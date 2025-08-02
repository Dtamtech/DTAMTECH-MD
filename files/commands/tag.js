import { createWriteStream } from 'fs';

import { downloadMediaMessage } from "@whiskeysockets/baileys";

import configManager from '../utils/manageConfigs.js';

export async function tagall(m) {

    const tagtext = m.textMessage || 'Hey everyone 👋🏾!';

     if (!m.isGroup) {
            return await m.reply('> This command only works in group chats.' );
        }

    try {

        const groupMetadata = await m.metadata;

        const participants = groupMetadata.participants.map(user => user.id);

        const text = participants.map(user => `@${user.split('@')[0]}`).join(' \n');

        await m.reply(`*${groupMetadata.subject}*\n\n${tagtext}\n\n${text}`,{

            mentions: participants
        });

    } catch (error) {

        console.error("_Error mentioning all:_", error);
    }
}

export async function tagadmin(m) {

    const botNumber = m.myNumber;

    try {

         if (!m.isGroup) {
            await m.reply('_This command only works in group chats._' );
            return;
        }

        const { participants } = await m.metadata;

        const admins = participants.filter(p => p.admin && p.id !== botNumber).map(p => p.id);

        if (admins.length === 0) {

            return await m.reply("❌ No admins found in this group." );
        }
        const text = `👮‍♂️ *𝗔𝗱𝗺𝗶𝗻𝘀 𝘁𝗮𝗴𝗴𝗲𝗱:* \n${admins.map(user => `@${user.split('@')[0]}`).join('\n')}`;

        await m.reply(text, {mentions: admins} );

    } catch (error) {

        console.error("❌ Error mentioning admins:", error);

        await m.reply("❌ Error while tagging admins!" );
    }
}

export async function respond(m) {

    const number = m.myNumber;

    const messageBody = m.messageBody
    // Ensure the user exists in config
    if (!configManager.config.users[number]) return;

    const tagRespond = m.config.response;

    if ((!m.fromMe) && tagRespond) {

        if (messageBody.includes(`@${number}`) || messageBody.includes(`${m.client.user.lid.split(':')[0]}@lid`)){

            await m.reply('', {

                audio: { url: m.config.tagAudioPath || "./files/medias/audio/tag.mp3" },

                mimetype: "audio/mp4",

                ptt: false
            });
        }
    }
}

export async function settag(m) {

    const number = m.myNumber;
    

    try {

        const quotedMessage = m.quoted;

        if (!quotedMessage || !quotedMessage.audioMessage) {

            return await m.reply("❌ Reply to an audio message" );
        }

        const audio = await downloadMediaMessage({ message: quotedMessage }, "stream");

        const filePath = `files/medias/audio/${number}.mp3`;

        const writeStream = createWriteStream(filePath);

        // Ensure the user exists in config and update path
        if (!m.config) configManager.config.users[number] = {};

        configManager.config.users[number].tagAudioPath = filePath;

        configManager.save(); // Save changes

        audio.pipe(writeStream);

        await m.reply("_Audio tag has been updated successfully_" );

    } catch (error) {

        console.error("_Error changing the tag audio:_", error);
    }
}export async function tag(m) {
    const remoteJid = m.chat;

    try {
        if (!m.isGroup) {
            await m.reply('_This command only works in group chats._' );
            return;
        }

        // Fetch group metadata
        const groupMetadata = await m.metadata;
        const participants = groupMetadata.participants.map(user => user.id);

        const text = m.textMessage || 'Hey everyone 👋🏾!';

        // Check if the message is quoting another message
        const quotedMessage = m.message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            // If the quoted message is a sticker, forward it
            if (quotedMessage.stickerMessage) {
                const sticker = quotedMessage.stickerMessage;
                await m.client.sendMessage(remoteJid, { sticker, mentions: participants });
                return;
            }

            // If a quoted message is text, reply with mentions
            const quotedText = quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || "";
            await m.client.sendMessage(remoteJid, { text: quotedText, mentions: participants});
            return;
        }

        // Default behavior (no quoted message)
        await m.client.sendMessage(remoteJid, { text: `${text}`, mentions: participants });

    } catch (error) {
        console.error("_Error mentioning all:_", error);
    }
}

export async function tagoption(m) {

    const number = m.myNumber;

    const option = m.textMessage

    if (!configManager.config.users[number]) return;

    try {

        if (option.toLowerCase().includes("on")) {

            configManager.config.users[number].response = true;

            configManager.save();

            await m.reply("_*Your tag response is enabled*_" );

        } else if (option.toLowerCase().includes("off")) {

            configManager.config.users[number].response = false;

            configManager.save();

            await m.reply("_*Your tag response is disabled*_" );

        } else {

            await m.reply("_*Select an option: On/off*_" );
        }
    } catch (error) {

        console.error("_Error changing the tag audio:_", error);
    }
}



export default { tagall, tagadmin, tagoption, settag, respond, tag };
