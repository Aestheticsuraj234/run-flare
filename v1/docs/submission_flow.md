# Run-Flare v1 Submission Architecture & Flow

This document outlines the architecture and flow of a code submission in the `v1` system.

## Architecture Overview

The system follows a **Layered Architecture** running on **Cloudflare Workers**:

1.  **Controller Layer**: Handles HTTP requests, parsing, and response formatting.
2.  **Service Layer**: Contains business logic, validation, and orchestration.
3.  **Repository Layer**: Manages database interactions (Prisma).
4.  **Infrastructure Layer**: Handles asynchronous processing via Queues and Durable Objects.

## Submission Flow Diagram

```mermaid
sequenceDiagram
    participant User as User/Client
    participant API as API Worker
    participant DB as Database (Prisma)
    participant Queue as Cloudflare Queue
    participant Consumer as Queue Consumer
    participant Executor as Executor DO
    participant Sandbox as Sandbox DO
    participant WS as WebSocket DO

    Note over User, API: 1. Submission Request
    User->>API: POST /api/v1/submissions
    Note right of User: Body: { source_code, language_id, ... }

    activate API
    API->>API: Validate Input (Controller/Service)
    
    Note over API, DB: 2. Persist Pending State
    API->>DB: Create Record (Status: IN_QUEUE)
    
    Note over API, Queue: 3. Async Processing
    API->>Queue: Send Message (Submission Data)
    
    API-->>User: Return { token }
    deactivate API

    Note over Queue, Consumer: 4. Queue Consumption
    Queue->>Consumer: Process Batch/Message
    
    activate Consumer
    Consumer->>Executor: Trigger Execution (Durable Object)
    deactivate Consumer

    activate Executor
    Note over Executor, WS: 5. Real-time Updates
    Executor->>DB: Update Status (PROCESSING)
    Executor->>WS: Broadcast "Processing"
    WS-->>User: WebSocket Update

    Note over Executor, Sandbox: 6. Code Execution
    Executor->>Sandbox: Run Code (Compile & Execute)
    activate Sandbox
    Sandbox-->>Executor: Result (Stdout, Stderr, Time, Memory)
    deactivate Sandbox

    Note over Executor, DB: 7. Finalize
    Executor->>DB: Update Result & Status (FINISHED)
    Executor->>WS: Broadcast "Finished" (with Output)
    WS-->>User: WebSocket Update
    deactivate Executor
```

## Detailed Flow Breakdown

### 1. User Input (The Body)
The user sends a `POST` request with the following JSON body:

```json
{
  "source_code": "console.log('Hello World')",
  "language_id": 1,
  "stdin": "optional input",
  "expected_output": "optional expected output",
  "cpu_time_limit": 2.0,
  "memory_limit": 128000,
  "test_cases": [
    { "stdin": "1 2", "expected_output": "3" }
  ]
}
```

### 2. API Handling (`src/controllers/SubmissionController.ts`)
- **Entry Point**: `create()` method.
- **Action**: Parses the body and calls `SubmissionService`.

### 3. Service Logic (`src/services/SubmissionService.ts`)
- **Validation**: Checks if `language_id` exists and input is valid.
- **Database**: Creates a new submission record with status `IN_QUEUE` (ID: 1).
- **Queueing**: Pushes the submission data to `env.SUBMISSION_QUEUE`.
- **Response**: Immediately returns a `token` to the user.

### 4. Queue Processing (`src/index.ts`)
- **Handler**: `queue()` function in the worker.
- **Action**: Receives the message from the queue.
- **Routing**: Instantiates the `SubmissionExecutor` Durable Object for this specific submission.

### 5. Execution (`src/durableObjects/SubmissionExecutor.ts`)
- **State Update**: Marks submission as `PROCESSING` in DB.
- **WebSocket**: Sends a "Processing" event to the `SubmissionWebSocket` Durable Object to notify the client.
- **Compilation**: Compiles the code if the language requires it (e.g., C++, Java).
- **Sandboxing**: Calls `env.SANDBOX` (another Durable Object) to run the code securely.
- **Result**: Captures `stdout`, `stderr`, `time`, `memory`, and `exit_code`.

### 6. Completion
- **Database**: Updates the submission record with the final results and status.
- **WebSocket**: Broadcasts the final result to the user.
- **Callback**: If a `callback_url` was provided, sends a POST request with the results.
