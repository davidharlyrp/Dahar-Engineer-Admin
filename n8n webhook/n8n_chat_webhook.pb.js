/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
    // 1. Ambil record pesan yang baru masuk
    const msg = e.record;
    const senderId = msg.getString("sender");

    // URL Webhook n8n Anda
    const n8nWebhookUrls = [
        "http://100.114.4.75:5678/webhook-test/pesan-chat",
        "http://100.114.4.75:5678/webhook/pesan-chat"
    ];
    try {
        let senderRecord = null;
        try {
            // PENTING: Untuk v0.23+, gunakan $app.findRecordById tanpa .dao()
            senderRecord = $app.findRecordById("users", senderId);
        } catch (err) {
            console.log("Could not fetch sender info: ", err);
        }
        // Cek field isAdmin
        if (senderRecord && senderRecord.getBool("isAdmin") === true) {
            return;
        }
        let senderInfo = {};
        if (senderRecord) {
            senderInfo = {
                name: senderRecord.getString("name") || senderRecord.getString("display_name"),
                email: senderRecord.getString("email"),
                phone: senderRecord.getString("phone_number")
            };
        }
        const payload = {
            messageId: msg.id, // v0.23+ pakai msg.id (bukan getId)
            conversationId: msg.getString("conversation"),
            senderId: senderId,
            senderInfo: senderInfo,
            content: msg.getString("content"),
            attachment: msg.getString("attachment") || null,
            created: msg.getString("created")
        };
        const stringifiedPayload = JSON.stringify(payload);
        // Kirim request POST
        n8nWebhookUrls.forEach(url => {
            try {
                const res = $http.send({
                    url: url,
                    method: "POST",
                    body: stringifiedPayload,
                    headers: { "Content-Type": "application/json" },
                    timeout: 5
                });
                console.log(`Successfully triggered n8n webhook at ${url}. Status: ${res.statusCode}`);
            } catch (err) {
                console.error(`Failed to trigger n8n webhook at ${url}:`, err);
            }
        });
    } catch (error) {
        console.error("Failed to process n8n webhook payload:", error);
    }
}, "messages");

conversation.user.id = @request.auth.id || @request.auth.isAdmin = true || @request.auth.collectionName = '_superusers' || sender = @request.auth.id