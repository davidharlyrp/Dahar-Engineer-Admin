import { useState, useEffect, useRef } from 'react';
import { pb } from '../lib/pb';
import {
    UserService, CourseService, ProductPaymentService,
    RevitFileService,
    ResourceService, TerraSimService, BlogCommentService, ReviewService
} from '../services/api';

export type NotificationType = 'user' | 'course' | 'payment' | 'activity' | 'file' | 'feedback' | 'comment' | 'review';

export interface NotificationItem {
    id: string;
    date: Date;
    text: string;
    type: NotificationType;
    isNew: boolean;
}

export function useRealtimeNotifications() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Auto-open trigger state
    const [autoOpenTrigger, setAutoOpenTrigger] = useState(0);

    // To play sound
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('/notification/notification.wav');

        // Request Web Notification permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const playSoundAndTriggerOpen = (text: string) => {
        setAutoOpenTrigger(prev => prev + 1);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            // Catch error if user hasn't interacted with document yet
            audioRef.current.play().catch(e => console.log("Audio play prevented by browser:", e));
        }

        // Native Browser OS Notification (existing)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification("Dahar Engineer", {
                body: text,
                icon: '/Logo.png'
            });
        }
    };

    // Helper for VAPID push manager
    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    // Push Subscription Logic
    const subscribeToPush = async () => {
        console.log("Attempting to subscribe to push...");
        if (!('serviceWorker' in navigator)) {
            console.warn("ServiceWorker is not supported in this browser.");
            return;
        }
        if (!('PushManager' in window)) {
            console.warn("Push API is not supported in this browser.");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            console.log("Service Worker is ready:", registration);

            const publicVapidKey = "BBf-IIYJJQqTfQRkyjUuF6OtKqAaVhIo51F7WPunPHvH1ss-ByuIPKzXLa3ralKeW7QlqFqm6S1dJ6NW0j5X1Fc";

            // Check existing subscription first
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                console.log("No existing subscription found. Requesting new one...");
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                });
            }

            const subJSON = subscription.toJSON();
            console.log("Push Subscription Object generated/retrieved:", subJSON);

            if (pb.authStore.model) {
                console.log("Saving subscription directly to pocketbase for user:", pb.authStore.model.id);
                // Cek dulu apakah token yang sama sudah ada biar ga error unik (p256dh atau endpoint)
                const existing = await pb.collection('push_subscriptions').getList(1, 1, {
                    filter: `endpoint = '${subJSON.endpoint}'`
                });

                if (existing.totalItems === 0) {
                    await pb.collection('push_subscriptions').create({
                        user: pb.authStore.model.id,
                        endpoint: subJSON.endpoint,
                        p256dh: subJSON.keys?.p256dh,
                        auth: subJSON.keys?.auth
                    });
                    console.log("Subscription saved to database!");
                    alert("Berhasil mendaftar notifikasi Push!");
                } else {
                    console.log("Subscription already exists in database.");
                }
            } else {
                console.warn("User is not logged in. Cannot save subscription to DB.");
                alert("Gagal menyimpan: Anda belum login.");
            }

        } catch (error: any) {
            console.error("Failed to subscribe to push", error);
            alert(`Push Subscription Failed: ${error.message}`);
        }
    };

    // Load initial data & set up subscriptions
    useEffect(() => {
        let isMounted = true;

        const setup = async () => {
            if (!pb.authStore.model) return;

            // 1. Get last read time
            const userLastReadStr = (pb.authStore.model as any).last_notification_read;
            const currentLastRead = userLastReadStr ? new Date(userLastReadStr) : new Date(0);

            // 2. Fetch initial recent items (simplified from Dashboard for speed)
            try {
                const [
                    usersRes, coursesRes, paymentsRes,
                    terrasimRunsRes, terrasimFeedbackRes,
                    revitRes, resourcesRes, commentsRes, reviewsRes
                ] = await Promise.allSettled([
                    UserService.getUsers(1, 5),
                    CourseService.getBookings(1, 5),
                    ProductPaymentService.getPayments(1, 5),
                    TerraSimService.getRunningHistory(1, 5),
                    TerraSimService.getFeedback(1, 5),
                    RevitFileService.getRevitFiles(1, 5),
                    ResourceService.getResources(1, 5),
                    BlogCommentService.getComments(1, 5),
                    ReviewService.getReviews(1, 5)
                ]);

                if (!isMounted) return;

                let initialItems: NotificationItem[] = [];

                if (usersRes.status === "fulfilled") {
                    usersRes.value.items.forEach(user => initialItems.push({
                        id: `user-${user.id}`, date: new Date(user.created), type: 'user',
                        text: `${user.name || user.email || "Someone"} registered as a new user.`,
                        isNew: new Date(user.created) > currentLastRead
                    }));
                }

                if (coursesRes.status === "fulfilled") {
                    coursesRes.value.items.forEach(booking => initialItems.push({
                        id: `booking-${booking.id}`, date: new Date(booking.created), type: 'course',
                        text: `${booking.full_name} booked "${booking.course_title}" session.`,
                        isNew: new Date(booking.created) > currentLastRead
                    }));
                }

                if (paymentsRes.status === "fulfilled") {
                    paymentsRes.value.items.forEach(payment => initialItems.push({
                        id: `payment-${payment.id}`, date: new Date(payment.payment_date || payment.created), type: 'payment',
                        text: `Payment of Rp ${payment.final_amount.toLocaleString()} received for ${payment.product_name}.`,
                        isNew: new Date(payment.payment_date || payment.created) > currentLastRead
                    }));
                }

                if (terrasimRunsRes.status === "fulfilled") {
                    terrasimRunsRes.value.items.forEach(run => initialItems.push({
                        id: `terrasim-run-${run.id}`, date: new Date(run.created), type: 'activity',
                        text: `${run.expand?.user_id?.name || "A user"} ran a TerraSim analysis.`,
                        isNew: new Date(run.created) > currentLastRead
                    }));
                }

                if (terrasimFeedbackRes.status === "fulfilled") {
                    terrasimFeedbackRes.value.items.forEach(feedback => initialItems.push({
                        id: `ts-feedback-${feedback.id}`, date: new Date(feedback.created), type: 'feedback',
                        text: `${feedback.expand?.user?.name || "A user"} submitted TerraSim feedback.`,
                        isNew: new Date(feedback.created) > currentLastRead
                    }));
                }

                if (revitRes.status === "fulfilled") {
                    revitRes.value.items.forEach(file => initialItems.push({
                        id: `revit-${file.id}`, date: new Date(file.created), type: 'file',
                        text: `New Revit file uploaded: ${file.display_name}.`,
                        isNew: new Date(file.created) > currentLastRead
                    }));
                }

                if (resourcesRes.status === "fulfilled") {
                    resourcesRes.value.items.forEach(res => initialItems.push({
                        id: `resource-${res.id}`, date: new Date(res.created), type: 'file',
                        text: `New Resource uploaded: ${res.title}.`,
                        isNew: new Date(res.created) > currentLastRead
                    }));
                }

                if (commentsRes.status === "fulfilled") {
                    commentsRes.value.items.forEach(comment => initialItems.push({
                        id: `comment-${comment.id}`, date: new Date(comment.created), type: 'comment',
                        text: `${comment.expand?.user_id?.name || "A user"} commented on a blog post.`,
                        isNew: new Date(comment.created) > currentLastRead
                    }));
                }

                if (reviewsRes.status === "fulfilled") {
                    reviewsRes.value.items.forEach(review => initialItems.push({
                        id: `review-${review.id}`, date: new Date(review.created), type: 'review',
                        text: `A ${review.rating}-star review was submitted.`,
                        isNew: new Date(review.created) > currentLastRead
                    }));
                }

                // Sort descending
                initialItems.sort((a, b) => b.date.getTime() - a.date.getTime());
                const finalItems = initialItems.slice(0, 30);
                setNotifications(finalItems);
                setUnreadCount(finalItems.filter(i => i.isNew).length);
            } catch (err) {
                console.error("Error fetching initial notifications", err);
            }

            // 3. Setup Subscriptions
            const setupSubscriptions = async () => {
                const handleRealtimeEvent = (type: NotificationType, text: string, record: any) => {
                    const date = new Date(record.created);
                    if (isMounted) {
                        setNotifications(prev => {
                            const newId = `${type}-${record.id}`;
                            // Avoid duplicates
                            if (prev.find(n => n.id === newId)) return prev;

                            const newItem: NotificationItem = {
                                id: newId,
                                date,
                                text,
                                type,
                                isNew: true
                            };
                            return [newItem, ...prev].slice(0, 30);
                        });

                        setUnreadCount(prev => prev + 1);
                        playSoundAndTriggerOpen(text);
                    }
                };

                const subscribe = (collection: string, type: NotificationType, textMapper: (record: any) => string) => {
                    pb.collection(collection).subscribe('*', function (e) {
                        if (e.action === 'create') {
                            handleRealtimeEvent(type, textMapper(e.record), e.record);
                        }
                    }).catch(console.error);
                };

                subscribe('users', 'user', (r) => `${r.name || r.email || "Someone"} registered as a new user.`);
                subscribe('bookings', 'course', (r) => `${r.full_name || "Someone"} booked "${r.course_title}" session.`);
                subscribe('product_payments', 'payment', (r) => `Payment of Rp ${r.final_amount?.toLocaleString()} received.`);
                subscribe('terrasim_running_history', 'activity', () => `A TerraSim analysis was run.`);
                subscribe('terrasim_feedbacks', 'feedback', () => `TerraSim feedback received.`);
                subscribe('revit_files', 'file', (r) => `New Revit file uploaded: ${r.display_name}.`);
                subscribe('resources', 'file', (r) => `New Resource uploaded: ${r.title}.`);
                subscribe('blog_comments', 'comment', () => `New blog comment received.`);
                subscribe('session_reviews', 'review', (r) => `A ${r.rating}-star review was submitted.`);
            };

            await setupSubscriptions();

            // Attempt to subscribe to PWA Push if permission is granted
            if ('Notification' in window && Notification.permission === 'granted') {
                await subscribeToPush();
            }
        };

        setup();

        return () => {
            isMounted = false;
            // Unsubscribe all
            pb.collection('users').unsubscribe('*');
            pb.collection('bookings').unsubscribe('*');
            pb.collection('product_payments').unsubscribe('*');
            pb.collection('terrasim_running_history').unsubscribe('*');
            pb.collection('terrasim_feedbacks').unsubscribe('*');
            pb.collection('revit_files').unsubscribe('*');
            pb.collection('resources').unsubscribe('*');
            pb.collection('blog_comments').unsubscribe('*');
            pb.collection('session_reviews').unsubscribe('*');
        };
    }, []);

    const markAllAsRead = async () => {
        if (!pb.authStore.model || unreadCount === 0) return;

        try {
            const now = new Date();
            // Optimistic update
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));

            await UserService.updateProfile({ last_notification_read: now.toISOString() });
        } catch (error) {
            console.error("Failed to mark notifications as read", error);
        }
    };

    return { notifications, unreadCount, markAllAsRead, autoOpenTrigger, subscribeToPush };
}
