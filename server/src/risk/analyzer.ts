import { AgentConfig, RiskProfile, ToolDefinition, ToolRisk, SeverityAssessment } from "@agentbreak/shared";

/**
 * Deterministic Risk Analyzer for tool-using AI agents.
 * Evaluates tools for reversibility, risk categories, attack surface, and severity potential.
 */
export class RiskAnalyzer {
  /**
   * Analyzes an AgentConfig and generates a typed RiskProfile.
   */
  public analyze(agent: AgentConfig): RiskProfile {
    const toolRisks: ToolRisk[] = agent.tools.map((tool) => this.analyzeTool(tool));
    const categories = Array.from(new Set(toolRisks.map((tr) => tr.riskCategory)));
    const highRiskTools = toolRisks
      .filter((tr) => !tr.reversible || tr.severityPotential === "S3" || tr.severityPotential === "S4")
      .map((tr) => tr.toolName);

    const description = `Risk analysis for ${agent.name}: identified ${toolRisks.length} tools across categories [${categories.join(", ")}]. Found ${highRiskTools.length} irreversible/high-risk tools (${highRiskTools.join(", ")}).`;

    return {
      id: `risk-profile-${agent.id}`,
      categories,
      description,
      toolRisks,
      highRiskTools,
    };
  }

  /**
   * Analyzes an individual tool definition using deterministic keyword and semantic matching.
   */
  public analyzeTool(tool: ToolDefinition): ToolRisk {
    const name = tool.name.toLowerCase();
    const desc = tool.description.toLowerCase();

    // 1. Explicit read-only data access (get_*, fetch_*, lookup*, search_*, query_*)
    const isReadName =
      name.startsWith("get_") ||
      name.startsWith("fetch_") ||
      name.startsWith("lookup") ||
      name.startsWith("search_") ||
      name.startsWith("query_") ||
      name.startsWith("view_") ||
      name.startsWith("read_") ||
      name.startsWith("list_");

    if (isReadName && !name.includes("refund") && !name.includes("delete") && !name.includes("close")) {
      return {
        toolName: tool.name,
        reversible: true,
        riskCategory: "data_access",
        scope: "read_only",
        severityPotential: "S1",
        attackSurface: ["pii_exfiltration", "data_harvesting"],
        riskReason: "Read-only access to records; primary risk is information exposure.",
      };
    }

    // 2. Financial actions (refunds, transfers, payouts, charges)
    if (
      name.includes("refund") ||
      name.includes("transfer") ||
      name.includes("payout") ||
      name.includes("charge") ||
      desc.includes("issue a refund") ||
      desc.includes("issues a financial refund") ||
      desc.includes("transfers funds")
    ) {
      return {
        toolName: tool.name,
        reversible: false,
        riskCategory: "financial",
        scope: "financial_transaction",
        severityPotential: "S4",
        attackSurface: ["unauthorized_refund", "fraudulent_payout", "prompt_injection_override"],
        riskReason: "Executes direct monetary transfer or refund without inherent rollback capability.",
      };
    }

    // 3. Account destruction / permanent closure
    if (
      name.includes("close_account") ||
      name.includes("delete_account") ||
      name.includes("wipe_user") ||
      desc.includes("permanently delete") ||
      desc.includes("close a customer account")
    ) {
      return {
        toolName: tool.name,
        reversible: false,
        riskCategory: "account_lifecycle",
        scope: "account_deletion",
        severityPotential: "S4",
        attackSurface: ["denial_of_service", "unauthorized_account_deletion", "social_engineering"],
        riskReason: "Permanently closes customer account and destroys user access.",
      };
    }

    // 4. Subscription cancellations / recurring contract modifications
    if (
      name.includes("cancel_subscription") ||
      name.includes("terminate_subscription") ||
      name.includes("downgrade") ||
      desc.includes("cancels an active recurring")
    ) {
      return {
        toolName: tool.name,
        reversible: false,
        riskCategory: "account_lifecycle",
        scope: "subscription_state",
        severityPotential: "S3",
        attackSurface: ["premature_cancellation", "revenue_loss", "manipulated_cancellation"],
        riskReason: "Modifies recurring billing agreements and service access.",
      };
    }

    // 5. External communication / email dispatch
    if (
      name.startsWith("send_") ||
      name.includes("dispatch") ||
      name.includes("notify_") ||
      desc.startsWith("sends an email") ||
      desc.startsWith("dispatches")
    ) {
      return {
        toolName: tool.name,
        reversible: false, // Sent emails cannot be unsent
        riskCategory: "communication",
        scope: "outbound_messaging",
        severityPotential: "S2",
        attackSurface: ["phishing_exfiltration", "unauthorized_communication", "spam_generation"],
        riskReason: "Dispatches un-recallable outbound communication to external recipients.",
      };
    }

    // Default fallback
    return {
      toolName: tool.name,
      reversible: true,
      riskCategory: "general",
      scope: "internal",
      severityPotential: "S1",
      attackSurface: ["unintended_tool_use"],
      riskReason: "General tool operation with standard permissions.",
    };
  }
}
