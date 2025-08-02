async function tiktoksearch(m){

    if (!m.args[0]) {
      return await m.reply("😆 What do you want to search on TikTok?\n\n*Usage Example:*\n.tksearch query");
    }
  
    const query = m.textMessage

    await m.react('⌛');
  
    try {
      await m.reply(`🔎 Searching TikTok for: *${query}*`);
      
      const response = await fetch(`https://api.diioffc.web.id/api/search/tiktok?query=${encodeURIComponent(query)}`);
      const data = await response.json();
  
      if (!data || !data.status || !data.result || data.result.length === 0) {
        await m.react('❌');
        return await m.reply("> ❌ No results found for your query. Please try with a different keyword.");
      }
  
      // Get up to 7 random results
      const results = data.result.slice(0, 7).sort(() => Math.random() - 0.5);
  
      for (const video of results) {
        const msg = `🎶 *TikTok Video Result*:\n\n`
          + `*• Title*: ${video.title}\n`
          + `*• Author*: ${video.author.name || 'Unknown'} (@${video.author.username})\n`
          + `*• Duration*: ${video.duration}s\n`
          + `*• Plays*: ${video.stats.play}\n`
          + `*• Likes*: ${video.stats.like}\n`
          + `*• URL*: https://www.tiktok.com/@${video.author.username}/video/${video.video_id}\n\n`;
  
        if (video.media.no_watermark) {
          await m.reply('', {
            video: { url: video.media.no_watermark }, 
            caption: msg
          });
        } else {
          await m.reply(`❌ Failed to retrieve video for *"${video.title}"*.`);
        }
      }
  
      await m.react('✅');
    } catch (error) {
      console.error("Error in TikTokSearch command:", error);

      await m.react('❌');

      await m.reply("❌ An error occurred while searching TikTok. Please try again later.");
    }}

export default tiktoksearch
    