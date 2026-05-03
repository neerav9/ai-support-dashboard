"use client"

import { useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface InputBarProps {
  value: string
  onChange: (value: string) => void
  onSend: (overrideText?: string) => void
  loading: boolean
}

export function InputBar({ value, onChange, onSend, loading }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!loading && value.trim()) {
        onSend()
      }
    }
  }

  return (
    <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950/60 px-6 py-4 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-3xl">
        <div className="group relative flex items-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-2 shadow-xl shadow-black/30 backdrop-blur-sm transition-colors focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/10">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Support…"
            disabled={loading}
            className="min-h-[44px] max-h-[200px] flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus-visible:border-0 focus-visible:ring-0 shadow-none"
            rows={1}
          />
          <Button
            onClick={onSend}
            disabled={loading || !value.trim()}
            size="icon"
            className="size-9 shrink-0 rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/20 ring-1 ring-inset ring-white/10 transition-all hover:from-violet-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:shadow-none disabled:ring-zinc-700"
          >
            {loading ? (
              <Spinner className="size-4" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-zinc-500">
          <p>
            Press{" "}
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 font-mono text-[10px] text-zinc-300">
              Enter
            </kbd>{" "}
            to send,{" "}
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 font-mono text-[10px] text-zinc-300">
              Shift + Enter
            </kbd>{" "}
            for new line
          </p>
          <p className="hidden items-center gap-1.5 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </p>
        </div>
      </div>
    </div>
  )
}
