import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { downloadMediaMessage, getContentType } from 'baileys';
import { Sticker } from 'wa-sticker-formatter';
import UserConfig from '../config/config.js';
import { logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/errorHelper.js';

// ═════════════════════════════════════════════════════════════════
// 1. PHOTO (CONVERSION STICKER EN IMAGE)
// ═════════════════════════════════════════════════════════════════
export async function photo(m) {
    let filename = null;
    try {
        if (!m.isQuoted || !m.quoted.stickerMessage) return m.reply('> ❌ Répondez à un sticker.');
        const quoted = m.quoted;
        const buffer = await downloadMediaMessage({ message: quoted }, "buffer");
        filename = `./temp/sticker-${Date.now()}.webp`;
        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true });
        fs.writeFileSync(filename, buffer);
        await m.reply('', { image: { url: filename }, caption: "> Powered by DTAMTECH " });
    } catch (e) {
        await m.reply("> ❌ Échec lors de la conversion en sticker.");
        logger.error(`Error converting sticker to image: ${e.message}`);
    } finally {
        if (filename && fs.existsSync(filename)) {
            try { fs.unlinkSync(filename); } catch { }
        }
    }
}

// ═════════════════════════════════════════════════════════════════
// 2. TOMP3 (CONVERSION VIDÉO EN MP3)
// ═════════════════════════════════════════════════════════════════
export async function tomp3(m) {
    let inputPath = null;
    let outputPath = null;
    try {
        const quoted = m.quoted;
        const target = quoted?.videoMessage;
        if (!target) return await m.reply("> ❌ Vidéo introuvable.");
        const buffer = await downloadMediaMessage({ message: quoted }, "buffer");
        inputPath = `./temp/video-${Date.now()}.mp4`;
        outputPath = `./temp/audio-${Date.now()}.mp3`;
        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true });
        fs.writeFileSync(inputPath, buffer);

        await new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${inputPath}" -vn -ab 128k -ar 44100 -y "${outputPath}"`, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        await m.reply('', { audio: { url: outputPath }, mimetype: 'audio/mp4', ptt: false });
    } catch (e) {
        logger.error(`Error converting video to audio: ${e.message}`);
        await m.reply("> ❌ Échec lors de la conversion en audio.");
    } finally {
        if (inputPath && fs.existsSync(inputPath)) {
            try { fs.unlinkSync(inputPath); } catch { }
        }
        if (outputPath && fs.existsSync(outputPath)) {
            try { fs.unlinkSync(outputPath); } catch { }
        }
    }
}

// ═════════════════════════════════════════════════════════════════
// 3. STICKER (CRÉATION DE STICKER WHATSAPP)
// ═════════════════════════════════════════════════════════════════
export async function sticker(m) {
    if (!m.isQuoted) return m.reply('> ❌ Répondez à une image/vidéo.');
    const mediaType = getContentType(m.quoted);
    if (mediaType !== "imageMessage" && mediaType !== "videoMessage") {
        return m.reply('> ❌ Image ou vidéo requise.');
    }

    if (mediaType === 'videoMessage' && (m.quoted.videoMessage || m.quoted).seconds > 15) {
        return m.reply('> ❌ Durée vidéo max : 15s.');
    }

    await m.react('⏳');

    let media = await downloadMediaMessage({ message: m.quoted }, "buffer", {
        reuploadRequest: m.client.updateMediaMessage
    });

    if (!media) {
        await m.react('❌');
        return m.reply("> ❌ Téléchargement média échoué.");
    }

    const tempDir = path.resolve("./temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const tempStickerPath = path.join(tempDir, `sticker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.webp`);
    fs.writeFileSync(tempStickerPath, media);

    const isAnimated = mediaType === "videoMessage";
    const pack = (await UserConfig.get("packname")) || "DTAMTECH MD";
    const author = (await UserConfig.get("author")) || m.pushName || "DTAMTECH";

    try {
        const s = new Sticker(tempStickerPath, {
            author: author,
            pack: pack,
            isAnimated: isAnimated,
            keepAspectRatio: true,
            keepOriginalSize: true,
            keepFrame: true,
            keepBackground: true,
            keepForeground: true,
            keepLogo: true,
            keepWatermark: true,
        });

        await m.client.sendMessage(m.chat, await s.toMessage());
        await m.react('✅');
    } catch (err) {
        await m.react('❌');
        m.reply(formatErrorMessage(err, 'Création sticker'));
    } finally {
        try { if (fs.existsSync(tempStickerPath)) fs.unlinkSync(tempStickerPath); } catch { }
    }
}

// ═════════════════════════════════════════════════════════════════
// 4. TAKE (MODIFICATION DU PACKNAME & AUTEUR D'UN STICKER)
// ═════════════════════════════════════════════════════════════════
export async function take(m) {
    const quotedMessage = m.quoted;
    if (!quotedMessage || !quotedMessage.stickerMessage) {
        return m.reply("> ❌ Répondez à un sticker.");
    }

    const tempDir = path.resolve("./temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const tempStickerPath = path.join(tempDir, `take_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.webp`);

    try {
        await m.react('⏳');
        const username = m.pushName || m.senderName || m.message?.key?.pushName || "Unknown";
        const pack = (await UserConfig.get("packname")) || "DTAMTECH MD";

        const stickerStream = await downloadMediaMessage(
            { message: quotedMessage },
            'buffer',
            { reuploadRequest: m.client.updateMediaMessage }
        );

        if (!stickerStream) {
            await m.react('❌');
            return m.reply("> ❌ Téléchargement sticker échoué.");
        }

        fs.writeFileSync(tempStickerPath, stickerStream);

        const isAnimated = quotedMessage.stickerMessage.isAnimated || false;
        const s = new Sticker(tempStickerPath, {
            author: username,
            pack: pack,
            isAnimated: isAnimated,
            keepAspectRatio: true,
            keepOriginalSize: true,
            keepFrame: true,
            keepBackground: true,
            keepForeground: true,
            keepLogo: true,
            keepWatermark: true,
        });

        await m.client.sendMessage(m.chat, await s.toMessage());
        await m.react('✅');
    } catch (error) {
        await m.react('❌');
        await m.reply(formatErrorMessage(error, 'Modification sticker'));
    } finally {
        try { if (fs.existsSync(tempStickerPath)) fs.unlinkSync(tempStickerPath); } catch { }
    }
}

// ═════════════════════════════════════════════════════════════════
// PLUGIN DEFINITION
// ═════════════════════════════════════════════════════════════════
export default {
    name: 'mediaConversions',
    description: 'Conversions et manipulations de médias (stickers, audio, images)',
    photo,
    tomp3,
    sticker,
    take,
    commands: [
        {
            name: 'sticker',
            aliases: ['s'],
            category: 'media',
            description: 'Convertit une image ou vidéo courte en sticker WhatsApp',
            usage: '.sticker (en répondant à une image ou vidéo)',
            cooldown: 5,
            execute: async ({ m }) => {
                await sticker(m);
            }
        },
        {
            name: 'tomp3',
            aliases: ['toaudio'],
            category: 'media',
            description: 'Convertit une vidéo en fichier audio MP3',
            usage: '.tomp3 (en répondant à une vidéo)',
            cooldown: 5,
            execute: async ({ m }) => {
                await tomp3(m);
            }
        },
        {
            name: 'photo',
            category: 'media',
            description: 'Convertit un sticker WhatsApp en image photo fixe',
            usage: '.photo (en répondant à un sticker)',
            cooldown: 5,
            execute: async ({ m }) => {
                await photo(m);
            }
        },
        {
            name: 'take',
            aliases: ['wm'],
            category: 'media',
            description: 'Modifie l\'auteur et le nom du pack d\'un sticker',
            usage: '.take (en répondant à un sticker)',
            cooldown: 5,
            execute: async ({ m }) => {
                await take(m);
            }
        }
    ]
};
