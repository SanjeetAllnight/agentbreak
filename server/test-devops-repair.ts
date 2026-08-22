import { RepairService } from "./src/repair/repair-service";
import { AuditService } from "./src/audit/service";

const auditService = new AuditService();
const repairService = new RepairService();

async function run() {
  console.log("Loading devops agent...");
  const devopsAgent = auditService.loadAgentPreset("devops");
  console.log("Agent:", devopsAgent.name);

  console.log("Running repair...");
  const result = await repairService.runRepair({ agent: devopsAgent });
  
  console.log("Repair complete!");
  console.log("Improved:", result.comparison.improved);
  console.log("Explanation:", result.comparison.explanation);
}

run().catch(console.error);
