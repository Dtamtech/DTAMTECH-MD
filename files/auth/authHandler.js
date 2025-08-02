import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    generateWAMessageFromContent,
    downloadContentFromMessage
} from 'baileys';

import {
    imageToWebp,
    writeExifImg,
} from'../utils/exif.js'

import configManager from '../utils/manageConfigs.js';

import readline from 'readline';

import { Boom } from "@hapi/boom";

import chalk from "chalk"

import pino from 'pino'

import proto from "baileys";

import fs from "fs";
import path from "path";

const PATH = 'files/auth_info_baileys'

async function prompt(question) {

    return new Promise((resolve) => {

        const rl = readline.createInterface({

            input: process.stdin,

            output: process.stdout,
        });

        rl.question(`\n${question}`, (input) => {

            rl.close();
            resolve(input);
        });
    });
}

function clearDirectory(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath);

        for (const file of files) {
            const filePath = path.join(directoryPath, file);

            const stat = fs.statSync(filePath);

            if (stat.isFile()) {
                fs.unlinkSync(filePath);
            }
        }

        console.log(chalk.green.bold('\n\nAll files have been deleted successfully!\n.'));
    } catch (error) {
        console.error(chalk.red.bold('\n\nError while trying to delete files:', error));
    }
}

async function removeSession(){
    const choice = await prompt('Do you really want to delete your current session Y/N ?');
    const confirm = (choice.toString()).toLowerCase() === 'y'
    return confirm ? clearDirectory(PATH) : console.log(chalk.yellow.bold("Permission denied !"))
}

async function connectToWhatsApp(handleMessage, handleGroupUpdate) {
    
    const { state, saveCreds } = await useMultiFileAuthState(PATH);

    const sock = makeWASocket({ 
        auth: state,

        logger: pino({level:"fatal"}),

        printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {

        const { connection, lastDisconnect} = update

        if (connection === 'close') {

            const reason = new Boom(lastDisconnect?.error)?.output.statusCode

            if (reason === DisconnectReason.connectionLost) {
                console.log(chalk.red.bold('Connection lost'));
                console.log(chalk.yellow.bold('Reconnecting...'));
                await connectToWhatsApp(
                    handleMessage,
                    handleGroupUpdate
                )
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log(chalk.red.bold('Connexion Closed'));
                console.log(chalk.yellow.bold('Reconnecting...'));
                await connectToWhatsApp(
                    handleMessage,
                    handleGroupUpdate
                )
    
            } else if (reason === DisconnectReason.restartRequired) {
                await console.log(chalk.yellow.bold('\nRestart required.\n\nReconnecting... '));
                await connectToWhatsApp(
                    handleMessage,
                    handleGroupUpdate
                )
            } else if (reason === DisconnectReason.timedOut) {
                await console.log(chalk.red.bold('Connection Timeout'));
                console.log(chalk.yellow.bold('\nReconnecting...'));
                await connectToWhatsApp(
                    handleMessage,
                    handleGroupUpdate
                )
            } else if (reason === DisconnectReason.badSession) {
                await console.log(chalk.red.bold('\nBad session. Attempting to delete current session files...'));
                (state.creds.registered)? console.log(chalk.green.bold('\nRestarting...')):async ()=>{
                    await removeSession()
                    console.log(chalk.green.bold('\nRestarting...'))
                }
                await connectToWhatsApp(
                    handleMessage,
                    handleGroupUpdate
                )
            } else if (reason === DisconnectReason.connectionReplaced) {
                await console.log(chalk.green.bold('\nVeillez fermer la session courante et ressayer...'));
                await connectToWhatsApp(
                    handleMessage,
                    handleGroupUpdate
                )
            } else {		
                sock.end(`Unknown DisconnectReason : ${reason}|${connection}`)
            }
        }else if (connection === 'connecting') {
            console.log(chalk.yellow.bold(`\nCONNECTING. . . .`));
        }else if (connection === 'open') {

            console.log(chalk.green.bold(`\nDTAMBOT Connected ✓\n\n`))
            setTimeout(async () => {
                await sock.sendMessage(sock.user?.id?.split(":")[0] + "@s.whatsapp.net", {
                    text: `*DTAMTECH MD CONNECTED 😆*\nHey ${sock.user?.name || sock.user?.id?.split(':')[0]} 👋 I'm ready to start !\nType .menu to see all available context actions`,
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363400242611705@newsletter',
                            newsletterName: 'DTAM-HOST'
                        },
                        externalAdReply: {
                            title: `Join Our WhatsApp Channel`,
                            body: `DTAMTECH MD`,
                            thumbnailUrl: 'https://img1.pixhost.to/images/5332/592865999_skyzopedia.jpg',
                            sourceUrl: 'https://whatsapp.com/channel/0029Vb66gGi6WaKeWjuQk333',
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                })
            },30000)
        }
    })

    setTimeout(async () => {

        if (!state.creds.registered) {

            await console.log(chalk.blue.bold(`
        ⣤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⢤⣤⣀⣀⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⡼⠋⠀⣀⠄⡂⠍⣀⣒⣒⠂⠀⠬⠤⠤⠬⠍⠉⠝⠲⣄⡀⠀⠀
⠀⠀⠀⢀⡾⠁⠀⠊⢔⠕⠈⣀⣀⡀⠈⠆⠀⠀⠀⡍⠁⠀⠁⢂⠀⠈⣷⠀⠀
⠀⠀⣠⣾⠥⠀⠀⣠⢠⣞⣿⣿⣿⣉⠳⣄⠀⠀⣀⣤⣶⣶⣶⡄⠀⠀⣘⢦⡀
⢀⡞⡍⣠⠞⢋⡛⠶⠤⣤⠴⠚⠀⠈⠙⠁⠀⠀⢹⡏⠁⠀⣀⣠⠤⢤⡕⠱⣷
⠘⡇⠇⣯⠤⢾⡙⠲⢤⣀⡀⠤⠀⢲⡖⣂⣀⠀⠀⢙⣶⣄⠈⠉⣸⡄⠠⣠⡿
⠀⠹⣜⡪⠀⠈⢷⣦⣬⣏⠉⠛⠲⣮⣧⣁⣀⣀⠶⠞⢁⣀⣨⢶⢿⣧⠉⡼⠁
⠀⠀⠈⢷⡀⠀⠀⠳⣌⡟⠻⠷⣶⣧⣀⣀⣹⣉⣉⣿⣉⣉⣇⣼⣾⣿⠀⡇⠀
⠀⠀⠀⠈⢳⡄⠀⠀⠘⠳⣄⡀⡼⠈⠉⠛⡿⠿⠿⡿⠿⣿⢿⣿⣿⡇⠀⡇⠀
⠀⠀⠀⠀⠀⠙⢦⣕⠠⣒⠌⡙⠓⠶⠤⣤⣧⣀⣸⣇⣴⣧⠾⠾⠋⠀⠀⡇⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠙⠶⣭⣒⠩⠖⢠⣤⠄⠀⠀⠀⠀⠀⠠⠔⠁⡰⠀⣧⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠲⢤⣀⣀⠉⠉⠀⠀⠀⠀⠀⠁⠀⣠⠏⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠛⠒⠲⠶⠤⠴⠒⠚⠁⠀

                Welcome!\n`
            ));

            try {

                let number = await prompt('📲 Enter your WhatsApp number (with country code, e.g., 237xxxx): ');
                number = number.trim();

                console.log(`\n🔄 Requesting a pairing code for ${number}`);

                const code = await sock.requestPairingCode(number);

                console.log(`\n📲 Pairing Code: ${code}`);
                
                console.log('\n👉 Enter this code on your WhatsApp app to pair.');


                configManager.config.users[`${number}`] = {
                    sudoList: [

                    ],
                    tagAudioPath: "tag.mp3",
                    antidel: false,
                    antibug:{
                        activated:true,
                        sanction:0
                    },
                    response: true,
                    autoreact: false,
                    autorespond: false,
                    autoviewstatus: false,
                    autoreadgroupmessage: false,
                    autoreadmessage:false,
                    autotyping: false,
                    autorecording: false,
                    autotag:false,
                    alwaysonline:false,
                    welcomemsg: false,
                    leavemsg: false,
                    prefix: ".",
                    reaction: "🧡",
                    private: true
                };

                configManager.save();
            } catch (error) {

                await console.log(chalk.red.bold(`\nError requesting pairing code: \n\n${error}`));
                await removeSession()
                await connectToWhatsApp(handleMessage, handleGroupUpdate);
            }
        }
    }, 5000);

    sock.ev.on('messages.upsert', async (event) => handleMessage(event, sock));
    sock.ev.on('group-participants.update',async (event)=>{
        console.log(JSON.stringify(event));
        const groupId = event.id;
        const participants = event.participants;
        const action = event.action
        const actionAuthor = event.author
        const groupMetadta = (await sock.groupMetadata(groupId))
        console.log(chalk.blue.bold(`\nNew member update on ${groupMetadta.subject}(ID :${groupId} )\nUpdate: ${action}\nUsers: ${participants}\nAction by ${actionAuthor}`))
    })
    sock.joinGroup = async (inviteCode) => {
        try {
            const joinResult = await sock.groupAcceptInvite(inviteCode);
            return true;
        } catch (error) {
            console.error(chalk.red.bold("Error while trying to accept invite code:", error));
            return false;
        }
    }

    sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path)
            ? path
            : /^data:.*?\/.*?;base64,/i.test(path)
                ? Buffer.from(path.split`, `[1], 'base64')
                : /^https?:\/\//.test(path)
                    ? await (await getBuffer(path))
                    : fs.existsSync(path)
                        ? fs.readFileSync(path)
                        : Buffer.alloc(0);

        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await imageToWebp(buff);
        }

        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    sock.sendButtonImg = async (jid, buttons = [], text, image, footer, quoted = '', options = {}) => {
        const buttonMessage = {
            image: { url: image },
            caption: text,
            footer: footer,
            buttons: buttons.map(button => ({
                buttonId: button.id || '',
                buttonText: { displayText: button.text || 'Button' },
                type: button.type || 1
            })),
            headerType: 1,
            viewOnce: options.viewOnce || false,
        }

        await sock.sendMessage(jid, buttonMessage, { quoted })
    }

    sock.sendList = async (jid, title, footer, btn, quoted = '', options = {}) => {
        let msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    "messageContextInfo": {
                        "deviceListMetadata": {},
                        "deviceListMetadataVersion": 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        ...options,
                        body: proto.Message.InteractiveMessage.Body.create({ text: title }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || "puqi" }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    "name": "single_select",
                                    "buttonParamsJson": JSON.stringify(btn)
                                },
                            ]
                        })
                    })
                }
            }
        }, { quoted })
        return await sock.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id
        })
    }

    sock.sendButtonProto = async (jid, title, footer, buttons = [], quoted = '', options = {}) => {
        let msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    "messageContextInfo": {
                        "deviceListMetadata": {},
                        "deviceListMetadataVersion": 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        ...options,
                        body: proto.Message.InteractiveMessage.Body.create({ text: title }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || "puqi" }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: buttons
                        })
                    })
                }
            }
        }, { quoted })
        return await sock.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id
        })
    }


    sock.ments = (text = '') => {
        return text.match('@') ? [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net') : []
    };

    sock.cMod = (jid, copy, text = '', sender = sock.user.id, options = {}) => {
        let mtype = Object.keys(copy.message)[0];
        let isEphemeral = mtype === 'ephemeralMessage';
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
        let content = msg[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content.caption) content.caption = text || content.caption;
        else if (content.text) content.text = text || content.text;
        if (typeof content !== 'string') msg[mtype] = {
            ...content,
            ...options
        };
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = sender === sock.user.id;
        return proto.WebMessageInfo.fromObject(copy);
    }

    sock.sendText = (jid, text, quoted = '', options) => sock.sendMessage(jid, { text: text, ...options }, { quoted });

    sock.deleteMessage = async (chatId, key) => {
        try {
            await sock.sendMessage(chatId, { delete: key });
            console.log(chalk.blue.bold(`\nMessage with ID ${key.id} from ${chatId} deleted successfully.`));
        } catch (error) {
            console.error(chalk.red.bold('\nError when trying to delete message :'), error);
        }
    };

    sock.downloadMediaMessage = (message,messageType) => {
        const stream = downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
    }

    return sock;
}

export default connectToWhatsApp;

