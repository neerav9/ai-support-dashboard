"use client"

import { useState, useCallback, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { Chat } from "@/components/chat"
import { InputBar } from "@/components/input-bar"
import { LogsPanel } from "@/components/logs-panel"
import type { Conversation, Message, ToolCall } from "@/types"
import { cn } from "@/lib/utils"

type FullConversation = Conversation & {
  messages: Message[]
  toolCalls: ToolCall[]
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function deriveTitle(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim()
  if (!trimmed) return "New conversation"
  return trimmed.length <= 40 ? trimmed : trimmed.slice(0, 40).trimEnd() + "…"
}

function makeEmptyConversation(): FullConversation {
  return {
    id: newId("conv"),
    title: "New conversation",
    lastMessage: "",
    updatedAt: new Date(),
    unread: false,
    messages: [],
    toolCalls: [],
  }
}

export default function Home() {
  const [conversations, setConversations] = useState<FullConversation[]>(() => [
    makeEmptyConversation(),
  ])
  const [activeId, setActiveId] = useState<string>(
    () => conversations[0]?.id ?? ""
  )
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Derived active conversation
  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  )
  const messages = active?.messages ?? []
  const toolCalls = active?.toolCalls ?? []

  // Sidebar metadata view (sorted newest-first)
  const sidebarConversations: Conversation[] = useMemo(() => {
    return [...conversations]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(({ id, title, lastMessage, updatedAt, unread }) => ({
        id,
        title,
        lastMessage,
        updatedAt,
        unread,
      }))
  }, [conversations])

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: false } : c))
    )
  }, [])

  const handleNewConversation = useCallback(() => {
    setConversations((prev) => {
      // If the active conversation is already empty, just keep it active.
      const current = prev.find((c) => c.id === activeId)
      if (current && current.messages.length === 0) return prev
      const fresh = makeEmptyConversation()
      setActiveId(fresh.id)
      setInput("")
      return [fresh, ...prev]
    })
  }, [activeId])

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id)
        if (next.length === 0) {
          const fresh = makeEmptyConversation()
          setActiveId(fresh.id)
          return [fresh]
        }
        if (id === activeId) {
          setActiveId(next[0].id)
        }
        return next
      })
    },
    [activeId]
  )

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim()
      if (!text || loading) return

      const targetId = activeId
      const userMessage: Message = {
        id: newId("msg"),
        role: "user",
        content: text,
        createdAt: new Date(),
      }
      const assistantMessageId = newId("msg")
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      }

      // Append messages and update conversation metadata atomically.
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetId) return c
          const isFirst = c.messages.length === 0
          return {
            ...c,
            title: isFirst ? deriveTitle(text) : c.title,
            lastMessage: text,
            updatedAt: new Date(),
            unread: false,
            messages: [...c.messages, userMessage, assistantMessage],
          }
        })
      )

      setInput("")
      setLoading(true)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        })

        if (!response.ok) throw new Error("Failed to fetch")
        if (!response.body) throw new Error("No response body")

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk
            .split("\n")
            .filter((line) => line.startsWith("data: "))

          for (const line of lines) {
            const data = JSON.parse(line.slice(6))

            if (data.type === "token") {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== targetId) return c
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: m.content + data.content }
                        : m
                    ),
                  }
                })
              )
            } else if (data.type === "tool_call") {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === targetId
                    ? { ...c, toolCalls: [...c.toolCalls, data.toolCall] }
                    : c
                )
              )
            } else if (data.type === "tool_call_complete") {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === targetId
                    ? {
                        ...c,
                        toolCalls: c.toolCalls.map((tc) =>
                          tc.id === data.toolCall.id ? data.toolCall : tc
                        ),
                      }
                    : c
                )
              )
            }
          }
        }

        // Final metadata update: set lastMessage to assistant's full reply.
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetId) return c
            const last = c.messages[c.messages.length - 1]
            const preview = last?.content?.replace(/\s+/g, " ").trim() ?? ""
            return {
              ...c,
              lastMessage: preview.slice(0, 120) || c.lastMessage,
              updatedAt: new Date(),
              unread: targetId !== activeId,
            }
          })
        )
      } catch (error) {
        console.error("[v0] Error sending message:", error)
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content:
                        "I apologize, but I encountered an error. Please try again.",
                    }
                  : m
              ),
              lastMessage:
                "I apologize, but I encountered an error. Please try again.",
              updatedAt: new Date(),
            }
          })
        )
      } finally {
        setLoading(false)
      }
    },
    [input, loading, activeId]
  )

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950 text-zinc-100 antialiased">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/3 size-[480px] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 size-[420px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar: fixed overlay on mobile, in-flow column on lg+ */}
      <div
        className={cn(
          "z-50 shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
          "fixed inset-y-0 left-0 lg:relative",
          sidebarOpen
            ? "w-[min(18rem,85vw)] translate-x-0 lg:w-72"
            : "w-[min(18rem,85vw)] -translate-x-full lg:w-0 lg:translate-x-0"
        )}
      >
        <div className="h-full w-[min(18rem,85vw)] lg:w-72">
          <Sidebar
            conversations={sidebarConversations}
            activeConversation={activeId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>
      </div>

      {/* Right area: stacks (chat over logs) on mobile, side-by-side on lg+ */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:flex-row">
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Chat
            messages={messages}
            loading={loading}
            onSuggestion={handleSend}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            title={active?.title}
          />
          <InputBar
            value={input}
            onChange={setInput}
            onSend={handleSend}
            loading={loading}
          />
        </main>
        <LogsPanel toolCalls={toolCalls} />
      </div>
    </div>
  )
}
