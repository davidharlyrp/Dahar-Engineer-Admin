const webpush = require('web-push');
const fetch = require('cross-fetch');
// Polyfill EventSource for PocketBase JS SDK in Node.js
const es = require('eventsource');
global.EventSource = es.EventSource || es;
// Use the official PocketBase JS SDK for reliable SSE connection
const PocketBase = require('pocketbase/cjs');

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'https://pb.daharengineer.com'; // Sesuaikan jika PocketBase di port lain
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@daharengineer.com'; // Ganti dengan akun admin Anda
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'D27h03R00p'; // Ganti dengan password admin Anda

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BBf-IIYJJQqTfQRkyjUuF6OtKqAaVhIo51F7WPunPHvH1ss-ByuIPKzXLa3ralKeW7QlqFqm6S1dJ6NW0j5X1Fc';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'oNha1_GtK8w_q1XDZx84cRLMp6as6uzm3blBdYwezvU';

webpush.setVapidDetails(
    'mailto:dahar.engineer@example.com',
    publicVapidKey,
    privateVapidKey
);

// Initialize PocketBase globally
const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);

async function loginAdmin() {
    console.log("Logging into PocketBase...");
    try {
        await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log("Login success.");
    } catch (err) {
        console.error("Login failed!", err);
        process.exitCode = 1;
        throw new Error("Login failed");
    }
}

async function sendPushNotification(title, body) {
    if (!pb.authStore.isValid) return;

    try {
        // Fetch all subscriptions using the SDK
        const subscriptions = await pb.collection('push_subscriptions').getFullList();

        if (!subscriptions || subscriptions.length === 0) {
            console.log("No push subscriptions found in DB.");
            return;
        }

        const payload = JSON.stringify({
            title: title,
            body: body,
            url: "/"
        });

        console.log(`Sending Push Notification to ${subscriptions.length} devices...`);

        // Broadcast to all subscribed devices
        for (const subRecord of subscriptions) {
            const pushSubscription = {
                endpoint: subRecord.endpoint,
                keys: {
                    p256dh: subRecord.p256dh,
                    auth: subRecord.auth
                }
            };

            try {
                await webpush.sendNotification(pushSubscription, payload);
                console.log(`Push sent successfully to device ID: ${subRecord.id}`);
            } catch (err) {
                console.error(`Failed to send push to device ID ${subRecord.id}`, err.statusCode);
                // Optionally delete expired subscriptions here
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await pb.collection('push_subscriptions').delete(subRecord.id);
                    console.log(`Deleted expired subscription ${subRecord.id} from DB.`);
                }
            }
        }
    } catch (err) {
        console.error("Error fetching subscriptions:", err);
    }
}

async function startListening() {
    try {
        await loginAdmin();
    } catch (err) {
        console.error("Could not start listener: ", err.message);
        return;
    }

    console.log("Connecting to PocketBase SSE for real-time events...");

    const collectionsToListen = [
        { name: 'bookings', title: "New Booking", body: "Someone booked a session." },
        { name: 'product_payments', title: "New Payment", body: "A product payment was received." },
        { name: 'terrasim_running_history', title: "TerraSim Update", body: "A TerraSim analysis was run." },
        { name: 'terrasim_feedbacks', title: "New Feedback", body: "TerraSim feedback was received." },
        { name: 'revit_files', title: "New File", body: "A Revit file was uploaded." },
        { name: 'resources', title: "New Resource", body: "A new Resource was uploaded." },
        { name: 'blog_comments', title: "New Comment", body: "A new blog comment was posted." },
        { name: 'session_reviews', title: "New Review", body: "A new course review was submitted." }
    ];

    try {
        for (const col of collectionsToListen) {
            await pb.collection(col.name).subscribe('*', function (e) {
                if (e.action === 'create') {
                    console.log(`Incoming realtime event from [${col.name}]: Create`);
                    sendPushNotification(col.title, col.body);
                }
            });
            console.log(`Subscribed to: ${col.name}`);
        }
        console.log("Listening for events indefinitely...");
    } catch (err) {
        console.error("SSE Subscription Error:", err);
    }
}

startListening();
