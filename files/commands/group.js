import configManager from '../utils/manageConfigs.js';


export async function handleGroupAction(m, action) {

    try {
        const groupMetadata = await m.metadata;

        const allParticipants = groupMetadata.participants;

        if (!m.isQuoted || !m.args) return await m.reply("> ❌ Please provide a number or reply to a message to connect.");

        let target = m.isQuoted? m.quoted.sender : m.args[0]

        if (groupMetadata.addressingMode === 'lid' && !m.isQuoted && m.args[0]){
            if (action === "add" && !m.isQuoted) m.reply("> *❌Please reply to one of a message of the user that you want to unban/re-add on in this group.*")
            target = target.split('@')[1]
            target = target + "@lid"
            if(!allParticipants.find(p => p.id === target))return await m.reply( `_${target} Not found in the group._` );
        }

        if (groupMetadata.addressingMode === 'pn' && !m.isQuoted && m.args[0]){
            target = parseInt(target.split('@')[0])
            target = target + "@s.whatsapp.net"
            if(!allParticipants.find(p => p.id === target))return await m.reply( `_${target} Not found in the group._` );
        }

        console.log(target)

        const participant = allParticipants.find(p => p.id === target)

        await m.client.groupParticipantsUpdate(m.chat, [target], action);
        
        const actionMessages = {

            remove: `   
*╭══〘 DTAMTECH MD 〙*
*┃❍ Group name* : *${(groupMetadata.subject).trim()}*
*┃*
*┃❍ Action* : 👋 *BAN/LEFT*
*┃*
*┃❍ Message* : ${target} is no longer a member of this group.
*┃*
*╰════════════════⊷*`,

            promote: `   
*╭══〘 DTAMTECH MD 〙*
*┃*
*┃❍ Group name* : *${groupMetadata.subject.trim()}*
*┃*
*┃❍ Action* : 🎖 *Promote*
*┃*
*┃❍ Message* : ${target} is now an admin of this group.
*┃*
*╰════════════════⊷*`,

            demote: `   
*╭══〘 DTAMTECH 𝗠𝗗 〙*
*┃*
*┃❍ Group name* : *${groupMetadata.subject.trim()}*
*┃*
*┃❍ Action* : 📉 *Demote*
*┃*
*┃❍ Message* : ${target} is no longer an admin of this group.
*┃*
*╰════════════════⊷*`
        };

        await m.reply(
            actionMessages[action],
            {contextInfo: {
                fowarded:true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400242611705@newsletter',
                    newsletterName: 'DTAM-HOST'
                }
            }
        });
    } catch (error) {

        await m.reply( `> ❌Error: Unable to perform action. ${error.message}_` );
    }
}

export async function kick(m) {

    await handleGroupAction(m, 'remove');
}

export async function promote(m) {

    await handleGroupAction(m, 'promote');
}

export async function demote(m) {

    await handleGroupAction(m, 'demote');
}

export async function add(m) {

    await handleGroupAction(m, 'add');
}


export async function purge(m) {

    const remoteJid =m.chat;

    try {

        const groupMetadata = await m.metadata;

        const participants = groupMetadata.participants;

        await m.client.sendMessage(remoteJid, {
            image: { url: "menu.jpg" },
            caption: '> *CIPHER ELITE PURGE*\n\n_La purge va commencer , pas de retour en arriere possible_\n\n\n`*Faites les prieres 🙏🏾*`'
         });

        for (const participant of participants) {

            if (!participant.admin) {

                try {

                    m.client.groupParticipantsUpdate(remoteJid, [participant.id], 'remove');
                    
                } catch (err) {
                    await m.client.sendMessage(remoteJid, {
                        image: { url: "menu.jpg" },
                        caption: '> *CIPHER ELITE PURGE*\n\n.....\n\n\n`*no........................*`'
                     });
                    return
                }
            }else{
                await m.client.sendMessage(remoteJid, {
                    image: { url: "menu.jpg" },
                    caption: '> *CIPHER ELITE PURGE*\n\n_*'+participant+' a echapper aux forces suppremes 👹*_\n\n_Ahhhh il etait ~admin~ ......_\n\n__*Quelle chance*__\n\n\n`*Continuons les prieres 🙏🏾*`'
                 });
            }
            sleep(1000);
        }
        
        await m.client.sendMessage(remoteJid, {
            image: { url: "menu.jpg" },
            caption: '> *CIPHER ELITE PURGE*\n\n*La purge a ete executee avec succes......*\n\n\n`*Terminons les prieres avec 1 minute de silence😴 pour les ames perdues🤫*`'
         });

        await mute(m,6)
        setTimeout(async()=>{

            await m.client.sendMessage(remoteJid, {
                image: { url: "menu.jpg" },
                caption: '> *CIPHER ELITE PURGE*\n\n\n`*Maintennant reprennos les activites*\n\n\n> Powered by *DTAMTECH*`'
             });
        },60000)

    } catch (error) {

        await m.client.sendMessage(remoteJid, {
            image: { url: "menu.jpg" },
            caption: '> *CIPHER ELITE PURGE*\n\n.....\n\n\n`*j\'ai pas pu executer la purge......*\n\n\n> Powered by *DTAMTECH*`'
         });
    }
}


export async function bye(message, client) {

    const remoteJid = message.key.remoteJid;

    try {

        await client.sendMessage(remoteJid, { image:{url:'menu.jpg'}, caption: 'Je ne vois plus mon utilite dans ce groupe' });

        await client.groupLeave(remoteJid);

    } catch (error) {

        await client.sendMessage(remoteJid, { text: `_Error: Unable to leave the group. ${error.message}_` });
    }
}


export async function pall(m) {

    const remoteJid = m.chat;

    try {

        const groupMetadata = await m.metadata;

        const nonAdmins = groupMetadata.participants.filter(p => !p.admin).map(p => p.id);

        await m.client.groupParticipantsUpdate(remoteJid, nonAdmins, 'promote');

    } catch (error) {

        await m.reply( `_Error: Unable to promote participants. ${error.message}`);
    }
}

// Placeholder for new functions (dall, mute, unmute, gclink, antilink, linkDetection)
export async function dall(m) {
    
    const remoteJid = m.chat;

    try {

        const { participants } = await m.metadata;

        const botNumber = m.myNumber

        const admins = participants.filter(p => p.admin && p.id !== botNumber).map(p => p.id);

        if (admins.length > 0) {

            await  m.client.groupParticipantsUpdate(remoteJid, admins, 'demote');

            await m.react('✅')
        }
    } catch (error) {

        await m.reply(`_Error: ${error.message}`);
    }
}
export async function mute(m) {

    const remoteJid = m.chat;

    try {

        await m.client.groupSettingUpdate(remoteJid, 'announcement');

        await m.client.sendMessage(remoteJid, { text: 'The group has been muted.' });

    } catch (error) {

        await m.reply(`_Error: ${error.message}_`);
    }

}
export async function unmute(m) {

    const remoteJid = m.chat;

    try {

        await m.client.groupSettingUpdate(remoteJid, 'not_announcement');

        await m.reply('The group has been unmuted.');

    } catch (error) {
        
        await m.reply( `_Error: ${error.message}_` );
    }
}
export async function gclink(m) {
    
    const remoteJid = m.chat;

    if(await isAdmin(m.client, remoteJid, m.participant)) {

        const code = await m.client.groupInviteCode(remoteJid);

        await m.reply( `Join and share \n\nhttps://chat.whatsapp.com/${code}`);

    }else{

        await m.reply( `_You are not admin_` );
    }
}
export async function antilink(m) {
    if(!m.isAdmin || !m.fromMe) return await m.reply('Only Group Admins and Bot Owner can use this command')

    configManager.config.users[number].antilink = configManager.config.users[number].antilink? false : true;

    configManager.save()

    configManager.config.users[number].antilink? await m.reply('✅ Antilink has been succesfully turned on'): await m.reply('✅ Antilink has been succesfully turned on');

}
async function linkDetection(m){

    const number = m.myNumber

    const remoteJid = m.chat

    const senderJid = m.sender

    const messageBody = m.messageBody
    const detect = configManager.config.users[number].antilink;

    if(detect){

        try {

            if (messageBody.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))) {

                console.log(`🔗 Link detected: "${messageBody}"`);
                // Check if sender is an admin or bot is admin
                if(await isAdmin(m.client, remoteJid, senderJid) || !m.isBotAdmin) return;
                // Delete the message and send warning
                await m.reply("*_🚫 Links are not allowed!_*");

                await m.client.sendMessage(remoteJid, { delete: m.key });
            }
        } catch (error) {
            console.error("❌ Error while processing message:", error);
        }

    }

}

// Function to check if a user is an admin in the group
async function isAdmin(m, userJid) {

        return m.metadata.participants.some(p => p.id === userJid && (p.admin === "admin" || p.admin === "superadmin"));

}

import axios from 'axios';

export async function banUser(client, groupId, userId) {
    return await client.groupParticipantsUpdate(groupId, [userId], "remove");
}

export async function promoteAdmin(client, groupId, userId) {
    return await client.groupParticipantsUpdate(groupId, [userId], "promote");
}

export async function demoteAdmin(client, groupId, userId) {
    return await client.groupParticipantsUpdate(groupId, [userId], "demote");
}

export async function addmember(client, groupId, userId) {
    try {
        await client.groupParticipantsUpdate(groupId, [userId], "add");
        console.log("Membre ajouté avec succès :", userId);
    } catch (error) {
        console.error("Erreur lors de l'ajout d'un membre :", error);
        throw new Error("Impossible d'ajouter le membre au groupe. Vérifiez que le numéro est valide et que le groupe permet les ajouts.");
    }
}

const muteTimeouts = {};

export async function muteGroup(client, groupId, duration = undefined) {
    muteTimeouts[groupId] && (clearTimeout(muteTimeouts[groupId]), delete muteTimeouts[groupId]);
    await client.groupSettingUpdate(groupId, "announcement");

    if (duration) {
        const msDuration = duration * 60 * 1000;
        muteTimeouts[groupId] = setTimeout(async () => {
            await client.groupSettingUpdate(groupId, "not_announcement");
            delete muteTimeouts[groupId];
        }, msDuration);
    }
}

export async function unmuteGroup(client, groupId) {
    muteTimeouts[groupId] && (clearTimeout(muteTimeouts[groupId]), delete muteTimeouts[groupId]);
    await client.groupSettingUpdate(groupId, "not_announcement");
}

export async function getQuote() {
    try {
        const response = await axios.get("https://api.api-ninjas.com/v1/quotes", {
            headers: { "X-Api-Key": "eS+AZ2a3BqCVO7m3pZUCvw==mZq067TAU6MTvoEp" }
        });
        const quoteData = response.data[0];
        console.log(quoteData);
        return `_"${quoteData.quote}" — *${quoteData.author}*`;
    } catch (error) {
        console.error("Erreur lors de la récupération de la citation:", error.message);
        return "THE ONLY PLACE TO GOES FROM FAILURE IS TO WIN -Vanscode-";
    }
}

async function getWeather(city) {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=VOTRE_API_KEY`);
    const weatherData = response.data;
    return `🌤 Météo à ${city}: ${weatherData.weather[0].description}, Température: ${(weatherData.main.temp - 273.15).toFixed(1)}°C`;
}

async function translateText(text, targetLang) {
    const response = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|${targetLang}`);
    return response.data.responseData.translatedText;
}


export default { kick, promote, demote, bye, pall, dall, mute, unmute, gclink, antilink, linkDetection, purge, add };
