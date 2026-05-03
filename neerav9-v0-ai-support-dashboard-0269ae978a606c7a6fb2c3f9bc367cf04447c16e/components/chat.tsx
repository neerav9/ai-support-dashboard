"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Check, User, Bot, Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Message } from "@/types"

// -------------------- CODE BLOCK --------------------

function CodeBlock({
  language,
  value,
}: {
  language: string | undefined
  value: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-zinc-700" />
            <span className="size-2.5 rounded-full bg-zinc-700" />
            <span className="size-2.5 rounded-full bg-zinc-700" />
          </div>
          <span className="ml-2 font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {language || "code"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          className="size-7 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}

// -------------------- MESSAGE --------------------

function MessageBubble({
  message,
  isFirstInGroup,
  isLastInGroup,
}: {
  message: Message
  isFirstInGroup: boolean
  isLastInGroup: boolean
}) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "")}>
      {/* Avatar (only on first in group) */}
      <div className={cn("w-8 shrink-0", !isFirstInGroup && "invisible")}>
        {isFirstInGroup && (
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-xl ring-1 ring-inset",
              isUser
                ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/20 ring-white/10"
                : "bg-zinc-900 text-zinc-300 ring-zinc-800"
            )}
          >
            {isUser ? (
              <User className="size-4" />
            ) : (
              <Bot className="size-4 text-violet-400" />
            )}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "flex min-w-0 max-w-[88%] flex-col gap-1 sm:max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {isFirstInGroup && (
          <span className="px-1 text-[11px] font-medium text-zinc-500">
            {isUser ? "You" : "AI Support Agent"}
          </span>
        )}
        <div
          className={cn(
            "min-w-0 max-w-full overflow-hidden break-words px-4 py-2.5 shadow-lg shadow-black/30 ring-1 ring-inset transition-all duration-200 [overflow-wrap:anywhere]",
            isUser
              ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white ring-white/10"
              : "bg-zinc-900/80 text-zinc-100 ring-zinc-800 backdrop-blur-sm",
            // Grouped border radii
            isFirstInGroup && isLastInGroup && "rounded-2xl",
            isFirstInGroup && !isLastInGroup && "rounded-2xl rounded-b-md",
            !isFirstInGroup && !isLastInGroup && (isUser ? "rounded-2xl rounded-r-md" : "rounded-2xl rounded-l-md"),
            !isFirstInGroup && isLastInGroup && "rounded-2xl rounded-t-md"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed [overflow-wrap:anywhere]">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none break-words [overflow-wrap:anywhere] prose-p:my-2 prose-p:text-[14px] prose-p:leading-relaxed prose-p:text-zinc-100 prose-headings:text-zinc-50 prose-strong:text-zinc-50 prose-a:break-all prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:text-[14px] prose-li:text-zinc-200 prose-pre:max-w-full prose-pre:overflow-x-auto">
              <ReactMarkdown
                components={{
                  code({ className, children }) {
                    const match = /language-(\w+)/.exec(className || "")
                    if (!match) {
                      return (
                        <code className="break-all rounded-md border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 font-mono text-[12.5px] text-cyan-400">
                          {children}
                        </code>
                      )
                    }
                    return (
                      <CodeBlock
                        language={match[1]}
                        value={String(children).replace(/\n$/, "")}
                      />
                    )
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block max-w-full truncate align-bottom"
                      >
                        {children}
                      </a>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Time (only on last in group) */}
        {isLastInGroup && (
          <span className="px-1 text-[10.5px] font-medium text-zinc-600">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  )
}

// -------------------- THINKING --------------------

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-violet-400 ring-1 ring-inset ring-zinc-800">
        <Bot className="size-4" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="px-1 text-[11px] font-medium text-zinc-500">
          AI Support Agent
        </span>
        <div className="flex items-center gap-2 rounded-2xl bg-zinc-900/80 px-4 py-2.5 ring-1 ring-inset ring-zinc-800 backdrop-blur-sm">
          <Sparkles className="size-3.5 animate-pulse text-violet-400" />
          <span className="text-[13px] font-medium text-zinc-300">
            Thinking
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
            <span className="size-1 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
            <span className="size-1 animate-bounce rounded-full bg-violet-400" />
          </span>
        </div>
      </div>
    </div>
  )
}

// -------------------- EMPTY --------------------

function EmptyState({
  onSuggestion,
}: {
  onSuggestion?: (text: string) => void
}) {
  const suggestions = [
    "Debug a login error",
    "Get user with id 1",
    "Search recent tickets",
    "Summarize this thread",
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 -z-10 size-16 rounded-2xl bg-violet-500/30 blur-2xl" />
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-xl shadow-violet-500/30 ring-1 ring-inset ring-white/10">
          <Bot className="size-8 text-white" />
        </div>
      </div>
      <h2 className="text-balance text-xl font-semibold tracking-tight text-zinc-50">
        How can I help you today?
      </h2>
      <p className="mt-2 max-w-sm text-pretty text-[13.5px] leading-relaxed text-zinc-400">
        Ask anything — I can debug errors, query data, or guide you through your
        product.
      </p>
      <div className="mt-7 grid w-full max-w-md grid-cols-2 gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion?.(s)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-left text-[12.5px] font-medium text-zinc-300 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 hover:bg-zinc-900 hover:text-zinc-100 hover:shadow-lg hover:shadow-violet-500/10 focus-visible:border-violet-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 active:translate-y-0"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// -------------------- HEADER --------------------

function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
  title,
}: {
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
  title?: string
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/60 px-3 backdrop-blur-xl sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Hide conversations" : "Show conversations"}
            aria-expanded={sidebarOpen}
            className="size-8 shrink-0 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>
        )}
        <span className="hidden h-4 w-px bg-zinc-800 sm:block" />
        <div className="flex shrink-0 items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Live
          </span>
        </div>
        <span className="hidden h-4 w-px bg-zinc-800 sm:block" />
        <h2 className="hidden truncate text-[14px] font-semibold tracking-tight text-zinc-100 sm:block">
          {title?.trim() ? title : "New conversation"}
        </h2>
      </div>
      <div className="hidden shrink-0 items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 backdrop-blur-sm md:flex">
        <span className="size-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
        <span className="text-[11px] font-medium text-zinc-300">
          gpt-4o · streaming
        </span>
      </div>
    </div>
  )
}

// -------------------- MAIN CHAT --------------------

export function Chat({
  messages,
  loading,
  onSuggestion,
  sidebarOpen,
  onToggleSidebar,
  title,
}: {
  messages: Message[]
  loading: boolean
  onSuggestion?: (text: string) => void
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
  title?: string
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Hide the empty assistant placeholder while we still want to show "Thinking..."
  const lastMsg = messages[messages.length - 1]
  const isThinking =
    loading && lastMsg?.role === "assistant" && lastMsg.content === ""
  const visibleMessages = isThinking ? messages.slice(0, -1) : messages

  // Smooth auto-scroll without layout jumps
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    })
  }, [])

  useEffect(() => {
    scrollToBottom(true)
  }, [visibleMessages.length, isThinking, scrollToBottom])

  // Smoothly track streaming content growth
  useEffect(() => {
    if (!loading) return
    const id = window.setInterval(() => scrollToBottom(true), 250)
    return () => window.clearInterval(id)
  }, [loading, scrollToBottom])

  return (
    <>
      <ChatHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
        title={title}
      />
      {messages.length === 0 ? (
        <div className="flex-1 overflow-hidden">
          <EmptyState onSuggestion={onSuggestion} />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 py-4 sm:px-6 sm:py-6"
        >
          <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-1">
            {visibleMessages.map((message, i) => {
              const prev = visibleMessages[i - 1]
              const next = visibleMessages[i + 1]
              const isFirstInGroup = !prev || prev.role !== message.role
              const isLastInGroup = !next || next.role !== message.role

              return (
                <div
                  key={message.id}
                  className={cn(
                    "animate-in fade-in slide-in-from-bottom-1 duration-200",
                    isFirstInGroup ? "mt-5 first:mt-0" : "mt-1"
                  )}
                >
                  <MessageBubble
                    message={message}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                  />
                </div>
              )
            })}

            {isThinking && (
              <div
                className={cn(
                  visibleMessages.length > 0 ? "mt-5" : ""
                )}
              >
                <ThinkingIndicator />
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={bottomRef} className="h-1" />
          </div>
        </div>
      )}
    </>
  )
}
