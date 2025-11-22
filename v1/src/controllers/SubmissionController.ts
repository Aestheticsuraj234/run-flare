import { SubmissionService, ValidationError, NotFoundError } from "../services/SubmissionService";
import { CreateSubmissionBody } from "../types/types";
import { APP_CONFIG } from "../config/appConfig";

export class SubmissionController {
  constructor(private submissionService: SubmissionService) { }

  async create(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const base64Encoded = url.searchParams.get("base64_encoded") === "true";
      const wait = url.searchParams.get("wait") === "true";

      const body = await request.json() as CreateSubmissionBody;
      const result = await this.submissionService.createSubmission(body, base64Encoded);

      if (wait) {
        const waitResult = await this.submissionService.waitForCompletion(
          result.token,
          base64Encoded,
          APP_CONFIG.TIMEOUTS.maxWaitTime,
          APP_CONFIG.TIMEOUTS.pollInterval
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

      const response = Response.json(submission);

      // Cache finished submissions for 1 hour, don't cache pending ones
      if (submission.status_id === 3 || submission.status_id >= 4) { // 3=Accepted, 4+=Error/Wrong Answer etc.
        response.headers.set("Cache-Control", `public, max-age=${APP_CONFIG.CACHE.ttl}`);
      } else {
        response.headers.set("Cache-Control", "no-store");
      }

      return response;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createBatch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const base64Encoded = url.searchParams.get("base64_encoded") === "true";

      const body = await request.json() as { submissions: CreateSubmissionBody[] };

      if (!body.submissions || !Array.isArray(body.submissions)) {
        return Response.json({ error: "Invalid batch format. Expected { submissions: [...] }" }, { status: 400 });
      }

      if (body.submissions.length > APP_CONFIG.BATCH.maxSize) {
        return Response.json({ error: `Batch size exceeds limit of ${APP_CONFIG.BATCH.maxSize}` }, { status: 400 });
      }

      const results = await Promise.all(
        body.submissions.map(sub => this.submissionService.createSubmission(sub, base64Encoded))
      );

      return Response.json(results, { status: 201 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getBatch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const base64Encoded = url.searchParams.get("base64_encoded") === "true";
      const tokensParam = url.searchParams.get("tokens");
      const fields = url.searchParams.get("fields") || undefined;

      if (!tokensParam) {
        return Response.json({ error: "Missing tokens parameter" }, { status: 400 });
      }

      const tokens = tokensParam.split(",").map(t => t.trim()).filter(Boolean);

      if (tokens.length > APP_CONFIG.BATCH.maxSize) {
        return Response.json({ error: `Batch size exceeds limit of ${APP_CONFIG.BATCH.maxSize}` }, { status: 400 });
      }

      const submissions = await Promise.all(
        tokens.map(async (token) => {
          try {
            return await this.submissionService.getSubmission(token, fields, base64Encoded);
          } catch (e) {
            return { token, error: "Not Found" };
          }
        })
      );

      return Response.json({ submissions });
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
