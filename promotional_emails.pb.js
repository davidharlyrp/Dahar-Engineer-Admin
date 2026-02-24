/**
 * PocketBase JavaScript hook to handle promotional email sending.
 * Save this file as `pb_hooks/promotional_emails.pb.js` on your PocketBase server.
 */

routerAdd("POST", "/promotional-emails", (e) => {
    let currentStep = "init";
    try {
        // --- Step 1: Read request body ---
        currentStep = "read_body";
        const data = new DynamicModel({
            adminEmail: "",
            adminPassword: "",
            userIds: [],
            subject: "",
            body: "",
            allUsers: false,
        });
        e.bindBody(data);

        // --- Step 2: Validate admin credentials ---
        currentStep = "auth_check";
        const adminEmail = data.adminEmail;
        const adminPassword = data.adminPassword;

        if (!adminEmail || !adminPassword) {
            return e.json(401, {
                success: false,
                message: "Admin credentials (email/password) are required.",
            });
        }

        let adminUser;
        try {
            adminUser = e.app.findAuthRecordByEmail("users", adminEmail);
        } catch (err) {
            return e.json(401, { success: false, message: "Admin user not found." });
        }

        if (!adminUser || !adminUser.validatePassword(adminPassword)) {
            return e.json(401, { success: false, message: "Invalid admin credentials." });
        }

        if (!adminUser.getBool("isAdmin")) {
            return e.json(403, { success: false, message: "User does not have admin privileges." });
        }

        // --- Step 3: Validate email content ---
        currentStep = "validate_content";
        const subject = data.subject;
        const body = data.body;

        if (!subject || !body) {
            return e.json(400, { success: false, message: "Missing email subject or body." });
        }

        // --- Step 4: Build recipient filter ---
        currentStep = "build_filter";
        let filter = "";
        if (data.allUsers) {
            filter = "id != ''";
        } else {
            const userIds = data.userIds;
            if (!userIds || userIds.length === 0) {
                return e.json(400, { success: false, message: "No users selected." });
            }
            const idsList = Array.isArray(userIds) ? userIds : [userIds];
            filter = idsList.map(id => `id='${id}'`).join(" || ");
        }

        // --- Step 5: Fetch recipient records ---
        currentStep = "fetch_records";
        const records = e.app.findRecordsByFilter("users", filter);

        // --- Step 6: Send emails ---
        currentStep = "send_emails";
        let sentCount = 0;
        const senderAddress = e.app.settings().meta.senderAddress;
        const senderName = e.app.settings().meta.senderName;
        const mailClient = e.app.newMailClient();

        for (const record of records) {
            try {
                const recipientEmail = record.get("email");
                if (!recipientEmail) continue;

                const message = new MailerMessage({
                    from: { address: senderAddress, name: senderName },
                    to: [{ address: recipientEmail }],
                    subject: subject,
                    html: body,
                });

                mailClient.send(message);
                sentCount++;
            } catch (mailErr) {
                console.error("Failed to send to " + record.get("email"), mailErr);
            }
        }

        return e.json(200, {
            success: true,
            message: `Successfully sent ${sentCount} email(s).`,
        });
    } catch (err) {
        console.error("Promotional Email Hook Error at [" + currentStep + "]:", err);
        return e.json(500, {
            success: false,
            message: `Error at [${currentStep}]: ` + (err.message || String(err)),
        });
    }
});
