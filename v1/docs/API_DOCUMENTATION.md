# API Documentation

This directory contains the OpenAPI documentation for the Run-Flare Code Execution API.

## Accessing the Documentation

### Interactive Documentation

Visit the interactive API documentation at:
- **Local**: `http://localhost:8787/api/v1/docs`
- **Production**: `https://api.run-flare.com/api/v1/docs`

The interactive documentation is powered by [Scalar](https://scalar.com/) and provides:
- Beautiful, modern UI with dark mode support
- "Try it out" functionality to test endpoints directly
- Automatic code generation in multiple languages
- Real-time request/response examples

### OpenAPI Specification

The OpenAPI specification is available in two formats:

- **JSON**: `/api/v1/docs/openapi.json`
- **YAML**: `/api/v1/docs/openapi.yaml`

You can use these files with any OpenAPI-compatible tool such as:
- Postman (import the spec)
- Insomnia
- SwaggerUI
- Code generators (openapi-generator, etc.)

## API Overview

### Endpoints

#### Submissions
- `POST /api/v1/submissions` - Create a code submission
- `GET /api/v1/submissions/{token}` - Get submission result
- `POST /api/v1/submissions/batch` - Create multiple submissions
- `GET /api/v1/submissions/batch` - Get multiple submission results

#### Languages
- `GET /api/v1/languages` - Get supported programming languages

#### Statuses
- `GET /api/v1/statuses` - Get execution status information

#### WebSocket
- `GET /api/v1/submissions/{token}/ws` - Real-time submission updates

## Quick Start Examples

### Create a Submission

```bash
curl -X POST http://localhost:8787/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "console.log(\"Hello, World!\");",
    "language_id": 63
  }'
```

Response:
```json
{
  "token": "abc123def456"
}
```

### Get Submission Result

```bash
curl http://localhost:8787/api/v1/submissions/abc123def456
```

Response:
```json
{
  "token": "abc123def456",
  "status_id": 3,
  "status": {
    "id": 3,
    "description": "Accepted"
  },
  "stdout": "Hello, World!\n",
  "time": "0.023",
  "memory": 2048
}
```

### Get Supported Languages

```bash
curl http://localhost:8787/api/v1/languages
```

## Query Parameters

### `base64_encoded`
Set to `true` if your `source_code` and `stdin` are base64 encoded.

```bash
curl -X POST http://localhost:8787/api/v1/submissions?base64_encoded=true \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "Y29uc29sZS5sb2coIkhlbGxvLCBXb3JsZCEiKTs=",
    "language_id": 63
  }'
```

### `wait`
Set to `true` to wait for execution to complete before returning.

```bash
curl -X POST http://localhost:8787/api/v1/submissions?wait=true \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "console.log(\"Hello, World!\");",
    "language_id": 63
  }'
```

### `fields`
Specify which fields to include in the response (comma-separated).

```bash
curl http://localhost:8787/api/v1/submissions/abc123def456?fields=stdout,stderr,time,memory
```

## WebSocket Real-Time Updates

Connect to the WebSocket endpoint for real-time submission status updates:

```javascript
const ws = new WebSocket('ws://localhost:8787/api/v1/submissions/abc123def456/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Status update:', message);
};
```

Message types:
- `connected` - Connection established
- `status_update` - Execution status changed
- `progress_update` - Progress information
- `error` - Error occurred
- `ping` - Server ping (respond with pong)

## Updating the Documentation

The OpenAPI specification is defined in `src/controllers/DocsController.ts` as a JavaScript object. To update the documentation:

1. Edit the `openApiSpec` object in `DocsController.ts`
2. The changes will be automatically reflected when you restart the dev server
3. The YAML file in `docs/openapi.yaml` is kept for reference but is not used by the application

## Development

To start the development server with documentation:

```bash
npm run dev
```

Then visit `http://localhost:8787/api/v1/docs` to see the interactive documentation.

## Production Deployment

The documentation is automatically deployed with your API. No additional configuration is needed.

The documentation endpoints are publicly accessible and cached for 1 hour to improve performance.
