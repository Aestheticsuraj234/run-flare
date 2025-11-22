import { Sandbox } from "@cloudflare/sandbox";
import { SubmissionRepository } from "../repositories/SubmissionRepository";
import { STATUS_IDS } from "../config/execution";
import { ExecutionService } from "../services/ExecutionService";
import { CallbackService } from "../services/CallbackService";
import { WebSocketStatusUpdate, WebSocketProgressUpdate } from "../types/types";

type Env = {
  SANDBOX: DurableObjectNamespace<Sandbox>;
  SUBMISSION_WEBSOCKET: DurableObjectNamespace<any>;
};


export class SubmissionExecutor {
  private state: DurableObjectState;
  private env: Env;
  private executionService: ExecutionService;
  private callbackService: CallbackService;
  private submissionRepo: SubmissionRepository;


  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.executionService = new ExecutionService(env.SANDBOX);
    this.submissionRepo = new SubmissionRepository();
    this.callbackService = new CallbackService(this.submissionRepo);
  }

  async fetch(request: Request): Promise<Response> {
    const data = await request.json();
    await this.executeSubmission(data);
    return new Response("OK");
  }

  private async executeSubmission(data: any): Promise<void> {
    const {
      submissionId,
      token,
      sourceCode,
      stdin,
      expectedOutput,
      language,
      limits,
      options,
    } = data;

    console.log(`[Executor] Starting submission ${submissionId} (${token})`);
    try {
      // Step 1: Update status to processing
      await this.submissionRepo.markAsProcessing(String(submissionId));
      await this.broadcastWebSocketUpdate(token, {
        type: "status_update",
        timestamp: new Date().toISOString(),
        token,
        status: { id: STATUS_IDS.PROCESSING, name: "Processing", description: "Submission is being processed" },
      });

      // Step 2: Compile (if needed)
      let compileOutput: string | null = null;
      if (language.compileCmd) {
        const compileResult = await this.executionService.compileIfNeeded(
          String(submissionId),
          sourceCode,
          language,
          limits,
          options
        );

        compileOutput = compileResult.output;

        if (!compileResult.success) {
          await this.submissionRepo.updateCompilationFailed(String(submissionId), {
            compileOutput,
            exitCode: compileResult.exitCode || 1,
          });

          await this.broadcastWebSocketUpdate(token, {
            type: "status_update",
            timestamp: new Date().toISOString(),
            token,
            status: { id: STATUS_IDS.COMPILATION_ERROR, name: "Compilation Error", description: "Compilation failed" },
            data: { compile_output: compileOutput ?? "", exit_code: compileResult.exitCode || 1 },
          });

          await this.submissionRepo.createResult({
            submissionId: String(submissionId),
            stderr: compileOutput,
            exitCode: compileResult.exitCode || 1,
            startedAt: new Date(),
            finishedAt: new Date(),
          });

          console.log(`[Executor] Compilation failed for ${token}`);
          return;
        }

        if (compileOutput) {
          await this.submissionRepo.updateStatus(String(submissionId), STATUS_IDS.PROCESSING, {
            compileOutput,
          });
        }
      }

      // Step 3: Execute runs
      await this.broadcastWebSocketUpdate(token, {
        type: "progress_update",
        timestamp: new Date().toISOString(),
        token,
        stage: "running",
        message: "Executing code...",
      });

      const numberOfRuns = options?.numberOfRuns ?? 1;
      const runResults = await this.executionService.executeRuns(
        String(submissionId),
        sourceCode,
        language,
        stdin ?? "",
        numberOfRuns,
        limits,
        options
      );

      // Aggregate results
      const executionResult = this.executionService.aggregateResults(runResults);

      // Step 4: Evaluate & update DB
      const evaluation = this.executionService.evaluateResults(executionResult, expectedOutput);

      await this.submissionRepo.updateWithResults(String(submissionId), evaluation, executionResult);

      // Broadcast completion status
      const submission = await this.submissionRepo.findByToken(token);
      if (submission) {
        await this.broadcastWebSocketUpdate(token, {
          type: "status_update",
          timestamp: new Date().toISOString(),
          token,
          status: { id: submission.statusId, name: submission.status.name, description: submission.status.description },
          data: {
            stdout: executionResult.stdout ?? "",
            stderr: executionResult.stderr ?? "",
            time: String(executionResult.time),
            memory: executionResult.memory,
            exit_code: executionResult.exitCode,
          },
        });
      }

      await this.submissionRepo.createResult({
        submissionId: String(submissionId),
        stdout: executionResult.stdout,
        stderr: executionResult.stderr,
        exitCode: executionResult.exitCode,
        startedAt: executionResult.startedAt,
        finishedAt: executionResult.finishedAt,
      });

      // Step 5: Optional callback
      const callbackUrl = options?.callbackUrl;
      if (callbackUrl) {
        await this.callbackService.sendCallback(String(submissionId), callbackUrl);
      }

      console.log(`[Executor] Submission ${token} completed successfully`);
    } catch (err: any) {
      console.error("[Executor] Internal error:", err);

      await this.submissionRepo.markAsInternalError(String(submissionId), err);

      await this.broadcastWebSocketUpdate(token, {
        type: "error",
        timestamp: new Date().toISOString(),
        token,
        error: "Internal Error",
        details: err?.message ?? String(err),
      });

      await this.submissionRepo.createResult({
        submissionId: String(submissionId),
        stderr: err.stack ?? String(err),
        exitCode: 1,
        startedAt: new Date(),
        finishedAt: new Date(),
      });
    }

  }

  private async broadcastWebSocketUpdate(
    token: string,
    message: WebSocketStatusUpdate | WebSocketProgressUpdate | { type: "error"; timestamp: string; token: string; error: string; details?: string }
  ): Promise<void> {
    try {
      const id = this.env.SUBMISSION_WEBSOCKET.idFromName(`ws-${token}`);
      const stub = this.env.SUBMISSION_WEBSOCKET.get(id);

      await stub.fetch(
        new Request("http://internal/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
        })
      );
    } catch (error) {
      // Don't fail the submission if WebSocket broadcast fails
      console.error("[Executor] Failed to broadcast WebSocket update:", error);
    }
  }
}