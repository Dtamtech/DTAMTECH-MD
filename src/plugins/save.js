import { downloadMediaMessage, normalizeMessageContent } from 'baileys';

/**
 * Sauvegarde et transfère un message cité vers le chat privé (ou remoteJid spécifié).
 */
export async function save(m, remoteJid = (m.myNumber ? m.myNumber + "@s.whatsapp.net" : null)) {
    const quotedMessage = normalizeMessageContent(m.quoted) || m.quoted;
    if (!quotedMessage) {
        await m.reply("> ❌ Répondez à un message.");
        return false;
    }

    const targetJid = remoteJid || (m.myNumber ? m.myNumber + "@s.whatsapp.net" : (m.sender?.split('@')[0].split(':')[0] + '@s.whatsapp.net'));

    if (quotedMessage.stickerMessage) {
        const file = await downloadMediaMessage({ message: quotedMessage }, "stream");
        await m.client.sendMessage(targetJid, {
            sticker: { stream: file },
            metadata: { packname: "DTAMTECH MD", author: m.message?.key?.pushName || "DTAMTECH" },
            mimetype: quotedMessage.mimetype
        });
    } else if (quotedMessage.imageMessage) {
        const file = await downloadMediaMessage({ message: quotedMessage }, "stream");
        await m.client.sendMessage(targetJid, {
            image: { stream: file },
            caption: quotedMessage.imageMessage.caption ? quotedMessage.imageMessage.caption : ""
        });
    } else if (quotedMessage.audioMessage) {
        const file = await downloadMediaMessage({ message: quotedMessage }, "stream");
        await m.client.sendMessage(targetJid, { audio: { stream: file } });
    } else if (quotedMessage.videoMessage) {
        const file = await downloadMediaMessage({ message: quotedMessage }, "stream");
        await m.client.sendMessage(targetJid, {
            video: { stream: file },
            caption: quotedMessage.videoMessage.caption ? quotedMessage.videoMessage.caption : ""
        });
    } else {
        const quotedText = quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || "";
        await m.client.sendMessage(targetJid, { text: quotedText });
    }
    return true;
}

export default {
    name: 'save',
    description: 'Sauvegarde discrète de messages et médias dans vos messages privés',
    save,
    commands: [
        {
            name: 'save',
            aliases: ['recup'],
            category: 'tools',
            description: 'Transfère le message ou média cité dans votre chat privé',
            usage: '.save (en répondant à un message)',
            ownerOnly: true,
            execute: async ({ m }) => {
                await save(m);
            }
        },
        {
            name: 'ok',
            category: 'tools',
            description: 'Sauvegarde furtive en transformant le message en "Ok" avec confirmation temporaire',
            usage: '.ok (en répondant à un message)',
            ownerOnly: true,
            execute: async ({ m }) => {
                if (m.fromMe && typeof m.client?.modifyMessage === 'function') {
                    await m.client.modifyMessage(m, { text: 'Ok' });
                }
                const success = await save(m);
                if (success) {
                    await m.react('🆗');
                    setTimeout(async () => {
                        try {
                            await m.react('');
                        } catch { }
                    }, 5000);
                }
            }
        }
    ]
};
