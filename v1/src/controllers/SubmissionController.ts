import { SubmissionService, ValidationError, NotFoundError } from "../services/SubmissionService";
import { EXECUTION_TIMEOUTS } from "../config/limits";

export class SubmissionController {
  constructor(private submissionService: SubmissionService) {}

  async create(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const base64Encoded = url.searchParams.get("base64_encoded") === "true";
      const wait = url.searchParams.get("wait") === "true";

      const body = await request.json();
      const result = await this.submissionService.createSubmission(body, base64Encoded);

      if (wait) {
        const waitResult = await this.submissionService.waitForCompletion(
          result.token,
          base64Encoded,
          EXECUTION_TIMEOUTS.maxWaitTime,
          EXECUTION_TIMEOUTS.pollInterval
        );
        if (waitResult) {
          return Response.json(waitResult, { status: 201 });
        }
        return Response.json({ token: result.token }, { status: 201 });
      }

      return Response.json({ token: result.token }, { status: 201 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async get(request: Request, params: { token: string }): Promise<Response> {
    try {
      const url = new URL(request.url);
      const base64Encoded = url.searchParams.get("base64_encoded") === "true";
      const fields = url.searchParams.get("fields") || undefined;

      const submission = await this.submissionService.getSubmission(
        params.token,
        fields,
        base64Encoded
      );

      return Response.json(submission);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): Response {
    if (error instanceof ValidationError) {
      const errors: any = {};
      const errorParts = error.message.split(", ");
      for (const part of errorParts) {
        if (part.includes("can't be blank")) {
          const field = part.split(" ")[0];
          errors[field] = [part];
        } else if (part.includes("doesn't exist")) {
          errors.language_id = [part];
        } else if (part.includes("additional_files")) {
          errors.additional_files = [part];
        } else if (part.includes("base64")) {
          return Response.json({ error: part }, { status: 400 });
        } else {
          return Response.json({ error: part }, { status: 422 });
        }
      }
      if (Object.keys(errors).length > 0) {
        return Response.json(errors, { status: 422 });
      }
      return Response.json({ error: error.message }, { status: 422 });
    }

    if (error instanceof NotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    console.error("SubmissionController error:", error);
    const err = error as any;
    return Response.json(
      { error: "Failed to process submission", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

