# Worked example: milk supplier selection

This is the originating [Jevini demo](https://jevini.becapable.in), not a generic purchasing policy or production-certified system.

## Contract

At 7 p.m., recommend at most one supplier: emergency delivery tonight or regular delivery tomorrow morning. Neither is pre-booked. Code considers no order and 24/48-packet offers; no booking and owner review are valid outcomes.

State groups: current stock and shelf life; each supplier's price, delivery time, quantity limits and booking availability; regular supplier's message; recent demand and local context; cash and protected reserves.

## Circuit

```text
read state ──┬── Jev: morning delay signal ──┐
            ├── Jev: local demand shift ────┴── code: projections ──┐
            └── code: spendable cash ──────────────────────────────┤
                                          code: size both offers ◄┘
                                                     │
                                          Jev: supplier choice
                                                     │
                                          code: policy guard
                                                     │
                           regular / emergency / no booking / owner
```

Delay and demand share one request. Code computes stock trajectories and proposes a quantity per supplier. A second request selects from supplier offers or safe exits. The guard can escalate a policy violation; it never silently replaces Jev's answer.

In a recorded synthetic-state run, ten packets minus six evening sales left four for morning; recent morning demand averaged 28 and the supplier message indicated an 11 a.m. arrival. The accepted result was Emergency 48. Quantity comes from discrete offer comparison over demand and expiry horizons, not simply subtracting four from 28.

## Transferable lessons, not defaults

- Precise commitments and timing changed the quality of decisions more than decorative graph layout.
- Candidate generation and output guarding matter as much as question wording.
- Because this demo's supplier ranking policy is explicit, code can perform the final choice after the semantic assessments. Treat the extra Choice gate as an experimental design choice, not a universal requirement.
- Its thresholds, quantities, demand multipliers and reliable-night-delivery assumption are demo-specific. Do not adopt them for another shop without evaluation and owner policy.
- Synthetic scenario sampling can exercise branches; never force provider outputs to create an attractive mix of outcomes.
- The hosted app recommends only. It does not send orders or run an autonomous periodic designer-review loop.

Useful cases include sufficient existing stock, delayed regular delivery, unavailable emergency delivery, exhausted discretionary cash, minimum orders above storage capacity, contradictory messages and provider failure. Decide expected permitted outcomes from the full state and policy, not from these labels alone.
