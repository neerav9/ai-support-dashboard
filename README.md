# AI Support Agent Dashboard

A deterministic, rule-based AI support agent that debugs errors in real time — no LLM, no AI costs, no hallucinations.

Live Demo: https://neerav9-v0-ai-support-dashboard.vercel.app

---

## What It Does

Paste any support query and the agent automatically:

1. Routes it to the right tools based on keywords
2. Runs all tools in parallel
3. Synthesizes a structured diagnosis
4. Streams the response token by token

**Example query:**
> "User id 1 is getting token expired error on login"

**Response:**
- 🚨 Detected Issue — ERROR: token expired at login
- 📘 Root Cause — Authentication token expiration confirmed by system logs and corroborated by similar GitHub issues
- 🛠 Recommended Fix — Refresh token, extend expiry, verify session renewal
- 🔗 External References — Real GitHub issues from public repos
- ✅ Confidence — High (based on logs + GitHub + database)

---

## How It Works
User Query
↓
Decision Engine (keyword routing)
↓
┌─────────────┬──────────────┬─────────────┐
│  Database   │     Logs     │   GitHub    │
│  Tool       │     Tool     │   Tool      │
│  (mock)     │   (mock)     │  (real API) │
└─────────────┴──────────────┴─────────────┘
↓
Response Builder (synthesizes all results)
↓
Streaming UI (Server-Sent Events)

### Decision Engine — Keyword Routing

| Keywords | Tool Triggered |
|----------|---------------|
| `error`, `fail`, `issue`, `log` | Logs Tool |
| `user`, `id`, `account` | Database Tool |
| Any error-related query | GitHub Tool |

---

## Tech Stack

- **Framework** — Next.js 14 App Router
- **Language** — TypeScript (strict)
- **Styling** — Tailwind CSS + shadcn/ui
- **Streaming** — Server-Sent Events
- **GitHub Integration** — GitHub REST API v3
- **Deployment** — Vercel
- **AI** — None. Zero. Fully deterministic.

---

## Project Structure
app/
├── api/
│   ├── chat/
│   │   └── route.ts    # Main agent — decision engine + tools + streaming
│   └── mcp/
│       └── route.ts    # MCP tool executor — database, logs, github
├── page.tsx             # Home page
components/
├── chat.tsx             # Chat UI + streaming handler
├── tool-logs.tsx        # Tool Logs panel
└── sidebar.tsx          # Conversation sidebar

---

## Key Features

- **Deterministic routing** — same input always gives same output
- **Parallel tool execution** — all tools run simultaneously via `Promise.all`
- **Real GitHub API** — searches live public issues with PAT auth
- **Streaming responses** — token-by-token like ChatGPT
- **Confidence scoring** — High/Medium/Low based on tool results
- **Zero AI costs** — no OpenAI, no Anthropic, no model inference
- **Tool Logs panel** — shows exactly what each tool did and returned

---

## Running Locally

```bash
# Clone
git clone https://github.com/neerav9/v0-ai-support-dashboard
cd v0-ai-support-dashboard

# Install
pnpm install

# Add env vars
echo "GITHUB_TOKEN=your_token_here" > .env.local

# Run
pnpm dev
```

Open http://localhost:3000

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token with `public_repo` scope |

---

## Test Queries
User id 1 is getting token expired error on login
Account id 3 has authentication failure and connection issues
Database connection is failing for user id 2
Find GitHub issues for JWT token expiry
User id 2 hitting rate limit on auth endpoint

---

## Architecture Decisions

**Why no LLM?**
LLMs are expensive, slow, and unpredictable. For structured support workflows, deterministic routing is faster, cheaper, and fully explainable. Every decision in this agent is traceable.

**Why static database?**
The database layer is intentionally mocked to keep the demo self-contained. Swapping it for a real database like Neon or Supabase requires changing one function — the routing and response logic are completely database-agnostic.

**Why Server-Sent Events?**
SSE is simpler than WebSockets for one-directional streaming. Next.js App Router supports it natively with no additional dependencies.

---

## What's Next

- [ ] Connect to real database — Neon PostgreSQL
- [ ] Add Slack webhook integration
- [ ] Add Sentry and Datadog as tools
- [ ] Add Jira ticket creation from diagnosis
- [ ] Role-based access for different team members
- [ ] Custom keyword rules per organization

---

## Author

Neerav Krishna Uppu
GitHub: github.com/neerav9