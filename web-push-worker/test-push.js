const webpush = require('web-push');

// Use the official PocketBase JS SDK for reliable SSE connection
const fetch = require('cross-fetch');
global.EventSource = require('eventsource').EventSource || require('eventsource');
const PocketBase = require('pocketbase/cjs');

const POCKETBASE_URL = 'https://pb.daharengineer.com'; // Sesuaikan jika PocketBase di port lain
const ADMIN_EMAIL = 'admin@daharengineer.com'; // Ganti dengan akun admin Anda
const ADMIN_PASSWORD = 'D27h03R00p'; // Ganti dengan password admin Anda

const publicVapidKey = 'BBf-IIYJJQqTfQRkyjUuF6OtKqAaVhIo51F7WPunPHvH1ss-ByuIPKzXLa3ralKeW7QlqFqm6S1dJ6NW0j5X1Fc';
const privateVapidKey = 'oNha1_GtK8w_q1XDZx84cRLMp6as6uzm3blBdYwezvU';

webpush.setVapidDetails(
    'mailto:dahar.engineer@example.com',
    publicVapidKey,
    privateVapidKey
);

const pb = new PocketBase(POCKETBASE_URL);

async function test() {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

    console.log("Fetching subscriptions...");
    const subscriptions = await pb.collection('push_subscriptions').getFullList();

    console.log(`Found ${subscriptions.length} subscriptions`);

    for (const subRecord of subscriptions) {
        console.log(`\nTesting device: ${subRecord.id}`);
        console.log(`Endpoint: ${subRecord.endpoint.substring(0, 50)}...`);

        const pushSubscription = {
            endpoint: subRecord.endpoint,
            keys: {
                p256dh: subRecord.p256dh,
                auth: subRecord.auth
            }
        };

        try {
            await webpush.sendNotification(pushSubscription, JSON.stringify({ title: 'Test', body: 'Android Test' }));
            console.log(`Success! Sent to ${subRecord.id}`);
        } catch (err) {
            console.log(`FAILED for ${subRecord.id} -> Status:`, err.statusCode);
            console.log(`Body:`, err.body);
        }
    }
}

test().catch(console.error);
