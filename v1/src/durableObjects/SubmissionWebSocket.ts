import { WebSocketStatusUpdate, WebSocketProgressUpdate, WebSocketErrorMessage, WebSocketConnectedMessage } from "../types/types";
import { DurableObject } from "cloudflare:workers";

export class SubmissionWebSocket extends DurableObject<Env> {
    private token: string;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.token = "";

        // Restore state if needed
        this.ctx.blockConcurrencyWhile(async () => {
            const storedToken = await this.ctx.storage.get<string>("token");
            if (storedToken) {
                this.token = storedToken;
            }
        });
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        // Handle WebSocket upgrade
        if (request.headers.get("Upgrade") === "websocket") {
            return this.handleWebSocketUpgrade(request);
        }

        // Handle broadcast requests from SubmissionExecutor
        if (request.method === "POST" && url.pathname === "/broadcast") {
            return this.handleBroadcastRequest(request);
        }

        return new Response("Not Found", { status: 404 });
    }

    private async handleWebSocketUpgrade(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        if (!token) {
            return new Response("Missing token parameter", { status: 400 });
        }

        // Store token if not already set
        if (!this.token) {
            this.token = token;
            await this.ctx.storage.put("token", token);
        }

        // Create WebSocket pair
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        // Accept the WebSocket connection using Hibernation API
        this.ctx.acceptWebSocket(server);

        // Send connected message immediately
        const connectedMessage: WebSocketConnectedMessage = {
            type: "connected",
            timestamp: new Date().toISOString(),
            token: this.token,
            message: `Connected to submission ${this.token}`,
        };
        server.send(JSON.stringify(connectedMessage));

        console.log(`[WebSocket] Client connected to submission ${this.token}.`);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
        try {
            const msg = JSON.parse(message as string);

            // Handle ping/pong
            if (msg.type === "ping") {
                ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
            }
        } catch (error) {
            console.error(`[WebSocket] Error parsing message:`, error);
        }
    }

    async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
        console.log(`[WebSocket] Client disconnected. Code: ${code}, Reason: ${reason}`);
    }

    async webSocketError(ws: WebSocket, error: unknown) {
        console.error(`[WebSocket] Error:`, error);
    }

    private async handleBroadcastRequest(request: Request): Promise<Response> {
        try {
            const message = await request.json() as WebSocketStatusUpdate | WebSocketProgressUpdate | WebSocketErrorMessage;
            this.broadcast(message);

            // Get client count efficiently
            const clients = this.ctx.getWebSockets();
            return new Response(JSON.stringify({ success: true, clientCount: clients.length }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("[WebSocket] Error handling broadcast request:", error);
            return new Response(JSON.stringify({ success: false, error: String(error) }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    private broadcast(message: WebSocketStatusUpdate | WebSocketProgressUpdate | WebSocketErrorMessage) {
        const messageStr = JSON.stringify(message);
        const websockets = this.ctx.getWebSockets();

        let successCount = 0;
        let failureCount = 0;

        for (const ws of websockets) {
            try {
                ws.send(messageStr);
                successCount++;
            } catch (error) {
                console.error(`[WebSocket] Failed to send to client:`, error);
                failureCount++;
                // Hibernation API handles cleanup automatically on error/close
            }
        }

        console.log(`[WebSocket] Broadcast to ${successCount} clients (${failureCount} failures). Message type: ${message.type}`);
    }
}
