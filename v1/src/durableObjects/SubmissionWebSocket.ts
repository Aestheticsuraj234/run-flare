import { WebSocketStatusUpdate, WebSocketProgressUpdate, WebSocketErrorMessage, WebSocketConnectedMessage } from "../types/types";

interface WebSocketClient {
    webSocket: WebSocket;
    connectedAt: number;
}

export class SubmissionWebSocket {
    private state: DurableObjectState;
    private clients: Map<string, WebSocketClient>;
    private token: string;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.clients = new Map();
        this.token = "";

        // Restore state if needed
        this.state.blockConcurrencyWhile(async () => {
            const storedToken = await this.state.storage.get<string>("token");
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
            await this.state.storage.put("token", token);
        }

        // Create WebSocket pair
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        // Accept the WebSocket connection
        server.accept();

        // Generate unique client ID
        const clientId = crypto.randomUUID();

        // Store client
        this.clients.set(clientId, {
            webSocket: server,
            connectedAt: Date.now(),
        });

        // Set up event handlers
        server.addEventListener("message", (event) => {
            this.handleWebSocketMessage(clientId, event);
        });

        server.addEventListener("close", () => {
            this.handleWebSocketClose(clientId);
        });

        server.addEventListener("error", (event) => {
            console.error(`[WebSocket] Error for client ${clientId}:`, event);
            this.handleWebSocketClose(clientId);
        });

        // Send connected message
        const connectedMessage: WebSocketConnectedMessage = {
            type: "connected",
            timestamp: new Date().toISOString(),
            token: this.token,
            message: `Connected to submission ${this.token}`,
        };
        server.send(JSON.stringify(connectedMessage));

        console.log(`[WebSocket] Client ${clientId} connected to submission ${this.token}. Total clients: ${this.clients.size}`);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    private handleWebSocketMessage(clientId: string, event: MessageEvent) {
        try {
            const message = JSON.parse(event.data as string);

            // Handle ping/pong
            if (message.type === "ping") {
                const client = this.clients.get(clientId);
                if (client) {
                    client.webSocket.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
                }
            }
        } catch (error) {
            console.error(`[WebSocket] Error parsing message from client ${clientId}:`, error);
        }
    }

    private handleWebSocketClose(clientId: string) {
        this.clients.delete(clientId);
        console.log(`[WebSocket] Client ${clientId} disconnected. Remaining clients: ${this.clients.size}`);
    }

    private async handleBroadcastRequest(request: Request): Promise<Response> {
        try {
            const message = await request.json() as WebSocketStatusUpdate | WebSocketProgressUpdate | WebSocketErrorMessage;
            this.broadcast(message);
            return new Response(JSON.stringify({ success: true, clientCount: this.clients.size }), {
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
        let successCount = 0;
        let failureCount = 0;

        for (const [clientId, client] of this.clients.entries()) {
            try {
                client.webSocket.send(messageStr);
                successCount++;
            } catch (error) {
                console.error(`[WebSocket] Failed to send to client ${clientId}:`, error);
                failureCount++;
                // Remove failed client
                this.clients.delete(clientId);
            }
        }

        console.log(`[WebSocket] Broadcast to ${successCount} clients (${failureCount} failures). Message type: ${message.type}`);
    }

    // Cleanup stale connections (called periodically via alarm)
    async alarm() {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour

        for (const [clientId, client] of this.clients.entries()) {
            if (now - client.connectedAt > maxAge) {
                try {
                    client.webSocket.close(1000, "Connection timeout");
                } catch (error) {
                    console.error(`[WebSocket] Error closing stale connection ${clientId}:`, error);
                }
                this.clients.delete(clientId);
            }
        }

        // Schedule next cleanup if there are still clients
        if (this.clients.size > 0) {
            await this.state.storage.setAlarm(Date.now() + 5 * 60 * 1000); // 5 minutes
        }
    }
}
