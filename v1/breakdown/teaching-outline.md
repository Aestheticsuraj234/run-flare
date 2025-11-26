# Run-Flare Teaching Presentation Outline

## 🎓 Course Overview
**Target Audience**: Students with basic JavaScript/TypeScript knowledge  
**Duration**: 4 sessions (2 hours each)  
**Goal**: Understand modern cloud-based code execution systems

---

## 📅 Session 1: Introduction & Overview (2 hours)

### Part 1: What is Run-Flare? (30 min)

#### Opening Demo (10 min)
```bash
# Live demonstration
curl -X POST http://localhost:8787/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "console.log(\"Hello from Run-Flare!\");",
    "language_id": 63
  }'

# Show the token response
# Then get results
curl http://localhost:8787/api/v1/submissions/{token}
```

**Discussion Points:**
- What just happened?
- Where did the code execute?
- Why is this useful?

#### Real-World Applications (10 min)
Show examples:
- LeetCode problem submission
- Online coding bootcamp exercises
- Code playground in documentation sites
- Automated testing systems

#### Architecture Overview (10 min)
Draw on whiteboard:
```
[Student's Browser] 
    ↓ (HTTP POST)
[Cloudflare Workers API]
    ↓ (Store)
[PostgreSQL Database]
    ↓ (Execute)
[Docker Sandbox]
    ↓ (Results)
[Back to Student]
```

---

### Part 2: Technology Stack (45 min)

#### Cloudflare Workers (15 min)
**Concept**: Serverless computing at the edge

**Key Points:**
- Runs on V8 engine (same as Chrome)
- Deployed to 300+ locations worldwide
- No servers to manage
- Pay per request

**Demo:**
```javascript
// Simple Worker example
export default {
  async fetch(request) {
    return new Response('Hello World!');
  }
}
```

**Discussion:**
- Traditional servers vs serverless
- Edge computing benefits
- When to use Workers

---

#### TypeScript (15 min)
**Concept**: JavaScript with types

**Show Examples:**
```typescript
// Without TypeScript (JavaScript)
function createSubmission(code, langId) {
  return { code, langId };
}

// With TypeScript
interface Submission {
  source_code: string;
  language_id: number;
}

function createSubmission(code: string, langId: number): Submission {
  return { source_code: code, language_id: langId };
}
```

**Benefits:**
- Catch errors before runtime
- Better IDE support
- Self-documenting code

---

#### Prisma & PostgreSQL (15 min)
**Concept**: Type-safe database access

**Show Schema:**
```prisma
model Submission {
  id          String   @id @default(cuid())
  token       String   @unique
  source_code String
  language_id Int
  status_id   Int
  stdout      String?
  created_at  DateTime @default(now())
}
```

**Demo Prisma Studio:**
```bash
npm run studio
```

**Discussion:**
- Why use an ORM?
- SQL vs Prisma queries
- Database design decisions

---

### Part 3: Hands-On Setup (45 min)

#### Environment Setup (20 min)
**Students follow along:**
1. Clone repository
2. Install dependencies
3. Configure database
4. Run migrations
5. Seed database
6. Start dev server

**Checkpoint:** Everyone should see:
```
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

#### First API Call (15 min)
**Students test API:**
1. Using curl/Postman
2. Visit `/api/v1/docs`
3. Try different languages
4. Observe results

#### Code Walkthrough (10 min)
**Open in VS Code:**
- Show `src/index.ts`
- Show `src/types/types.ts`
- Show `prisma/schema.prisma`

**Don't dive deep yet - just overview!**

---

## 📅 Session 2: Architecture Deep Dive (2 hours)

### Part 1: Request Flow (45 min)

#### Live Code Trace (30 min)
**Follow a submission from start to finish:**

1. **Entry Point** (`src/index.ts`)
   ```typescript
   // Show how requests are routed
   const router = new Router();
   router.post('/api/v1/submissions', submissionController.create);
   ```

2. **Controller** (`src/controllers/SubmissionController.ts`)
   ```typescript
   // Show how request is handled
   async create(request: Request) {
     const body = await request.json();
     const result = await submissionService.create(body);
     return Response.json(result);
   }
   ```

3. **Service** (`src/services/SubmissionService.ts`)
   ```typescript
   // Show business logic
   async create(data: CreateSubmissionData) {
     // Validate
     // Generate token
     // Save to database
     // Queue for execution
   }
   ```

4. **Repository** (`src/repositories/SubmissionRepository.ts`)
   ```typescript
   // Show database interaction
   async create(data) {
     return await prisma.submission.create({ data });
   }
   ```

#### Draw Sequence Diagram (15 min)
```
Client → Controller → Service → Repository → Database
                ↓
           Executor → Sandbox
```

**Discussion:**
- Why separate layers?
- Benefits of this architecture
- Alternative approaches

---

### Part 2: Code Execution (45 min)

#### Docker Sandbox (20 min)
**Show Dockerfile:**
```dockerfile
FROM docker.io/cloudflare/sandbox:0.5.1

RUN apt-get update && apt-get install -y \
    nodejs npm \
    python3 python3-pip \
    openjdk-17-jdk \
    g++
```

**Explain:**
- What is a container?
- Why use containers for code execution?
- Security implications

**Demo:**
```bash
# Show running container
docker ps

# Execute code manually
docker exec -it <container> /bin/bash
echo 'console.log("test")' > test.js
node test.js
```

#### Execution Flow (15 min)
**Trace through** `SubmissionExecutor.ts`:
1. Receive submission
2. Update status to "Processing"
3. Prepare sandbox environment
4. Execute code
5. Capture output
6. Update status to "Accepted" or error
7. Save results

#### Security Discussion (10 min)
**Topics:**
- Resource limits (CPU, memory, time)
- Network isolation
- File system restrictions
- User permissions

---

### Part 3: Durable Objects (30 min)

#### Concept Introduction (15 min)
**What are Durable Objects?**
- Stateful serverless computing
- Consistent storage
- Coordination between workers

**Show Example:**
```typescript
export class SubmissionExecutor implements DurableObject {
  state: DurableObjectState;
  
  constructor(state: DurableObjectState) {
    this.state = state;
  }
  
  async execute(submission: Submission) {
    // Execution logic with persistent state
  }
}
```

#### Use Cases in Run-Flare (15 min)
1. **SubmissionExecutor** - Manages execution lifecycle
2. **SubmissionWebSocket** - Maintains WebSocket connections
3. **Sandbox** - Interfaces with Docker

**Discussion:**
- Why use Durable Objects here?
- Alternatives (Redis, etc.)
- Trade-offs

---

## 📅 Session 3: Implementation Details (2 hours)

### Part 1: Database Design (30 min)

#### Schema Review (15 min)
**Open** `prisma/schema.prisma`

**Discuss each model:**
- Language - Why store languages in DB?
- Status - Why not just strings?
- Submission - What fields are essential?
- User - Future authentication

#### Migrations (15 min)
**Show migration files:**
```bash
ls prisma/migrations/
```

**Explain:**
- What are migrations?
- Why version control schema changes?
- How to create new migrations

**Demo:**
```bash
# Create a new migration
npx prisma migrate dev --name add_user_email
```

---

### Part 2: WebSocket Real-Time Updates (45 min)

#### WebSocket Basics (15 min)
**Compare:**
```
HTTP Polling:
Client → Server (every 2 seconds)
"Is it done yet?"

WebSocket:
Client ←→ Server (persistent connection)
Server pushes updates when ready
```

**Show Protocol:**
```javascript
// Client connects
const ws = new WebSocket('ws://localhost:8787/api/v1/submissions/token/ws');

// Server sends updates
ws.send(JSON.stringify({
  type: 'status_update',
  status: { id: 3, description: 'Accepted' },
  data: { stdout: 'Hello!' }
}));
```

#### Implementation Walkthrough (20 min)
**Show files:**
1. `src/controllers/WebSocketController.ts` - Handle connections
2. `src/durableObjects/SubmissionWebSocket.ts` - Manage state
3. `examples/websocket-demo.html` - Client example

**Live Demo:**
```bash
# Open websocket-demo.html in browser
# Submit code
# Watch real-time updates
```

#### Hands-On Exercise (10 min)
**Students:**
1. Open browser console
2. Connect to WebSocket
3. Submit code via API
4. Observe messages

---

### Part 3: Error Handling & Validation (45 min)

#### Validation Service (20 min)
**Show** `src/services/ValidationService.ts`

**Examples:**
```typescript
// Validate source code
if (!source_code || source_code.trim() === '') {
  throw new ValidationError('source_code cannot be blank');
}

// Validate language
const language = await languageRepository.findById(language_id);
if (!language) {
  throw new ValidationError('language_id does not exist');
}

// Validate limits
if (cpu_time_limit > MAX_CPU_TIME) {
  throw new ValidationError('cpu_time_limit exceeds maximum');
}
```

#### Error Handling Middleware (15 min)
**Show** `src/middleware/errorHandler.ts`

**Explain:**
- Catching errors globally
- Formatting error responses
- Logging errors
- Different error types

#### Status Codes (10 min)
**Review HTTP status codes:**
- 200 OK - Success
- 201 Created - Submission created
- 400 Bad Request - Invalid input
- 404 Not Found - Submission not found
- 422 Unprocessable Entity - Validation error
- 500 Internal Server Error - System error

---

## 📅 Session 4: Advanced Topics & Projects (2 hours)

### Part 1: Batch Submissions (30 min)

#### Use Case (10 min)
**Example:** Running test cases
```javascript
// Instead of 10 separate API calls
const submissions = [
  { source_code: code, stdin: "test1", expected_output: "output1" },
  { source_code: code, stdin: "test2", expected_output: "output2" },
  // ... 8 more
];

// Single batch request
POST /api/v1/submissions/batch
{ submissions: [...] }
```

#### Implementation (20 min)
**Show:**
- Batch create endpoint
- Batch get endpoint
- How results are aggregated
- Performance considerations

---

### Part 2: CORS & Security (30 min)

#### CORS Explanation (15 min)
**Problem:**
```
Browser: "Hey API, can I make a request from myapp.com?"
API: "No, I only allow requests from localhost"
Browser: "Request blocked!"
```

**Solution:**
```typescript
// CORS middleware
headers.set('Access-Control-Allow-Origin', 'https://myapp.com');
headers.set('Access-Control-Allow-Methods', 'GET, POST');
```

#### Rate Limiting (15 min)
**Show** `src/middleware/rateLimiter.ts`

**Explain:**
- Why rate limit?
- How it works (token bucket, etc.)
- Configuration options

---

### Part 3: Hands-On Projects (60 min)

#### Project Ideas (10 min)
**Students choose one:**
1. Add support for a new language (Ruby, Go, Rust)
2. Build a simple frontend (code playground)
3. Implement user authentication
4. Add submission history feature
5. Create a testing dashboard

#### Work Time (40 min)
**Students work on projects**

**Instructor:** Circulate and help

#### Demos (10 min)
**Students present:**
- What they built
- Challenges faced
- What they learned

---

## 🎯 Teaching Tips

### Use Visual Aids
- Draw diagrams on whiteboard
- Use sequence diagrams for flows
- Color-code different layers

### Live Coding
- Make mistakes intentionally
- Show debugging process
- Use console.log liberally

### Encourage Questions
- Pause frequently
- Ask "Does this make sense?"
- No question is too basic

### Relate to Real World
- Compare to familiar systems
- Show production examples
- Discuss industry practices

---

## 📝 Assessment Ideas

### Quiz Questions
1. What is the purpose of Durable Objects?
2. Explain the difference between HTTP polling and WebSocket
3. Why use Docker for code execution?
4. What is the repository pattern?

### Coding Challenges
1. Add a new API endpoint
2. Implement a new validation rule
3. Add a database field and migration
4. Fix a bug in error handling

### Final Project
**Build a feature:**
- User authentication
- Submission history
- Code sharing
- Leaderboard

---

## 📚 Additional Resources for Students

### Documentation
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Prisma: https://www.prisma.io/docs
- TypeScript: https://www.typescriptlang.org/docs/
- Docker: https://docs.docker.com/

### Video Tutorials
- Cloudflare Workers Crash Course
- Prisma Tutorial
- WebSocket Explained
- Docker for Beginners

### Practice Projects
- Build a simple REST API
- Create a WebSocket chat app
- Dockerize a Node.js app
- Deploy to Cloudflare Workers

---

## 🎬 Session Wrap-Up Template

**End each session with:**
1. **Recap** (5 min) - What we covered
2. **Q&A** (10 min) - Open questions
3. **Homework** (5 min) - What to study/build
4. **Preview** (5 min) - Next session topics

---

## 📊 Progress Tracking

### Session 1 Checklist
- [ ] Students understand what Run-Flare does
- [ ] Students can make API calls
- [ ] Development environment set up
- [ ] Basic concepts understood

### Session 2 Checklist
- [ ] Students can trace request flow
- [ ] Docker concepts understood
- [ ] Durable Objects explained
- [ ] Architecture makes sense

### Session 3 Checklist
- [ ] Database schema understood
- [ ] WebSocket working
- [ ] Error handling clear
- [ ] Students can debug issues

### Session 4 Checklist
- [ ] Advanced features explored
- [ ] Security concepts understood
- [ ] Projects started
- [ ] Students can extend codebase

---

**Good luck with your teaching! 🚀**

Remember: The goal is not to memorize everything, but to understand the concepts and know where to look for details.
