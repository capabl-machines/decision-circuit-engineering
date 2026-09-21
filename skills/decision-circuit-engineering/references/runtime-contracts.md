# Runtime contracts

Use these invariants when implementing a circuit. Adapt field names and file layout to the target stack; this document is not an executable schema or a universal runtime.

## Artifacts

Keep a decision contract, input schema, versioned graph, operation registry, provider adapter, runner and evaluation cases. The graph describes composition; the operation registry supplies implemented code. Do not confuse a visually connected diagram with an executable graph.

Each node needs:

| Field | Meaning |
| --- | --- |
| ID and kind | Stable identity; judgment, compute, guard or outcome |
| Dependencies | Which completed outputs are required |
| Input mapping | Exact state fields and upstream outputs consumed |
| Output contract | Type, legal values, units and validation |
| Implementation | Question/rubric, or registered code operation |
| Failure handling | Stop, bounded retry, review or explicit fallback |

Include input/policy/schema versions and accurate authorship in the artifact. Record a graph content hash in each run; a provenance label alone is not independent proof of authorship. Preserve actual generated artifacts and relevant design records without exposing private conversation contents.

## Validate before execution

- Unique IDs; existing dependencies; acyclic, reachable graph with bounded size.
- Every declared operation resolves to an approved implementation.
- Input mappings refer only to available state or dependency outputs.
- Every external-action path passes required guards; no alternate unguarded branch.
- Types, units and time horizons agree across edges.
- Judgment choices cover no-match/ambiguity cases relevant to the task.
- Unsupported graph versions and unknown operations fail closed.

## Runtime sequence

1. Validate and snapshot the state, graph version and policy. Generate a run ID.
2. Resolve ready dependencies. Compute exact rules in code; submit independent judgments together when their provider permits it.
3. Validate provider response types, finite numeric ranges, legal choices and distribution shape where supplied. Do not require probability fields a provider does not support.
4. Prepare new state only after required answers arrive. Retain raw responses separately from derived values.
5. Resolve the candidate recommendation, check constraints and uncertainty handling, and expose accepted, rejected, review or failed status.
6. Persist the final trace and result. If execution is authorized, separately recheck current state, obtain required approval and use an idempotency key before the side effect.

An action changing the world is a separate adapter, not an implicit consequence of reaching an outcome node. Default to recommendation-only for a new prototype.

## Trace contract

Useful events are run-started, node-started, provider-completed, node-completed, node-skipped, node-failed and run-completed/failed. Each carries run ID, timestamp and relevant node identity. Provider events carry actual model version, source (live/fixture), duration and reported usage. Include input snapshots or redacted references, raw output, derived result and guard reason.

Protect traces as application data: redact secrets, minimize personal information, restrict retrieval to authorized users and choose retention intentionally. A browser inspector must not make every user's provider payload public.

## Evaluation and debugging

Use human-reviewed labels or independently implemented permitted-action checks, not the same selector function as both implementation and sole test oracle. Unit tests establish arithmetic and guards; fixture tests establish composition; live runs establish provider integration; real outcome studies establish business usefulness. None substitutes for the others.

Use metamorphic checks where exact labels are ambiguous: adding protected cash cannot increase spendable cash; an unavailable candidate cannot become bookable; irrelevant wording should not change arithmetic. Distinguish justified policy changes from prompt changes and scenario-generation changes. Never manipulate output selection to hit a desired demo distribution.
