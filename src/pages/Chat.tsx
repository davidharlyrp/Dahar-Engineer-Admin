import { useEffect, useState, useRef } from "react";
import { Send, Image as ImageIcon, X, User, CheckCheck, Loader2, ArrowLeft, MessageSquare, Trash2 } from "lucide-react";
import { ChatService, UserService, type ConversationRecord, type MessageRecord } from "../services/api";
import { pb } from "../lib/pb";
import { cn } from "../lib/utils";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { useChat } from "../contexts/ChatContext";

export function Chat() {
    const [conversations, setConversations] = useState<ConversationRecord[]>([]);
    const [activeConversation, setActiveConversation] = useState<ConversationRecord | null>(null);
    const [messages, setMessages] = useState<MessageRecord[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [latestMessages, setLatestMessages] = useState<Record<string, MessageRecord>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activeConversationRef = useRef<ConversationRecord | null>(null);
    const { subscribeToMessages } = useChat();
    const currentUserId = pb.authStore.model?.id;

    const fetchConversations = async () => {
        try {
            const result = await ChatService.getConversations(1, 50);
            setConversations(result.items);
            setIsLoadingConversations(false);

            // Fetch latest messages for each conversation
            const newLatest: Record<string, MessageRecord> = {};
            await Promise.all(result.items.map(async (conv) => {
                const msg = await ChatService.getLatestMessage(conv.id);
                if (msg) newLatest[conv.id] = msg;
            }));
            setLatestMessages(prev => ({ ...prev, ...newLatest }));
        } catch (error) {
            console.error("Error fetching conversations", error);
            setIsLoadingConversations(false);
        }
    };

    // Load Messages for active conversation
    const fetchMessages = async (convId: string, silent = false) => {
        if (!silent) setIsLoadingMessages(true);
        try {
            const msgs = await ChatService.getMessages(convId);
            setMessages(msgs);
        } catch (error) {
            console.error("Error fetching messages", error);
        } finally {
            setIsLoadingMessages(false);
            // Wait for React to render the messages into the DOM before instantly scrolling
            if (!silent) {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                }, 50);
            }
        }
    };

    // Fetch Initial Unread Counts
    const fetchUnreadCounts = async () => {
        try {
            const unreadMsgs = await ChatService.getUnreadMessages();
            const counts: Record<string, number> = {};
            unreadMsgs.forEach(msg => {
                counts[msg.conversation] = (counts[msg.conversation] || 0) + 1;
            });
            setUnreadCounts(counts);
        } catch (error) {
            console.error("Error fetching unread counts", error);
        }
    };

    useEffect(() => {
        fetchConversations();
        fetchUnreadCounts();

        let pollingInterval: ReturnType<typeof setInterval>;

        const syncChatData = async () => {
            fetchConversations();
            fetchUnreadCounts();

            if (activeConversationRef.current) {
                const currentRoomId = activeConversationRef.current.id;

                setMessages(currentMessages => {
                    const performDeltaSync = async () => {
                        if (currentMessages.length > 0) {
                            const lastMsgDate = currentMessages[currentMessages.length - 1].created;
                            const newMsgs = await ChatService.getMessagesSince(currentRoomId, lastMsgDate);

                            if (newMsgs.length > 0) {
                                setMessages(prev => {
                                    const existingIds = new Set(prev.map(m => m.id));
                                    const uniqueNewMsgs = newMsgs.filter(m => !existingIds.has(m.id));
                                    if (uniqueNewMsgs.length === 0) return prev;
                                    return [...prev, ...uniqueNewMsgs];
                                });
                                ChatService.markAsRead(currentRoomId);
                                setTimeout(() => {
                                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                                }, 100);
                            }
                        } else {
                            fetchMessages(currentRoomId, true);
                        }
                    };

                    performDeltaSync();
                    return currentMessages;
                });
            }
        };

        pollingInterval = setInterval(() => {
            syncChatData();
        }, 3000);

        const handleReconnect = () => {
            syncChatData();
        };

        window.addEventListener("focus", handleReconnect);
        window.addEventListener("online", handleReconnect);

        const unsubscribeGlobal = subscribeToMessages((e) => {
            if (e.action === "create") {
                const newMsg = e.record as MessageRecord;
                setLatestMessages(prev => ({ ...prev, [newMsg.conversation]: newMsg }));

                if (activeConversationRef.current?.id === newMsg.conversation) {
                    setMessages(prev => {
                        const exists = prev.some(m => m.id === newMsg.id);
                        if (exists) return prev;
                        return [...prev, newMsg];
                    });
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 100);

                    if (newMsg.sender !== currentUserId) {
                        ChatService.markAsRead(activeConversationRef.current.id);
                    }
                }
            }
        });

        return () => {
            clearInterval(pollingInterval);
            unsubscribeGlobal();
            window.removeEventListener("focus", handleReconnect);
            window.removeEventListener("online", handleReconnect);
        };
    }, []);

    // Sync activeConversation to Ref and fetch its messages
    useEffect(() => {
        activeConversationRef.current = activeConversation;

        if (activeConversation) {
            fetchMessages(activeConversation.id);

            setUnreadCounts(prev => ({ ...prev, [activeConversation.id]: 0 }));
            ChatService.markAsRead(activeConversation.id);
        }
    }, [activeConversation]);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        }, 100);
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!activeConversation || (!newMessage.trim() && !attachment)) return;

        setIsSending(true);
        try {
            let sentMsg;
            if (attachment) {
                const formData = new FormData();
                formData.append("conversation", activeConversation.id);
                formData.append("content", newMessage.trim() || "[Attachment]");
                formData.append("attachment", attachment);
                formData.append("sender", currentUserId || "");

                sentMsg = await ChatService.sendMessage(formData);
            } else {
                sentMsg = await ChatService.sendMessage({
                    conversation: activeConversation.id,
                    content: newMessage.trim(),
                    sender: currentUserId,
                    read: false
                });
            }

            if (sentMsg) {
                setMessages(prev => {
                    if (prev.find(m => m.id === sentMsg.id)) return prev;
                    return [...prev, sentMsg];
                });
                scrollToBottom();
            }

            setNewMessage("");
            setAttachment(null);
            setAttachmentPreview(null);
        } catch (error) {
            console.error("Error sending message", error);
            alert("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) return;

        try {
            await ChatService.deleteConversation(conversationId);
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (activeConversationRef.current?.id === conversationId) {
                setActiveConversation(null);
                setMessages([]);
            }
        } catch (error) {
            console.error("Error deleting conversation", error);
            alert("Failed to delete conversation");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                alert("Only image files are allowed.");
                return;
            }
            setAttachment(file);
            const objectUrl = URL.createObjectURL(file);
            setAttachmentPreview(objectUrl);
        }
    };

    const removeAttachment = () => {
        setAttachment(null);
        if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
        setAttachmentPreview(null);
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-8rem)] bg-secondary border border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex flex-1 h-full overflow-hidden">

                {/* Conversations Sidebar (Left Pane) */}
                <div className={cn(
                    "w-full sm:w-80 flex-shrink-0 border-r border-white/5 flex flex-col bg-secondary transition-all",
                    activeConversation ? "hidden sm:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <h2 className="text-lg font-bold text-white">Messages</h2>
                        <span className="text-xs font-medium px-2 py-1 bg-white/5 text-white/40 rounded-full">
                            {conversations.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoadingConversations ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-white/40 text-sm">
                                No conversations yet
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {conversations.map(conv => {
                                    const user = conv.expand?.user;
                                    const isActive = activeConversation?.id === conv.id;

                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => setActiveConversation(conv)}
                                            className={cn(
                                                "group w-full text-left p-4 hover:bg-white/[0.02] transition-colors flex items-center gap-3",
                                                isActive && "bg-white/[0.04] border-l-2 border-l-army-400"
                                            )}
                                        >
                                            <div className="relative">
                                                {user?.avatar ? (
                                                    <img src={UserService.getAvatarUrl(user, "100x100") || ""} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-white/40" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h3 className="text-sm font-semibold text-white truncate pr-2">
                                                        {user ? UserService.getDisplayName(user) : "Anonymous User"}
                                                    </h3>
                                                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                                                        {unreadCounts[conv.id] > 0 && (
                                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                                                                {unreadCounts[conv.id]}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-white/30">
                                                            {formatDistanceToNow(new Date(conv.updated), { addSuffix: true }).replace("about ", "")}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleDeleteConversation(e, conv.id)}
                                                            className="p-1.5 text-white/30 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 rounded transition-all focus:opacity-100"
                                                            title="Delete Conversation"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-[11px] text-white/40 truncate min-h-[16px]">
                                                    {(() => {
                                                        const latest = latestMessages[conv.id];
                                                        if (!latest) return "No messages yet";

                                                        const isMine = latest.sender === currentUserId;
                                                        const senderPrefix = isMine ? "You: " : "User: ";
                                                        const textPreview = latest.content === "[Attachment]" ? "📷 Image Attached" : latest.content;

                                                        return (
                                                            <span className={cn(
                                                                "flex items-center gap-1",
                                                                !isMine && unreadCounts[conv.id] > 0 ? "text-white font-semibold" : ""
                                                            )}>
                                                                <span className={isMine ? "text-white/30" : "text-white/50 font-medium"}>{senderPrefix}</span>
                                                                <span className="truncate">{textPreview}</span>
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Chat Room (Right Pane) */}
                <div className={cn(
                    "flex-1 flex flex-col min-w-0 bg-secondary transition-all",
                    !activeConversation ? "hidden sm:flex" : "flex"
                )}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.02] shrink-0">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="p-2 -ml-2 text-white/40 hover:text-white sm:hidden"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-3">
                                    {activeConversation.expand?.user?.avatar ? (
                                        <img src={UserService.getAvatarUrl(activeConversation.expand.user, "100x100") || ""} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                            <User className="w-5 h-5 text-white/40" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            {activeConversation.expand?.user ? UserService.getDisplayName(activeConversation.expand.user) : "Anonymous User"}
                                        </h3>
                                        <p className="text-xs text-white/40">
                                            {activeConversation.expand?.user?.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                                {isLoadingMessages ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-white/30">
                                        <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="text-sm">No messages yet. Say hello!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMine = msg.sender === currentUserId;
                                        const showAvatar = !isMine && (index === 0 || messages[index - 1]?.sender !== msg.sender);
                                        const attachmentUrl = ChatService.getAttachmentUrl(msg);

                                        // Date divider logic
                                        const messageDate = new Date(msg.created);
                                        const prevMessageDate = index > 0 ? new Date(messages[index - 1].created) : null;
                                        const showDateDivider = !prevMessageDate ||
                                            messageDate.toLocaleDateString() !== prevMessageDate.toLocaleDateString();

                                        const getDateLabel = (date: Date) => {
                                            if (isToday(date)) return "Today";
                                            if (isYesterday(date)) return "Yesterday";
                                            return format(date, "MMMM d, yyyy");
                                        };

                                        return (
                                            <div key={msg.id}>
                                                {showDateDivider && (
                                                    <div className="flex items-center gap-4 my-8 first:mt-2">
                                                        <div className="flex-1 h-px bg-white/5" />
                                                        <span className="text-[11px] font-medium text-white/30 whitespace-nowrap">
                                                            {getDateLabel(messageDate)}
                                                        </span>
                                                        <div className="flex-1 h-px bg-white/5" />
                                                    </div>
                                                )}
                                                <div className={cn("flex w-full gap-2", isMine ? "justify-end" : "justify-start")}>
                                                    {!isMine && (
                                                        <div className="w-8 flex-shrink-0">
                                                            {showAvatar && (
                                                                msg.expand?.sender?.avatar ? (
                                                                    <img src={UserService.getAvatarUrl(msg.expand.sender, "100x100") || ""} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                                                        <User className="w-4 h-4 text-white/40" />
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className={cn(
                                                        "max-w-[75%] sm:max-w-[65%] flex flex-col gap-1",
                                                        isMine ? "items-end" : "items-start"
                                                    )}>
                                                        <div className={cn(
                                                            "px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words",
                                                            isMine
                                                                ? "bg-army-600 text-white rounded-tr-sm"
                                                                : "bg-white/[0.04] text-white border border-white/5 rounded-tl-sm shadow-sm"
                                                        )}>
                                                            {attachmentUrl && (
                                                                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className={cn("block", msg.content && msg.content !== "[Attachment]" && "mb-2")}>
                                                                    <img src={attachmentUrl} alt="Attachment" className="rounded-lg max-h-60 object-contain" />
                                                                </a>
                                                            )}
                                                            {msg.content && msg.content !== "[Attachment]" && msg.content}
                                                        </div>

                                                        <div className="flex items-center gap-1 text-[10px] text-white/30 px-1">
                                                            <span>{new Date(msg.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            {isMine && (
                                                                msg.read ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <CheckCheck className="w-3 h-3 opacity-50" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 bg-secondary border-t border-white/5 shrink-0">
                                {attachmentPreview && (
                                    <div className="mb-3 relative inline-block group">
                                        <img src={attachmentPreview} alt="Preview" className="h-20 rounded-lg border border-white/10 object-cover" />
                                        <button
                                            onClick={removeAttachment}
                                            className="absolute -top-2 -right-2 bg-white text-black rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSend} className="flex items-end gap-2">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="chat-attachment"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <label
                                            htmlFor="chat-attachment"
                                            className="cursor-pointer p-3 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center shrink-0"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                        </label>
                                    </div>

                                    <div className="flex-1 min-h-[48px] bg-black/40 rounded-xl px-4 py-3 border border-white/10 focus-within:border-army-500/40 transition-colors flex items-center">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Type a message..."
                                            className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm text-white max-h-32 m-0 p-0 overflow-y-auto placeholder:text-white/30"
                                            rows={1}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSending || (!newMessage.trim() && !attachment)}
                                        className="p-3 rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center"
                                    >
                                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/30 p-8 text-center bg-black/20">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold text-white mb-2">No Conversation Selected</h3>
                            <p className="text-sm max-w-sm">
                                Choose a conversation from the sidebar to view messages and respond to users in real-time.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
