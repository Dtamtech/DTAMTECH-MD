import fs from 'fs' 

export async function info(m) {

    const t = `  
*╭══〘〘 DTAMTECH 𝗠𝗗 〙〙*
*┃❍ ᴍᴏᴅᴇ* : *${m.mode? 'Private':'Public'}*
*┃❍ ᴘʀᴇғɪx* : [ *${m.prefix}* ]
*┃❍ ᴅᴇᴠ* : *DTAMTECH*
*┃❍ ᴠᴇʀsɪᴏɴs* : *1.0.0*
*╰════════════════⊷*

*╭────❒ ⁠⁠⁠⁠GROUP-CMD ❒⁠⁠⁠⁠*
*├⬡ ${m.prefix}del* 
*├⬡ ${m.prefix}purge*
*├⬡ ${m.prefix}ᴋɪᴄᴋ*
*├⬡ ${m.prefix}ᴋɪᴄᴋᴀʟʟ*
*├⬡ ${m.prefix}ᴘʀᴏᴍᴏᴛᴇ*
*├⬡ ${m.prefix}ᴅᴇᴍᴏᴛᴇ*
*├⬡ ${m.prefix}ᴘʀᴏᴍᴏᴛᴇᴀʟʟ*
*├⬡ ${m.prefix}ᴅᴇᴍᴏᴛᴇᴀʟʟ*
*├⬡ ${m.prefix}ᴛᴀɢ*
*├⬡ ${m.prefix}ᴛᴀɢᴀʟʟ*
*├⬡ ${m.prefix}ᴛᴀɢᴀᴅᴍɪɴ*
*├⬡ ${m.prefix}sᴇᴛᴛᴀɢ*
*├⬡ ${m.prefix}ʜɪᴅᴇᴛᴀɢ*
*├⬡ ${m.prefix}ᴍᴜᴛᴇ*
*├⬡ ${m.prefix}ᴜɴᴍᴜᴛᴇ*
*├⬡ ${m.prefix}ɢᴄʟɪɴᴋ*
*├⬡ ${m.prefix}ᴀɴᴛɪʟɪɴᴋ*
*┕──────────────❒*

*╭────❒⁠⁠⁠⁠ UTILITAIRE ❒⁠⁠⁠⁠* 
*├⬡ ${m.prefix}vv*
*├⬡ ${m.prefix}save*
*├⬡ ${m.prefix}photo*
*├⬡ ${m.prefix}toaudio*
*├⬡ ${m.prefix}setpp*
*┕─────────────❒*

*╭────❒⁠⁠⁠⁠ AI MENU ❒⁠⁠⁠⁠*
*├──❍ \`TEXT\`❍*
*├⬡ ${m.prefix}ᴀɪ*
*├⬡ ${m.prefix}gpt*
*├─────────*
*├──❍ \`IMAGE\`❍*
*├⬡ ${m.prefix}imagen*
*├⬡ ${m.prefix}3dgen*
*┕──────────────❒*

*╭────❒⁠⁠⁠⁠ Download MENU ❒⁠⁠⁠⁠* 
*├⬡ ${m.prefix}tiktok*
*├⬡ ${m.prefix}insta*
*├⬡ ${m.prefix}youtube*
*├⬡ ${m.prefix}spotify*
*├⬡ ${m.prefix}fb*
*┕─────────────❒*

*╭────❒⁠⁠⁠⁠ Search MENU ❒⁠⁠⁠⁠* 
*├⬡ ${m.prefix}tksearch*
*├⬡ ${m.prefix}instas*
*├⬡ ${m.prefix}ytsearch*
*├⬡ ${m.prefix}sptfsearch*
*├⬡ ${m.prefix}fbsearch*
*├⬡ ${m.prefix}gsearch*
*├⬡ ${m.prefix}gitsearch*
*┕─────────────❒*

*╭────❒⁠⁠⁠⁠ Stalk MENU ❒⁠⁠⁠⁠* 
*├⬡ ${m.prefix}stalk*
*├⬡ ${m.prefix}gitstalk*
*├⬡ ${m.prefix}instalk*
*├⬡ ${m.prefix}ytstalk*
*├⬡ ${m.prefix}tgstalk*
*├⬡ ${m.prefix}fbstalk*
*├⬡ ${m.prefix}xstalk*
*┕─────────────❒*

*╭────❒⁠⁠⁠⁠ BOT-CMD ❒⁠⁠⁠⁠* 
*├⬡ ${m.prefix}ᴍᴇɴᴜ*
*├⬡ ${m.prefix}vip*
*├⬡ ${m.prefix}public*
*├⬡ ${m.prefix}private*
*├⬡ ${m.prefix}ᴘɪɴɢ*
*├⬡ ${m.prefix}sᴇᴛᴘʀᴇғɪx*
*├⬡ ${m.prefix}ᴀᴜᴛᴏʀᴇᴀᴄᴛ*
*├⬡ ${m.prefix}sudo*
*├⬡ ${m.prefix}delsudo*
*┕──────────────❒*


> POWERED BY DTAMTECH 
    `
;

    m.reply('',{

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

export default info;
