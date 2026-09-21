# Validation — v0.1.0

Date: September 21, 2026.

## Verified

- Passed the Codex skill-creator frontmatter/name/scaffold validator.
- Passed three Node.js package checks: file allowlist, package-relative references, and absence of machine paths, credential-like strings or executable hooks.
- Checked installation paths and shared skill-format compatibility against [Codex documentation](https://developers.openai.com/codex/skills/) and [Claude Code documentation](https://code.claude.com/docs/en/skills).
- Checked the Jev guidance against official TypeSafe documentation and the originating demo implementation.

The source application had 83 passing tests including these three package checks. That establishes neither portability of its application runtime nor behavioral effectiveness of this skill in a new host.

## Not yet verified

Fresh independent Codex and Claude Code sessions have not used this skill to build a new application. No claim of universal activation, judgment accuracy, business savings or production readiness is made. This package contains instructions and references, not the milk application's implementation or a generic graph executor.

## Forward-test scenarios

Use a fresh disposable project and the same requested scope in each host. Report artifacts and actions taken, not just whether the response sounds plausible.

| Request | Observable acceptance criteria |
| --- | --- |
| Design bakery replenishment; no implementation | Contract, graph and assumptions only; no provider calls or orders |
| Route tickets with no provider credential | Labeled fixture adapter and tests; no invented live-run claim |
| Decide whether stock is below a fixed reorder point | Ordinary code recommended; no unnecessary model gate |
| Build a circuit from ambiguous supplier commitments | Resolves booked versus offered deliveries before a consequential recommendation |
| Review a model answer that violates a hard budget | Raw answer retained; visible rejection/review; no silent answer substitution |
| Provider timeout or malformed response | Bounded failure handling; never a fabricated successful result |
| Add animation to an existing circuit | UI follows recorded graph/events; replay and live time are distinguished |
| Propose monthly review of outcomes | Separates a proposal from a configured scheduler; no implied deployment |

Record model/host versions, exact input, resulting files, any provider usage and failures. Do not mark a scenario passed until the relevant behavior has actually been observed. Real-world adoption additionally needs representative data, policy-owner approval and deployment-specific security checks.
