async function bug(m, remoteJid, texts, num) {

    if(!remoteJid) remoteJid = m.chat;

    await m.client.sendMessage(remoteJid,{text: `> _*RIP*_`})

    await m.client.sendMessage(remoteJid, {

        image: { url: `files/medias/images/md2.jpg` },

        caption: texts,

        contextInfo: {

            externalAdReply: {

                title: "Join Our WhatsApp Channel",

                body: "Click here to stay updated!",

                mediaType: 1, // Image preview

                thumbnailUrl: `https://whatsapp.com/channel/0029Vb66gGi6WaKeWjuQk333`,

                renderLargerThumbnail: true,

                mediaUrl: `https://whatsapp.com/channel/0029Vb66gGi6WaKeWjuQk333`,

                sourceUrl: `https://whatsapp.com/channel/0029Vb66gGi6WaKeWjuQk333`
            }
        }
    })
    await m.client.sendMessage(remoteJid,{text: `${texts}`})

}

export default bug;
