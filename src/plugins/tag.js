import { createWriteStream, mkdirSync } from 'fs';
import { downloadMediaMessage } from 'baileys';
import UserConfig from '../config/config.js';
import { logger } from '../utils/logger.js';

export async function tagAll(m) {
    const tagText = m.textMessage || 'Hey everyone 👋🏾!';
    if (!m.isGroup) return await m.reply('> ❌ Groupe uniquement.');
    try {
        const groupMetadata = await m.metadata;
        const participants = groupMetadata.participants.map(user => user.id);
        const text = participants.map(user => `@${user.split('@')[0]}`).join(' \n');
        await m.modify({
            text: `*${groupMetadata.subject}*\n\n${tagText}\n\n${text}`,
            mentions: participants
        });
    } catch (error) {
        logger.error(`Error mentioning all: ${error.message}`);
    }
}

export async function tagAdmin(m) {
    if (!m.isGroup) return await m.reply('> ❌ Groupe uniquement.');
    try {
        const groupMetadata = await m.metadata;
        const { participants } = groupMetadata;
        const admins = participants.filter(p => p.admin).map(p => p.id);
        if (admins.length === 0) {
            return await m.reply('> ⚠️ Aucun admin trouvé.');
        }
        const text = `*${groupMetadata.subject}*\n\n👮‍♂️ *𝗔𝗱𝗺𝗶𝗻𝘀 𝘁𝗮𝗴𝗴𝗲𝗱:* \n${admins.map(user => `@${user.split('@')[0]}`).join('\n')}`;
        await m.modify({ text, mentions: admins });
    } catch (error) {
        await m.reply('> ❌ Échec tag admins.');
    }
}

export async function tag(m) {
    if (!m.isGroup) return await m.reply('> 🚫 _*This command only works in group chats.*_');
    try {
        const groupMetadata = await m.metadata;
        const participants = groupMetadata.participants.map(user => user.id);
        const text = m.textMessage || 'Hey everyone 👋🏾!';
        const quotedMessage = m.quoted;

        if (quotedMessage) {
            if (quotedMessage.stickerMessage) {
                const file = await downloadMediaMessage({ message: quotedMessage }, 'stream');
                return await m.client.sendMessage(m.chat, {
                    sticker: { stream: file },
                    metadata: {
                        packname: 'DTAMTECH MD',
                        author: m.message.key.pushName
                    },
                    mimetype: quotedMessage.mimetype,
                    mentions: participants
                });
            } else if (quotedMessage.imageMessage) {
                const file = await downloadMediaMessage({ message: quotedMessage }, 'stream');
                return await m.client.sendMessage(m.chat, {
                    image: { stream: file },
                    caption: quotedMessage.imageMessage.caption || '',
                    mentions: participants
                });
            } else if (quotedMessage.audioMessage) {
                const file = await downloadMediaMessage({ message: quotedMessage }, 'stream');
                return await m.client.sendMessage(m.chat, {
                    audio: { stream: file },
                    mentions: participants
                });
            } else if (quotedMessage.videoMessage) {
                const file = await downloadMediaMessage({ message: quotedMessage }, 'stream');
                return await m.client.sendMessage(m.chat, {
                    video: { stream: file },
                    caption: quotedMessage.videoMessage.caption || '',
                    mentions: participants
                });
            } else {
                const quotedText = quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || '';
                return await m.modify({ text: quotedText, mentions: participants });
            }
        } else {
            await m.modify({ text, mentions: participants });
        }
    } catch (error) {
        logger.error(`Error mentioning all: ${error.message}`);
    }
}

export async function setTag(m) {
    const number = m.myNumber;
    try {
        const quotedMessage = m.quoted;
        if (!quotedMessage || !quotedMessage.audioMessage) {
            return await m.reply('> ❌ Répondez à un message audio.');
        }
        const audio = await downloadMediaMessage({ message: quotedMessage }, 'stream');
        const dirPath = 'src/medias/audio';
        mkdirSync(dirPath, { recursive: true });
        const filePath = `${dirPath}/${number}.mp3`;
        const writeStream = createWriteStream(filePath);
        audio.pipe(writeStream);
        await UserConfig.set('tagAudioPath', filePath);
        await m.modify({ text: '> *_Audio tag has been updated successfully_*' });
    } catch (error) {
        logger.error(`Error changing tag audio: ${error.message}`);
    }
}

export async function tagOption(m) {
    const option = m.textMessage || '';
    try {
        if (option.toLowerCase().includes('on')) {
            await UserConfig.set('tagRespond', true);
            await m.modify({ text: '> _*Your tag auto response has been enabled*_' });
        } else if (option.toLowerCase().includes('off')) {
            await UserConfig.set('tagRespond', false);
            await m.modify({ text: '> _*Your tag auto response has been disabled*_' });
        } else {
            await m.reply('> _*Select an option: On/off*_');
        }
    } catch (error) {
        logger.error(`Error changing tag option: ${error.message}`);
    }
}

export async function respond(m) {
    const tagRespond = (await UserConfig.get("tagRespond")) ?? (await UserConfig.get("tagrespond"));
    if ((!m.fromMe) && tagRespond && m.messageBody) {
        if (m.messageBody.includes(`@${m.myNumber}`) || m.messageBody.includes(`@${m.client?.user?.lid?.split(':')[0]}`)) {
            const audioUrl = await UserConfig.get("tagAudioPath") || "https://cdn.jsdelivr.net/gh/Dtamtech/dtamtech-assets@main/tag.mp3";
            return await m.reply('', {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                ptt: false
            });
        }
    }
}

export default {
    name: 'tag',
    description: 'Commandes de mentions et notifications de groupe',
    respond,
    commands: [
        {
            name: 'tagall',
            category: 'group',
            description: 'Mentionne tous les membres du groupe avec un message',
            usage: '.tagall [message]',
            groupOnly: true,
            adminOnly: true,
            nuisance: true,
            execute: async (ctx) => {
                await tagAll(ctx.m);
            }
        },
        {
            name: 'tag',
            aliases: ['hidetag', 'totag'],
            category: 'group',
            description: 'Transfère ou envoie un message en mentionnant discrètement tout le monde',
            usage: '.tag [texte ou réponse]',
            groupOnly: true,
            adminOnly: true,
            nuisance: true,
            execute: async (ctx) => {
                await tag(ctx.m);
            }
        },
        {
            name: 'tagadmin',
            category: 'group',
            description: 'Mentionne tous les administrateurs du groupe',
            groupOnly: true,
            adminOnly: true,
            nuisance: true,
            execute: async (ctx) => {
                await tagAdmin(ctx.m);
            }
        },
        {
            name: 'settag',
            category: 'owner',
            description: 'Configure l\'audio personnalisé joué quand le bot est mentionné',
            ownerOnly: true,
            execute: async (ctx) => {
                await setTag(ctx.m);
            }
        },
        {
            name: 'tagrespond',
            category: 'owner',
            description: 'Active ou désactive la réponse vocale automatique aux mentions',
            ownerOnly: true,
            execute: async (ctx) => {
                await tagOption(ctx.m);
            }
        }
    ]
};
