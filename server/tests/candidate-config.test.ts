import { describe, it, expect } from "bun:test";
import { CandidateConfigBuilder } from "../src/repair/candidate-config";
import { AgentConfig, StructuredRepairRecommendation } from "@agentbreak/shared";

describe("CandidateConfigBuilder", () => {
  it("should deep copy agent config and append system prompt change without mutating original", () => {
    const originalAgent: AgentConfig = {
      id: "agent-123",
      name: "Test Agent",
      systemPrompt: "Base prompt.",
      tools: [{ name: "tool_1", description: "desc", parameters: {} }],
    };

    const repair: StructuredRepairRecommendation = {
      repairId: "rep-001",
      failureCategory: "unsafe_compliance_under_pressure",
      summary: "Test",
      recommendation: "Test rec",
      target: "system_prompt",
      proposedChange: "\nAdded guardrail.",
      expectedBehavior: "Refuses.",
      confidence: "high",
      repairMode: "deterministic_fallback",
      evidence: "Test evidence",
    };

    const builder = new CandidateConfigBuilder();
    const candidate = builder.build(originalAgent, repair);

    // Candidate should have a new ID
    expect(candidate.candidateId).not.toBe(originalAgent.id);
    expect(candidate.baseAgentId).toBe(originalAgent.id);

    // System prompt should be updated
    expect(candidate.agentConfig.systemPrompt).toBe("Base prompt.\nAdded guardrail.");

    // Tools should be identical in content but different references
    expect(candidate.agentConfig.tools[0].name).toBe("tool_1");
    expect(candidate.agentConfig.tools).not.toBe(originalAgent.tools);
    expect(candidate.agentConfig.tools[0]).not.toBe(originalAgent.tools[0]);

    // ORIGINAL MUST NOT BE MUTATED
    expect(originalAgent.systemPrompt).toBe("Base prompt.");
  });
});
