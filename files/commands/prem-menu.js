import fs from "fs";
export async function prem(m) {

    const t = `  
*╭══〘〘 DTAMTECH 𝗠𝗗 〙〙*
*┃❍ ᴍᴏᴅᴇ* : *${m.mode? 'Private':'Public'}*
*┃❍ ᴘʀᴇғɪx* : [ *${m.prefix}* ]
*┃❍ ᴅᴇᴠ* : *DTAMTECH*
*┃❍ ᴠᴇʀsɪᴏɴs* : *1.0.0*
*╰════════════════⊷*

*╭────❒⁠⁠⁠⁠PREMIUM❒⁠⁠⁠⁠* 
*├⬢ connect userNumber*   
*├⬢ disconnect userNumber*
*├⬢ reconnect userNumber*
*├⬢ reconnectall*
*┕─────────────❒*        

*╭────❒⁠⁠⁠⁠* *OWNER* *❒⁠⁠⁠⁠* 
*├⬢ shutdown* 
*├⬢ restart *
*┕─────────────❒*


> ᴘᴏᴡᴇʀᴇᴅ ʙʏ DTAMTECH
    `
;

    await m.reply('',{

        footer: `©DTAMTECH`,
        headerType: 1,
        viewOnce: true,
        document: fs.readFileSync("./package.json"),
        fileName: `</> DTAMDOCS </>`,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileLength: 111199999999,
        caption: t,
        contextInfo: {
            isForwarded: true,
            mentionedJid: [m.message.key.remoteJid],
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363400242611705@newsletter',
                newsletterName: 'DTAMTECH'
            },
            externalAdReply: {
                title: `DTAMTECH MD - V1`,
                body: `DTAMTECH MD`,
                thumbnailUrl: 'https://img1.pixhost.to/images/5332/592865778_skyzopedia.jpg',
                sourceUrl: 'https://whatsapp.com/channel/0029Vb66gGi6WaKeWjuQk333',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }

    });
}   

export default prem;
