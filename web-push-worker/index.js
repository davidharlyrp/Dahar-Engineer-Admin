const webpush = require('web-push');
const https = require('https');
const fetch = require('cross-fetch');

const POCKETBASE_URL = 'https://pb.daharengineer.com'; // Sesuaikan jika PocketBase di port lain
const ADMIN_EMAIL = 'admin@daharengineer.com'; // Ganti dengan akun admin Anda
const ADMIN_PASSWORD = 'D27h03R00p'; // Ganti dengan password admin Anda

const publicVapidKey = 'BBf-IIYJJQqTfQRkyjUuF6OtKqAaVhIo51F7WPunPHvH1ss-ByuIPKzXLa3ralKeW7QlqFqm6S1dJ6NW0j5X1Fc';
// TODO: INSERT PRIVATE VAPID KEY HERE
const privateVapidKey = 'oNha1_GtK8w_q1XDZx84cRLMp6as6uzm3blBdYwezvU';

webpush.setVapidDetails(
    'mailto:dahar.engineer@example.com',
    publicVapidKey,
    privateVapidKey
);

let adminToken = '';

async function loginAdmin() {
    console.log("Logging into PocketBase...");
    // Update for PocketBase v0.23+ which renamed '/api/admins' to '/api/collections/_superusers'
    const res = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            identity: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        })
    });
    const data = await res.json();
    if (data.token) {
        adminToken = data.token;
        console.log("Login success.");
    } else {
        console.error("Login failed!", data);
        process.exitCode = 1;
        throw new Error("Login failed");
    }
}

async function sendPushNotification(title, body) {
    if (!adminToken) return;

    try {
        // Fetch all subscriptions
        const res = await fetch(`${POCKETBASE_URL}/api/collections/push_subscriptions/records`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await res.json();
        const subscriptions = data.items;

        if (!subscriptions || subscriptions.length === 0) {
            console.log("No push subscriptions found.");
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
                if (err.statusCode === 410) {
                    await fetch(`${POCKETBASE_URL}/api/collections/push_subscriptions/records/${subRecord.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${adminToken}` }
                    });
                    console.log(`Deleted expired subscription ${subRecord.id}`);
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
    const url = new URL(`${POCKETBASE_URL}/api/realtime`);

    const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'text/event-stream'
        }
    };

    https.get(options, (res) => {
        if (res.statusCode !== 200) {
            console.error(`SSE Connection Failed. Status Code: ${res.statusCode}`);
            return;
        }

        let buffer = '';
        let currentEvent = null;
        let currentData = null;

        res.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // keep the incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('event:')) {
                    currentEvent = line.replace('event:', '').trim();
                } else if (line.startsWith('data:')) {
                    currentData = line.replace('data:', '').trim();
                }

                // Empty line means end of SSE message
                if (line.trim() === '' && currentEvent && currentData) {
                    try {
                        const parsedData = JSON.parse(currentData);

                        if (currentEvent === 'PB_CONNECT') {
                            console.log("Connected to Realtime SSE.");
                            const clientId = parsedData.clientId;

                            // Subscribe to relevant collections
                            const collections = [
                                'bookings', 'product_payments', 'terrasim_running_history',
                                'terrasim_feedbacks', 'revit_files', 'resources', 'blog_comments', 'session_reviews'
                            ];

                            collections.forEach(col => fetch(`${POCKETBASE_URL}/api/realtime`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${adminToken}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    clientId: clientId,
                                    subscriptions: [col]
                                })
                            }));
                        } else if (currentEvent === 'bookings' && parsedData.action === 'create') {
                            sendPushNotification("New Booking", "Someone booked a session.");
                        } else if (currentEvent === 'product_payments' && parsedData.action === 'create') {
                            sendPushNotification("New Payment", "A product payment was received.");
                        } else if (currentEvent === 'blog_comments' && parsedData.action === 'create') {
                            sendPushNotification("New Comment", "A new blog comment was posted.");
                        } else if (currentEvent === 'session_reviews' && parsedData.action === 'create') {
                            sendPushNotification("New Review", "A new course review was submitted.");
                        }
                    } catch (e) {
                        console.error("Error parsing SSE data:", e);
                    }

                    // Reset for next message
                    currentEvent = null;
                    currentData = null;
                }
            }
        });

        res.on('end', () => {
            console.log("SSE Connection closed by server.");
        });

        res.on('error', (err) => {
            console.error("SSE Streaming Error:", err);
        });
    }).on('error', (err) => {
        console.error("Failed to make SSE request:", err);
    });
}

startListening();
