"use client";

import { SiteShell } from "@/components/layout/site-shell";
import { apiClient } from "@/lib/api-client";
import { SendHorizonal, MessageSquareMore } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";

interface ConversationSummary {
  other_user_id: number;
  other_user_name: string;
  last_message: string;
  last_message_at: string | null;
  unread_count: number;
}

interface ChatMessage {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  sent_at: string | null;
}

export default function MessagesPage() {
  const currentUser = useAppStore((state) => state.currentUser);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);

  // Fetch conversation inbox on mount
  useEffect(() => {
    async function fetchInbox() {
      setLoadingInbox(true);
      try {
        const res = await apiClient.getConversationInbox();
        const data: ConversationSummary[] = res.data ?? [];
        setConversations(data);
        if (data.length > 0 && selectedUserId === null) {
          setSelectedUserId(data[0].other_user_id);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingInbox(false);
      }
    }
    fetchInbox();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch thread when selected user changes
  const fetchThread = useCallback(async (userId: number) => {
    setLoadingThread(true);
    try {
      const res = await apiClient.getConversation(userId);
      setThreadMessages(res.data ?? []);
      // Mark conversation as read
      await apiClient.markConversationRead(userId).catch(() => {});
      // Update unread count in sidebar
      setConversations((prev) =>
        prev.map((c) => (c.other_user_id === userId ? { ...c, unread_count: 0 } : c))
      );
    } catch {
      setThreadMessages([]);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId !== null) {
      fetchThread(selectedUserId);
    }
  }, [selectedUserId, fetchThread]);

  const handleSend = async () => {
    if (!selectedUserId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    try {
      const res = await apiClient.sendChatMessage({
        receiver_id: selectedUserId,
        message: text,
      });
      const newMsg: ChatMessage = res.data;
      setThreadMessages((prev) => [...prev, newMsg]);
      // Update last message preview in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.other_user_id === selectedUserId
            ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch {
      // restore draft on error
      setDraft(text);
    }
  };

  const selectedContact = useMemo(
    () => conversations.find((c) => c.other_user_id === selectedUserId) ?? null,
    [conversations, selectedUserId]
  );

  const currentUserId = currentUser
    ? (currentUser as any).user_id ?? (currentUser as any).id
    : null;

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-white">Messages</h1>
          <p className="mt-3 text-slate-400">Stay connected with mentors and learners through quick messages.</p>
        </section>

        {!currentUser ? (
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 text-slate-300">
            Log in to view your conversations.
          </div>
        ) : (
          <div className="mt-8 grid min-h-[680px] gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
              <div className="mb-4 flex items-center justify-between px-2 pt-2">
                <h2 className="text-lg font-semibold text-white">Chats</h2>
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
                  <MessageSquareMore className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-3">
                {loadingInbox ? (
                  <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-400">
                    Loading conversations…
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-slate-950/20 p-4 text-sm text-slate-400">
                    No chats yet. Start by messaging a mentor.
                  </div>
                ) : (
                  conversations.map((contact) => (
                    <button
                      key={contact.other_user_id}
                      type="button"
                      onClick={() => setSelectedUserId(contact.other_user_id)}
                      className={`flex w-full items-center gap-3 rounded-[1.25rem] border p-3 text-left transition ${
                        selectedUserId === contact.other_user_id
                          ? "border-cyan-400/30 bg-cyan-400/10"
                          : "border-transparent bg-slate-950/30 hover:border-white/10 hover:bg-slate-950/40"
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-800 text-sm font-semibold text-white">
                        {contact.other_user_name.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate font-medium text-white">{contact.other_user_name}</span>
                          {contact.unread_count > 0 && (
                            <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-[10px] font-semibold text-slate-900">
                              {contact.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm text-slate-400">
                          {contact.last_message || "Start a conversation"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <main className="flex min-h-[680px] flex-col rounded-[1.75rem] border border-white/10 bg-slate-900/70 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
              {selectedContact ? (
                <>
                  <div className="flex items-center gap-4 border-b border-white/10 p-5">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-800 text-sm font-semibold text-white">
                      {selectedContact.other_user_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{selectedContact.other_user_name}</h3>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {loadingThread ? (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        Loading messages…
                      </div>
                    ) : threadMessages.length ? (
                      threadMessages.map((msg) => {
                        const isFromCurrentUser = currentUserId !== null && msg.sender_id === currentUserId;
                        return (
                          <div
                            key={msg.message_id}
                            className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-[1.25rem] px-4 py-3 ${
                                isFromCurrentUser
                                  ? "bg-cyan-500 text-slate-950"
                                  : "bg-slate-800/90 text-white"
                              }`}
                            >
                              <div className="text-sm leading-relaxed">{msg.message}</div>
                              <div
                                className={`mt-2 text-[10px] ${
                                  isFromCurrentUser ? "text-slate-800/70" : "text-slate-400"
                                }`}
                              >
                                {msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-white/10 bg-slate-950/20 p-6 text-slate-400">
                        No messages yet. Send a hello to start the chat.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/10 p-4">
                    <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/40 p-2">
                      <input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={`Message ${selectedContact.other_user_name}...`}
                        className="flex-1 bg-transparent px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!draft.trim()}
                        className="rounded-full bg-cyan-400 p-3 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <SendHorizonal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-slate-400">
                  Select a chat to view the conversation.
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
