export default async function apkdl(m) {
    await m.react('👨🏽‍💻')
    const text = m.textMessage
    if (!text) return m.reply("𝖶𝖧𝖨𝖢𝖧 𝖠𝖯𝖪 𝖣𝖮 𝖸𝖮𝖴 𝖶𝖠𝖭𝖳 𝖳𝖮 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 ?");
    let response = await fetch(`https://api.giftedtech.web.id/api/download/apkdl?apikey=gifted&appName=${encodeURIComponent(text)}`)
    const search = await response.json()
    if (!search.success || search.status !== 200) {return await m.reply('❌ An error occurred while searching your app. Please try again later.')}
    let searchResult = search.result
    await m.reply('',
        {
            document: {
                url: searchResult.download_url
            },
            fileName: searchResult.appname,
            mimetype: searchResult.mimetype,
            caption:`*⚜ APK SEARCH RESULT*\n\n`
                + `*• Title*: ${searchResult.appname}\n`
                + `*• Developper*: ${searchResult.developer}\n`
                + `*• Type*: ${searchResult.mimetype.split('/')[0]}\n\n> *Powered by DTAMTECH*`,
            contextInfo: {
                    isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400242611705@newsletter',
                    newsletterName: 'DTAM-HOST'
                },
                externalAdReply: {
                    title: "DTAMTECH MD APK DOWNLOADER",
                    body: `${searchResult.appname} by ${searchResult.developer}`,
                    thumbnailUrl: searchResult.icon,
                    sourceUrl: searchResult.download_url,
                    mediaType: 1,
                    showAdAttribution: true,
                    renderLargerThumbnail: false
                }
            }
        }
    );
}
               
