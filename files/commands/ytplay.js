async function ytplay(m){

    if (!m.args[0]) {
      return await m.reply("😆 What do you want to download on YouTube?\n\n*Usage Example:*\n.ytplay query");
    }
  
    const query = m.textMessage

    await m.react('⌛');
  
    try {
      await m.reply(`🔎 Searching YouTube for: *${query}*`);

      const response = await fetch(`https://api.diioffc.web.id/api/search/ytplay?query=${encodeURIComponent(query)}`);
      const data = await response.json();
  
      if (!data || !data.status || !data.result || data.result.length === 0) {
        await m.react('❌');
        return await m.reply("> ❌ No results found for your query. Please try with a different keyword.");
      }
      const song = data.result
        const msg = `🔱 *YouTube song Result*:\n\n`
          + `*• Title*: ${song.title}\n`
          + `*• Author*: ${song.author.name || 'Unknown'}\n`
          + `*• Duration*: ${song.duration.timestamp} posted ${song.duration.ago}\n`
          + `*• Plays*: ${song.views}\n`
          + `*• Content*: ${song.type}\n`
          + `*• URL*: ${song.url}\n\n`
          + `*• Description*: ${song.description}`;

        if (song.download) {
            await m.reply(`${msg}`, {
                mentions: [m.sender],
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363400242611705@newsletter',
                        newsletterName: 'DTAM-HOST'
                    },
                    externalAdReply: {
                        title: `Youtube song result`,
                        body: `DTAMTECH MD`,
                        thumbnailUrl: song.thumbnail,
                        sourceUrl: song.url,
                        renderLargerThumbnail: false
                    }
                }
            });
            await m.reply('', {
                audio: { url: song.download.url },
                mimetype: "audio/mpeg",
                ptt: true
            });
        } else {
            await m.reply(msg);
        }
        await m.react('✅');
     
    } catch (error) {
      console.error("Error in YouTubeSearch command:", error);

      await m.react('❌');

      await m.reply("❌ An error occurred while searching YouTube. Please try again later.");
    }}

export default ytplay
    