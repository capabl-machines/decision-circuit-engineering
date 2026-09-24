// Runs one season (scenario × seed) as a closed loop: each morning's state reflects the
// recommendations released on earlier mornings. `decide` may be a model-backed policy or a
// fixed rule; it receives the morning's state and facts and returns { purchase, production, release }
// or { failed: true, error } when the provider did not return a valid answer.

import { MORNINGS, makeWorld, initialStock, composeMorning, advance, runOut, truth, CONST } from './world.mjs';
import { judge } from './rulebook.mjs';

export async function runSeason(scenario, seed, decide) {
  const p = makeWorld(scenario, seed);
  const stock = initialStock(p);
  const mornings = [];
  for (let i = 0; i < MORNINGS.length; i++) {
    const { state, facts } = composeMorning(p, stock, i);
    const result = await decide({ scenario, seed, index: i, date: MORNINGS[i], state, facts });
    const decision = result.failed ? null : { purchase: result.purchase, production: result.production, release: result.release };
    const judgement = decision ? judge(facts, decision) : { overall: 'failed', verdicts: null, permitted: null, gap: null };
    const outcome = advance(p, stock, i, decision);
    mornings.push({ date: MORNINGS[i], state, facts, result, decision, judgement, outcome });
  }
  const end = runOut(p, stock);
  return {
    scenario, seed, truth: truth(p), mornings,
    totals: {
      spendLakh: stock.spendLakh,
      shortDaysInWindow: stock.shortDays,
      shortDaysToDiwali: stock.shortDays + end.shortDaysToDiwali,
      penaltyToDiwaliRs: stock.penaltyRs + end.penaltyToDiwaliRs,
      correct: mornings.filter(m => m.judgement.overall === 'correct').length,
      safe: mornings.filter(m => m.judgement.overall === 'safe').length,
      wrong: mornings.filter(m => m.judgement.overall === 'wrong').length,
      failed: mornings.filter(m => m.judgement.overall === 'failed').length
    }
  };
}

// Baseline 1: do nothing, always release the plan unchanged.
export const doNothing = async () => ({ purchase: 'A', production: 'A', release: 'A' });

// Baseline 2: a fixed reorder rule a planner might write without reading any text.
// Spot-buy when cold-store QC life or usable cover drops under 10 days and nothing is on order.
export const reorderRule = async ({ facts }) => {
  const usable = facts.lifeDays > 0 ? facts.coldGross * (1 - facts.lossPct / 100) : 0;
  const coverDays = usable / CONST.usePerDay;
  const onOrder = facts.openOrders.length > 0;
  const buy = !onOrder && (facts.lifeDays < 10 || coverDays < 10);
  return { purchase: buy ? 'B' : 'A', production: 'A', release: 'A' };
};
