"use client"

import { useState } from "react"
import { Bot, Search, Plus, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types"

const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Debugging API issues",
    lastMessage: "The error was in the middleware...",
    updatedAt: new Date(),
    unread: true,
  },
  {
    id: "2",
    title: "Database migration help",
    lastMessage: "Migration completed successfully",
    updatedAt: new Date(Date.now() - 3600000),
    unread: false,
  },
  {
    id: "3",
    title: "Auth flow implementation",
    lastMessage: "OAuth tokens should be stored...",
    updatedAt: new Date(Date.now() - 86400000),
    unread: false,
  },
  {
    id: "4",
    title: "Performance optimization",
    lastMessage: "Consider using memoization for...",
    updatedAt: new Date(Date.now() - 172800000),
    unread: false,
  },
]

interface SidebarProps {
  activeConversation: string
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
}

export function Sidebar({
  activeConversation,
  onSelectConversation,
  onNewConversation,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = mockConversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative z-10 flex h-full w-72 flex-col border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800/80 px-5 py-4">
        <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/20 ring-1 ring-inset ring-white/10">
          <Bot className="size-[18px] text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-zinc-50">
            AI Support
          </h1>
          <p className="truncate text-[11px] font-medium text-zinc-500">
            Agent Dashboard
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="h-9 border-zinc-800 bg-zinc-900/60 pl-9 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/20"
          />
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-3 pt-3">
        <Button
          onClick={onNewConversation}
          className="h-9 w-full justify-center gap-2 bg-gradient-to-b from-violet-500 to-violet-600 text-[13px] font-medium text-white shadow-lg shadow-violet-500/20 ring-1 ring-inset ring-white/10 hover:from-violet-500 hover:to-violet-500"
        >
          <Plus className="size-4" />
          New Conversation
        </Button>
      </div>

      {/* Section Label */}
      <div className="px-5 pb-1.5 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          Recent
        </p>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-0.5 px-1 pb-3">
          {filteredConversations.map((conversation) => {
            const isActive = activeConversation === conversation.id
            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "group relative flex w-full flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                  isActive
                    ? "bg-zinc-900/80 ring-1 ring-inset ring-zinc-800"
                    : "hover:bg-zinc-900/50"
                )}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-violet-500"
                  />
                )}
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <MessageSquare
                      className={cn(
                        "size-3.5 shrink-0",
                        isActive ? "text-violet-400" : "text-zinc-500"
                      )}
                    />
                    <span
                      className={cn(
                        "truncate text-[13px] font-medium",
                        conversation.unread || isActive
                          ? "text-zinc-50"
                          : "text-zinc-300"
                      )}
                    >
                      {conversation.title}
                    </span>
                  </div>
                  {conversation.unread && (
                    <span className="size-1.5 shrink-0 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  )}
                </div>
                <p className="line-clamp-1 pl-[22px] text-[11.5px] leading-relaxed text-zinc-500">
                  {conversation.lastMessage}
                </p>
                <span className="pl-[22px] text-[10.5px] font-medium text-zinc-600">
                  {formatTime(conversation.updatedAt)}
                </span>
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-zinc-800/80 px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-[11px] font-semibold text-zinc-200 ring-1 ring-inset ring-zinc-700">
            JS
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-zinc-200">
              Jamie Smith
            </p>
            <p className="truncate text-[10.5px] text-zinc-500">
              Pro plan · Online
            </p>
          </div>
          <span className="size-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  )
}
