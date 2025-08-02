async function bug(m, text) {


    await m.reply(`> ${text}`, {
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

export default bug;
