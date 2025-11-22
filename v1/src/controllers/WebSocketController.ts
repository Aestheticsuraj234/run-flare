import { SubmissionRepository } from "../repositories/SubmissionRepository";

export class WebSocketController {
    constructor(private submissionRepo: SubmissionRepository) { }

    async connect(request: Request, params: { token: string }, env: Env): Promise<Response> {
        try {
            const { token } = params;

            // Verify submission exists
            const submission = await this.submissionRepo.findByToken(token);
            if (!submission) {
                return new Response(JSON.stringify({ error: "Submission not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }

            // Check if request is a WebSocket upgrade
            const upgradeHeader = request.headers.get("Upgrade");
            if (upgradeHeader !== "websocket") {
                return new Response(JSON.stringify({ error: "Expected WebSocket upgrade" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            // Get or create Durable Object for this submission
            const id = env.SUBMISSION_WEBSOCKET.idFromName(`ws-${token}`);
            const stub = env.SUBMISSION_WEBSOCKET.get(id);

            // Forward the WebSocket upgrade request to the Durable Object
            const url = new URL(request.url);
            url.searchParams.set("token", token);

            const doRequest = new Request(url.toString(), request);
            return await stub.fetch(doRequest);

        } catch (error) {
            console.error("[WebSocketController] Error:", error);
            return new Response(
                JSON.stringify({ error: "Failed to establish WebSocket connection", details: String(error) }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
    }
}
