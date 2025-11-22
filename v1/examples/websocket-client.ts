// WebSocket Client Example for Run-Flare
// This example demonstrates how to use WebSocket for real-time submission updates

class RunFlareWebSocketClient {
    private ws: WebSocket | null = null;
    private token: string;
    private baseUrl: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second

    constructor(token: string, baseUrl: string = 'ws://localhost:8787') {
        this.token = token;
        this.baseUrl = baseUrl;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `${this.baseUrl}/api/v1/submissions/${this.token}/ws`;
                console.log(`[WebSocket] Connecting to ${wsUrl}`);

                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('[WebSocket] Connected');
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };

                this.ws.onerror = (error) => {
                    console.error('[WebSocket] Error:', error);
                    reject(error);
                };

                this.ws.onclose = (event) => {
                    console.log(`[WebSocket] Closed: ${event.code} - ${event.reason}`);
                    this.handleReconnect();
                };

            } catch (error) {
                console.error('[WebSocket] Connection failed:', error);
                reject(error);
            }
        });
    }

    private handleMessage(event: MessageEvent) {
        try {
            const message = JSON.parse(event.data);
            console.log('[WebSocket] Message received:', message);

            switch (message.type) {
                case 'connected':
                    this.onConnected(message);
                    break;
                case 'status_update':
                    this.onStatusUpdate(message);
                    break;
                case 'progress_update':
                    this.onProgressUpdate(message);
                    break;
                case 'error':
                    this.onError(message);
                    break;
                case 'pong':
                    console.log('[WebSocket] Pong received');
                    break;
                default:
                    console.warn('[WebSocket] Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                this.connect().catch(err => {
                    console.error('[WebSocket] Reconnection failed:', err);
                });
            }, delay);
        } else {
            console.error('[WebSocket] Max reconnection attempts reached');
            this.onMaxReconnectAttemptsReached();
        }
    }

    sendPing() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
    }

    // Override these methods in your implementation
    protected onConnected(message: any) {
        console.log('[WebSocket] Connected to submission:', message.token);
    }

    protected onStatusUpdate(message: any) {
        console.log('[WebSocket] Status update:', message.status.name);
        console.log('[WebSocket] Data:', message.data);
    }

    protected onProgressUpdate(message: any) {
        console.log('[WebSocket] Progress:', message.stage, '-', message.message);
    }

    protected onError(message: any) {
        console.error('[WebSocket] Error:', message.error);
        if (message.details) {
            console.error('[WebSocket] Details:', message.details);
        }
    }

    protected onMaxReconnectAttemptsReached() {
        console.error('[WebSocket] Failed to reconnect after maximum attempts');
    }
}

// Example usage:
async function example() {
    // 1. Create a submission
    const response = await fetch('http://localhost:8787/api/v1/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            source_code: 'console.log("Hello, World!");',
            language_id: 63, // JavaScript
        }),
    });

    const { token } = await response.json();
    console.log('Submission token:', token);

    // 2. Connect via WebSocket for real-time updates
    const wsClient = new RunFlareWebSocketClient(token);

    // Customize event handlers
    wsClient.onStatusUpdate = (message) => {
        console.log(`Status: ${message.status.name}`);
        if (message.data) {
            console.log('Output:', message.data.stdout);
            console.log('Errors:', message.data.stderr);
            console.log('Time:', message.data.time, 'ms');
        }
    };

    wsClient.onProgressUpdate = (message) => {
        console.log(`Progress: ${message.stage} - ${message.message}`);
    };

    try {
        await wsClient.connect();
        console.log('WebSocket connected successfully');
    } catch (error) {
        console.error('Failed to connect via WebSocket, falling back to polling');

        // Fallback to polling
        await pollForResults(token);
    }
}

// Fallback polling function
async function pollForResults(token: string, maxAttempts = 60, interval = 500) {
    for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch(`http://localhost:8787/api/v1/submissions/${token}`);
        const result = await response.json();

        console.log(`Poll ${i + 1}: Status = ${result.status.name}`);

        // Check if completed
        if (result.status.id >= 3) { // 3 = Accepted, 4+ = Error states
            console.log('Final result:', result);
            return result;
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Polling timeout');
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RunFlareWebSocketClient, pollForResults };
}
