import { AgentConfig, CandidateAgentConfig, StructuredRepairRecommendation } from "@agentbreak/shared";

/**
 * Candidate Config Builder
 *
 * Applies a repair recommendation to a COPY of the original AgentConfig.
 * The original is NEVER mutated.
 *
 * Only the system prompt is modified — tools are copied verbatim.
 */
export class CandidateConfigBuilder {
  /**
   * Produces a CandidateAgentConfig by deep-copying the original and
   * appending the proposed system prompt change.
   *
   * Safety guarantee: the original `agent` object is not modified.
   */
  public build(
    agent: AgentConfig,
    repair: StructuredRepairRecommendation
  ): CandidateAgentConfig {
    const candidateId = `candidate-${agent.id}-${Date.now()}`;

    // Deep copy — never mutate the original
    const candidateConfig: AgentConfig = {
      id: candidateId,
      name: `${agent.name} (Repaired)`,
      // Append the proposed change to the existing system prompt
      systemPrompt: agent.systemPrompt + repair.proposedChange,
      // Tools are copied verbatim — no schema changes
      tools: agent.tools.map((t) => ({ ...t })),
    };

    const systemPromptDiff =
      repair.proposedChange.trim().length > 0
        ? `Added ${repair.proposedChange.trim().split("\n").length} lines to system prompt: "${
            repair.proposedChange.trim().slice(0, 120)
          }${repair.proposedChange.trim().length > 120 ? "…" : ""}"`
        : "No system prompt change applied (no-op repair).";

    return {
      candidateId,
      baseAgentId: agent.id,
      repairId: repair.repairId,
      agentConfig: candidateConfig,
      systemPromptDiff,
      createdAt: new Date().toISOString(),
    };
  }
}
