import yts from 'yt-search';

async function mp3(m,params) {
    text = m.textMessage
    if (!text) return m.reply('Provide a song name to play')
    await m.react('🔎')
    let ytsSearch = await yts(text)
    const res = await ytsSearch.all[0]

    var result= await (await fetch("https://api.skyzopedia.us.kg/api/download/ytmp3?url="+res.url)).json()

    if (result.download.audio) {
    let urlMp3 = result.download.audio
    await m.reply('', {audio: {url: urlMp3}, mimetype: "audio/mpeg", contextInfo: { externalAdReply: {thumbnailUrl: res.thumbnail, title: res.title, body: `Author ${res.author.name} || Duration ${res.timestamp}`, sourceUrl: res.url, renderLargerThumbnail: true, mediaType: 1}}})
    } else {
    return m.reply("Error! Video not found!")
    }
    await m.react('')
}

async function mp4(m,params) {
    text = m.textMessage
    if (!text) return m.reply('Provide a video name to play')
    await m.react('🔎')
    let ytsSearch = await yts(text)
    const res = await ytsSearch.all[0]

    var result= await (await fetch("https://api.skyzopedia.us.kg/api/download/ytmp4?url="+res.url)).json()

    if (result.download.video) {
    let urlMp4 = result.download.video
    await m.reply('', {video: {url: urlMp4}, mimetype: "video/mp4", ptv: true})
    } else {
    return m.reply("Error! Video not found!")
    }
    await m.react('')
}

export default { mp3, mp4 }