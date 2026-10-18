/**
 * Plugin de mesure de latence (Ping / Speed)
 * DTAMTECH MD V4
 */

export async function pingCommand(m) {
    const startTime = Date.now();
    // Send a ping reaction
    await m.react('🏓');
    // Send the latency result back to the user
    await m.reply(`> *BOT SPEED : ${Date.now() - startTime} ms*`, {
        mentions: [m.sender],
        contextInfo: {
            isForwarded: true,
            mentionedJid: [m.chat],
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
                renderLargerThumbnail: true
            }
        }
    });
}

export default {
    name: 'ping',
    aliases: ['p', 'speed', 'latence'],
    desc: 'Mesure la latence et la réactivité du bot',
    category: 'tools',
    cooldown: 3,
    pingCommand,
    execute: async ({ m }) => {
        await pingCommand(m);
    }
};
