import { downloadMediaMessage } from "@whiskeysockets/baileys";

import fs from "fs";

import path from "path";

export async function take(m) {

    try {

        const remoteJid = m.chat;

        const quotedMessage = m.quoted;

        const username = m.message.pushName || "Unknown"; // Get sender's name

        if (!quotedMessage || !quotedMessage.stickerMessage) {

            return m.reply("❌ Reply to a sticker to modify it!" );
        }

        // Download the original sticker
        const stickerBuffer = await downloadMediaMessage({ message: quotedMessage }, "buffer");

        if (!stickerBuffer) {

            return m.reply("❌ Failed to download sticker!" );
        }

        // Save temporary sticker file
        const tempStickerPath = path.resolve("./temp_sticker.webp");

        fs.writeFileSync(tempStickerPath, stickerBuffer);

        // Detect if the sticker is animated
        const isAnimated = quotedMessage.stickerMessage.isAnimated || false;

        m.client.sendImageAsSticker(m.chat, stickerBuffer, m, {
            packname: "DTAMTECH MD",
            author: m.message.key.pushName
        })

        // Cleanup
        fs.unlinkSync(tempStickerPath);

        console.log(`✅ Sticker sent successfully with ${username}'s metadata!`);

    } catch (error) {

        console.error("❌ Error:", error);
        
        await m.reply("⚠️ Error modifying sticker.");
    }
}

export default take;
