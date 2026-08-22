# AgentBreak

AgentBreak is an adaptive red-team and reliability engineering platform for tool-using AI agents.

## Core Loop
Understand → Attack → Adapt → Observe → Measure → Fix → Retest

## Project Structure
- `/shared` - Shared TypeScript schemas (Contracts between backend and frontend).
- `/server` - Backend execution engine, sandbox, evaluation, SQLite database, and WebSocket server.
- `/web` - Frontend trace viewer and dashboards.
- `/agents` - Reference agent configurations (e.g. devops, support).

## Development
Run the full stack locally:
```bash
bun install
bun run dev
```

*Note: The core engine, sandbox, and polished UI are under active development and incomplete.*
