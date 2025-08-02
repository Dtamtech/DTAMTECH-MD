export async function spsearch(m){

    if (!m.args[0]) {
      return await m.reply("😆 What do you want to download on Spotify?\n\n*Usage Example:*\n.song query");
    }

    const query = m.textMessage

    await m.react('⌛');
  
    try {
        await m.reply(`🔎 Searching Spotify for: *${query}*`);

        const response = await fetch(`https://api.diioffc.web.id/api/search/spotify?query=${encodeURIComponent(query)}`);
        const data = await response.json();
  
        if (!data || !data.status || !data.result || data.result.length === 0) {
            await m.react('❌');
            return await m.reply("> ❌ No results found for your query. Please try with a different keyword.");
        }
  
        // Get up first pertinent result
        const results = data.result.slice(0, 10).sort(() => Math.random() - 0.5);
        for (const song of results) {
            const msg = `🔱 *Spotify Track Result*:\n\n`
                + `*• Title*: ${song.trackName}\n`
                + `*• Author*: ${song.artistName|| 'Unknown'}\n`
                + `*• URL*: ${song.externalUrl}\n\n> Type .spotify < URL > to download this song`
            await m.reply(`${msg}`, {
                mentions: [m.sender],
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363400242611705@newsletter',
                        newsletterName: 'DTAM-HOST'
                    },
                    externalAdReply: {
                        title: `Join Our WhatsApp Channel`,
                        body: `DTAMTECH MD`,
                        thumbnailUrl: songData.result.thumbnail,
                        sourceUrl: song.externalUrl,
                        renderLargerThumbnail: true
                    }
                }
            });

        }

      await m.react('✅');
    } catch (error) {
      console.error("Error in YouTubeSearch command:", error);

      await m.react('❌');

      await m.reply("❌ An error occurred while searching YouTube. Please try again later.");
    }}


async function spotify(url) {
    fetch(`https://api.diioffc.web.id/api/download/spotify?url=${url}`)
        .then(response => response.json())
        .then(data => {
            if (!data || !data.status || !data.result || data.result.length === 0) {
                return {
                    downloaded:false,
                    reason:'Uncounted error'
                }
            }
            return {
                downloaded: true,
                result: data.result
            };
        })
        .catch(error => {
            console.error("Error fetching Spotify data:", error);
            return {
                downloaded: false,
                reason: 'Uncounted error:' + error
            };
        });
}


export async function spotifydl(m){
    if (!m.args[0]) {
        return await m.reply("😆 What do you want to download from Spotify?\n\n*Usage Example:*\n.tkdwn song_name");
    }

    const query = m.textMessage;

    await m.react('⌛');

    try {
        await m.reply(`🔎 Searching Spotify for: *${query}*`);

      const response = await fetch(`https://api.diioffc.web.id/api/download/spotify?url=${url}`);
      const data = await response.json();
  
      if (!data || !data.status || !data.result || data.result.length === 0) {
        await m.react('❌');
        return await m.reply("> ❌ No results found for your query. Please try with a different keyword.");
      }
  
      // Get up first pertinent result
      const song = data.result[0]
      const msg = `🔱 *Spotify Track Result*:\n\n`
          + `*• Title*: ${song.title}\n`
          + `*• Author*: ${song.artists	|| 'Unknown'}\n`
        
        if (!song || !song.status || !song.result || song.result.length === 0) {
            return await m.reply("❌ No valid song data found. Please try again with a different query.");
        }else{
            m.reply(msg)
            m.reply('', {
                audio: { url: song.audio },
            });
        }
        await m.react('✅');
    } catch (error) {
        console.error("Error in SpotifyDL command:", error);

        await m.react('❌');

        await m.reply("❌ An error occurred while searching Spotify. Please try again later.");
    }
}


