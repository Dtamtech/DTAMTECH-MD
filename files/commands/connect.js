import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';

import handleIncomingMessage from '../events/messageHandler.js';

import configManager from '../utils/manageConfigs.js';

import { Boom } from "@hapi/boom";

import log from '../utils/Log.js';

import chalk from "chalk"
    
import P from 'pino'

import fs from "fs";

const SESSIONS_FILE = "./files/sessions.json";

const sessions = {};

function saveSessionNumber(number) {

    let sessionsList = [];

    if (fs.existsSync(SESSIONS_FILE)) {

        try {

            const data = JSON.parse(fs.readFileSync(SESSIONS_FILE));

            // Ensure sessionsList is an array
            sessionsList = Array.isArray(data.sessions) ? data.sessions : [];

        } catch (err) {

            console.error("Error reading sessions file:", err);

            sessionsList = [];
        }
    }

    if (!sessionsList.includes(number)) {

        sessionsList.push(number);

        fs.writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions: sessionsList }, null, 2));

    }
}

async function removeSession(number) {

    await log(`❌ Removing session data for ${number} due to failed pairing.`,'orange');

    if (fs.existsSync(SESSIONS_FILE)) {

        let sessionsList

        try {

            const data = JSON.parse(fs.readFileSync(SESSIONS_FILE));

            sessionsList = Array.isArray(data.sessions) ? data.sessions : [];

        } catch (err) {

            console.error("Error reading sessions file:", err);

            sessionsList = [];
        }

        sessionsList = sessionsList.filter(num => num !== number);

        fs.writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions: sessionsList }, null, 2));
    }

    const sessionPath = `./files/sessions/${number}`;

    if (fs.existsSync(sessionPath)) {

        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    delete sessions[number];

    await log(`✅ Session for ${number} fully removed.`,'green');
}

async function startSession(m) {

    const targetNumber = m.targetNumber ;

    if (!targetNumber) return await m.reply('Provide a number or reply to a message to connect an user');

    await log("Starting session for:", targetNumber);

    const sessionPath = `./files/sessions/${targetNumber}`;

    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({ 
        auth: state, 
        logger: P({ level: "silent" }),
        printQRInTerminal: false, 
        syncFullHistory: false 
        });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
    
            const { connection, lastDisconnect } = update
    
            if (connection === 'close') {
    
                const reason = new Boom(lastDisconnect?.error)?.output.statusCode
    
                if (reason === DisconnectReason.connectionLost) {
    
                    await log('La connexion a été perdue. Ressayez dans quelques intants...');
                    await startSession(m)
                
                } else if (reason === DisconnectReason.connectionClosed) {

                    await log('La connexion a été fermée\n\n\nAttempting to Reconnect...');
                    
        
                } else if (reason === DisconnectReason.restartRequired) {
                    await log('Redémarrage requis... ');
                    await startSession(m)
                } else if (reason === DisconnectReason.timedOut) {
                    await log('La connexion à expirée\n\n\nAttempting to Reconnect...');

                } else if (reason === DisconnectReason.badSession) {
                    await log('Bad session...');
                    removeSession(targetNumber)
                    await startSession(m)
                } else if (reason === DisconnectReason.connectionReplaced) {
                    await log('Veillez fermer la session courante et ressayer...');
                    await startSession(m)
                } else {		
                    sock.end(`Unknown DisconnectReason : ${reason}|${connection}`)
                }
            }else if (connection === 'open') {
    
                log(`✅ Session open for ${targetNumber}`);
                await sock.sendMessage(sock.user.id.split(":")[0] + "@s.whatsapp.net", {
                    image: {url: "files/medias/images/md1.jpg"},
                    caption: `*DTAMTECH MD CONNECTED 😆*`})
                console.log(chalk.blue.bold(`DTAMBOT Connected for ${targetNumber} ✓\n\n`))
    
            }
        })
    
    
    setTimeout(async () => {

        if (!state.creds.registered) {

            await log(`\n🔄 Requesting a pairing code for ${targetNumber}`);

            const code = await sock.requestPairingCode(targetNumber);

            await m.reply('Your Pairing Code is:\n> *' + code+'*\n\n_Enter this code on your Whatsapp app to connect._');
        }
    }, 5000);

    setTimeout(async () => {

        if (!state.creds.registered) {

            await log(`❌ Pairing failed or expired for ${targetNumber}. Removing session.`);
    
            m.reply(`> ❌ Pairing failed or expired for ${targetNumber}. You need to reconnect wait 1 minute.`);
    
            removeSession(targetNumber);
    
        }else{
            m.reply(`> Connection etablished successfully for ${targetNumber}.`);
        }
        
    }, 120000);

    configManager.config.users[`${targetNumber}`] = {
        sudoList: [

        ],
        tagAudioPath: "tag.mp3",
        antilink: false,
        antiwalink: false,
        antidel: false,
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

    sock.ev.on('messages.upsert', async (msg) => handleIncomingMessage(msg, sock));

    sock.ev.on('creds.update', saveCreds);

    sessions[targetNumber] = sock;

    saveSessionNumber(targetNumber);
    
    await log(`✅   Session established for ${targetNumber}`,'green');

    return sock;
}

async function reconnectall(m) {

    if (!fs.existsSync(SESSIONS_FILE)) return;

    
    const data = JSON.parse(fs.readFileSync(SESSIONS_FILE));

    const sessionNumbers = Array.isArray(data.sessions) ? data.sessions : [];

    for(let number in sessionNumbers) {
        
        await log('💢💢💢Trying to reconnect'+number)
        try {
            m.targetNumber = number;
            await startSession(m)
            await log('✅ ✅ ✅ '+number+' Was reconnected succesfully')
            await m.reply("✅ ✅ ✅ "+number+" reconnected succesfully.");
            
        } catch (error) {

            await log('❌ ❌ ❌ the reconnection of '+number+' have failed')

            await m.reply("❌ ❌ ❌ the reconnection of "+number+" have failed.");

        }

    }
    
}

async function connect(m) {

    let targetNumber = m.args[0]
    // Handle reply to message
    if (m.isQuoted) targetNumber = m.quoted.sender.split('@')[0];

    if (!targetNumber) return await m.reply("> ❌ Please provide a number or reply to a message to connect.");

    targetNumber = targetNumber.replace('@s.whatsapp.net', '').trim();
    m.targetNumber = targetNumber;
    await startSession(m);
    await log('✅   ✅   ✅  '+ targetNumber+' Was connected succesfully','green')

}

async function reconnect(m) {

    let targetNumber = m.args[0]
    // Handle reply to message
    if (m.isQuoted) targetNumber = m.quoted.sender.split('@')[0];

    if (!targetNumber) return await m.reply("> ❌ Please provide a number or reply to a message to connect.");

    targetNumber = targetNumber.replace('@s.whatsapp.net', '').trim();

    console.log("Checking connection for:", targetNumber);

    if (sessions[targetNumber]) {

        try {
            m.targetNumber = targetNumber;
            await startSession(m);

        } catch (error) {
            await m.reply("An Error occured when trying to reconnect" + targetNumber);
        }

    } else {

        m.reply("This number is already connected.");
    }
}


export default { connect, reconnect, reconnectall };
