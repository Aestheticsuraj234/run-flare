# WebSocket Support for Run-Flare

This document explains how to use WebSocket for real-time submission status updates.

## Overview

Run-Flare now supports WebSocket connections for receiving real-time updates about code execution submissions. This is an **optional feature** that complements the existing polling mechanism.

## Features

- ✅ **Real-time updates**: Instant notifications when submission status changes
- ✅ **Multiple clients**: Support for multiple WebSocket connections per submission
- ✅ **Progress tracking**: Receive updates during compilation, execution, and completion
- ✅ **Automatic cleanup**: Stale connections are automatically removed
- ✅ **Backward compatible**: All existing REST API endpoints continue to work

## WebSocket Endpoint

```
GET /api/v1/submissions/:token/ws
```

## Message Types

### 1. Connected Message
Sent immediately after WebSocket connection is established.

```json
{
  "type": "connected",
  "timestamp": "2025-11-22T10:00:00.000Z",
  "token": "abc123",
  "message": "Connected to submission abc123"
}
```

### 2. Status Update
Sent when submission status changes (queued → processing → completed/error).

```json
{
  "type": "status_update",
  "timestamp": "2025-11-22T10:00:01.000Z",
  "token": "abc123",
  "status": {
    "id": 3,
    "name": "Accepted",
    "description": "Submission completed successfully"
  },
  "data": {
    "stdout": "Hello, World!\n",
    "stderr": "",
    "time": "125",
    "memory": 2048,
    "exit_code": 0
  }
}
```

### 3. Progress Update
Sent during compilation or execution phases.

```json
{
  "type": "progress_update",
  "timestamp": "2025-11-22T10:00:00.500Z",
  "token": "abc123",
  "stage": "running",
  "message": "Executing code..."
}
```

### 4. Error Message
Sent when an error occurs.

```json
{
  "type": "error",
  "timestamp": "2025-11-22T10:00:02.000Z",
  "token": "abc123",
  "error": "Internal Error",
  "details": "Timeout exceeded"
}
```

## Usage Examples

### JavaScript/TypeScript

```typescript
// 1. Create a submission
const response = await fetch('http://localhost:8787/api/v1/submissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source_code: 'console.log("Hello!");',
    language_id: 63,
  }),
});

const { token } = await response.json();

// 2. Connect via WebSocket
const ws = new WebSocket(`ws://localhost:8787/api/v1/submissions/${token}/ws`);

ws.onopen = () => console.log('Connected');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'status_update') {
    console.log('Status:', message.status.name);
    console.log('Output:', message.data?.stdout);
  }
};

ws.onerror = (error) => console.error('Error:', error);
ws.onclose = () => console.log('Disconnected');
```

### Python

```python
import asyncio
import websockets
import json
import requests

# 1. Create submission
response = requests.post('http://localhost:8787/api/v1/submissions', json={
    'source_code': 'print("Hello!")',
    'language_id': 71
})
token = response.json()['token']

# 2. Connect via WebSocket
async def listen():
    uri = f"ws://localhost:8787/api/v1/submissions/{token}/ws"
    async with websockets.connect(uri) as websocket:
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data['type']}")
            
            if data['type'] == 'status_update':
                print(f"Status: {data['status']['name']}")
                if data.get('data'):
                    print(f"Output: {data['data'].get('stdout')}")

asyncio.run(listen())
```

## Fallback to Polling

If WebSocket connection fails, you can fall back to polling:

```typescript
async function getSubmissionWithFallback(token: string) {
  try {
    // Try WebSocket first
    const ws = new WebSocket(`ws://localhost:8787/api/v1/submissions/${token}/ws`);
    // ... handle WebSocket
  } catch (error) {
    console.log('WebSocket failed, falling back to polling');
    
    // Poll every 500ms
    const interval = setInterval(async () => {
      const response = await fetch(`http://localhost:8787/api/v1/submissions/${token}`);
      const result = await response.json();
      
      console.log('Status:', result.status.name);
      
      // Stop polling when completed
      if (result.status.id >= 3) {
        clearInterval(interval);
        console.log('Final result:', result);
      }
    }, 500);
  }
}
```

## Client Ping/Pong

You can send ping messages to keep the connection alive:

```typescript
// Send ping
ws.send(JSON.stringify({ type: 'ping' }));

// Receive pong
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'pong') {
    console.log('Pong received');
  }
};
```

## Examples

See the `examples/` directory for complete working examples:

- **`websocket-client.ts`**: TypeScript client with reconnection logic
- **`websocket-demo.html`**: Interactive HTML demo page

## Testing

### 1. Start the development server

```bash
npm run dev
```

### 2. Open the demo page

Open `examples/websocket-demo.html` in your browser and try executing code.

### 3. Test with curl + websocat

```bash
# Create submission
TOKEN=$(curl -X POST http://localhost:8787/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code": "print(123)", "language_id": 71}' \
  | jq -r '.token')

# Connect WebSocket
websocat "ws://localhost:8787/api/v1/submissions/$TOKEN/ws"
```

## Backward Compatibility

All existing endpoints continue to work:

- ✅ `POST /api/v1/submissions` - Create submission
- ✅ `GET /api/v1/submissions/:token` - Poll for status
- ✅ `POST /api/v1/submissions?wait=true` - Server-side polling

WebSocket is purely **additive** - no breaking changes!

## Architecture

```
Client                    Worker                 Durable Object
  |                         |                          |
  |--1. POST /submissions-->|                          |
  |<----{token}-------------|                          |
  |                         |                          |
  |--2. WS Connect--------->|                          |
  |   (ws://.../:token/ws)  |                          |
  |                         |----Store WS------------>|
  |                         |                          | (SubmissionWebSocket)
  |                         |                          |
  |                         |                          |<--Execute (Queue)
  |                         |                          |
  |<----3. Updates (WS)-----|<----Broadcast-----------|
```

## Troubleshooting

### WebSocket connection fails

- Check that you're using the correct URL scheme (`ws://` for HTTP, `wss://` for HTTPS)
- Verify the submission token exists
- Check browser console for errors

### No messages received

- Ensure the submission is still processing (not already completed)
- Check that WebSocket connection is open (`ws.readyState === WebSocket.OPEN`)
- Verify network connectivity

### Connection closes immediately

- The submission may have already completed before WebSocket connected
- Poll the REST API to get the final result

## Performance

- **Latency**: Status updates arrive within ~100ms of status change
- **Scalability**: Supports multiple concurrent WebSocket connections per submission
- **Memory**: Minimal overhead per connection (~1KB)
- **Cleanup**: Stale connections automatically removed after 1 hour
