# Decision Circuit Engineering — skill v0.1.0

For Codex and Claude Code: turn a recurring decision into typed model judgments, deterministic calculations, guarded outcomes and a trace you can inspect. This is an instruction package for your coding agent, not a hosted service or installed decision engine.

License: [MIT](LICENSE). Provider services and linked third-party documentation have their own terms.

## Install

Copy the complete `decision-circuit-engineering` folder—not just `SKILL.md`—to **one** of the locations for your tool:

| Tool | This project only | All your local projects |
| --- | --- | --- |
| Codex | `.agents/skills/decision-circuit-engineering/` | `~/.agents/skills/decision-circuit-engineering/` |
| Claude Code | `.claude/skills/decision-circuit-engineering/` | `~/.claude/skills/decision-circuit-engineering/` |

Check for an existing folder before copying; do not overwrite another version unintentionally. Reload/restart your tool if it does not discover the skill. Managed workspace restrictions may limit local skills. These instructions target local coding tools, not automatic installation into cloud sessions or a marketplace.

For macOS/Linux, from a directory containing the extracted skill folder, this example installs Codex user scope and refuses an existing destination:

```sh
mkdir -p "$HOME/.agents/skills"
test ! -e "$HOME/.agents/skills/decision-circuit-engineering" && \
  test ! -L "$HOME/.agents/skills/decision-circuit-engineering" && \
  cp -R decision-circuit-engineering "$HOME/.agents/skills/decision-circuit-engineering"
```

For Claude Code, use `.claude/skills` instead of `.agents/skills` in the same commands. On Windows, copy the folder into the corresponding directory under your user profile or project. No global configuration edit, plugin, MCP server, or companion skill is required.

## Try it

Codex:

```text
$decision-circuit-engineering Design a daily replenishment recommendation
for my bakery. Use stock, yesterday's sales, tomorrow's events and supplier
messages. Start with the decision contract and graph. Do not place orders.
```

Claude Code:

```text
/decision-circuit-engineering Build a support-ticket routing circuit in this
repository's stack. Use code for account rules and Jev for interpreting the
message. Test with fixtures first; keep email sending disabled.
```

You can also ask naturally for a Decision Circuit Engineering workflow. The active coding model designs the circuit; Astra access is not required. Live Jev inference needs your own TypeSafe account/key and incurs provider charges. No key is included, and installing this package does not call a provider.

The deliverable is a contract, graph, harness, evaluation cases and indexed evidence in your project. Design-only requests remain design-only. This skill does not authorize publication, deployment or real business actions.

## Contents and verification

- `SKILL.md`: workflow and boundaries.
- `references/runtime-contracts.md`: graph, harness, trace and evaluation invariants.
- `references/jev.md`: provider integration guidance with current-doc links.
- `references/milk-parlour.md`: worked example and limitations.
- `assets/decision-brief.md`: reusable project brief.
- `agents/openai.yaml`: optional Codex display metadata; core instructions are tool-neutral.

Format and package integrity are validated locally. Compatibility is based on the documented shared skill format; this release has not been end-to-end forward-tested in fresh Codex and Claude Code sessions. No universal correctness or production-readiness claim is made.

Installation references, checked September 21, 2026: [Codex skills](https://developers.openai.com/codex/skills/), [Claude Code skills](https://code.claude.com/docs/en/skills).
