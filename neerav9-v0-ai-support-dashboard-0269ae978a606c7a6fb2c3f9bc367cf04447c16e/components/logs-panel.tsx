"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronDown,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  Github,
  Database,
  ScrollText,
  ExternalLink,
  Copy,
  Check,
  User,
  AlertCircle,
  Info,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { ToolCall } from "@/types"

interface LogsPanelProps {
  toolCalls: ToolCall[]
}

// -------------------- TOOL META --------------------

type ToolMeta = {
  icon: typeof Terminal
  iconClass: string
  bgClass: string
  ringClass: string
  label: string
}

function getToolMeta(name: string): ToolMeta {
  const key = name.toLowerCase()
  if (key === "logs") {
    return {
      icon: ScrollText,
      iconClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
      ringClass: "ring-emerald-500/20",
      label: "Logs",
    }
  }
  if (key === "github") {
    return {
      icon: Github,
      iconClass: "text-violet-400",
      bgClass: "bg-violet-500/10",
      ringClass: "ring-violet-500/20",
      label: "GitHub",
    }
  }
  if (key === "database") {
    return {
      icon: Database,
      iconClass: "text-cyan-400",
      bgClass: "bg-cyan-500/10",
      ringClass: "ring-cyan-500/20",
      label: "Database",
    }
  }
  return {
    icon: Terminal,
    iconClass: "text-zinc-400",
    bgClass: "bg-zinc-800/80",
    ringClass: "ring-zinc-700",
    label: name,
  }
}

// -------------------- STATUS PILL --------------------

function StatusPill({ status }: { status: ToolCall["status"] }) {
  if (status === "success") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 text-[10.5px] font-medium tracking-wide text-emerald-300">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        Success
      </span>
    )
  }
  if (status === "loading") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 text-[10.5px] font-medium tracking-wide text-amber-300">
        <Loader2 className="size-2.5 animate-spin" />
        Running
      </span>
    )
  }
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 text-[10.5px] font-medium tracking-wide text-red-300">
      <XCircle className="size-2.5" />
      Error
    </span>
  )
}

// -------------------- COPY BUTTON --------------------

function CopyButton({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(value).then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          })
        }
      }}
      aria-label="Copy"
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-400 opacity-0 backdrop-blur-sm transition-all duration-150 hover:border-white/20 hover:bg-white/10 hover:text-zinc-100 group-hover/payload:opacity-100 focus:opacity-100",
        className
      )}
    >
      {copied ? (
        <Check className="size-3 text-emerald-400" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  )
}

// -------------------- INPUT (syntax-highlighted JSON) --------------------

function InputBlock({ input }: { input: Record<string, unknown> }) {
  const entries = useMemo(() => Object.entries(input ?? {}), [input])
  const raw = useMemo(() => {
    try {
      return JSON.stringify(input, null, 2)
    } catch {
      return String(input)
    }
  }, [input])

  return (
    <div className="group/payload relative overflow-hidden rounded-lg border border-white/5 bg-black/30">
      <div className="max-h-48 overflow-y-auto p-2.5 font-mono text-[11.5px] leading-relaxed">
        <span className="text-zinc-600">{"{"}</span>
        <div className="pl-3">
          {entries.length === 0 ? (
            <span className="text-zinc-600">// empty</span>
          ) : (
            entries.map(([k, v], i) => (
              <div
                key={k}
                className="break-words [overflow-wrap:anywhere]"
              >
                <span className="text-violet-300">{`"${k}"`}</span>
                <span className="text-zinc-500">{": "}</span>
                <span className="text-emerald-300">
                  {typeof v === "string"
                    ? `"${v}"`
                    : typeof v === "number" || typeof v === "boolean"
                      ? String(v)
                      : JSON.stringify(v)}
                </span>
                {i < entries.length - 1 && (
                  <span className="text-zinc-500">,</span>
                )}
              </div>
            ))
          )}
        </div>
        <span className="text-zinc-600">{"}"}</span>
      </div>
      <CopyButton value={raw} className="absolute right-1.5 top-1.5" />
    </div>
  )
}

// -------------------- OUTPUT RENDERERS --------------------

type ParsedGitHubIssue = {
  title: string
  repo: string
  url: string
  snippet: string
}

function parseGitHubIssues(text: string): ParsedGitHubIssue[] | null {
  if (!text.trim().toLowerCase().startsWith("top github issues")) return null

  const lines = text.split("\n")
  const issues: ParsedGitHubIssue[] = []
  let current: Partial<ParsedGitHubIssue> | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.toLowerCase().startsWith("top github issues")) continue

    if (line.startsWith("- ")) {
      if (current?.title && current.url) {
        issues.push({
          title: current.title,
          repo: current.repo ?? "unknown/unknown",
          url: current.url,
          snippet: current.snippet ?? "",
        })
      }
      current = { title: line.slice(2).trim(), snippet: "" }
      continue
    }

    if (!current) continue

    if (/^repo:/i.test(line)) {
      current.repo = line.replace(/^repo:\s*/i, "").trim()
      continue
    }
    if (/^https?:\/\//.test(line) && !current.url) {
      current.url = line
      continue
    }
    current.snippet = (current.snippet ? current.snippet + " " : "") + line
  }

  if (current?.title && current.url) {
    issues.push({
      title: current.title,
      repo: current.repo ?? "unknown/unknown",
      url: current.url,
      snippet: current.snippet ?? "",
    })
  }

  return issues.length > 0 ? issues : null
}

function GitHubIssuesView({ issues }: { issues: ParsedGitHubIssue[] }) {
  return (
    <div className="flex flex-col gap-2">
      {issues.map((issue, idx) => (
        <a
          key={idx}
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/issue flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-violet-500/5"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 break-words text-[12.5px] font-medium leading-snug text-zinc-100 group-hover/issue:text-white [overflow-wrap:anywhere]">
              {issue.title}
            </h4>
            <ExternalLink className="mt-0.5 size-3 shrink-0 text-zinc-500 transition-colors group-hover/issue:text-violet-300" />
          </div>
          {issue.snippet && (
            <p className="line-clamp-2 break-words text-[11px] leading-relaxed text-zinc-500 [overflow-wrap:anywhere]">
              {issue.snippet}
            </p>
          )}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Github className="size-3 text-zinc-500" />
            <span className="truncate font-mono text-[10.5px] text-zinc-400">
              {issue.repo}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}

type LogLine = {
  level: "ERROR" | "WARN" | "INFO" | "DEBUG"
  message: string
}

function parseLogLine(text: string): LogLine | null {
  const m = text.match(/^(ERROR|WARN|WARNING|INFO|DEBUG):\s*(.+)$/i)
  if (!m) return null
  const lvl = m[1].toUpperCase()
  const level: LogLine["level"] =
    lvl === "WARNING" ? "WARN" : (lvl as LogLine["level"])
  return { level, message: m[2].trim() }
}

function LogLineView({ line }: { line: LogLine }) {
  const palette: Record<
    LogLine["level"],
    { bg: string; border: string; text: string; icon: typeof AlertCircle }
  > = {
    ERROR: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-300",
      icon: AlertCircle,
    },
    WARN: {
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
      text: "text-amber-300",
      icon: AlertCircle,
    },
    INFO: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      text: "text-cyan-300",
      icon: Info,
    },
    DEBUG: {
      bg: "bg-zinc-700/30",
      border: "border-zinc-600/30",
      text: "text-zinc-300",
      icon: Info,
    },
  }
  const p = palette[line.level]
  const Icon = p.icon

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-2.5 py-2",
        p.bg,
        p.border
      )}
    >
      <Icon className={cn("mt-0.5 size-3.5 shrink-0", p.text)} />
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "mr-1.5 rounded px-1 py-0.5 font-mono text-[10px] font-bold tracking-wider",
            p.bg,
            p.text
          )}
        >
          {line.level}
        </span>
        <span className="break-words text-[12px] leading-relaxed text-zinc-200 [overflow-wrap:anywhere]">
          {line.message}
        </span>
      </div>
    </div>
  )
}

type DbUser = { id: number; name: string; status: string }

function isDbUser(v: unknown): v is DbUser {
  return (
    typeof v === "object" &&
    v !== null &&
    "id" in v &&
    "name" in v &&
    "status" in v
  )
}

function UserCard({ user }: { user: DbUser }) {
  const statusColor =
    user.status === "active"
      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
      : user.status === "suspended"
        ? "text-red-300 bg-red-500/10 border-red-500/20"
        : "text-zinc-300 bg-zinc-700/30 border-zinc-600/30"

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 ring-1 ring-inset ring-white/10">
        <span className="text-[11px] font-semibold text-zinc-100">
          {initials || <User className="size-4" />}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-zinc-100">
          {user.name}
        </p>
        <p className="truncate font-mono text-[10.5px] text-zinc-500">
          ID: {user.id}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize tracking-wide",
          statusColor
        )}
      >
        {user.status}
      </span>
    </div>
  )
}

function PlainOutput({ text }: { text: string }) {
  return (
    <div className="group/payload relative overflow-hidden rounded-lg border border-white/5 bg-black/30">
      <pre className="max-h-[300px] overflow-y-auto whitespace-pre-wrap break-words p-2.5 font-mono text-[11.5px] leading-relaxed text-zinc-300 [overflow-wrap:anywhere]">
        {text}
      </pre>
      <CopyButton value={text} className="absolute right-1.5 top-1.5" />
    </div>
  )
}

function OutputBlock({ output }: { output: unknown }) {
  // String output
  if (typeof output === "string") {
    const ghIssues = parseGitHubIssues(output)
    if (ghIssues) return <GitHubIssuesView issues={ghIssues} />

    const log = parseLogLine(output)
    if (log) return <LogLineView line={log} />

    return <PlainOutput text={output} />
  }

  // User object
  if (isDbUser(output)) {
    return <UserCard user={output} />
  }

  // Fallback — JSON
  let json: string
  try {
    json = JSON.stringify(output, null, 2)
  } catch {
    json = String(output)
  }
  return <PlainOutput text={json} />
}

// -------------------- TOOL CALL CARD --------------------

function extractTimestamp(id: string): number | null {
  const m = id.match(/^tool_(\d+)_/)
  return m ? parseInt(m[1], 10) : null
}

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [isOpen, setIsOpen] = useState(false)
  const meta = getToolMeta(toolCall.name)
  const Icon = meta.icon

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "group/card overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-200",
          "animate-in fade-in slide-in-from-bottom-2",
          isOpen
            ? "border-white/20 bg-white/[0.07] shadow-xl shadow-black/40"
            : "hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-black/30"
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={cn(
                "relative flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                meta.bgClass,
                meta.ringClass
              )}
            >
              {toolCall.status === "loading" && (
                <span
                  className={cn(
                    "absolute inset-0 animate-pulse rounded-lg",
                    meta.bgClass
                  )}
                />
              )}
              <Icon className={cn("relative size-4", meta.iconClass)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate font-mono text-[12.5px] font-semibold text-zinc-50">
                  {meta.label}
                </span>
                <span className="truncate font-mono text-[10.5px] text-zinc-500">
                  {toolCall.name}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusPill status={toolCall.status} />
            <ChevronDown
              className={cn(
                "size-3.5 text-zinc-500 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 data-[state=closed]:duration-150 data-[state=open]:duration-200">
          <div className="space-y-3 border-t border-white/5 bg-black/20 p-3">
            {/* INPUT */}
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-violet-400" />
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                    Input
                  </h4>
                </div>
              </div>
              <InputBlock input={toolCall.input} />
            </div>

            {/* OUTPUT */}
            {toolCall.status !== "loading" && (
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1 rounded-full",
                        toolCall.status === "error"
                          ? "bg-red-400"
                          : "bg-emerald-400"
                      )}
                    />
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                      Output
                    </h4>
                  </div>
                </div>
                <OutputBlock output={toolCall.output} />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// -------------------- HEADER COUNTERS --------------------

function CounterPill({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone: "success" | "running" | "error"
}) {
  const palette = {
    success: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
    },
    running: {
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
      text: "text-amber-300",
      dot: "bg-amber-400",
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-300",
      dot: "bg-red-400",
    },
  }[tone]

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5",
        palette.bg,
        palette.border
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("size-1.5 shrink-0 rounded-full", palette.dot)} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </span>
      </div>
      <span
        key={value}
        className={cn(
          "inline-block animate-in fade-in slide-in-from-bottom-1 font-mono text-[13px] font-semibold tabular-nums duration-300",
          palette.text
        )}
      >
        {value}
      </span>
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// -------------------- MAIN PANEL --------------------

export function LogsPanel({ toolCalls }: LogsPanelProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false)

  const successCount = toolCalls.filter((t) => t.status === "success").length
  const errorCount = toolCalls.filter((t) => t.status === "error").length
  const runningCount = toolCalls.filter((t) => t.status === "loading").length
  const anyLoading = runningCount > 0

  // Total execution time — derived from tool-call ID timestamps.
  const startMs = useMemo(() => {
    let min: number | null = null
    for (const tc of toolCalls) {
      const t = extractTimestamp(tc.id)
      if (t !== null && (min === null || t < min)) min = t
    }
    return min
  }, [toolCalls])

  const [now, setNow] = useState<number>(() => Date.now())
  const lastSettledRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!anyLoading) {
      lastSettledRef.current = Date.now()
      setNow(Date.now())
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [anyLoading, toolCalls.length])

  const elapsed =
    startMs === null
      ? 0
      : (anyLoading ? now : lastSettledRef.current) - startMs

  return (
    <aside
      className={cn(
        "relative z-10 flex shrink-0 flex-col overflow-hidden border-white/10 bg-zinc-950/80 backdrop-blur-xl",
        // Mobile: full width, top border, height controlled by collapse state
        "w-full border-t",
        mobileExpanded ? "max-h-[60vh]" : "max-h-14",
        // Desktop: fixed width column, left border, full height
        "lg:h-full lg:max-h-none lg:w-80 lg:border-l lg:border-t-0 xl:w-96",
        "transition-[max-height] duration-300 ease-in-out"
      )}
      aria-label="Tool execution logs"
    >
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 lg:px-5 lg:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Terminal className="size-3.5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[13px] font-semibold tracking-tight text-zinc-50">
                Tool Logs
              </h2>
              <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500">
                <span className="font-mono tabular-nums">
                  {toolCalls.length} call{toolCalls.length === 1 ? "" : "s"}
                </span>
                {startMs !== null && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="size-2.5" />
                      {formatDuration(elapsed)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile expand/collapse toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileExpanded((v) => !v)}
            aria-label={mobileExpanded ? "Collapse logs" : "Expand logs"}
            aria-expanded={mobileExpanded}
            className="size-7 shrink-0 text-zinc-400 hover:bg-white/5 hover:text-zinc-100 lg:hidden"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                mobileExpanded && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Counter pills — hidden when mobile collapsed, always shown on lg */}
        <div
          className={cn(
            "mt-3 grid grid-cols-3 gap-1.5",
            !mobileExpanded && "hidden",
            "lg:grid"
          )}
        >
          <CounterPill value={successCount} label="OK" tone="success" />
          <CounterPill value={runningCount} label="Run" tone="running" />
          <CounterPill value={errorCount} label="Err" tone="error" />
        </div>
      </div>

      {/* Body */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          !mobileExpanded && "hidden",
          "lg:flex"
        )}
      >
        {toolCalls.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-2xl bg-cyan-400/10 blur-xl" />
              <div className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <Terminal className="size-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-medium text-zinc-200">
                No tool calls yet
              </p>
              <p className="mt-1 max-w-[200px] text-[11.5px] leading-relaxed text-zinc-500">
                Tool executions will stream here in real time
              </p>
            </div>
          </div>
        ) : (
          <div
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700/60 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-600 [&::-webkit-scrollbar-track]:bg-transparent"
            role="log"
            aria-live="polite"
          >
            <div className="flex flex-col gap-2 p-3 lg:p-4">
              {toolCalls.map((toolCall) => (
                <ToolCallCard key={toolCall.id} toolCall={toolCall} />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
