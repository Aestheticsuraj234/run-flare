import { prisma } from "../lib/db";
import { STATUS_IDS } from "../config/execution";
import { EXECUTION_CONFIG } from "../config/execution";

export interface CreateSubmissionData {
  sourceCode: string;
  languageId: number;
  stdin: string | null;
  expectedOutput: string | null;
  token: string;
  statusId: number;
  userId?: string | null;
  numberOfRuns?: number;
  cpuTimeLimit?: number;
  cpuExtraTime?: number;
  wallTimeLimit?: number;
  memoryLimit?: number;
  stackLimit?: number;
  maxProcessesAndThreads?: number;
  enablePerProcessTimeLimit?: boolean;
  enablePerProcessMemoryLimit?: boolean;
  maxFileSize?: number;
  compilerOptions?: string | null;
  commandLineArguments?: string | null;
  redirectStderrToStdout?: boolean;
  callbackUrl?: string | null;
  additionalFiles?: Buffer | null;
  enableNetwork?: boolean;
  queuedAt: Date;
}

export class SubmissionRepository {
  async create(data: CreateSubmissionData) {
    return prisma.submission.create({ data });
  }

  async findByToken(token: string) {
    return prisma.submission.findUnique({
      where: { token },
      include: { language: true, status: true },
    });
  }

  async findById(id: string) {
    return prisma.submission.findUnique({
      where: { id },
      include: { language: true, status: true },
    });
  }

  async updateStatus(id: string, statusId: number, additionalData?: any) {
    return prisma.submission.update({
      where: { id },
      data: { statusId, ...additionalData },
    });
  }

  async markAsProcessing(id: string) {
    return this.updateStatus(id, STATUS_IDS.PROCESSING, {
      startedAt: new Date(),
      executionHost: EXECUTION_CONFIG.executionHost,
    });
  }

  async updateCompilationFailed(id: string, compileResult: { compileOutput: string | null; exitCode: number }) {
    return prisma.submission.update({
      where: { id },
      data: {
        statusId: STATUS_IDS.COMPILATION_ERROR,
        compileOutput: compileResult.compileOutput,
        exitCode: compileResult.exitCode,
        finishedAt: new Date(),
        message: "Compilation failed",
      },
    });
  }

  async updateWithResults(
    id: string,
    evaluation: { statusId: number; message: string | null },
    executionResult: any
  ) {
    return prisma.submission.update({
      where: { id },
      data: {
        statusId: evaluation.statusId,
        stdout: executionResult.stdout,
        stderr: executionResult.stderr,
        exitCode: executionResult.exitCode,
        exitSignal: executionResult.exitSignal,
        time: executionResult.time,
        memory: executionResult.memory,
        wallTime: executionResult.wallTime,
        message: evaluation.message,
        finishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async markAsInternalError(id: string, error: any) {
    return prisma.submission.update({
      where: { id },
      data: {
        statusId: STATUS_IDS.INTERNAL_ERROR,
        message: error.message ?? "Internal error",
        finishedAt: new Date(),
        stderr: error.stack ?? String(error),
      },
    });
  }

  async createResult(data: {
    submissionId: string;
    stdout?: string | null;
    stderr?: string | null;
    exitCode?: number | null;
    startedAt?: Date | null;
    finishedAt?: Date | null;
  }) {
    return prisma.result.create({ data });
  }
}

