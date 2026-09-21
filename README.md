# Decision Circuit Engineering

**Design the decision once. Run changing states through it.**

A portable skill for **Codex and Claude Code** that guides a coding agent from a recurring decision to a versioned, tested circuit:

```text
Decision contract → graph design → typed judgments + code → guarded outcome
                              ↑                                  │
                              └──── evaluate traces and revise ──┘
```

The design-time model shapes the process. A small runtime model interprets changing context. Code handles arithmetic, explicit rules and execution boundaries. This skill defaults to Jev for runtime judgments, but respects another provider you choose. **Astra access is not required.**

## Install

Clone this repository:

```sh
git clone https://github.com/capabl-machines/decision-circuit-engineering.git
cd decision-circuit-engineering
```

Choose your tool. These macOS/Linux commands install for your local user and refuse to overwrite an existing installation.

**Codex**

```sh
mkdir -p "$HOME/.agents/skills"
test ! -e "$HOME/.agents/skills/decision-circuit-engineering" && \
  test ! -L "$HOME/.agents/skills/decision-circuit-engineering" && \
  cp -R skills/decision-circuit-engineering "$HOME/.agents/skills/decision-circuit-engineering"
```

**Claude Code**

```sh
mkdir -p "$HOME/.claude/skills"
test ! -e "$HOME/.claude/skills/decision-circuit-engineering" && \
  test ! -L "$HOME/.claude/skills/decision-circuit-engineering" && \
  cp -R skills/decision-circuit-engineering "$HOME/.claude/skills/decision-circuit-engineering"
```

For project-only or Windows installation, see the [installation guide](skills/decision-circuit-engineering/README.md). Copy the complete skill folder. Restart your coding tool if discovery does not refresh. No MCP server or companion skill is required.

## Use it

In Codex:

```text
$decision-circuit-engineering Build a daily bakery replenishment recommender.
Use stock, sales history, local events and supplier messages. Start with
the decision contract. Test with fixtures first. Do not place orders.
```

In Claude Code:

```text
/decision-circuit-engineering Design a support-ticket routing circuit.
Use code for account rules and Jev for message interpretation. Explain
the graph, allowed outcomes and evaluation plan before implementation.
```

## What it helps build

- An explicit contract: state, actions, constraints, assumptions and authority.
- A graph of narrow judgments and deterministic operations, with validated dependencies.
- A bounded provider adapter and harness, with failure and review exits.
- An inspectable trace: actual inputs, outputs, model versions, rule checks and timings.
- Evaluation cases, a simpler baseline and reproducible project documentation.

This is **an engineering workflow, not a prebuilt universal decision engine**. Design-only requests stay design-only. If rules alone solve a problem, the skill recommends code rather than unnecessary AI. Live Jev usage requires your own TypeSafe key and has provider costs; installation makes no API calls. Never paste keys into prompts or commit them.

## Start with the example

[Try Jevini](https://jevini.becapable.in): a milk parlour choosing between tonight's emergency supplier and tomorrow's regular supplier. [Read the worked example](skills/decision-circuit-engineering/references/milk-parlour.md).

The demo uses synthetic states and recommendations, not actual orders. Its exact quantities, thresholds and two-request design are not universal defaults. Real-world accuracy and savings are not established.

## Validation and contributing

Run the dependency-free package checks with Node.js 20+:

```sh
node --test tests/skill-package.test.mjs
```

These check package contents, internal links and common portability/security leaks. They do not prove agent behavior. Fresh-session forward tests in both Codex and Claude Code remain pending; see [validation and test scenarios](docs/validation.md).

Contributions are most useful with a bounded use case, expected permitted outcomes, an observed failure and a reproducible trace. Redact secrets and private data; do not submit real customer records without permission.

## Documentation

- [Skill instructions](skills/decision-circuit-engineering/SKILL.md)
- [Documentation index](docs/README.md)
- [MIT license](LICENSE)

By **capabl machines**. v0.1.0 — an early, inspectable starting point.
