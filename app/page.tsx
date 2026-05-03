"use client"

import { useState, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { Chat } from "@/components/chat"
import { InputBar } from "@/components/input-bar"
import { LogsPanel } from "@/components/logs-panel"
import type { Message, ToolCall } from "@/types"
import { cn } from "@/lib/utils"

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [activeConversation, setActiveConversation] = useState("1")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim()
      if (!text || loading) return

      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setLoading(true)

    // Create assistant message placeholder
    const assistantMessageId = `msg_${Date.now() + 1}`
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

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
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "))

        for (const line of lines) {
          const data = JSON.parse(line.slice(6))

          if (data.type === "token") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + data.content }
                  : msg
              )
            )
          } else if (data.type === "tool_call") {
            setToolCalls((prev) => [...prev, data.toolCall])
          } else if (data.type === "tool_call_complete") {
            setToolCalls((prev) =>
              prev.map((tc) =>
                tc.id === data.toolCall.id ? data.toolCall : tc
              )
            )
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "I apologize, but I encountered an error. Please try again.",
              }
            : msg
        )
      )
    } finally {
      setLoading(false)
    }
  }, [input, loading])

  const handleNewConversation = useCallback(() => {
    setMessages([])
    setToolCalls([])
    setInput("")
    setActiveConversation(`new_${Date.now()}`)
  }, [])

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

      <div
        className={cn(
          "relative z-10 shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
          sidebarOpen ? "w-72" : "w-0"
        )}
      >
        <div className="h-full w-72">
          <Sidebar
            activeConversation={activeConversation}
            onSelectConversation={setActiveConversation}
            onNewConversation={handleNewConversation}
          />
        </div>
      </div>
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Chat
          messages={messages}
          loading={loading}
          onSuggestion={handleSend}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
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
  )
}
