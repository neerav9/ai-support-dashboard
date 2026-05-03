"use client"

import { useState } from "react"
import {
  Bot,
  Search,
  Plus,
  MessageSquare,
  Trash2,
  MessageSquarePlus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types"

interface SidebarProps {
  conversations: Conversation[]
  activeConversation: string
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation?: (id: string) => void
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (seconds < 30) return "Just now"
  if (minutes < 1) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function Sidebar({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const q = searchQuery.trim().toLowerCase()
  const filteredConversations = q
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
      )
    : conversations

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
      <div className="flex items-center justify-between px-5 pb-1.5 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          Recent
        </p>
        <span className="font-mono text-[10px] font-medium text-zinc-600">
          {conversations.length}
        </span>
      </div>

      {/* Conversation List */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700/60 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-600 [&::-webkit-scrollbar-track]:bg-transparent">
        {conversations.length === 0 ? (
          <EmptyConversations onNewConversation={onNewConversation} />
        ) : filteredConversations.length === 0 ? (
          <NoSearchResults query={searchQuery} />
        ) : (
          <div className="flex flex-col gap-0.5 px-1 pb-3">
            {filteredConversations.map((conversation) => {
              const isActive = activeConversation === conversation.id
              const isEmpty =
                !conversation.lastMessage &&
                conversation.title === "New conversation"

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group/row relative flex w-full items-stretch rounded-lg transition-all duration-200",
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

                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className="group flex min-w-0 flex-1 flex-col items-start gap-1 px-3 py-2.5 text-left"
                  >
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
                      {conversation.unread && !isActive && (
                        <span
                          aria-label="Unread"
                          className="size-1.5 shrink-0 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                        />
                      )}
                    </div>
                    <p
                      className={cn(
                        "line-clamp-1 pl-[22px] text-[11.5px] leading-relaxed",
                        isEmpty ? "italic text-zinc-600" : "text-zinc-500"
                      )}
                    >
                      {isEmpty
                        ? "No messages yet"
                        : conversation.lastMessage || "—"}
                    </p>
                    <span className="pl-[22px] text-[10.5px] font-medium text-zinc-600">
                      {formatTime(conversation.updatedAt)}
                    </span>
                  </button>

                  {onDeleteConversation && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conversation.id)
                      }}
                      aria-label={`Delete ${conversation.title}`}
                      className="mr-1 flex size-7 shrink-0 items-center justify-center self-center rounded-md text-zinc-500 opacity-0 transition-all hover:bg-zinc-800 hover:text-red-400 focus-visible:opacity-100 group-hover/row:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

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

function EmptyConversations({
  onNewConversation,
}: {
  onNewConversation: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
        <MessageSquarePlus className="size-4 text-zinc-500" />
      </div>
      <div>
        <p className="text-[12.5px] font-medium text-zinc-200">
          No conversations yet
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Start a new chat to debug, query data, or look up issues.
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={onNewConversation}
        className="h-7 gap-1.5 bg-zinc-800 text-[11.5px] text-zinc-100 hover:bg-zinc-700"
      >
        <Plus className="size-3.5" />
        Start chat
      </Button>
    </div>
  )
}

function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <Search className="size-4 text-zinc-600" />
      <p className="text-[12px] font-medium text-zinc-300">No matches</p>
      <p className="text-[11px] leading-relaxed text-zinc-500">
        Nothing found for{" "}
        <span className="font-mono text-zinc-400">&ldquo;{query}&rdquo;</span>
      </p>
    </div>
  )
}
