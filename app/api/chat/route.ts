import { NextRequest } from "next/server"

type ToolName = "database" | "github" | "logs"

// -------------------- DECISION ENGINE --------------------

function decideTools(query: string): ToolName[] {
  const q = query.toLowerCase()
  const tools: ToolName[] = []

  if (["user", "id", "account"].some((k) => q.includes(k))) {
    tools.push("database")
  }

  if (["error", "fail", "issue", "log"].some((k) => q.includes(k))) {
    tools.push("logs")
  }

  // GitHub provides external context for errors/issues/bugs and acts as fallback
  if (
    tools.length === 0 ||
    ["error", "issue", "bug", "fail", "log"].some((k) => q.includes(k))
  ) {
    tools.push("github")
  }

  return tools
}

// -------------------- MCP CLIENT --------------------

async function callMCP(tool: string, query: string) {
  try {
    const res = await fetch("/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tool, query }),
    })

    // Read raw response first (important)
    const text = await res.text()

    let data

    try {
      data = JSON.parse(text)
    } catch {
      return `Invalid MCP response: ${text}`
    }

    // Always return actual MCP result if present
    if (data && data.result !== undefined) {
      return data.result
    }

    return "No result returned from MCP"
  } catch (err) {
    return "GitHub temporarily unavailable"
  }
}

// -------------------- RESPONSE BUILDER --------------------

type DbUser = { id: number; name: string; status: string }
type GitHubRef = { title: string; repo: string; url: string }

function isDbUser(v: unknown): v is DbUser {
  return (
    typeof v === "object" &&
    v !== null &&
    "id" in v &&
    "name" in v &&
    "status" in v
  )
}

function isErrorString(v: unknown): boolean {
  return typeof v === "string" && /^MCP error/i.test(v)
}

// Parse the multi-line GitHub MCP output into structured references.
// Falls back to an empty array on "no results" or error strings.
function parseGitHubRefs(output: unknown): GitHubRef[] {
  if (typeof output !== "string") return []
  if (isErrorString(output)) return []
  if (/^no github issues/i.test(output)) return []

  const refs: GitHubRef[] = []
  const lines = output.split("\n").map((l) => l.trim())

  let current: Partial<GitHubRef> | null = null

  for (const line of lines) {
    const titleMatch = line.match(/^-\s+(.+?)\s+\(repo:\s+(.+?)\)\s*$/)
    if (titleMatch) {
      if (current?.title && current.url) {
        refs.push({
          title: current.title,
          repo: current.repo ?? "unknown",
          url: current.url,
        })
      }
      current = { title: titleMatch[1], repo: titleMatch[2] }
      continue
    }

    if (current && /^https?:\/\//.test(line) && !current.url) {
      current.url = line
    }
  }

  if (current?.title && current.url) {
    refs.push({
      title: current.title,
      repo: current.repo ?? "unknown",
      url: current.url,
    })
  }

  return refs
}

// Derive a deterministic root-cause statement from the strongest available signal.
function deriveRootCause(
  logLine: string | null,
  ghRefs: GitHubRef[]
): string | null {
  const haveLogs = logLine && !/^no logs/i.test(logLine)
  const haveGh = ghRefs.length > 0

  if (!haveLogs && !haveGh) return null

  const signal = (logLine ?? "").toLowerCase()

  let topic = "the reported issue"
  if (signal.includes("token") || signal.includes("auth")) {
    topic = "an authentication token expiration"
  } else if (signal.includes("database") || signal.includes("connection")) {
    topic = "a database connectivity failure"
  } else if (signal.includes("rate limit")) {
    topic = "rate limiting on an upstream endpoint"
  } else if (signal.includes("environment") || signal.includes("env")) {
    topic = "a misconfigured environment variable"
  } else if (haveLogs) {
    topic = "the error captured in the system logs"
  } else if (haveGh) {
    topic = "a known issue reported by the community"
  }

  if (haveLogs && haveGh) {
    return `${capitalize(topic)} confirmed by system logs and corroborated by similar GitHub issues.`
  }
  if (haveLogs) {
    return `${capitalize(topic)} surfaced in the system logs.`
  }
  return `${capitalize(topic)} based on related GitHub issues.`
}

// Deterministic fix recommendations based on the detected log signal.
function deriveFixes(logLine: string | null): string[] {
  if (!logLine || /^no logs/i.test(logLine)) return []
  const s = logLine.toLowerCase()

  if (s.includes("token") || s.includes("auth")) {
    return [
      "Refresh the authentication token on the client",
      "Extend token expiry or implement silent refresh",
      "Verify session renewal logic on the server",
    ]
  }
  if (s.includes("database") || s.includes("connection")) {
    return [
      "Verify the database connection string and credentials",
      "Add retry logic with exponential backoff",
      "Check connection pool limits and idle timeouts",
    ]
  }
  if (s.includes("rate limit")) {
    return [
      "Implement client-side request batching and backoff",
      "Cache idempotent responses where possible",
      "Request a higher rate-limit tier if traffic is legitimate",
    ]
  }
  if (s.includes("environment") || s.includes("env")) {
    return [
      "Confirm all required environment variables are set in production",
      "Validate config at boot and fail fast on missing keys",
      "Document required variables in the project README",
    ]
  }
  return [
    "Reproduce the error locally with verbose logging enabled",
    "Inspect the relevant stack trace and recent deploys",
    "Roll back to the last known-good revision if blocking",
  ]
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function buildMessageMulti(
  results: { tool: ToolName; output: unknown }[]
): string {
  // ---- Index outputs by tool ----
  const byTool = new Map<ToolName, unknown>()
  for (const r of results) byTool.set(r.tool, r.output)

  const rawLogs = byTool.get("logs")
  const rawDb = byTool.get("database")
  const rawGh = byTool.get("github")

  const logLine =
    typeof rawLogs === "string" && !isErrorString(rawLogs) ? rawLogs : null
  const dbUser = isDbUser(rawDb) ? (rawDb as DbUser) : null
  const ghRefs = parseGitHubRefs(rawGh)

  const haveLogs = !!logLine && !/^no logs/i.test(logLine)
  const haveGh = ghRefs.length > 0
  const haveDb = !!dbUser

  // ---- Build sections ----
  const lines: string[] = []
  lines.push("🧠 **Analysis Complete**")
  lines.push("")

  // Detected Issue (logs)
  if (haveLogs) {
    lines.push("🚨 **Detected Issue**")
    lines.push(`> ${logLine}`)
    lines.push("")
  } else if (typeof rawLogs === "string" && /^no logs/i.test(rawLogs)) {
    lines.push("🚨 **Detected Issue**")
    lines.push("> No matching log entries were found for this query.")
    lines.push("")
  }

  // Root Cause (synthesized from logs + github)
  const rootCause = deriveRootCause(logLine, ghRefs)
  if (rootCause) {
    lines.push("📘 **Root Cause**")
    lines.push(rootCause)
    lines.push("")
  }

  // Recommended Fix
  const fixes = deriveFixes(logLine)
  if (fixes.length > 0) {
    lines.push("🛠 **Recommended Fix**")
    for (const f of fixes) lines.push(`- ${f}`)
    lines.push("")
  }

  // External References (github)
  if (haveGh) {
    lines.push("🔗 **External References**")
    for (const ref of ghRefs) {
      lines.push(`- [${ref.title}](${ref.url}) — \`${ref.repo}\``)
    }
    lines.push("")
  }

  // Data (database)
  if (haveDb && dbUser) {
    lines.push("👤 **User Data**")
    lines.push(
      `- **${dbUser.name}** (ID: \`${dbUser.id}\`) — Status: \`${dbUser.status}\``
    )
    lines.push("")
  } else if (typeof rawDb === "string" && /user not found/i.test(rawDb)) {
    lines.push("👤 **User Data**")
    lines.push("- No user matched the provided identifier.")
    lines.push("")
  }

  // Confidence
  const sourceCount = [haveLogs, haveGh, haveDb].filter(Boolean).length
  let confidence = "Low"
  if (sourceCount >= 3) confidence = "High"
  else if (sourceCount === 2) confidence = "High"
  else if (sourceCount === 1) confidence = "Medium"

  const sources: string[] = []
  if (haveLogs) sources.push("logs")
  if (haveGh) sources.push("GitHub")
  if (haveDb) sources.push("database")

  lines.push("✅ **Confidence**")
  lines.push(
    `${confidence}${
      sources.length ? ` (based on ${sources.join(" + ")})` : ""
    }`
  )

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

// -------------------- UTILS --------------------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// -------------------- API --------------------

export async function POST(request: NextRequest) {
  let body: any

  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 })
  }

  const messages =
    body?.messages ??
    (body?.message ? [{ role: "user", content: body.message }] : null)

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "messages must be array" }), { status: 400 })
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")

  if (!lastUserMessage) {
    return new Response(JSON.stringify({ error: "No user message" }), { status: 400 })
  }

  // 🔥 CONTEXT-AWARE QUERY
  const lastMessages = messages.slice(-3)
  const query = lastMessages.map((m) => m.content).join(" ").toLowerCase()

  const tools = decideTools(query)

  // EXECUTE TOOLS via MCP route
  const results = await Promise.all(
    tools.map(async (tool) => ({
      tool,
      output: await callMCP(tool, query),
    }))
  )

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const { tool, output } of results) {
          const toolCall = {
            id: `tool_${Date.now()}_${tool}`,
            name: tool,
            input: { query },
            output,
            status: "success",
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "tool_call",
                toolCall: { ...toolCall, status: "loading" },
              })}\n\n`
            )
          )

          await sleep(200)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "tool_call_complete",
                toolCall,
              })}\n\n`
            )
          )

          await sleep(150)
        }

        const responseText = buildMessageMulti(results)
        const words = responseText.split(" ")

        for (const word of words) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "token",
                content: word + " ",
              })}\n\n`
            )
          )

          await sleep(20)
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        )

        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "Stream error",
            })}\n\n`
          )
        )

        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
