import bug from "./bug.js";

export async function pingCommand(m) {

    const startTime = Date.now();

    const remoteJid = m.chat;

    // Send a ping message
    await m.reply('*Pong* 🏓');

    // Send the latency result back to the user
    await bug(m,`*BOT SPEED : ${Date.now() - startTime} ms*`,1)
}

export default pingCommand;
