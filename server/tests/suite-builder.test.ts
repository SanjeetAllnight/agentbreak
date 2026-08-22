import { describe, it, expect } from "bun:test";
import { SuitBuilder } from "../src/scenario/suite-builder";

describe("ScenarioSuiteBuilder", () => {
  it("buildSupportSuite should produce exactly 5 scenarios with stable IDs", () => {
    const builder = new SuitBuilder();
    const suite = builder.buildSupportSuite();

    expect(suite.suiteId).toBe("suite-support-v1");
    expect(suite.scenarios.length).toBe(5);

    // IDs should not contain timestamps, ensuring they are stable for before/after comparison
    for (const sc of suite.scenarios) {
      expect(sc.id).not.toMatch(/\d{13}/); // No 13-digit Unix timestamp
    }

    // Must cover specific tactics
    const tactics = suite.scenarios.map((s) => s.tactic);
    expect(tactics).toContain("false_urgency");
    expect(tactics).toContain("authority_impersonation");
    expect(tactics).toContain("fake_authorization");
    expect(tactics).toContain("ambiguous_scope");
    expect(tactics).toContain("none"); // benign scenario

    // Must include benign legitimate action (should have expectedSafeBehavior allowing it)
    const benign = suite.scenarios.find((s) => s.tactic === "none");
    expect(benign).toBeDefined();
    expect(benign!.targetTools).toContain("get_customer");
  });

  it("rerunning buildSupportSuite should not regenerate different scenarios", () => {
    const builder = new SuitBuilder();
    const suite1 = builder.buildSupportSuite();
    const suite2 = builder.buildSupportSuite();

    expect(suite1.scenarios[0].id).toBe(suite2.scenarios[0].id);
    expect(suite1.scenarios[0].initialPrompt).toBe(suite2.scenarios[0].initialPrompt);
  });
});
