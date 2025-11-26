# Run-Flare Quick Reference Cheat Sheet

## 🎯 What is Run-Flare?
A cloud-based code execution API built on Cloudflare Workers that executes code in multiple languages securely.

---

## 🛠️ Technology Stack Summary

| Technology | Purpose | Version |
|------------|---------|---------|
| **Cloudflare Workers** | Serverless runtime | Latest |
| **TypeScript** | Programming language | 5.5.2 |
| **Prisma** | Database ORM | 6.19.0 |
| **PostgreSQL** | Database | Latest |
| **Docker** | Code execution sandbox | Latest |
| **WebSocket** | Real-time updates | Native |
| **Wrangler** | Cloudflare CLI | 4.47.0 |

---

## 📁 Key File Locations

### Entry Points
- `src/index.ts` - Main application entry
- `wrangler.jsonc` - Cloudflare configuration
- `package.json` - Dependencies

### Core Logic
- `src/controllers/` - HTTP request handlers
- `src/services/` - Business logic
- `src/repositories/` - Database access
- `src/durableObjects/` - Stateful objects

### Configuration
- `src/config/appConfig.ts` - App settings
- `src/config/execution.ts` - Execution limits
- `prisma/schema.prisma` - Database schema

### Documentation
- `docs/API_DOCUMENTATION.md` - API guide
- `docs/WEBSOCKET.md` - WebSocket guide
- `docs/CORS.md` - CORS configuration

---

## 🚀 Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run deploy              # Deploy to Cloudflare

# Database
npm run migrate             # Run migrations
npm run generate            # Generate Prisma client
npm run studio              # Open Prisma Studio
npm run seed                # Seed database

# TypeScript
npm run cf-typegen          # Generate types
```

---

## 🌐 API Endpoints

### Submissions
```
POST   /api/v1/submissions              # Create submission
GET    /api/v1/submissions/:token       # Get result
POST   /api/v1/submissions/batch        # Batch create
GET    /api/v1/submissions/batch        # Batch get
```

### Languages & Statuses
```
GET    /api/v1/languages                # List languages
GET    /api/v1/statuses                 # List statuses
```

### WebSocket
```
GET    /api/v1/submissions/:token/ws    # WebSocket connection
```

### Documentation
```
GET    /api/v1/docs                     # Interactive docs
GET    /api/v1/docs/openapi.json        # OpenAPI spec (JSON)
GET    /api/v1/docs/openapi.yaml        # OpenAPI spec (YAML)
```

---

## 📊 Database Models

### Language
```typescript
{
  id: number
  name: string
  is_archived: boolean
}
```

### Status
```typescript
{
  id: number
  description: string
}
```

### Submission
```typescript
{
  id: string
  token: string (unique)
  source_code: string
  language_id: number
  status_id: number
  stdin?: string
  stdout?: string
  stderr?: string
  compile_output?: string
  time?: string
  memory?: number
  exit_code?: number
  created_at: DateTime
  updated_at: DateTime
}
```

---

## 🎯 Execution Statuses

| ID | Status | Description |
|----|--------|-------------|
| 1 | In Queue | Waiting to be processed |
| 2 | Processing | Currently executing |
| 3 | Accepted | Successful execution |
| 4 | Wrong Answer | Output doesn't match expected |
| 5 | Runtime Error (NZEC) | Non-zero exit code |
| 6 | Compilation Error | Failed to compile |
| 7 | Time Limit Exceeded | Execution timeout |
| 8 | Memory Limit Exceeded | Out of memory |
| 9 | Internal Error | System error |

---

## 🔑 Important Concepts

### Durable Objects
Stateful serverless objects that persist across requests:
- `SubmissionExecutor` - Manages code execution
- `SubmissionWebSocket` - Handles WebSocket connections
- `Sandbox` - Interfaces with Docker

### Repository Pattern
Separates data access from business logic:
```
Controller → Service → Repository → Database
```

### Middleware Chain
Processes requests before reaching controllers:
1. CORS
2. Rate Limiting
3. Error Handling

### Asynchronous Execution
1. Submit code → Get token immediately
2. Code executes in background
3. Poll for results OR use WebSocket

---

## 🔒 Security Features

- **Sandboxed Execution** - Docker containers
- **Resource Limits** - CPU, memory, time
- **Network Isolation** - Disabled by default
- **Rate Limiting** - Prevent abuse
- **CORS** - Controlled cross-origin access
- **Non-root User** - Sandbox runs as `sandboxuser`

---

## 📝 Request/Response Examples

### Create Submission
```bash
curl -X POST http://localhost:8787/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "console.log(\"Hello!\");",
    "language_id": 63
  }'
```

**Response:**
```json
{
  "token": "abc123def456"
}
```

### Get Result
```bash
curl http://localhost:8787/api/v1/submissions/abc123def456
```

**Response:**
```json
{
  "token": "abc123def456",
  "status_id": 3,
  "status": {
    "id": 3,
    "description": "Accepted"
  },
  "stdout": "Hello!\n",
  "time": "0.023",
  "memory": 2048
}
```

---

## 🌍 Supported Languages

| ID | Language | Runtime |
|----|----------|---------|
| 63 | JavaScript | Node.js |
| 71 | Python | Python 3 |
| 54 | C++ | GCC 9.2.0 |
| 62 | Java | OpenJDK 17 |

*See `/api/v1/languages` for full list*

---

## 🐛 Debugging Tips

### Check Logs
```bash
wrangler tail  # View live logs
```

### Database Inspection
```bash
npm run studio  # Open Prisma Studio
```

### Test API
- Use Postman or curl
- Visit `/api/v1/docs` for interactive testing
- Check `examples/` folder for sample code

### Common Issues
1. **"Submission not found"** - Invalid token or expired
2. **"Language doesn't exist"** - Check language_id
3. **"Time Limit Exceeded"** - Increase cpu_time_limit
4. **"Compilation Error"** - Check compile_output field

---

## 📦 Project Structure (Simplified)

```
src/
├── index.ts                    # Entry point
├── controllers/                # Handle requests
│   ├── SubmissionController
│   ├── LanguageController
│   └── WebSocketController
├── services/                   # Business logic
│   ├── SubmissionService
│   ├── ExecutionService
│   └── ValidationService
├── repositories/               # Database access
│   ├── SubmissionRepository
│   └── LanguageRepository
├── durableObjects/             # Stateful objects
│   ├── SubmissionExecutor
│   └── SubmissionWebSocket
├── middleware/                 # Request processing
│   ├── cors.ts
│   └── rateLimiter.ts
└── utils/                      # Helpers
    ├── encoding.ts
    └── sandbox.ts
```

---

## 🎓 Learning Path

1. **Week 1-2**: TypeScript, REST APIs, Databases
2. **Week 3-4**: Cloudflare Workers, Docker, WebSocket
3. **Week 5-6**: Codebase deep dive
4. **Week 7-8**: Hands-on projects

---

## 🔗 Quick Links

- **Local Dev**: http://localhost:8787
- **API Docs**: http://localhost:8787/api/v1/docs
- **Prisma Studio**: `npm run studio`
- **Cloudflare Dashboard**: https://dash.cloudflare.com

---

## 💡 Common Tasks

### Add a New Language
1. Update `Dockerfile` to install runtime
2. Add language to `prisma/seed.ts`
3. Run `npm run seed`

### Test WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8787/api/v1/submissions/TOKEN/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Query Database
```typescript
const submission = await prisma.submission.findUnique({
  where: { token: 'abc123' }
});
```

### Update Status
```typescript
await prisma.submission.update({
  where: { token: 'abc123' },
  data: { status_id: 3 }
});
```

---

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Prisma Docs](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Docker Docs](https://docs.docker.com/)

---

**Print this page for quick reference! 📄**
