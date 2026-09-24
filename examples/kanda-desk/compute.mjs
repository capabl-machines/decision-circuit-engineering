// Compute gates for hybrid circuits (v2.x). Each operation receives the structured stock
// records a purchase team keeps (`erp`), the date, and earlier gate answers, and returns a
// state field with numbers plus a plain-language summary for later Jev gates.
// They never read hidden truth, message text or the rulebook's permitted sets.
//
// The shortage projection reuses rulebook.projectGap, so arithmetic is shared with the
// evaluator; the choice of action is not. Disclosed in README.

import { CONST, DAY, t, label, inFestival } from './world.mjs';
import { projectGap } from './rulebook.mjs';

// Jev's reading of the kharif news (J3 levels) mapped to an expected arrival date.
const ETA_BY_LEVEL = ['2026-10-15', '2026-10-22', '2026-11-01', '2026-11-08'];

function mostLikelyLevel(answer) {
  const entries = Object.entries(answer.probabilities).map(([k, v]) => [Number(k), v]);
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

export const OPERATIONS = {
  festival_window({ erp }) {
    const today = t(erp.date);
    const inWindow = [0, 1, 2, 3, 4, 5, 6].filter(k => inFestival(today + k * DAY)).length;
    return {
      festival_days_in_next_7: inWindow,
      summary: inWindow > 0
        ? `Navratri (11–19 Oct) covers ${inWindow} of the next seven days. On those days onion gravy orders are down about 40%.`
        : 'No festival dip in the next seven days. Onion use is normal.'
    };
  },

  supply_projection({ erp, answers }) {
    const level = mostLikelyLevel(answers.J3);
    const today = t(erp.date);
    const eta = Math.max(t(ETA_BY_LEVEL[level]), today);
    const facts = { ...erp, etaPublished: new Date(eta).toISOString().slice(0, 10), kharifArriving: level === 0 && today >= t(ETA_BY_LEVEL[0]) };
    const none = projectGap(facts);
    const flakes = projectGap(facts, [{ kind: 'flakes', arrive: today + CONST.flakeLeadDays * DAY }]);
    const spot = projectGap(facts, [{ kind: 'spot', arrive: today + CONST.spotLeadDays * DAY }]);
    const r = x => Math.round(x * 10) / 10;
    const removedByFlakes = r(none.tonnes - flakes.tonnes), removedBySpot = r(none.tonnes - spot.tonnes);
    const summary = none.days === 0
      ? `Stock on hand and on order covers every production day until new kharif onion is expected around ${label(eta)}. Nothing is missing.`
      : `If nothing is bought, about ${none.days} production days (${none.tonnes} t) lack onion before new kharif onion is expected around ${label(eta)}. Ordering the flakes today would remove about ${removedByFlakes} t of that shortfall. Buying the spot lot today would remove about ${removedBySpot} t${removedBySpot < 1 ? ', because it would expire before the shortage starts' : ''}.`;
    return {
      kharif_expected: label(eta),
      short_days_if_no_purchase: none.days,
      shortfall_tonnes_if_no_purchase: none.tonnes,
      shortfall_removed_by_flakes_today_t: removedByFlakes,
      shortfall_removed_by_spot_lot_today_t: removedBySpot,
      summary
    };
  },

  spend_check({ erp, answers }) {
    const choice = answers.J14.choice;
    const cost = choice === 'B' ? erp.spotLakh : choice === 'C' ? erp.flakesLakh : 0;
    const ok = cost <= CONST.limitLakh;
    return {
      within_limit: ok,
      cost_lakh: cost,
      limit_lakh: CONST.limitLakh,
      summary: cost === 0 ? 'The chosen action spends nothing.' : `The chosen action costs ₹${cost} lakh, ${ok ? 'within' : 'above'} the purchase manager's ₹${CONST.limitLakh} lakh limit.`
    };
  }
};

// The structured records a code gate may read. Message text, news and hidden truth are excluded.
export const ERP_KEYS = ['date', 'coldGross', 'lossPct', 'lifeDays', 'spotLots', 'openOrders', 'flakesOnHand', 'spotLakh', 'flakesLakh', 'flakesApproved', 'limitInForce'];
export const erpFrom = facts => Object.fromEntries(ERP_KEYS.map(k => [k, facts[k]]));
