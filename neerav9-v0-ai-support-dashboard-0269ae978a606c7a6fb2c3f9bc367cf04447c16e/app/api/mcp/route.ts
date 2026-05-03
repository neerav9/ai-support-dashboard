import { NextResponse } from "next/server"

type ToolName = "database" | "github" | "logs"

type RequestBody = {
  tool: ToolName
  query: string
}

type SuccessResponse = {
  result: unknown
}

type ErrorResponse = {
  error: string
}

// -------------------- MOCK DATA --------------------

const users = [
  { id: 1, name: "John Doe", status: "active" },
  { id: 2, name: "Alice Smith", status: "inactive" },
  { id: 3, name: "Marcus Lee", status: "suspended" },
]

const logs = [
  "ERROR: token expired at login",
  "ERROR: database connection failed",
  "WARN: missing environment variable",
  "ERROR: rate limit exceeded on /api/auth",
  "INFO: user session refreshed",
]

// -------------------- GUARDS --------------------

const VALID_TOOLS = new Set<ToolName>(["database", "github", "logs"])

function isToolName(value: unknown): value is ToolName {
  return typeof value === "string" && VALID_TOOLS.has(value as ToolName)
}

function isValidBody(body: unknown): body is RequestBody {
  if (typeof body !== "object" || body === null) return false
  const b = body as Record<string, unknown>
  return isToolName(b.tool) && typeof b.query === "string"
}

// -------------------- TOOLS --------------------

function queryDatabase(query: string): { id: number; name: string; status: string } | string {
  const match = query.match(/\d+/)
  if (!match) return "User not found"
  const id = parseInt(match[0], 10)
  return users.find((u) => u.id === id) ?? "User not found"
}

function fetchLogs(query: string): string {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  for (const word of words) {
    const found = logs.find((l) => l.toLowerCase().includes(word))
    if (found) return found
  }
  return "No logs found"
}

type GitHubIssue = {
  title: string
  html_url: string
  body: string | null
  repository_url: string
}

async function fetchGitHub(query: string): Promise<string> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return "DEBUG: GITHUB_TOKEN is undefined"

  try {
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=3`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    })

    if (!res.ok) return `GitHub error: ${res.status} ${res.statusText}`

    const data = (await res.json()) as { items?: GitHubIssue[] }
    const items = data.items ?? []

    if (items.length === 0) return "No relevant GitHub issues found"

    const lines: string[] = ["Top GitHub issues:"]
    for (const item of items.slice(0, 3)) {
      const repoName = item.repository_url.split("/repos/")[1] ?? "unknown/unknown"
      const body = (item.body ?? item.title).replace(/\s+/g, " ").trim()
      const snippet = body.length > 140 ? body.slice(0, 140) + "..." : body
      lines.push(
        `- ${item.title}`,
        `  Repo: ${repoName}`,
        `  ${item.html_url}`,
        `  ${snippet}`
      )
    }
    return lines.join("\n")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `GitHub fetch failed: ${message}`
  }
}

// -------------------- ROUTE --------------------

export async function POST(req: Request): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  let raw: unknown

  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!isValidBody(raw)) {
    return NextResponse.json(
      { error: "Missing or invalid 'tool' or 'query'" },
      { status: 400 }
    )
  }

  const { tool, query }: RequestBody = raw

  try {
    let result: unknown

    switch (tool) {
      case "database":
        result = queryDatabase(query)
        break
      case "logs":
        result = fetchLogs(query)
        break
      case "github":
        result = await fetchGitHub(query)
        break
    }

    return NextResponse.json({ result })
  } catch {
    return NextResponse.json(
      { result: "Service temporarily unavailable" },
      { status: 500 }
    )
  }
}
