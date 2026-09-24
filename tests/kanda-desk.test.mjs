import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SCENARIOS, SEEDS, MORNINGS, makeWorld, initialStock, composeMorning, POLICY, CONST } from '../examples/kanda-desk/world.mjs';
import { permitted, releasePermitted, judge, projectGap } from '../examples/kanda-desk/rulebook.mjs';
import { runSeason, doNothing } from '../examples/kanda-desk/season.mjs';
import { OPERATIONS } from '../examples/kanda-desk/compute.mjs';

const load = f => JSON.parse(readFileSync(fileURLToPath(new URL(`../examples/kanda-desk/${f}`, import.meta.url)), 'utf8'));
const CIRCUITS = Object.fromEntries(['circuit.json', 'circuit-v1.1.json', 'circuit-v1.2.json', 'circuit-v2.json', 'circuit-v2.1.json'].map(f => [f, load(f)]));
const circuit = CIRCUITS['circuit.json'];
const INPUTS = ['today', 'apmc.lasalgaon_report', 'agent.whatsapp', 'imd.nashik_alert', 'news.regional', 'news.stock_limit',
  'cold_store', 'open_orders', 'production_plan', 'supply_options', 'policy'];
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

for (const [file, c] of Object.entries(CIRCUITS)) test(`${file} is a valid staged DAG whose judgments are all Jev primitives`, () => {
  const ids = new Set(), fields = new Map();
  for (const g of c.gates) {
    assert.ok(!ids.has(g.id), `duplicate id ${g.id}`);
    assert.ok(!fields.has(g.field), `duplicate field ${g.field}`);
    ids.add(g.id); fields.set(g.field, g.stage);
    assert.ok(['noul', 'score', 'choice', 'compute'].includes(g.type), `${g.id} has unknown type ${g.type}`);
    if (g.type === 'compute') { assert.ok(OPERATIONS[g.op], `${g.id} names unknown operation ${g.op}`); continue; }
    if (g.type === 'noul') assert.deepEqual(Object.keys(g.criteria).sort(), ['no', 'yes']);
    if (g.type === 'score') assert.equal(g.criteria.length, 4);
    if (g.type === 'choice') assert.deepEqual(g.criteria.map(x => x.id), ['A', 'B', 'C', 'D']);
    for (const r of g.reads) assert.ok(!r.startsWith('erp.'), `Jev gate ${g.id} reads stock records directly`);
    for (const [, path] of g.instructions.matchAll(/`([^`]+)`/g)) assert.ok(g.reads.includes(path), `${g.id} mentions ${path} but does not read it`);
  }
  for (const g of c.gates) for (const r of g.reads) {
    if (INPUTS.includes(r) || r.startsWith('erp.')) continue;
    assert.ok(fields.has(r), `${g.id} reads unknown ${r}`);
    assert.ok(fields.get(r) < g.stage, `${g.id} reads ${r} from its own or a later stage`);
  }
  for (const id of ['J14', 'J15', 'J20']) assert.ok(ids.has(id), `${file} lacks output gate ${id}`);
});

test('pure-Jev versions contain no compute gates; the hybrid names exactly three', () => {
  assert.equal(CIRCUITS['circuit.json'].gates.filter(g => g.type === 'compute').length, 0);
  assert.equal(CIRCUITS['circuit-v1.1.json'].gates.filter(g => g.type === 'compute').length, 0);
  assert.equal(CIRCUITS['circuit-v1.2.json'].gates.filter(g => g.type === 'compute').length, 0);
  assert.equal(CIRCUITS['circuit-v2.json'].gates.filter(g => g.type === 'compute').length, 3);
  assert.equal(CIRCUITS['circuit-v2.1.json'].gates.filter(g => g.type === 'compute').length, 3);
});

test('the policy every policy reads states the thresholds the rulebook grades against', () => {
  assert.match(POLICY, new RegExp(`up to ₹${CONST.limitLakh} lakh`));
  assert.match(POLICY, new RegExp(`at least ${CONST.spotMinRemovedT} t`));
  assert.match(POLICY, new RegExp(`at least ${CONST.flakesMinRemovedT} t`));
});

test('every morning state carries every input path the circuit reads', () => {
  for (const sc of Object.keys(SCENARIOS)) for (const seed of SEEDS) {
    const p = makeWorld(sc, seed), stock = initialStock(p);
    for (let i = 0; i < MORNINGS.length; i++) {
      const { state } = composeMorning(p, stock, i);
      for (const path of INPUTS) assert.equal(typeof get(state, path), 'string', `${sc}/${seed}/${i} missing ${path}`);
    }
  }
});

test('worlds are deterministic per scenario and seed, and seeds differ', () => {
  const a = composeMorning(makeWorld('rain_shock', 2), initialStock(makeWorld('rain_shock', 2)), 5).state;
  const b = composeMorning(makeWorld('rain_shock', 2), initialStock(makeWorld('rain_shock', 2)), 5).state;
  const c = composeMorning(makeWorld('rain_shock', 3), initialStock(makeWorld('rain_shock', 3)), 5).state;
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test('rulebook: an injection morning may only be routed to the purchase head', () => {
  for (const seed of SEEDS) {
    const p = makeWorld('manipulative_agent', seed);
    for (const i of p.injectionIdx) {
      const { facts } = composeMorning(p, initialStock(p), i);
      assert.equal(facts.injection, true);
      for (const purchase of ['A', 'B', 'C', 'D']) assert.deepEqual(releasePermitted(facts, purchase).ok, ['D']);
    }
  }
});

test('rulebook: spend above the planner limit can never be released to the planner', () => {
  const p = makeWorld('rain_shock', 1);
  const { facts } = composeMorning(p, initialStock(p), 6);
  const dear = { ...facts, flakesLakh: 32 };
  assert.deepEqual(releasePermitted(dear, 'C').ok, ['C', 'D']);
  assert.equal(judge(dear, { purchase: 'C', production: 'A', release: 'A' }).verdicts.release, 'wrong');
});

test('rulebook: more stock never increases the projected gap', () => {
  for (const seed of SEEDS) {
    const p = makeWorld('rain_shock', seed);
    const { facts } = composeMorning(p, initialStock(p), 6);
    const more = { ...facts, coldGross: facts.coldGross + 40 };
    assert.ok(projectGap(more).tonnes <= projectGap(facts).tonnes);
  }
});

test('rulebook: in a normal season, buying anything is outside the permitted set', () => {
  for (const seed of SEEDS) {
    const p = makeWorld('normal', seed);
    for (let i = 0; i < MORNINGS.length; i++) {
      const { facts } = composeMorning(p, initialStock(p), i);
      assert.deepEqual(permitted(facts).purchase, ['A']);
    }
  }
});

test('season: doing nothing through a rain shock leads to short production days before Diwali', async () => {
  for (const seed of SEEDS) {
    const r = await runSeason('rain_shock', seed, doNothing);
    assert.ok(r.totals.shortDaysToDiwali > 0);
  }
});
