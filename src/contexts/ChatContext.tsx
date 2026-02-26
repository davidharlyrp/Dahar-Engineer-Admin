import React, { createContext, useContext, useEffect, useState } from 'react';
import { type MessageRecord } from '../services/api';
import { pb } from '../lib/pb';
import toast from 'react-hot-toast';

interface ChatContextType {
    globalUnreadCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
    const currentUserId = pb.authStore.model?.id;

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
            if (e.action === "create") {
                const newMsg = e.record as MessageRecord;

                // Incoming unread messages
                if (newMsg.sender !== currentUserId && !newMsg.read) {
                    setGlobalUnreadCount(prev => prev + 1);

                    // Show a quick global toast if they're not explicitly ignoring it (or if we had standard window.Notification logic)
                    const senderName = newMsg.expand?.sender?.name || newMsg.expand?.sender?.username || "Someone";
                    const isMedia = newMsg.content === "[Attachment]";

                    toast(`New message from ${senderName}: ${isMedia ? 'Image' : newMsg.content}`, {
                        icon: '',
                        duration: 5000
                    });

                    // Trigger Web Push natively if permission is granted
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification(`New Message from ${senderName}`, {
                            body: isMedia ? 'Image attached' : newMsg.content,
                            icon: '/icon-192x192.png'
                        });
                    }
                }
            } else if (e.action === "update") {
                // If a message we received got marked as read (e.g. from opening Chat.tsx), decrement the counter
                const updatedMsg = e.record as MessageRecord;
                if (updatedMsg.sender !== currentUserId && updatedMsg.read === true) {
                    // It was mark as read
                    // We can't guarantee how many got marked read precisely from just one event update easily without refetch, 
                    // so we do a quick refetch to ensure accuracy
                    pb.collection("messages").getList(1, 1, {
                        filter: `read = false && sender != "${currentUserId}"`,
                        $autoCancel: false
                    }).then(res => setGlobalUnreadCount(res.totalItems)).catch(console.error);
                }
            }
        };

        pb.collection("messages").subscribe("*", handleNewMessage, { expand: "sender" }).catch(console.error);

        return () => {
            pb.collection("messages").unsubscribe("*").catch(console.error);
        };
    }, [currentUserId]);

    return (
        <ChatContext.Provider value={{ globalUnreadCount }}>
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
