const PocketBase = require('pocketbase/cjs');
const es = require('eventsource');
global.EventSource = es.EventSource || es;

const pb = new PocketBase('https://pb.daharengineer.com');

async function test() {
    try {
        await pb.collection('_superusers').authWithPassword('admin@daharengineer.com', 'D27h03R00p');
        console.log("Logged in");

        await pb.collection('messages').subscribe('*', function (e) {
            console.log("RAW SSE EVENT RECEIVED:", e.action, e.record.id);
        });

        console.log("Subscribed to messages successfully");

        // Send a test message
        setTimeout(async () => {
            console.log("Sending test message...");
            try {
                // Find a conversation to use
                const convs = await pb.collection('conversations').getList(1, 1);
                if (convs.items.length > 0) {
                    const testMsg = await pb.collection('messages').create({
                        conversation: convs.items[0].id,
                        sender: pb.authStore.model.id,
                        content: "TEST_SSE_EVENT"
                    });
                    console.log("Test message created:", testMsg.id);
                } else {
                    console.log("No conversations found to send test message");
                }
            } catch (err) {
                console.log("Error creating message:", err.response || err);
            }
        }, 2000);

    } catch (err) {
        console.error("Fatal error:", err);
    }
}
test();
