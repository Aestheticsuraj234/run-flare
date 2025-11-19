import { SubmissionRepository } from "../repositories/SubmissionRepository";

export class CallbackService {
  constructor(private submissionRepo: SubmissionRepository) {}

  async sendCallback(submissionId: string, callbackUrl: string): Promise<void> {
    try {
      const submission = await this.submissionRepo.findById(submissionId);
      if (!submission) return;

      await fetch(callbackUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: submission.token,
          stdout: submission.stdout,
          stderr: submission.stderr,
          compile_output: submission.compileOutput,
          time: submission.time,
          memory: submission.memory,
          exit_code: submission.exitCode,
          exit_signal: submission.exitSignal,
          message: submission.message,
          status: {
            id: submission.status.id,
            name: submission.status.name,
            description: submission.status.description,
          },
          language: {
            id: submission.language.id,
            name: submission.language.name,
          },
        }),
      });
    } catch (err) {
      console.error("Callback failed", err);
    }
  }
}

