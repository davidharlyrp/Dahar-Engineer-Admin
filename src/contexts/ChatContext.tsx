import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { pb } from '../lib/pb';
import toast from 'react-hot-toast';

interface ChatContextType {
    globalUnreadCount: number;
    subscribeToMessages: (handler: (e: any) => void) => () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
    const listenersRef = useRef<((e: any) => void)[]>([]);
    const currentUserId = pb.authStore.model?.id;

    const subscribeToMessages = (handler: (e: any) => void) => {
        listenersRef.current.push(handler);
        return () => {
            listenersRef.current = listenersRef.current.filter(h => h !== handler);
        };
    };

    // Initial fetch of unread count
    useEffect(() => {
        if (!currentUserId) return;

        const fetchInitCount = async () => {
            try {
                // To get total unread count quickly
                const unreadMsgs = await pb.collection("messages").getList(1, 1, {
                    filter: `read = false && sender != "${currentUserId}"`,
                    $autoCancel: false
                });
                setGlobalUnreadCount(unreadMsgs.totalItems);
            } catch (err) {
                console.error("Failed to fetch initial global unread count:", err);
            }
        };

        fetchInitCount();
    }, [currentUserId]);

    // Setup global subscriptions just for unread counts & toast push notifications
    useEffect(() => {
        if (!currentUserId) return;

        let pollingInterval: ReturnType<typeof setInterval>;
        let lastSeenMessageIds = new Set<string>();

        // We use polling exclusively now for 100% rock-solid reliability
        const performPolling = async () => {
            try {
                // 1. Fetch unread counts globally
                const unreadRes = await pb.collection("messages").getList(1, 50, {
                    filter: `read = false && sender != "${currentUserId}"`,
                    sort: "-created",
                    expand: "sender,conversation.user",
                    $autoCancel: false // crucial to prevent overlapping requests killing each other
                });

                setGlobalUnreadCount(unreadRes.totalItems);

                // 2. Diff and Trigger Notifications/Callbacks
                const currentUnreadIds = new Set<string>();

                for (const record of unreadRes.items) {
                    currentUnreadIds.add(record.id);

                    // If it's a completely new unread message we haven't seen yet in this session
                    if (!lastSeenMessageIds.has(record.id)) {
                        lastSeenMessageIds.add(record.id);

                        // Fire fake "create" event to all listeners (Chat.tsx) so it appends immediately
                        listenersRef.current.forEach(handler => handler({
                            action: "create",
                            record: record
                        }));

                        // Fire Global Toast notification
                        const senderName = record.expand?.sender?.name || record.expand?.sender?.username || "Someone";
                        const isMedia = record.content === "[Attachment]";

                        toast(`New message from ${senderName}: ${isMedia ? 'Image' : record.content}`, {
                            icon: '',
                            duration: 5000
                        });

                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification(`New Message from ${senderName}`, {
                                body: isMedia ? 'Image attached' : record.content,
                                icon: '/icon-192x192.png'
                            });
                        }
                    }
                }

                // Prune the last seen IDs so we don't hold them forever if they got read
                lastSeenMessageIds = new Set([...lastSeenMessageIds].filter(id => currentUnreadIds.has(id)));

            } catch (err) {
                // Silent fail on network errors during polling
            }
        };

        // 1. Initial connect
        performPolling();

        // 2. Aggressive Polling (Every 3s) for guaranteed "real-time" feel without SSE drops
        pollingInterval = setInterval(() => {
            performPolling();
        }, 2000);

        // 3. Instant fetch on Window Focus
        const handleFocus = () => {
            performPolling();
        };

        window.addEventListener("focus", handleFocus);
        window.addEventListener("online", handleFocus);

        return () => {
            clearInterval(pollingInterval);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("online", handleFocus);
        };
    }, [currentUserId]);

    return (
        <ChatContext.Provider value={{ globalUnreadCount, subscribeToMessages }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
