import { setupRoutes } from "./routes";
import { SubmissionExecutor } from "./durableObjects/SubmissionExecutor";
import { Sandbox } from "./durableObjects/Sandbox";

export { SubmissionExecutor, Sandbox };

import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";

export default {

	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return errorHandler(request, async () => {
			// Rate Limiter
			const rateLimitResponse = await rateLimiter(request, env);
			if (rateLimitResponse) return rateLimitResponse;

			const router = setupRoutes(env);
			const response = await router.handle(request, env, ctx);
			return response ?? new Response("Not Found", { status: 404 });
		});
	},

	async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
		for (const message of batch.messages) {
			try {
				const data = message.body;

				// Get durable object instance for this submission
				const id = env.SUBMISSION_EXECUTOR.idFromName(`executor-${data.submissionId}`);
				const stub = env.SUBMISSION_EXECUTOR.get(id);

				// Execute submission in Durable Object
				await stub.fetch(
					new Request("http://internal/execute", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(data),
					})
				);

				message.ack();
			} catch (error) {
				console.error("Queue processing error:", error);
				message.retry()
			}
		}
	}
} satisfies ExportedHandler<Env>;
