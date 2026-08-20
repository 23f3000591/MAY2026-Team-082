"use client";

import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { SendHorizonal, MessageSquareMore } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function MessagesPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);
  const messages = useAppStore((state) => state.messages);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const markMessageRead = useAppStore((state) => state.markMessageRead);

  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const contacts = useMemo(() => {
    if (!currentUser) return [];

    const uniqueIds = new Set<string>();
    messages.forEach((message) => {
      if (message.fromId === currentUser.id) uniqueIds.add(message.toId);
      if (message.toId === currentUser.id) uniqueIds.add(message.fromId);
    });

    return [...uniqueIds]
      .map((id) => users.find((user) => user.id === id))
      .filter((user): user is NonNullable<typeof user> => Boolean(user));
  }, [currentUser, messages, users]);

  useEffect(() => {
    if (!contacts.length) {
      setSelectedContactId(null);
      return;
    }

    if (!selectedContactId || !contacts.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(contacts[0].id);
    }
  }, [contacts, selectedContactId]);

  useEffect(() => {
    if (!currentUser || !selectedContactId) return;

    messages
      .filter((message) => message.fromId === selectedContactId && message.toId === currentUser.id && !message.read)
      .forEach((message) => markMessageRead(message.id));
  }, [currentUser, selectedContactId, messages, markMessageRead]);

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId) ?? null;

  const threadMessages = useMemo(() => {
    if (!currentUser || !selectedContactId) return [];

    return messages
      .filter(
        (message) =>
          (message.fromId === currentUser.id && message.toId === selectedContactId) ||
          (message.fromId === selectedContactId && message.toId === currentUser.id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [currentUser, selectedContactId, messages]);

  const handleSend = () => {
    if (!currentUser || !selectedContactId || !draft.trim()) return;

    sendMessage({
      fromId: currentUser.id,
      toId: selectedContactId,
      content: draft.trim(),
    });

    setDraft("");
  };

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
                {contacts.map((contact) => {
                  const latestMessage = [...messages]
                    .reverse()
                    .find(
                      (message) =>
                        (message.fromId === contact.id && message.toId === currentUser.id) ||
                        (message.fromId === currentUser.id && message.toId === contact.id)
                    );

                  const unreadCount = messages.filter(
                    (message) => message.fromId === contact.id && message.toId === currentUser.id && !message.read
                  ).length;

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`flex w-full items-center gap-3 rounded-[1.25rem] border p-3 text-left transition ${
                        selectedContactId === contact.id
                          ? "border-cyan-400/30 bg-cyan-400/10"
                          : "border-transparent bg-slate-950/30 hover:border-white/10 hover:bg-slate-950/40"
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-800 text-sm font-semibold text-white">
                        {contact.name.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate font-medium text-white">{contact.name}</span>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-[10px] font-semibold text-slate-900">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm text-slate-400">
                          {latestMessage ? latestMessage.content : "Start a conversation"}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {!contacts.length && (
                  <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-slate-950/20 p-4 text-sm text-slate-400">
                    No chats yet. Start by messaging a mentor.
                  </div>
                )}
              </div>
            </aside>

            <main className="flex min-h-[680px] flex-col rounded-[1.75rem] border border-white/10 bg-slate-900/70 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
              {selectedContact ? (
                <>
                  <div className="flex items-center gap-4 border-b border-white/10 p-5">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-800 text-sm font-semibold text-white">
                      {selectedContact.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{selectedContact.name}</h3>
                      <p className="text-sm text-emerald-400">Online</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {threadMessages.length ? (
                      threadMessages.map((message) => {
                        const isFromCurrentUser = message.fromId === currentUser.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-[1.25rem] px-4 py-3 ${
                                isFromCurrentUser
                                  ? "bg-cyan-500 text-slate-950"
                                  : "bg-slate-800/90 text-white"
                              }`}
                            >
                              <div className="text-sm leading-relaxed">{message.content}</div>
                              <div
                                className={`mt-2 text-[10px] ${
                                  isFromCurrentUser ? "text-slate-800/70" : "text-slate-400"
                                }`}
                              >
                                {new Date(message.createdAt).toLocaleString()}
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
                        placeholder={`Message ${selectedContact.name}...`}
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
