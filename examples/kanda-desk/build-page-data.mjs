// Builds the page's data file from recorded runs only. Nothing here calls a provider.
//
//   node examples/kanda-desk/build-page-data.mjs runs/2026-09-24-s1.1 page/data.json

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIOS, SEEDS, MORNINGS, CONST, POLICY, PRODUCTION_PLAN, SCENARIO_VERSION } from './world.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const runDir = resolve(here, process.argv[2] || 'runs/2026-09-24-s1.1');
const outFile = resolve(here, process.argv[3] || 'page/data.json');
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const r3 = x => Math.round(x * 1000) / 1000;

// Recorded policies: [id, label, subdirectory, policy folder, circuit file or null]
const POLICIES = [
  ['v2.1', 'Hybrid circuit v2.1', 'v2.1', 'jev', 'circuit-v2.1.json'],
  ['v2.0', 'Hybrid circuit v2.0', 'v2.0', 'jev', 'circuit-v2.json'],
  ['v1.2', 'Pure Jev v1.2', 'v1.2', 'jev', 'circuit-v1.2.json'],
  ['v1.1', 'Pure Jev v1.1', 'v1.1', 'jev', 'circuit-v1.1.json'],
  ['v1.0', 'Pure Jev v1.0', 'v1.0', 'jev', 'circuit.json'],
  ['llm', 'GPT-6 Sol, one prompt', 'llm', 'llm', null],
  ['reorder_rule', 'Fixed reorder rule', 'baselines', 'reorder_rule', null],
  ['do_nothing', 'Do nothing', 'baselines', 'do_nothing', null]
];

function compactAnswer(a) {
  if (a.type === 'noul') return r3(a.noul);
  if (a.type === 'score') return a.probabilities ? Object.keys(a.probabilities).sort((x, y) => x - y).map(k => r3(a.probabilities[k])) : null;
  return { c: a.choice, p: ['A', 'B', 'C', 'D'].map(k => r3(a.probabilities[k] ?? 0)) };
}

const shared = {};   // exogenous evidence per scenario-seed-morning, from the do-nothing trajectory
const data = { built: new Date().toISOString(), scenarioVersion: SCENARIO_VERSION, mornings: MORNINGS, scenarios: SCENARIOS, seeds: SEEDS,
  policyText: POLICY, productionPlan: PRODUCTION_PLAN, limits: { limitLakh: CONST.limitLakh, spotMinRemovedT: CONST.spotMinRemovedT, flakesMinRemovedT: CONST.flakesMinRemovedT },
  manifests: {}, circuits: {}, policies: [], runs: {}, evidence: shared };

for (const [id, label, sub, folder, circuitFile] of POLICIES) {
  const dir = resolve(runDir, sub, folder);
  if (!existsSync(dir)) { console.warn(`skip ${id}: ${dir} missing`); continue; }
  const manifestPath = resolve(runDir, sub, 'manifest.json');
  if (existsSync(manifestPath)) data.manifests[id] = read(manifestPath);
  if (circuitFile) data.circuits[id] = read(resolve(here, circuitFile));
  data.policies.push({ id, label, circuit: circuitFile });
  data.runs[id] = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const r = read(resolve(dir, f));
    const key = `${r.scenario}-${r.seed}`;
    if (folder === 'do_nothing') shared[key] = r.mornings.map(m => { const s = { ...m.state }; return s; });
    data.runs[id][key] = {
      totals: r.totals,
      truth: r.truth,
      mornings: r.mornings.map(m => {
        const x = m.result || {};
        const out = {
          dec: m.decision ? m.decision.purchase + m.decision.production + m.decision.release : null,
          v: m.judgement.overall,
          vv: m.judgement.verdicts,
          perm: m.judgement.permitted,
          gap: m.judgement.gap,
          spent: m.outcome.spentLakh, short: m.outcome.shortDays,
          cold: m.state.cold_store, orders: m.state.open_orders,
          err: x.failed ? x.error : undefined
        };
        if (x.stages) {
          out.ans = {}; out.comp = {};
          out.ms = x.stages.reduce((a, s) => a + (s.latencyMs || 0), 0);
          out.usd = x.stages.reduce((a, s) => a + (s.costUsd || 0), 0);
          out.tok = x.stages.reduce((a, s) => a + (s.usage?.input_tokens || 0), 0);
          out.model = x.stages.find(s => s.model)?.model;
          for (const s of x.stages) {
            for (const [gid, a] of Object.entries(s.answers || {})) out.ans[gid] = compactAnswer(a);
            for (const [gid, c] of Object.entries(s.computed || {})) out.comp[gid] = c;
          }
        }
        if (x.call) {
          out.ms = x.call.latencyMs; out.usd = x.call.costUsd; out.model = x.call.model;
          out.tok = x.call.usage?.prompt_tokens; out.outTok = x.call.usage?.completion_tokens;
          out.reasonTok = x.call.usage?.completion_tokens_details?.reasoning_tokens;
          out.reply = x.call.content;
        }
        return out;
      })
    };
  }
}

// Evidence for policy-independent fields comes from the do-nothing run; each policy keeps its own
// cold-store and open-orders text because those move with its decisions.
for (const key of Object.keys(shared)) shared[key] = shared[key].map(s => ({ ...s, cold_store: undefined, open_orders: undefined }));

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(data));
console.log(`wrote ${outFile} (${(JSON.stringify(data).length / 1e6).toFixed(2)} MB), policies: ${data.policies.map(p => p.id).join(', ')}`);
