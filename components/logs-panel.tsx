"use client"

import { useState } from "react"
import { ChevronDown, Terminal, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
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

function StatusBadge({ status }: { status: ToolCall["status"] }) {
  const config = {
    success: {
      variant: "outline" as const,
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.05)]",
      icon: CheckCircle2,
      label: "Success",
    },
    error: {
      variant: "outline" as const,
      className:
        "border-red-500/20 bg-red-500/10 text-red-400 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.05)]",
      icon: XCircle,
      label: "Error",
    },
    loading: {
      variant: "outline" as const,
      className:
        "border-amber-400/20 bg-amber-400/10 text-amber-300 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.05)]",
      icon: Loader2,
      label: "Running",
    },
  }

  const { className, icon: Icon, label } = config[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 gap-1 rounded-md px-1.5 py-0 text-[10.5px] font-medium tracking-wide",
        className
      )}
    >
      <Icon
        className={cn("size-2.5", status === "loading" && "animate-spin")}
      />
      {label}
    </Badge>
  )
}

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "group/card overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-lg shadow-black/30 backdrop-blur-sm transition-all duration-200",
          "animate-in fade-in slide-in-from-bottom-2",
          isOpen
            ? "border-zinc-700 shadow-xl"
            : "hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl"
        )}
      >
        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition-colors duration-200 hover:bg-zinc-900/60">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={cn(
                "relative flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors duration-200",
                toolCall.status === "loading"
                  ? "bg-amber-400/10 text-amber-300 ring-amber-400/20"
                  : toolCall.status === "error"
                    ? "bg-red-500/10 text-red-400 ring-red-500/20"
                    : "bg-zinc-800/80 text-zinc-300 ring-zinc-700"
              )}
            >
              {toolCall.status === "loading" && (
                <span className="absolute inset-0 animate-pulse rounded-lg bg-amber-400/10" />
              )}
              <Terminal className="relative size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate font-mono text-[12.5px] font-medium text-zinc-100">
                {toolCall.name}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge status={toolCall.status} />
            <ChevronDown
              className={cn(
                "size-3.5 text-zinc-500 transition-transform duration-200 group-hover:text-zinc-300",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 data-[state=closed]:duration-150 data-[state=open]:duration-200">
          <div className="space-y-3 border-t border-zinc-800/80 bg-zinc-950/40 p-3">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-cyan-400" />
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Input
                </h4>
              </div>
              <pre className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-[11.5px] leading-relaxed text-zinc-300">
                <code>{JSON.stringify(toolCall.input, null, 2)}</code>
              </pre>
            </div>
            {toolCall.status !== "loading" && (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-1 rounded-full",
                      toolCall.status === "error"
                        ? "bg-red-400"
                        : "bg-emerald-400"
                    )}
                  />
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    Output
                  </h4>
                </div>
                <pre className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-[11.5px] leading-relaxed text-zinc-300">
                  <code>{JSON.stringify(toolCall.output, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function EmptyLogs() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-cyan-400/10 blur-xl" />
        <div className="flex size-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/30">
          <Terminal className="size-5 text-cyan-400" />
        </div>
      </div>
      <div>
        <p className="text-[13px] font-medium text-zinc-200">
          No tool calls yet
        </p>
        <p className="mt-1 max-w-[180px] text-[11.5px] leading-relaxed text-zinc-500">
          Tool executions will stream here in real time
        </p>
      </div>
    </div>
  )
}

export function LogsPanel({ toolCalls }: LogsPanelProps) {
  const successCount = toolCalls.filter((t) => t.status === "success").length
  const errorCount = toolCalls.filter((t) => t.status === "error").length
  const runningCount = toolCalls.filter((t) => t.status === "loading").length

  return (
    <div className="relative z-10 flex h-full w-80 flex-col border-l border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-zinc-800/80 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-cyan-400" />
            <h2 className="text-[13px] font-semibold tracking-tight text-zinc-50">
              Tool Logs
            </h2>
          </div>
          <span className="rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-zinc-400 ring-1 ring-inset ring-zinc-800">
            {toolCalls.length}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-medium text-zinc-500">OK</span>
            </div>
            <p className="mt-0.5 font-mono text-[13px] font-semibold text-zinc-100 tabular-nums">
              {successCount}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] font-medium text-zinc-500">Run</span>
            </div>
            <p className="mt-0.5 font-mono text-[13px] font-semibold text-zinc-100 tabular-nums">
              {runningCount}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] font-medium text-zinc-500">Err</span>
            </div>
            <p className="mt-0.5 font-mono text-[13px] font-semibold text-zinc-100 tabular-nums">
              {errorCount}
            </p>
          </div>
        </div>
      </div>

      {toolCalls.length === 0 ? (
        <EmptyLogs />
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 p-4">
            {toolCalls.map((toolCall) => (
              <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
