import { Database } from "bun:sqlite";
import { dirname } from "path";
import { mkdirSync } from "fs";
import {
  CandidateAgentConfig,
  JudgeVerdict,
  RepairComparisonResult,
  SeverityDetail,
  StructuredRepairRecommendation,
  Trace,
} from "@agentbreak/shared";

const defaultDbPath =
  process.env.NODE_ENV === "production"
    ? "/data/agentbreak.sqlite"
    : "agentbreak.sqlite";

let resolvedDbPath = process.env.DATABASE_PATH || defaultDbPath;

// Auto-create parent directory if path specifies a directory
const dir = dirname(resolvedDbPath);
if (dir && dir !== "." && dir !== "") {
  try {
    mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.warn(`Could not create directory "${dir}" for database: ${err}. Falling back to local database path.`);
    resolvedDbPath = "agentbreak.sqlite";
  }
}

let dbInstance: Database;
try {
  dbInstance = new Database(resolvedDbPath, { create: true });
} catch (err) {
  console.warn(`Failed to open database at "${resolvedDbPath}": ${err}. Falling back to "agentbreak.sqlite".`);
  resolvedDbPath = "agentbreak.sqlite";
  dbInstance = new Database(resolvedDbPath, { create: true });
}

export const databasePath = resolvedDbPath;
export const db = dbInstance;

export function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS traces (
      id TEXT PRIMARY KEY,
      scenarioId TEXT NOT NULL,
      agentId TEXT,
      criticalActionsCount INTEGER DEFAULT 0,
      attackEventsJson TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      traceId TEXT NOT NULL,
      turnIndex INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      toolCallsJson TEXT,
      toolResultsJson TEXT,
      attackMetaJson TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(traceId) REFERENCES traces(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS verdicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      traceId TEXT NOT NULL,
      scenarioId TEXT NOT NULL,
      passed INTEGER NOT NULL,
      failureCategory TEXT NOT NULL,
      rationale TEXT NOT NULL,
      confidence TEXT NOT NULL,
      judgeMode TEXT NOT NULL,
      severityLevel TEXT NOT NULL,
      severityReason TEXT NOT NULL,
      severityCriticalTool TEXT,
      overallScore INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS repairs (
      id TEXT PRIMARY KEY,
      originalAgentId TEXT NOT NULL,
      repairId TEXT NOT NULL,
      failureCategory TEXT NOT NULL,
      summary TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      proposedChange TEXT NOT NULL,
      expectedBehavior TEXT NOT NULL,
      repairMode TEXT NOT NULL,
      candidateId TEXT NOT NULL,
      candidateSystemPromptDiff TEXT,
      beforeScore INTEGER,
      afterScore INTEGER,
      scoreDelta INTEGER,
      improved INTEGER,
      regressionDetected INTEGER,
      explanation TEXT,
      comparisonJson TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function saveTrace(trace: Trace): void {
  const insertTrace = db.prepare(`
    INSERT OR REPLACE INTO traces (id, scenarioId, agentId, criticalActionsCount, attackEventsJson)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertTrace.run(
    trace.id,
    trace.scenarioId,
    trace.agentId || null,
    trace.criticalActions?.length || 0,
    trace.attackEvents ? JSON.stringify(trace.attackEvents) : null
  );

  const insertTurn = db.prepare(`
    INSERT INTO turns (traceId, turnIndex, role, content, toolCallsJson, toolResultsJson, attackMetaJson)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const turn of trace.turns) {
    insertTurn.run(
      trace.id,
      turn.turnIndex ?? 0,
      turn.role,
      turn.content,
      turn.toolCalls ? JSON.stringify(turn.toolCalls) : null,
      turn.toolResults ? JSON.stringify(turn.toolResults) : null,
      turn.attackMeta ? JSON.stringify(turn.attackMeta) : null
    );
  }
}

export function saveVerdict(
  traceId: string,
  scenarioId: string,
  verdict: JudgeVerdict,
  severity: SeverityDetail,
  overallScore?: number
): void {
  const insert = db.prepare(`
    INSERT INTO verdicts
      (traceId, scenarioId, passed, failureCategory, rationale, confidence, judgeMode, severityLevel, severityReason, severityCriticalTool, overallScore)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    traceId,
    scenarioId,
    verdict.passed ? 1 : 0,
    verdict.failureCategory,
    verdict.rationale,
    verdict.confidence,
    verdict.judgeMode,
    severity.level,
    severity.reason,
    severity.criticalTool ?? null,
    overallScore ?? null
  );
}

export function saveRepair(
  verificationId: string,
  originalAgentId: string,
  repair: StructuredRepairRecommendation,
  candidate: CandidateAgentConfig,
  comparison: RepairComparisonResult
): void {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO repairs
      (id, originalAgentId, repairId, failureCategory, summary, recommendation, proposedChange, expectedBehavior, repairMode,
       candidateId, candidateSystemPromptDiff, beforeScore, afterScore, scoreDelta, improved, regressionDetected, explanation, comparisonJson)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    verificationId,
    originalAgentId,
    repair.repairId,
    repair.failureCategory,
    repair.summary,
    repair.recommendation,
    repair.proposedChange,
    repair.expectedBehavior,
    repair.repairMode,
    candidate.candidateId,
    candidate.systemPromptDiff,
    comparison.beforeScore,
    comparison.afterScore,
    comparison.scoreDelta,
    comparison.improved ? 1 : 0,
    comparison.regressionDetected ? 1 : 0,
    comparison.explanation,
    JSON.stringify(comparison)
  );
}

export function getTraces(): any[] {
  return db.query("SELECT * FROM traces ORDER BY createdAt DESC").all();
}

export function getVerdicts(): any[] {
  return db.query("SELECT * FROM verdicts ORDER BY createdAt DESC").all();
}

export function getRepairs(): any[] {
  return db.query("SELECT * FROM repairs ORDER BY createdAt DESC").all();
}

initializeDatabase();
