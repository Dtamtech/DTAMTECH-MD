import {downloadMediaMessage} from "@whiskeysockets/baileys";
export default async function (m){
    if (!m.isQuoted) return m.reply(`❌ Reply to an image or video`)

    if (m.quoted.imageMessage) {

        let media = m.quoted.download()
        //let media = m.client.downloadMediaMessage(m.quoted,'image')

        await m.client.sendImageAsSticker(m.chat, media, m, {
            packname: "DTAMTECH MD",
            author: m.message.key.pushName
        })
    } else if (m.quoted.videoMessage) {
        if ((m.quoted.msg || m.quoted).seconds > 15) return reply('Durée maximale de la vidéo ? 15 s !')
        let media = m.quoted.download()
        await m.client.sendVideoAsSticker(m.chat, media, m, {
            packname: "DTAMTECH MD",
            author: m.message.key.pushName
        })
    } else {
        return m.reply(`❌ Reply to image or video. The video duration should be between 1 - 15 s`)
    }
}
