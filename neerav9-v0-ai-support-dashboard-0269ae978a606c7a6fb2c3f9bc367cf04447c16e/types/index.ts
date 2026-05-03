export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

export type ToolCall = {
  id: string
  name: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  status: "success" | "error" | "loading"
}

export type Conversation = {
  id: string
  title: string
  lastMessage: string
  updatedAt: Date
  unread: boolean
}
