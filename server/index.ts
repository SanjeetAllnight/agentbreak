import { Hono } from "hono";
import { cors } from "hono/cors";
import { getTraces, getVerdicts, getRepairs } from "./db";
import { AuditService } from "./src/audit/service";
import { RepairService } from "./src/repair/repair-service";
import { WSMessage } from "@agentbreak/shared";

const app = new Hono();
const auditService = new AuditService();
const repairService = new RepairService();

// Enable CORS for web frontend
app.use("*", cors());

// Track active WebSocket connections for live event broadcast
const activeSockets = new Set<any>();

function broadcast(msg: WSMessage) {
  const payload = JSON.stringify(msg);
  for (const ws of activeSockets) {
    try {
      ws.send(payload);
    } catch (e) {
      activeSockets.delete(ws);
    }
  }
}

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "agentbreak-backend" });
});

app.get("/api/traces", (c) => {
  const traces = getTraces();
  return c.json(traces);
});

app.get("/api/verdicts", (c) => {
  const verdicts = getVerdicts();
  return c.json(verdicts);
});

app.get("/api/repairs", (c) => {
  const repairs = getRepairs();
  return c.json(repairs);
});

// ── Primary Audit execution endpoint ──────────────────────────────────────────
const runAuditHandler = async (c: any) => {
  try {
    let body: any = {};
    if (c.req.header("content-type")?.includes("application/json")) {
      body = await c.req.json().catch(() => ({}));
    }

    const agentPreset = body.agentPreset || "support";
    const agentConfig = body.agentConfig;

    const result = await auditService.runAudit({
      agentPreset,
      agentConfig,
      onEvent: (event) => broadcast(event),
    });

    return c.json(result);
  } catch (error: any) {
    console.error("Error executing audit:", error);
    return c.json(
      {
        error: "Audit execution failed",
        details: error?.message || String(error),
      },
      500
    );
  }
};

app.post("/audits", runAuditHandler);
app.post("/api/audits", runAuditHandler);

// ── Repair + Regression Verification endpoint ──────────────────────────────────
/**
 * POST /api/repair
 *
 * Runs the complete self-verifying repair cycle:
 *   1. Build support suite
 *   2. Run suite against original agent (before)
 *   3. Generate repair from worst failure
 *   4. Build candidate config (system prompt only)
 *   5. Run SAME suite against candidate (after)
 *   6. Compare scorecards
 *   7. Return full RepairVerificationResult
 *
 * Request body:
 *   { agentPreset?: string, agentConfig?: AgentConfig }
 */
app.post("/api/repair", async (c) => {
  try {
    let body: any = {};
    if (c.req.header("content-type")?.includes("application/json")) {
      body = await c.req.json().catch(() => ({}));
    }

    let agent;
    if (body.agentConfig) {
      agent = body.agentConfig;
    } else {
      agent = auditService.loadAgentPreset(body.agentPreset || "support");
    }

    const result = await repairService.runRepair({ agent });
    return c.json(result);
  } catch (error: any) {
    console.error("Error executing repair:", error);
    return c.json(
      {
        error: "Repair execution failed",
        details: error?.message || String(error),
      },
      500
    );
  }
});

const port = parseInt(process.env.PORT || "3000");

console.log(`Server starting on port ${port}...`);

export default {
  port,
  fetch(request: Request, server: any) {
    if (server.upgrade(request)) {
      return; // upgraded to WS
    }
    return app.fetch(request, server);
  },
  websocket: {
    open(ws: any) {
      activeSockets.add(ws);
      console.log("WebSocket client connected. Total clients:", activeSockets.size);
      ws.send(JSON.stringify({ type: "AUDIT_STATUS", payload: { message: "Connected to AgentBreak WebSocket" } }));
    },
    message(ws: any, message: string) {
      try {
        const parsed = JSON.parse(message) as WSMessage;
        ws.send(JSON.stringify({ type: "ACK", payload: parsed.type }));
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    },
    close(ws: any) {
      activeSockets.delete(ws);
      console.log("WebSocket client disconnected. Total clients:", activeSockets.size);
    },
  },
};
