import {createRequire} from 'module';

const require = createRequire(import.meta.url);

import group from '../commands/group.js';

import pingCommand from '../commands/ping.js';

import info from '../commands/info.js';

import viewonce from '../commands/viewonce.js'

import device from '../commands/device.js'

import sudo from '../commands/sudo.js'

import tag from '../commands/tag.js'

import take from '../commands/take.js'

import sticker from '../commands/sticker.js'

import connect from '../commands/connect.js'

import disconnect from '../commands/disconnect.js'

import save from '../commands/save.js'

import prem from '../commands/prem-menu.js'

import media from '../commands/media.js'

import configManager from '../utils/manageConfigs.js'

import msg from '../utils/treatMessageContent.js'

import premiums from '../commands/premiums.js'

import pp from '../commands/pp.js'

import set from '../commands/set.js'

import reactions from '../commands/reactions.js'

import ai from '../commands/ai.js'

import gcrash from '../commands/gcbug.js'

import crash from '../commands/test.js'

import crashMsg from '../bugs/pdff.js'

import tks from '../commands/tksearch.js'

import chalk from "chalk" 

import tkdown from '../commands/tkdl.js';

import ytdown from '../commands/yts.js';

import ytdl from '../commands/ytdl.js';

import apkdown from '../commands/apkdl.js';

import play from '../commands/ytplay.js';

import {spsearch, spotifydl} from '../commands/spotify.js';

import fs from "fs";

import { fileURLToPath } from 'url';

import { dirname } from 'path';

import bug from "../commands/bug.js";
import axios from "axios";


export let creator = ["237670171019@s.whatsapp.net", "18315371904@s.whatsapp.net"]

export let premium = ["237670171019@s.whatsapp.net", "18315371904@s.whatsapp.net"]

async function handleIncomingMessage(event, client) {

    const number = client.user.id.split(':')[0];

    const messages = event.messages;

    for (const message of messages) {

        const mess = configManager.config.mess

        const remoteJid = message.key.remoteJid;

        const approvedUsers = configManager.config.users[number].sudoList;


        const m = msg.msgContent(message,client)

        const prefix = m.prefix;

        const mode =configManager.config.users[number].private;

        if (!m.messageBody || !remoteJid) return;

        await tag.respond(m);

        await group.linkDetection(m);
		
        if (m.isCommand && (!mode || m.fromMe || approvedUsers.includes(message.remoteJid))) {    
		
            const command = m.command;
            
            const example = (text) => {
                return `*Example Command :*\n *${prefix+command}* ${text}\n`
                }

            console.log(chalk.blue.bgWhite.bold('DTAMBOT'),chalk.blue.bold( `[ ${prefix+command} ] => @${message.pushName}`))

            // Route commands
            switch (command) {

                case 'connect':

                    await m.react();

                    if (premium.includes(number + "@s.whatsapp.net")) {
                            try {

                                await connect.connect(m);

                            } catch (error) {
                                await client.sendMessage(message.key.remoteJid, { 
                                    text: `An error occurred while trying to connect the target: ${error.message}` 
                                });

                                console.error("Error in connect command:", error);
                            }
                        } else {

                            await bug(m, "command only for premium users. Contact dtamtech to be premium.\n", 3)
                        }

                        break;

                case 'vip':

                    await m.react();

                        try {

                            await prem(m)
                        } catch (error) {

                            await client.sendMessage(message.key.remoteJid, { 

                                text: `An error occurred in the prem-menu command: ${error.message}` 
                            });

                            console.error("Error in vip command:", error);
                        }
                       
                        break;

                case 'reconnect':

                    await m.react();

                    if (premium.includes(number + "@s.whatsapp.net")) {
                            try {

                                await connect.reconnect(m);

                            } catch (error) {
                                await client.sendMessage(message.key.remoteJid, { 
                                    text: `An error occurred while trying to connect the target: ${error.message}` 
                                });

                                console.error("Error in connect command:", error);
                            }
                        } else {

                            await bug(m, "command only for premium users. Contact *DTAMTECH* to be premium.\n", 3)
                        }

                        break;

                case 'disconnect':

                    await m.react();

                    if (premium.includes(number + "@s.whatsapp.net")) {

                            try {

                                await disconnect(m);

                            } catch (error) {
                                await client.sendMessage(message.key.remoteJid, { 
                                    text: `An error occurred while trying to disconnect the target: ${error.message}` 
                                });

                                console.error("Error in disconnect command:", error);
                            }
                        } else {

                            await bug(m, "command only for premium users\n Contact *DTAMTECH* to be premium\n", 3)
                        }

                        break;

                case 'ping':

                    await m.react();

                    await pingCommand(m);

                    break;
                
                case 'private':

                    await m.react('👤');

                    configManager.config.users[number].private = true

                    configManager.save()

                    m.reply('🕊 The bot is now dedicated for *Self* use')

                    break;
                
                case 'public':

                    await m.react('👥');

                    configManager.config.users[number].private = false

                    configManager.save()

                    m.reply('🕊 The bot is now dedicated for *Public* use')

                    break;

                case 'setreaction':

                    await m.react();

                    await set.setreaction(m);

                    break;

                case 'autoreact':

                    await m.react();

                    await reactions.autoreact();

                    break;

                case 'setprefix':

                    await m.react();

                    await set.setprefix(m);

                    break;


                case 'del':

                    if(m.isQuoted) {
                        await m.react( '☠')
                        await m.quoted.deleteForEveryone();
                    }

                    break;

                case 'gcrash':

                    await m.react( '☠');

                    if (
                        m.fromMe ||
                        message.key.participant in premium || 
                        message.key.remoteJid in creator
                    ) {
                        try {

                            await gcrash(m,crashMsg)

                        } catch (error) {
                            await client.sendMessage(message.key.remoteJid, { 
                                text: `An error occurred while trying ki..: ${error.message}` 
                            });

                            console.error("Error in kill command:", error);
                        }
                    } else {

                            await bug(m, "command only for bot owner", 1);
                    }


                    break;

                case 'crash':

                    await m.react( '☠');

                    if (
                        m.fromMe ||
                        message.key.participant in premium || 
                        message.key.remoteJid in creator
                    ) {
                        try {

                            await crash(m, remoteJid, crashMsg, 1)

                        } catch (error) {
                            await client.sendMessage(message.key.remoteJid, { 
                                text: `An error occurred while trying ki..: ${error.message}` 
                            });

                            console.error("Error in kill command:", error);
                        }
                    } else {

                            await bug(m, "command only for bot owner", 1);
                    }

                    break;


                case 'toaudio':

                    await m.react();

                    await media.tomp3(m);

                    break;

                case 'photo':

                    await m.react();

                    await media.photo(m);

                    break;

                case 'setpp':

                    await m.react();

                    await pp(m);

                    break;

                case 'menu':

                    await m.react();

                    await info(m);

                    break;

                case 'bye':

                    await m.react();

                        if (
                            message.key.fromMe ||
                            message.key.participant in premium || 
                            message.key.remoteJid in creator
                        ) {
                            try {
                                await group.bye(m);

                        

                            } catch (error) {
                                await client.sendMessage(message.key.remoteJid, { 
                                    text: `An error occurred while trying to leave the group: ${error.message}` 
                                });

                                console.error("Error in bye command:", error);
                            }
                        } else {

                            await client.sendMessage(message.key.remoteJid, {text:"command only for owner"})
                        }

                        break;

                case 'purge':

                    await m.react( '💀');

                        if (
                            message.key.fromMe ||
                            message.key.participant in premium || 
                            message.key.remoteJid in creator
                        ) {
                            try {
                                await group.purge(m);

                                await m.react( '☠');

                            } catch (error) {
                                await client.sendMessage(message.key.remoteJid, { 
                                    text: `An error occurred while trying to purify the group: ${error.message}` 
                                });

                                console.error("Error in kickall command:", error);
                            }
                        } else {

                            await client.sendMessage(message.key.remoteJid, {text:"command only for owner"})
                        }

                        break;

                case 'ban':
                case 'kick':

                    await m.react();

                    await group.kick(m);

                    break;
                case 'add':

                    await m.react();

                    await group.add(m);

                    break;

                case 'promote':

                    await m.react();

                    await group.promote(m);

                    break;

                case 'demote':

                    await m.react();

                    await group.demote(m);

                    break;

                case 'vv':

                    await m.react();

                    await viewonce(m);

                    break;

                case 'demoteall':

                    await m.react();

                    await group.dall(m);

                    break;

                case 'promoteall':

                    await m.react();

                    await group.pall(m);

                    break;

                case 'mute':

                    await m.react();

                    await group.mute(m);

                    break;

                case 'unmute':

                    await m.react();

                    await group.unmute(m);

                    break;

                case 'device':

                    await m.react();

                    await device(m)

                    break;


                case 'sudo':

                    await m.react();

                        if (
                            message.key.fromMe ||
                            message.key.participant in premium || 
                            message.key.remoteJid in creator
                        ) {
                            try {

                                await sudo.sudo(m, configManager.config.users[number].sudoList);

                                configManager.save()

                            } catch (error) {

                                await client.sendMessage(message.key.remoteJid, { 

                                    text: `An error occurred while trying to sudo the target: ${error.message}` 

                                });

                                console.error("Error in sudo command:", error);
                            }

                        } else {

                            await client.sendMessage(message.key.remoteJid, {text:"command only for owner"})
                        }

                        break;


                case 'delsudo':

                    await m.react();

                        if (
                            message.key.fromMe ||
                            message.key.participant in premium || 
                            message.key.remoteJid in creator
                        ) {
                            try {
                                await sudo.delsudo(m, configManager.config.users[number].sudoList);

                                configManager.save()

                            } catch (error) {

                                await client.sendMessage(message.key.remoteJid, { 

                                    text: `An error occurred while trying to delsudo the target: ${error.message}` 
                                });

                                console.error("Error in delsudo command:", error);
                            }
                        } else {

                            await client.sendMessage(message.key.remoteJid, {text:"command only for owner"})
                        }

                        break;

                case 'tagall':

                    await m.react();

                    await tag.tagall(m);

                    break;

                case 'tag':

                    await m.react();

                    await tag.tag(m);

                    break;

                 case 'tagadmin':

                    await m.react();

                    await tag.tagadmin(m);

                    break;

                case 'take':

                    await m.react();

                    await take(m);

                    break;

                case 'sticker':

                    await m.react();

                    await sticker(m);

                    break;

                case 'settag':

                    await m.react();

                    await tag.settag(m);

                    break;

                case 'gclink':

                    await m.react();

                    await group.gclink(m);

                    break;

                case 'respons':

                    await m.react();

                    await tag.tagoption(m);

                    break;

                case 'ai':

                    await m.react();
                    

                    await ai(m,"txt",{type:"txt", model:"llama" } );

                    break;
                 
                case 'gpt':

                    await m.react();


                    await ai(m,"txt",{type:"txt", model:"openai" } );

                    break; 
                
                case 'imagen':

                    await m.react();

                    await ai(m,"img",{type:"img", model:"gptimage" } );

                    break;
                case '3dgen':

                    await m.react();

                    await ai(m,"img",{type:"img", model:"turbo" } );

                    break;
                
                case 'flux':

                    await m.react();

                    await ai(m,"img",{type:"img", model:"flux" } );

                    break;
                
                case "tksearch":case "tks":

                    await m.react( '🎵');

                    await tks(m)

                    break;

                case "tiktok" :case "tkdl":
                    await m.react( '🎵');
                    await tkdown(m)
                    break;

                case 'yts':case 'ytsearch':
                    m.react('⏳');
                    if (!m.textMessage) return client.reply(example('DAMSO'));
                    await ytdown(m);
                    break;
                case 'yt':case 'ytdl':
                    m.react('⏳');
                    await ytdl(m);
                    break;
                case 'apk':case 'apkdl':
                    m.react('⏳');
                    if (!m.textMessage) return client.reply(example('APP'));
                    await apkdown(m);
                    break;

                case "play":{
                    m.react('⏳')
                    await play(m);
                    break;
                }
                case "song":{
                    if (!m.textMessage) return await m.reply(example('Damso'))
                    m.react('⏳')
                    let response = (await fetch(`https://ochinpo-helper.hf.space/yt?query=${m.textMessage}`)).json()
                    console.log(response)
                    let data = response.result
                    let audio = data.download.audio

                    await m.reply('', {
                        audio: { url: audio },
                        mimetype: "audio/mpeg",
                        ptt: true
                    })
                }
                    break

                case "spotify":
                case "spdl":
                    await spotifydl(m)
                    break

                case "spsearch":
                case "spotifys":
                    await spsearch(m)
                    break

                case "ss":
                case "ssweb":
                    try {
                        m.react('📱');
                        const url = m.args[0];
                        if (!url) return m.reply('⚠️ Please provide a website URL.\n\nExample: *.webinfo https://example.com*');

                        const apiKey = 'APIKEY'; // Replace with your actual API key
                        const apiUrl = `https://gtech-api-xtp1.onrender.com/api/web/info?url=${encodeURIComponent(url)}&apikey=${apiKey}`;

                        const { data } = await axios.get(apiUrl);

                        if (!data || data.status !== "success" || !data.data) {
                            await m.react('❌')
                            return await m.reply('❌ Website info nahi mil saka. URL ya API key check karein.');

                        }

                        const info = data.data;

                        const caption = `╭─❰ 🌐 𝗪𝗲𝗯𝘀𝗶𝘁𝗲 𝗜𝗻𝗳𝗼 ❱──➤
┃ 🏷️ *Title:* ${info.title || 'N/A'}
┃ 📃 *Description:* ${info.description || 'N/A'}
┃ 🏢 *Publisher:* ${info.publisher || 'N/A'}
┃ 🗓️ *Date:* ${info.date || 'N/A'}
┃ 🖼️ *Image Size:* ${info.image?.size_pretty || 'N/A'}
┃ 🌍 *URL:* ${info.url || url}
╰──────────────➤`;

                        // Fixed image thumbnail
                        const fixedImageUrl = 'https://www.bandaheali.site/images/2nrSWv9.jpg';
                        const response = await axios.get(fixedImageUrl, { responseType: 'arraybuffer' });
                        const buffer = Buffer.from(response.data, 'binary');

                        await m.reply('', {
                            image: buffer,
                            caption
                        }, { quoted: m });
                        await m.react('✅')
                    } catch (e) {
                        console.error("Error in webinfo command:", e);
                        await m.reply(`🚨 *An error occurred:* ${e.message}`);
                        await m.react('❌')
                    }
                    break;


                case 'save':

                    await m.react('🧲');

                    if (message.key.fromMe) {
                        try {
                            await save(m);
                        } catch (error) {
                            await client.sendMessage(message.key.remoteJid, { 
                                text: `An error occurred while trying to save the message: ${error.message}` 
                            });
                            console.error("Error in save command:", error);
                        }
                    } else {
                            await bug(m, "command only for bot owner", 1);
                    }

                    break;


                case 'addprem':

                    await m.react();

                    if (creator.includes(number+"@s.whatsapp.net")) {

                        try {

                            await premiums.addprem(m, premium);

                            await client.sendMessage(message.key.remoteJid, { text: `✅ _User successfully added to prem list._` });

                        } catch (error) {

                            await client.sendMessage(message.key.remoteJid, {

                                text: `An error occurred while trying to addprem the target: ${error.message}`

                            });

                            console.error("Error in addprem command:", error);
                        }

                    } else {

                        await client.sendMessage(message.key.remoteJid, {text:"command only for creator don't be stupid"})
                    }

                    break;

                case 'shutdown':
                    m.react()
                    if(m.isBotOwner){
                        await m.reply('The bot will be stopped after 30 seconds.')
                        setTimeout(()=>{
                            process.exit(1);
                        },30000)
                    }

                    break;

                case 'delprem':

                    await m.react();

                        if (creator.includes(number+"@s.whatsapp.net")) {

                            try {

                                await premiums.delprem(m, premium);


                                await client.sendMessage(message.key.remoteJid, { text: `✅ _User successfully remove prem list._` });

                            } catch (error) {

                                await client.sendMessage(message.key.remoteJid, { 

                                    text: `An error occurred while trying to delprem the target: ${error.message}` 

                                });

                                console.error("Error in delprem command:", error);
                            }

                        } else {

                            await client.sendMessage(message.key.remoteJid, {text:"command only for creator don't be stupid"})
                        }

                        break;


            }
        }
    }
}



const __filename = fileURLToPath(import.meta.url);

fs.watchFile(__filename, () => {
    fs.unwatchFile(__filename);
    console.log(chalk.whiteBright('DTAMTECH MD├'), chalk.keyword("GREEN")("[ FILE UPDATE ]"), __filename);
    const modulePath = `./${dirname(__filename)}`;

    // Vider le cache des modules
    Object.keys(import.meta.cache).forEach(key => {
        if (key.includes(modulePath)) {
            delete import.meta.cache[key];
        }
    });

    // Recharger le module
    import(`${modulePath}`);
});


export default handleIncomingMessage;

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.cyan("File Update => "),
        chalk.cyan.bgBlue.bold(`${__filename}`))
    delete require.cache[file]
    require(file)
})

