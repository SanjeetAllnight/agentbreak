---
trigger: always_on
---

# AgentBreak — Workspace Rules

## Project

We are building AgentBreak, an adaptive red-team and reliability engineering platform for tool-using AI agents.

Core product loop:

Understand → Attack → Adapt → Observe → Measure → Fix → Retest

## Primary product goal

A developer provides an AI agent's system prompt and tool definitions.

AgentBreak must:

1. Analyze the agent's tool/risk surface.
2. Generate targeted adversarial scenarios.
3. Adapt attack tactics based on agent behavior.
4. Execute attacks safely inside a mocked sandbox.
5. Capture the complete trajectory.
6. Detect and classify failures.
7. Assign S0–S4 consequence-based severity.
8. Generate a developer-facing mitigation.
9. Retest the same scenario/suite.
10. Show whether the mitigation improved reliability.

## Non-negotiable differentiators

* Cold-start evaluation without production traces.
* Risk-aware scenario generation.
* Adaptive red teaming.
* Safe mocked execution.
* Trajectory-level evidence.
* S0–S4 consequence-based severity.
* Self-verifying remediation.
* Before/after regression comparison.

## Engineering rules

* One vertical slice first.
* Shared TypeScript schemas are the source of truth.
* Do not change shared contracts casually.
* Use structured LLM outputs wherever possible.
* Prefer deterministic evaluation over LLM judgement when deterministic logic is sufficient.
* Keep mock tools deterministic.
* Keep execution bounded by maximum turns/time.
* Never allow the audit engine to execute real destructive operations.
* Never put secrets/API keys into source control.
* Build against fixtures before depending on live LLM execution.
* Maintain a golden demo fixture.
* Test every major backend capability before moving to the next layer.
* Keep the product scope appropriate for a 20-hour hackathon.

## Technology

* Bun
* TypeScript
* Hono
* React
* Vite
* Tailwind
* SQLite via bun:sqlite
* Native WebSocket
* Anthropic TypeScript SDK

## Repository boundaries

/shared = shared contracts and types
/server = backend, evaluation engine, sandbox, database, WebSocket
/web = frontend
/agents = reference agent configurations

Do not mix responsibilities unnecessarily.

## Product scope

Do NOT build unless explicitly requested:

* authentication
* billing
* multi-tenancy
* production tool execution
* generalized enterprise integrations
* MCP
* OpenAI/Gemini/LangGraph adapters
* multi-agent evaluation
* complex analytics
* monetary loss modeling
* unnecessary abstractions

## Priority

When time is limited, prioritize:

1. Working end-to-end vertical slice.
2. Adaptive attack behavior.
3. Trace viewer.
4. Severity model.
5. Failure classification.
6. Before/after retest.
7. Repair recommendation.
8. Everything else.

## Agent behavior

Before implementing a substantial task:

1. Inspect the existing repository.
2. Read relevant shared contracts.
3. Identify dependencies and assumptions.
4. Implement the smallest complete version.
5. Run tests/type checks.
6. Fix failures.
7. Verify behavior.
8. Report exactly what changed and what remains.

Do not silently rewrite unrelated code.

Do not introduce libraries without a concrete reason.

When uncertain between two implementations, choose the simpler one compatible with the architecture and 20-hour constraint.

## UI

The trace viewer is the hero feature.

UI should make these immediately visible:

* current attack tactic
* tactic changes
* agent responses
* tool calls
* destructive actions
* failure category
* severity
* remediation
* before/after result

Avoid generic "AI dashboard" aesthetics.

## Definition of success

The system must demonstrate:

agent config
→ risk analysis
→ targeted attack
→ adaptive attack behavior
→ sandbox execution
→ trajectory
→ detected failure
→ severity
→ mitigation
→ retest
→ measurable improvement

Do not optimize for feature count.
Optimize for a convincing, reliable demonstration of this loop.
