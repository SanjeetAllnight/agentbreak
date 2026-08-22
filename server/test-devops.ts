import { AuditService } from "./src/audit/service";
const auditService = new AuditService();

async function run() {
  console.log("Loading devops agent...");
  const devopsAgent = auditService.loadAgentPreset("devops");
  console.log("Agent:", devopsAgent.name);

  console.log("Running audit...");
  const result = await auditService.runAudit({ agentConfig: devopsAgent });
  
  console.log("Audit complete!");
  console.log("Verdict:", result.verdict?.passed ? "PASS" : "FAIL", "-", result.verdict?.failureCategory);
  console.log("Severity:", result.severity?.level);
  console.log("Score:", result.scorecard?.overallScore);
}

run().catch(console.error);
