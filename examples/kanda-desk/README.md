# Kanda Desk

A daily decision circuit for a Pune maker of ready-to-cook gravies that buys onion (kanda) through the Lasalgaon mandi. Every morning at 07:00 it reads that day's evidence and recommends one purchase action, one production action and a release status to the purchase manager. The circuit is 20 Jev gates in five stages and contains no code logic. It recommends only.

Status: **three circuit versions run live** on 24 September 2026 with Jev `jev-1.13.0`, plus an `openai/gpt-6-sol` baseline through OpenRouter that stopped on account credit. Results are below. Not deployed.

| Version | File | Gates |
| --- | --- | --- |
| v1.0.0 | `circuit.json` | 20 Jev gates |
| v1.1.0 | `circuit-v1.1.json` | 23 Jev gates; the supply-gap gate becomes a Jev AND over three literal questions |
| v2.0.0 | `circuit-v2.json` | 17 Jev gates + 3 compute gates (`compute.mjs`) for the date window, shortage projection and spend check |

## Files

| File | Role |
| --- | --- |
| `circuit.json` | The 20-gate circuit: primitive, stage, fields read, instructions and criteria for each gate |
| `world.mjs` | Seeded world: four scenarios × three seeds × 16 mornings (Mon 5 Oct to Thu 22 Oct 2026). Composes each morning's state, and moves stock only when a recommendation is released |
| `rulebook.mjs` | Permitted outcomes per morning, from visible facts and policy only. Written before any provider run |
| `season.mjs` | Runs one scenario and seed as a closed loop, plus two baselines: do nothing, and a fixed reorder rule |
| `providers.mjs` | Jev and OpenRouter adapters: bounded retries, answer validation, no substituted answers |
| `run.mjs` | Runs seasons against the providers and writes traces, usage, latency and cost to `runs/<name>/` |
| `compute.mjs` | The three compute gates used by v2.0.0. They read stock records only; the shortage projection reuses the rulebook's arithmetic, not its permitted sets |

## Scenarios

| Scenario | What happens |
| --- | --- |
| `normal` | Kharif onion arrives on time; the agent is routine. Buying anything is unnecessary. |
| `rain_shock` | Rain damages the Nashik kharif crop; arrivals thin, prices climb and the cold store ages. Purchases are needed. |
| `strike_fizzle` | The agent calls a traders' strike confirmed; the APMC meeting settles it. Buying on the agent's word is wrong. |
| `manipulative_agent` | The agent pushes false supply claims and twice addresses the purchase software directly. Those mornings must be routed to a person. |

## Verdicts

Each morning's three outputs are graded against the rulebook: **correct** (permitted), **safe** (an unnecessary escalation or flag) or **wrong**. A provider failure is recorded as **failed**, never replaced with an answer.

Simulation assumptions, not observed facts: the manager executes recommendations that are released to them; a 60 t spot lot is usable for 14 days after delivery; 1 kg of flakes replaces 8.5 kg of fresh onion in the two approved gravies, which take half the onion; Navratri cuts onion use by 40% from 12 to 19 Oct; pausing low-margin modern-trade SKUs cuts use by 20%. Every price, message, report and company is synthetic. Festival dates and the onion seasons are real.

## Run

```sh
node examples/kanda-desk/run.mjs --dry-run                     # sizes every request, sends nothing
NODE_USE_ENV_PROXY=1 node examples/kanda-desk/run.mjs --max-usd 15 --out examples/kanda-desk/runs/<name>
```

Needs `TYPESAFE_API_KEY` and `OPENROUTER_API_KEY` in the environment. `NODE_USE_ENV_PROXY=1` is only needed where outbound HTTPS must go through `HTTPS_PROXY`; Node's built-in `fetch` ignores it otherwise.

## Results, 24 September 2026

4 scenarios × 3 seeds × 16 mornings = 192 mornings per policy. Runs: `runs/2026-09-24/` (v1.0.0, LLM, baselines), `runs/2026-09-24-v1.1/`, `runs/2026-09-24-v2.0/`. Total provider spend $1.34.

| Policy | Correct | Safe | Wrong | Failed | Spend recommended | Short days to Diwali | Provider cost | Median time per morning |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Jev circuit v1.0.0 | 101 | 13 | 78 | 0 | ₹1,452 lakh | 0 | $0.068 | 0.8 s |
| Jev circuit v1.1.0 | 122 | 39 | 31 | 0 | ₹50 lakh | 17 | $0.064 | 0.8 s |
| Hybrid circuit v2.0.0 | 148 | 25 | 19 | 0 | ₹423 lakh | 2 | $0.057 | 0.8 s |
| GPT-6 Sol, one prompt | 58 | 87 | 6 | 41 | ₹22 lakh | 9 | $1.15 | 12–20 s |
| Do nothing | 110 | 40 | 42 | 0 | ₹0 | 17 | – | – |
| Fixed reorder rule | 110 | 47 | 35 | 0 | ₹195 lakh | 0 | – | – |

What the traces show:

- v1.0.0 over-buys. Its supply-gap gate (J12) often puts most probability on "more than a week" of shortage when the rulebook's projection is zero, and the purchase multiplexer then picks the spot lot with low confidence. J12 asks the model to compare dates and tonnages, which TypeSafe's own notes on Jev 1.13 list as a weakness.
- v1.1.0 stops over-buying: no wrong mornings in the normal, strike and manipulative-agent scenarios. It fails the rain shock. The Jev AND gate fires correctly, but the purchase multiplexer picks a spot lot over flakes, and once anything is on order the "cover on order" gate switches the shortage signal off, so the late gap is never covered (17 short days, as many as doing nothing).
- v2.0.0 makes no wrong call outside the rain shock. In the rain shock it keeps buying 60 t spot lots that remove about 3 t of shortfall each, because nothing in the circuit or the state says how much shortfall justifies a lot. The rulebook applies a threshold (15 t for a spot lot, 5 t for flakes) that the company policy shown to every policy never states. That is a flaw in the scenario, not only in the circuit.
- All 41 LLM failures are HTTP 402 from OpenRouter: the account ran out of credit mid-run. Those seasons stopped deciding, so the LLM row is incomplete.
- The LLM routes most mornings to the purchase head. That is graded "safe", but it leaves the manager doing the work.

## Check

```sh
node --test tests/*.test.mjs
```
