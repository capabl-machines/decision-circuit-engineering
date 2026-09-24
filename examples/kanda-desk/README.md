# Kanda Desk

A daily decision circuit for a Pune maker of ready-to-cook gravies that buys onion (kanda) through the Lasalgaon mandi. Every morning at 07:00 it reads that day's evidence and recommends one purchase action, one production action and a release status to the purchase manager. The circuit is 20 Jev gates in five stages and contains no code logic. It recommends only.

Status: **five circuit versions, one LLM baseline and two fixed rules recorded live** on 24 September 2026 with Jev `jev-1.13.0` and `openai/gpt-6-sol` through OpenRouter. Scenario 1.1.0 is current. Page: `page/index.html` with `page/data.json`, built from recorded runs only. Not deployed.

| Version | File | Gates |
| --- | --- | --- |
| v1.0.0 | `circuit.json` | 20 Jev gates |
| v1.1.0 | `circuit-v1.1.json` | 23 Jev gates; the supply-gap gate becomes a Jev AND over three literal questions |
| v1.2.0 | `circuit-v1.2.json` | v1.1 with the "cover on order" gate narrowed to flakes, and the purchase gate reading the policy |
| v2.0.0 | `circuit-v2.json` | 17 Jev gates + 3 compute gates (`compute.mjs`) for the date window, shortage projection and spend check |
| v2.1.0 | `circuit-v2.1.json` | v2.0 with policy clause (f), the purchase-size rule, applied in the projection gate |

## Files

| File | Role |
| --- | --- |
| `circuit.json` | The 20-gate circuit: primitive, stage, fields read, instructions and criteria for each gate |
| `world.mjs` | Seeded world: four scenarios × three seeds × 16 mornings (Mon 5 Oct to Thu 22 Oct 2026). Composes each morning's state, and moves stock only when a recommendation is released |
| `rulebook.mjs` | Permitted outcomes per morning, from visible facts and policy only. Written before any provider run |
| `season.mjs` | Runs one scenario and seed as a closed loop, plus two baselines: do nothing, and a fixed reorder rule |
| `providers.mjs` | Jev and OpenRouter adapters: bounded retries, answer validation, no substituted answers |
| `run.mjs` | Runs seasons against the providers and writes traces, usage, latency and cost to `runs/<name>/` |
| `compute.mjs` | Compute gates for v2.x. They read stock records only; the shortage projection reuses the rulebook's arithmetic, and v2.1's variant also applies policy clause (f) |
| `build-page-data.mjs` | Builds `page/data.json` from recorded runs |
| `explainer/index.html` | 16:9 auto-playing explainer for screen recording, in ten scenes: the players, the problem, the building blocks, the 20-part circuit, one recorded morning flowing through it, the recommendation, the season, and the LLM comparison last. Reads `data.json` next to it or `../page/data.json` |
| `race/index.html` | Square cartoon race for screen recording: one recorded morning replayed (circuit v2.1 vs GPT-6 Sol vs a person), sped up on a √time scale, with a record mode that hides controls. Reads `data.json` next to it or `../page/data.json` |
| `page/index.html` | The interactive page: a replay "race" of one recorded morning (circuit vs LLM vs a person, at recorded timings), then the scoreboard, yearly cost and season explorer with each morning's evidence and recorded gate answers |

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

## Results, scenario 1.1.0 (`runs/2026-09-24-s1.1/`)

4 scenarios × 3 seeds × 16 mornings = 192 mornings per policy. Provider spend for these runs: $1.88.

| Policy | Correct | Safe | Wrong | Failed | Routed to a person | Purchases recommended | Short days to Diwali | Provider cost / morning | Median time / morning |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hybrid v2.1 | 133 | 50 | 9 | 0 | 3% | ₹114 lakh | 3 | $0.0003 | 0.9 s |
| Hybrid v2.0 | 139 | 39 | 14 | 0 | 3% | ₹330 lakh | 1 | $0.0003 | 0.9 s |
| Pure Jev v1.2 | 154 | 20 | 18 | 0 | 3% | ₹52 lakh | 17 | $0.0003 | 0.9 s |
| Pure Jev v1.1 | 141 | 15 | 36 | 0 | 3% | ₹52 lakh | 17 | $0.0003 | 0.8 s |
| Pure Jev v1.0 | 74 | 15 | 103 | 0 | 3% | ₹1,866 lakh | 0 | $0.0004 | 0.9 s |
| GPT-6 Sol, one prompt | 75 | 112 | 5 | 0 | 97% | ₹0 lakh | 17 | $0.0082 | 10.1 s |
| Fixed reorder rule | 110 | 47 | 35 | 0 | 0% | ₹195 lakh | 0 | – | – |
| Do nothing | 110 | 40 | 42 | 0 | 0% | ₹0 lakh | 17 | – | – |

What the traces show:

- Pure Jev v1.0 over-buys: its supply-gap gate asks Jev to compare dates and tonnages, a documented jev-1.13 weakness.
- Pure Jev v1.2 stops over-buying, but all 18 wrong mornings are in the rain shock and it leaves 17 short days, as many as doing nothing. From text alone it cannot tell whether a purchase covers a gap two weeks out.
- Hybrid v2.1 makes the fewest wrong calls of the policies that decide on their own: none of its 9 wrong calls is a purchase. Its "safe" mornings mostly release without flagging the agent's unsupported claims.
- GPT-6 Sol makes the fewest wrong calls overall, but routes 97% of mornings to the purchase head. Routed recommendations are not carried out in the simulation, so it buys nothing and ends with 17 short days; in practice a person would decide those mornings by hand.
- Per morning the LLM costs about 27× more than the circuit and takes about 12× longer.

Caveats: synthetic scenarios; provisional rulebook; one run per morning, no repeat sampling; the LLM prompt was written once and not tuned; v2.x compute gates reuse the rulebook's shortage arithmetic, and v2.1 also applies policy clause (f) in code, so its purchase choices are partly checked against a rule they were given.

Runs on scenario 1.0.0 (`runs/2026-09-24/`, `-v1.1/`, `-v2.0/`) are kept as the record of the first attempt. That scenario's policy text omitted the purchase-size rule the rulebook applied, and 41 of its LLM calls failed on OpenRouter credit.

## View the page locally

```sh
npx serve examples/kanda-desk/page      # or any static file server; the page fetches data.json
```

## Check

```sh
node --test tests/*.test.mjs
```
