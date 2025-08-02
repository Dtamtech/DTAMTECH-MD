async function ytsearch(m){

    if (!m.args[0]) {
      return await m.reply("😆 What do you want to search on YouTube?\n\n*Usage Example:*\n.ytsearch query");
    }
  
    const query = m.textMessage

    await m.react('⌛');
  
    try {
      await m.reply(`🔎 Searching YouTube for: *${query}*`);

      const response = await fetch(`https://api.diioffc.web.id/api/search/youtube?query=${encodeURIComponent(query)}`);
      const data = await response.json();
  
      if (!data || !data.status || !data.result || data.result.length === 0) {
        await m.react('❌');
        return await m.reply("> ❌ No results found for your query. Please try with a different keyword.");
      }
  
      // Get up to 10 random results
      const results = data.result.slice(0, 10).sort(() => Math.random() - 0.5);
  
      for (const video of results) {
        const msg = `🔱 *YouTube Video Result*:\n\n`
          + `*• Title*: ${video.title}\n`
          + `*• Author*: ${video.author?.name? video.author.name : 'Unknown'}\n`
          + `*• Duration*: ${video.duration?.timestamp} posted ${video.duration?.ago}\n`
          + `*• Plays*: ${video.views}\n`
          + `*• Content*: ${video.type}\n`
          + `*• URL*: ${video.url}\n\n`
          + `*• Description*: ${video.description}`;

        if (video.thumbnail) {
            await m.reply(`${msg}`, {
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
                        thumbnailUrl: video.thumbnail,
                        sourceUrl: video.url,
                        mediaUrl: video.url,
                        renderLargerThumbnail: false
                    }
                }
            });
        } else {
            await m.reply(msg);
        }
      }
  
      await m.react('✅');
    } catch (error) {
      console.error("Error in YouTubeSearch command:", error);

      await m.react('❌');

      await m.reply("❌ An error occurred while searching YouTube. Please try again later.");
    }}

export default ytsearch
    