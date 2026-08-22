# AgentBreak

AgentBreak is an adaptive red-team and reliability engineering platform for tool-using AI agents.

## The Core Product Loop
AgentBreak executes the following pipeline to detect, analyze, and repair agent vulnerabilities:

Agent Config
→ Risk Analysis
→ Adaptive Red Team
→ Sandbox Execution
→ Trace Capture
→ Failure Judge
→ S0–S4 Severity
→ Scorecard
→ Repair
→ Same Scenario Suite Retest
→ Before/After Comparison

## Architecture & Tech Stack
- **Backend**: Bun, Hono, SQLite (`bun:sqlite`), Native WebSockets.
- **Frontend**: React, Vite, Tailwind CSS, Dark Theme.
- **LLM Integration**: Google Gemini API (`@google/genai` with `gemini-3.6-flash`) powers the Adaptive Red Team, Failure Judge, and Repair Generator.

## Project Structure
- `/shared` - Shared TypeScript schemas (Contracts between backend and frontend).
- `/server` - Backend execution engine, sandbox, evaluation, SQLite database, and WebSocket server.
- `/web` - Frontend trace viewer and dashboards.
- `/agents` - Reference agent configurations (e.g. support).

## Running Locally (Live Mode)
AgentBreak uses real LLMs to generate adaptive attacks and evaluate failures. You must provide a Google Gemini API key to run in live mode.

1. Set your Gemini API Key:
```bash
export GEMINI_API_KEY="AIzaSy..."
```

2. Install dependencies:
```bash
bun install
```

3. Start the backend:
```bash
cd server
bun run dev
```

4. Start the frontend (in a new terminal):
```bash
cd web
bun run dev
```

---

## Production Deployment (Render)

AgentBreak is packaged as a single Docker container where the Hono/Bun backend automatically builds and serves the compiled React frontend, handles WebSocket connections over `wss://`, and exposes REST APIs.

### Steps to Deploy on Render

1. **Connect Repository**: In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Blueprint** (or **Web Service**).
2. **Select Repository**: Select the `agentbreak` repository.
3. **Configuration**: 
   - If using Blueprints, Render automatically detects `render.yaml`.
   - If creating a Web Service manually:
     - **Runtime**: Docker (`Dockerfile`)
     - **Instance Type**: Free
     - **Health Check Path**: `/health`
4. **Environment Variables**:
   - In the Render Dashboard **Environment** tab, set:
     - `GEMINI_API_KEY`: `<your_gemini_api_key>`
     - `NODE_ENV`: `production`
5. **Deploy**: Trigger deployment. Once complete, your service will be live at `https://<your-service-name>.onrender.com`.
6. **Verify Health**: Visit `https://<your-service-name>.onrender.com/health` to confirm the backend is healthy.

### Operational Notes
- **Live Mode vs. Demo Mode**:
  - **Live Mode**: Uses real Gemini API calls configured via `GEMINI_API_KEY`.
  - **Demo Mode**: Instant, reproducible fixture-based walkthroughs that run independently of any external API credentials.
- **Ephemeral Storage on Render Free Tier**: Hosted free deployment on Render uses an ephemeral filesystem for SQLite. Database history resets when the container is rebuilt or restarted.
- **Spin-down Behavior**: Render Free Web Services sleep after 15 minutes of inactivity; the first request after spin-down may take ~50 seconds to initialize.

---

## Alternative Deployment (Fly.io with Persistent Volume)

For environments requiring persistent SQLite disk storage across machine restarts, AgentBreak retains full Fly.io support:

1. Install the `flyctl` CLI and authenticate.
2. Build and deploy:
```bash
fly deploy
```
3. Set the Gemini API key on the deployed app:
```bash
fly secrets set GEMINI_API_KEY="AIzaSy..."
```
