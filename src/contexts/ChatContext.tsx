import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { type MessageRecord } from '../services/api';
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

        // Since we are not in Chat.tsx, we track globally just to bump numbers/show toasts
        const handleNewMessage = (e: any) => {
            // Internal logic: Unread count & Notifications
            if (e.action === "create") {
                const newMsg = e.record as MessageRecord;

                // Incoming unread messages
                if (newMsg.sender !== currentUserId && !newMsg.read) {
                    setGlobalUnreadCount(prev => prev + 1);

                    // Show a quick global toast
                    const senderName = newMsg.expand?.sender?.name || newMsg.expand?.sender?.username || "Someone";
                    const isMedia = newMsg.content === "[Attachment]";

                    toast(`New message from ${senderName}: ${isMedia ? 'Image' : newMsg.content}`, {
                        icon: '',
                        duration: 5000
                    });

                    // Trigger Web Push natively
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification(`New Message from ${senderName}`, {
                            body: isMedia ? 'Image attached' : newMsg.content,
                            icon: '/icon-192x192.png'
                        });
                    }
                }
            } else if (e.action === "update") {
                const updatedMsg = e.record as MessageRecord;
                if (updatedMsg.sender !== currentUserId && updatedMsg.read === true) {
                    // Refetch global unread count to stay accurate
                    pb.collection("messages").getList(1, 1, {
                        filter: `read = false && sender != "${currentUserId}"`,
                        $autoCancel: false
                    }).then(res => setGlobalUnreadCount(res.totalItems)).catch(console.error);
                }
            }

            // Distribute to all external listeners
            listenersRef.current.forEach(handler => handler(e));
        };

        // Single shared subscription
        pb.collection("messages").subscribe("*", handleNewMessage, { expand: "sender,conversation.user" }).catch(console.error);

        return () => {
            pb.collection("messages").unsubscribe("*").catch(console.error);
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
