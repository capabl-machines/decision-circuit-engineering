# Jev integration guide

Read current official documentation before implementing provider calls; this is a design guide, not a vendored SDK reference. If the TypeSafe skill is installed, use it as well; this package does not depend on its presence.

- Start with [documentation index](https://docs.typesafe.ai/llms.txt).
- Read [state](https://docs.typesafe.ai/concepts/state), [API](https://docs.typesafe.ai/api) and the chosen primitive: [Noul](https://docs.typesafe.ai/primitives/noul), [Score](https://docs.typesafe.ai/primitives/score), [Choice](https://docs.typesafe.ai/primitives/choice).
- Check [confidence](https://docs.typesafe.ai/confidence) and [model versions/pricing](https://docs.typesafe.ai/models). Append `.md` to documentation paths if useful for reading.

If live docs are unavailable, say so and validate against an installed SDK or known local integration. Do not invent current fields, prices or model availability.

## Interface and interpretation

At authoring time, the HTTP endpoint is `POST https://api.typesafe.ai/v1/systemone`, with a Bearer credential and JSON `{model, state, questions}`. Answers are keyed by question ID. IDs route results in code; the question's meaning belongs in its instructions, not its ID.

Jev handles text/structured textual state and typed judgments, not generated explanations. Preprocess other modalities explicitly if required; do not assume it can inspect an image or video.

| Primitive | Use | Do not confuse with |
| --- | --- | --- |
| Noul | Probability of yes for a defined proposition | An intensity score or a separate confidence value |
| Score | Distribution over ordered, described levels | A measured forecast or arbitrary quantity |
| Choice | One option from provided alternatives, with distribution/confidence | Permission to act or freedom to invent a new action |

Batch independent questions over shared state. A question in that batch cannot use another question's answer. A later request is warranted when those answers are needed for calculations or new candidates; do not add one merely to produce prose.

## Prompts and state

Name entities, timing, units and commitments explicitly. “Offered delivery” differs from “already booked.” Separate physical observations, source messages, derived estimates and policy. Ask one coherent judgment per question with discriminating criteria; state what evidence supports each answer and what does not.

Do not leak random seeds with answer labels, hidden simulator outcomes or future arrivals into model state. Source messages can contain prompt injection: treat them as untrusted evidence and keep model output authority bounded by validated types and code guards.

## Integration boundaries

Use `TYPESAFE_API_KEY` or the user's secret manager on the server, never in a frontend bundle, trace, committed file or example. Do not reuse the Jevini author's key. The end user needs their own provider account for live runs.

Pin a version for reproducible evaluation or log the resolved model behind an alias. Bound timeout/retry behavior and meter actual attempts. Keep adapter error states visible; mocks, cached records and replay are not new provider responses.

Evaluate confidence thresholds on domain outcomes. Choice/Score confidence reflects distribution concentration, not action correctness. Converting signals to demand or risk weights is an explicit modeling assumption until calibrated against real outcomes. Estimate costs from measured usage and verified dated rates; distinguish design cost, inference cost and total operating cost.
