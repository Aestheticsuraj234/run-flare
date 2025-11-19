import { executeInSandbox, SandboxExecutionResult } from "../utils/sandbox";
import { STATUS_IDS } from "../config/execution";
import { Sandbox } from "@cloudflare/sandbox";

export interface Language {
  id: number;
  name: string;
  compileCmd: string | null;
  runCmd: string;
  sourceFile: string;
}

export interface CompilationResult {
  success: boolean;
  output: string | null;
  exitCode?: number;
}

export interface ExecutionResult extends SandboxExecutionResult {}

export interface EvaluationResult {
  statusId: typeof STATUS_IDS[keyof typeof STATUS_IDS];
  message: string | null;
}

export class ExecutionService {
  constructor(private sandboxBinding: DurableObjectNamespace<Sandbox>) {}

  async compileIfNeeded(
    submissionId: string,
    sourceCode: string,
    language: Language,
    limits: any,
    options: any
  ): Promise<CompilationResult> {
    if (!language.compileCmd) {
      return { success: true, output: null };
    }

    const result = await executeInSandbox(
      {
        submissionId,
        sourceCode,
        command: language.compileCmd,
        sourceFile: language.sourceFile,
        stdin: "",
        limits,
        options,
        isCompilation: true,
      },
      this.sandboxBinding
    );

    if (result.exitCode !== 0) {
      return {
        success: false,
        output: result.stderr || result.stdout || null,
        exitCode: result.exitCode,
      };
    }

    return { success: true, output: result.stderr || result.stdout || null };
  }

  async executeRuns(
    submissionId: string,
    sourceCode: string,
    language: Language,
    stdin: string,
    numberOfRuns: number,
    limits: any,
    options: any
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    for (let i = 0; i < numberOfRuns; i++) {
      const result = await executeInSandbox(
        {
          submissionId,
          sourceCode,
          command: language.runCmd,
          sourceFile: language.sourceFile,
          stdin: stdin ?? "",
          limits,
          options,
          isCompilation: false,
        },
        this.sandboxBinding
      );
      results.push(result);
    }
    return results;
  }

  aggregateResults(runResults: ExecutionResult[]): ExecutionResult {
    if (runResults.length === 1) {
      return runResults[0];
    }

    const totalTime = runResults.reduce((s, r) => s + (r.time || 0), 0);
    const totalMem = runResults.reduce((s, r) => s + (r.memory || 0), 0);
    return {
      ...runResults[0],
      time: totalTime / runResults.length,
      memory: Math.floor(totalMem / runResults.length),
    };
  }

  evaluateResults(
    executionResult: ExecutionResult,
    expectedOutput: string | null
  ): EvaluationResult {
    let statusId: typeof STATUS_IDS[keyof typeof STATUS_IDS] = STATUS_IDS.ACCEPTED;
    let message: string | null = null;

    if (executionResult.exitCode !== 0) {
      // Signal detection logic
      if (executionResult.exitSignal === 11) {
        statusId = STATUS_IDS.RUNTIME_ERROR_SIGSEGV;
        message = "Segmentation fault";
      } else if (executionResult.exitSignal === 25) {
        statusId = STATUS_IDS.RUNTIME_ERROR_FILE_SIZE;
        message = "File size limit exceeded";
      } else if (executionResult.exitSignal === 8) {
        statusId = STATUS_IDS.RUNTIME_ERROR_FPE;
        message = "Floating point exception";
      } else if (executionResult.exitSignal === 6) {
        statusId = STATUS_IDS.RUNTIME_ERROR_ABORTED;
        message = "Aborted";
      } else if (executionResult.exitSignal) {
        statusId = STATUS_IDS.RUNTIME_ERROR_OTHER;
        message = `Runtime error: signal ${executionResult.exitSignal}`;
      } else {
        statusId = STATUS_IDS.RUNTIME_ERROR_NONZERO;
        message = `Non-zero exit code: ${executionResult.exitCode}`;
      }
    } else if (executionResult.timeLimitExceeded) {
      statusId = STATUS_IDS.TIME_LIMIT_EXCEEDED;
      message = "Time limit exceeded";
    } else if (expectedOutput !== null && expectedOutput !== undefined) {
      const actualOutput = (executionResult.stdout || "").trim();
      const expected = String(expectedOutput).trim();
      if (actualOutput !== expected) {
        statusId = STATUS_IDS.WRONG_ANSWER;
        message = "Wrong answer";
      } else {
        message = "Accepted";
      }
    } else {
      message = "Accepted";
    }

    return { statusId, message };
  }
}
