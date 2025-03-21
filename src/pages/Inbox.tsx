
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/AuthProvider"
import { MessageList } from "@/components/inbox/MessageList"
import { MessagePreview } from "@/components/inbox/MessagePreview"
import { InboxToolbar } from "@/components/inbox/InboxToolbar"
import { Message } from "@/types/inbox"

export default function Inbox() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [view, setView] = useState<"received" | "sent">("received")
  const queryClient = useQueryClient()
  const { session } = useAuth()

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", view],
    queryFn: async () => {
      const query = supabase
        .from("messages")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })

      // Filter based on view
      if (view === "received") {
        query.eq("recipient_id", session?.user.id)
      } else {
        query.eq("sender_id", session?.user.id)
      }

      const { data, error } = await query

      if (error) {
        toast.error("Failed to load messages")
        throw error
      }

      return data as Message[]
    },
    enabled: !!session?.user.id,
  })

  // Update message (read/starred status)
  const updateMessageMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Message>
    }) => {
      const { error } = await supabase
        .from("messages")
        .update(updates)
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] })
    },
    onError: () => {
      toast.error("Failed to update message")
    },
  })

  // Handle message selection
  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message)
    if (!message.is_read && message.recipient_id === session?.user.id) {
      updateMessageMutation.mutate({
        id: message.id,
        updates: { is_read: true },
      })
    }
  }

  // Toggle starred status
  const toggleStarred = async (message: Message) => {
    updateMessageMutation.mutate({
      id: message.id,
      updates: { is_starred: !message.is_starred },
    })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "long" })
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      })
    }
  }

  if (!session) {
    return (
      <div className="container py-6 text-center">
        Please sign in to view your messages
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-[1400px]">
      <div className="flex flex-col space-y-4">
        <InboxToolbar
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ["messages"] })}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          view={view}
          onViewChange={setView}
        />

        <div className="grid grid-cols-[350px,1fr] gap-4">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            selectedMessage={selectedMessage}
            searchQuery={searchQuery}
            onMessageClick={handleMessageClick}
            onToggleStarred={toggleStarred}
            formatDate={formatDate}
          />
          <MessagePreview
            message={selectedMessage}
            onToggleStarred={toggleStarred}
          />
        </div>
      </div>
    </div>
  )
}
