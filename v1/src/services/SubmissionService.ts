import { CreateSubmissionBody } from "../types/types";
import { SubmissionRepository } from "../repositories/SubmissionRepository";
import { LanguageRepository } from "../repositories/LanguageRepository";
import { ValidationService } from "./ValidationService";
import { APP_CONFIG, STATUS_IDS } from "../config/appConfig";
import { parseAdditionalFilesPayload, hasNonUtf8Characters } from "../utils/encoding";

export interface SubmissionDTO {
  [key: string]: any;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class SubmissionService {
  constructor(
    private submissionRepo: SubmissionRepository,
    private languageRepo: LanguageRepository,
    private validationService: ValidationService,
    private queue: Queue<any>
  ) { }

  async createSubmission(
    body: CreateSubmissionBody,
    base64Encoded: boolean
  ): Promise<{ token: string }> {
    // Validation
    const validation = this.validationService.validateSubmissionInput(body);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    // Validate language exists
    const language = await this.validationService.validateLanguageExists(body.language_id!);
    if (!language) {
      throw new ValidationError(`language with id ${body.language_id} doesn't exist`);
    }

    // Decode if needed
    let decodedSourceCode = body.source_code as string;
    let decodedStdin = body.stdin ?? null;
    let decodedExpectedOutput = body.expected_output ?? null;
    const additionalFilesRaw = (body as any).additional_files ?? null;
    let additionalFilesPayload: any[] | undefined;

    if (additionalFilesRaw) {
      try {
        additionalFilesPayload = parseAdditionalFilesPayload(additionalFilesRaw);
      } catch (err: any) {
        throw new ValidationError(err?.message ?? "invalid additional_files payload");
      }
    }

    if (base64Encoded) {
      try {
        decodedSourceCode = atob(body.source_code as string);
        if (body.stdin) decodedStdin = atob(body.stdin);
        if (body.expected_output) decodedExpectedOutput = atob(body.expected_output);
      } catch (e) {
        throw new ValidationError("Invalid base64 encoding");
      }
    }

    // Create submission
    const token = crypto.randomUUID();
    const submission = await this.submissionRepo.create({
      sourceCode: decodedSourceCode,
      languageId: body.language_id!,
      stdin: decodedStdin,
      expectedOutput: decodedExpectedOutput,
      token,
      statusId: STATUS_IDS.IN_QUEUE,
      userId: body.user_id ?? null,
      numberOfRuns: body.number_of_runs ?? APP_CONFIG.EXECUTION.numberOfRuns,
      cpuTimeLimit: body.cpu_time_limit ?? APP_CONFIG.EXECUTION.cpuTimeLimit,
      cpuExtraTime: body.cpu_extra_time ?? APP_CONFIG.EXECUTION.cpuExtraTime,
      wallTimeLimit: body.wall_time_limit ?? APP_CONFIG.EXECUTION.wallTimeLimit,
      memoryLimit: body.memory_limit ?? APP_CONFIG.EXECUTION.memoryLimit,
      stackLimit: body.stack_limit ?? APP_CONFIG.EXECUTION.stackLimit,
      maxProcessesAndThreads: body.max_processes_and_or_threads ?? APP_CONFIG.EXECUTION.maxProcessesAndThreads,
      enablePerProcessTimeLimit: body.enable_per_process_and_thread_time_limit ?? APP_CONFIG.EXECUTION.enablePerProcessTimeLimit,
      enablePerProcessMemoryLimit: body.enable_per_process_and_thread_memory_limit ?? APP_CONFIG.EXECUTION.enablePerProcessMemoryLimit,
      maxFileSize: body.max_file_size ?? APP_CONFIG.EXECUTION.maxFileSize,
      compilerOptions: body.compiler_options ?? null,
      commandLineArguments: body.command_line_arguments ?? null,
      redirectStderrToStdout: body.redirect_stderr_to_stdout ?? false,
      callbackUrl: body.callback_url ?? null,
      additionalFiles: additionalFilesRaw ? (typeof Buffer !== "undefined" ? Buffer.from(additionalFilesRaw, "base64") : null) : null,
      enableNetwork: body.enable_network ?? false,
      queuedAt: new Date(),
    });

    // Send to Cloudflare Queue
    await this.queue.send({
      submissionId: submission.id,
      token: submission.token,
      sourceCode: submission.sourceCode!,
      languageId: submission.languageId,
      stdin: submission.stdin,
      expectedOutput: submission.expectedOutput,
      language: {
        id: language.id,
        name: language.name,
        compileCmd: language.compileCmd,
        runCmd: language.runCmd,
        sourceFile: language.sourceFile,
      },
      limits: {
        cpuTimeLimit: submission.cpuTimeLimit,
        cpuExtraTime: submission.cpuExtraTime,
        wallTimeLimit: submission.wallTimeLimit,
        memoryLimit: submission.memoryLimit,
        stackLimit: submission.stackLimit,
        maxProcessesAndThreads: submission.maxProcessesAndThreads,
        enablePerProcessTimeLimit: submission.enablePerProcessTimeLimit,
        enablePerProcessMemoryLimit: submission.enablePerProcessMemoryLimit,
        maxFileSize: submission.maxFileSize,
      },
      options: {
        numberOfRuns: submission.numberOfRuns,
        compilerOptions: submission.compilerOptions,
        commandLineArguments: submission.commandLineArguments,
        redirectStderrToStdout: submission.redirectStderrToStdout,
        enableNetwork: submission.enableNetwork,
        callbackUrl: submission.callbackUrl,
        additionalFiles: additionalFilesPayload ?? undefined,
      },
    });

    return { token };
  }

  async getSubmission(
    token: string,
    fields?: string,
    base64Encoded: boolean = false
  ): Promise<SubmissionDTO> {
    const submission = await this.submissionRepo.findByToken(token);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    return this.formatSubmissionResponse(submission, fields, base64Encoded);
  }

  private formatSubmissionResponse(
    submission: any,
    fields?: string,
    base64Encoded: boolean = false
  ): SubmissionDTO {
    const hasNonUtf8 = !base64Encoded && (
      hasNonUtf8Characters(submission.stdout) ||
      hasNonUtf8Characters(submission.stderr) ||
      hasNonUtf8Characters(submission.compileOutput)
    );

    if (hasNonUtf8) {
      throw new ValidationError("some attributes cannot be converted; use base64_encoded=true");
    }

    const allFields: any = {
      source_code: base64Encoded && submission.sourceCode ? btoa(submission.sourceCode) : submission.sourceCode,
      language_id: submission.languageId,
      stdin: base64Encoded && submission.stdin ? btoa(submission.stdin) : submission.stdin,
      expected_output: base64Encoded && submission.expectedOutput ? btoa(submission.expectedOutput) : submission.expectedOutput,
      stdout: base64Encoded && submission.stdout ? btoa(submission.stdout) : submission.stdout,
      stderr: base64Encoded && submission.stderr ? btoa(submission.stderr) : submission.stderr,
      status_id: submission.statusId,
      created_at: submission.createdAt.toISOString(),
      finished_at: submission.finishedAt?.toISOString() || null,
      time: submission.time ? String(submission.time) : null,
      memory: submission.memory,
      token: submission.token,
      compile_output: base64Encoded && submission.compileOutput ? btoa(submission.compileOutput) : submission.compileOutput,
      exit_code: submission.exitCode,
      exit_signal: submission.exitSignal,
      message: submission.message,
      status: { id: submission.status.id, name: submission.status.name, description: submission.status.description },
      language: { id: submission.language.id, name: submission.language.name },
    };

    if (fields && fields !== "*") {
      const requested = fields.split(",").map((f) => f.trim());
      const filtered: any = {};
      requested.forEach((f) => {
        if (Object.prototype.hasOwnProperty.call(allFields, f)) filtered[f] = allFields[f];
      });
      return filtered;
    }

    if (!fields) {
      return {
        stdout: allFields.stdout,
        time: allFields.time,
        memory: allFields.memory,
        stderr: allFields.stderr,
        token: allFields.token,
        compile_output: allFields.compile_output,
        message: allFields.message,
        status: allFields.status,
      };
    }

    return allFields;
  }

  async waitForCompletion(
    token: string,
    base64Encoded: boolean,
    maxWaitTime: number = 30000,
    pollInterval: number = 500
  ): Promise<SubmissionDTO | null> {
    const start = Date.now();
    while (Date.now() - start < maxWaitTime) {
      await new Promise((r) => setTimeout(r, pollInterval));
      const submission = await this.submissionRepo.findByToken(token);
      if (submission && submission.statusId !== STATUS_IDS.IN_QUEUE && submission.statusId !== STATUS_IDS.PROCESSING) {
        const hasNonUtf8 = !base64Encoded && (
          hasNonUtf8Characters(submission.stdout) ||
          hasNonUtf8Characters(submission.stderr) ||
          hasNonUtf8Characters(submission.compileOutput)
        );
        if (hasNonUtf8) {
          return { token: submission.token, error: "some attributes cannot be converted to UTF-8; use base64_encoded=true" };
        }
        return {
          stdout: base64Encoded && submission.stdout ? btoa(submission.stdout) : submission.stdout,
          time: submission.time ? String(submission.time) : null,
          memory: submission.memory,
          stderr: base64Encoded && submission.stderr ? btoa(submission.stderr) : submission.stderr,
          token: submission.token,
          compile_output: base64Encoded && submission.compileOutput ? btoa(submission.compileOutput) : submission.compileOutput,
          message: submission.message,
          status: { id: submission.status.id, name: submission.status.name, description: submission.status.description },
        };
      }
    }
    return null;
  }
}

