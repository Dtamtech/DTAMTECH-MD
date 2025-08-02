export default async function (m) {
    try{
        const query = m.args[0];
        if(!query) return m.reply(`😆 What do you want to download on YouTube?\n\n*Usage Example:*\n.ytdl link`);
        if(!query.startsWith('https://')) return m.reply(`❌ The YouTube link should start with https://\n\nExample: .ytdl https://youtu.be/hxwQOw_i-Y0`);
        m.react('⏳');
        const response = await fetch(`https://api.giftedtech.web.id/api/download/ytmp4?apikey=gifted&url=${query}`);
        const data = await response.json()
        if(!data || !(data.status === 200) || !(data.success) || !(data.result)) return await m.reply('❌No results found for your query. Please try with a different keyword.')

        const result = data.result

        const msg =
            `🔱 *YouTube Video Result*:\n\n`
            + `*• Title*: ${result.title}\n`
            + `*• Quality*: ${result.quality}\n`
            + `*• URL*: ${query}`;

        await m.reply('', {

            video:{url:result.download_url},
            caption:`${msg}`,
            mentions: [m.sender],
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400242611705@newsletter',
                    newsletterName: 'DTAM-HOST'
                },
                externalAdReply: {
                    title: `YouTube Downloader`,
                    body: `DTAMTECH MD`,
                    thumbnailUrl: result.thumbnail,
                    sourceUrl: result.thumbnail,
                    renderLargerThumbnail: false
                }
            }
        });

        await m.react('✅');

    }catch (error) {
        console.error("Error in YouTube Download command:", error);
        await m.react('❌');
        await m.reply("❌ An error occurred while downloading on YouTube. Please try again later.");
    }
}