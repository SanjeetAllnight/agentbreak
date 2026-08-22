import { describe, it, expect } from "bun:test";
import { RiskAnalyzer } from "../src/risk/analyzer";
import { AgentConfig } from "@agentbreak/shared";

describe("RiskAnalyzer", () => {
  const analyzer = new RiskAnalyzer();

  const mockAgent: AgentConfig = {
    id: "test-support",
    name: "Customer Support Agent",
    systemPrompt: "Support assistant",
    tools: [
      {
        name: "get_customer",
        description: "Retrieves customer profile by ID",
        parameters: { type: "object", properties: { customerId: { type: "string" } } },
      },
      {
        name: "get_order",
        description: "Retrieves order status",
        parameters: { type: "object", properties: { orderId: { type: "string" } } },
      },
      {
        name: "issue_refund",
        description: "Issues monetary refund back to customer",
        parameters: { type: "object", properties: { orderId: { type: "string" }, amount: { type: "number" } } },
      },
      {
        name: "cancel_subscription",
        description: "Cancels an active subscription immediately",
        parameters: { type: "object", properties: { subscriptionId: { type: "string" } } },
      },
      {
        name: "close_account",
        description: "Permanently deletes and closes a customer account",
        parameters: { type: "object", properties: { customerId: { type: "string" } } },
      },
      {
        name: "send_email",
        description: "Sends an email to user",
        parameters: { type: "object", properties: { to: { type: "string" } } },
      },
    ],
  };

  it("should mark issue_refund, cancel_subscription, and close_account as irreversible / high-risk", () => {
    const profile = analyzer.analyze(mockAgent);

    expect(profile.highRiskTools).toContain("issue_refund");
    expect(profile.highRiskTools).toContain("cancel_subscription");
    expect(profile.highRiskTools).toContain("close_account");

    const refundRisk = profile.toolRisks?.find((t) => t.toolName === "issue_refund");
    expect(refundRisk?.reversible).toBe(false);
    expect(refundRisk?.riskCategory).toBe("financial");
    expect(refundRisk?.severityPotential).toBe("S4");

    const cancelRisk = profile.toolRisks?.find((t) => t.toolName === "cancel_subscription");
    expect(cancelRisk?.reversible).toBe(false);
    expect(cancelRisk?.riskCategory).toBe("account_lifecycle");
    expect(cancelRisk?.severityPotential).toBe("S3");

    const closeRisk = profile.toolRisks?.find((t) => t.toolName === "close_account");
    expect(closeRisk?.reversible).toBe(false);
    expect(closeRisk?.riskCategory).toBe("account_lifecycle");
    expect(closeRisk?.severityPotential).toBe("S4");
  });

  it("should classify read-only data access tools as reversible with S1 severity", () => {
    const profile = analyzer.analyze(mockAgent);

    const getCustomerRisk = profile.toolRisks?.find((t) => t.toolName === "get_customer");
    expect(getCustomerRisk?.reversible).toBe(true);
    expect(getCustomerRisk?.riskCategory).toBe("data_access");
    expect(getCustomerRisk?.severityPotential).toBe("S1");
  });
});
