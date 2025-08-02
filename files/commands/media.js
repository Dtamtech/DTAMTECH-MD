import fs from 'fs'
import { exec } from 'child_process'
import { downloadMediaMessage } from '@whiskeysockets/baileys'

export async function photo(m) {

    try {

        const quoted = m.quoted;

        const target = quoted?.stickerMessage;

        if (!target) return await m.reply("No sticker found." )

        const buffer = await downloadMediaMessage({ message: quoted }, "buffer");

        const filename = `./temp/sticker-${Date.now()}.png`

        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp')

        fs.writeFileSync(filename, buffer)

        await m.reply('', { image: fs.readFileSync(filename), caption: "> Powered by DTAMTECH " })

        fs.unlinkSync(filename)

    } catch (e) {

        console.log(e)

        await m.reply("❌ Error converting sticker to image." )
    }
}

export async function tomp3(m) {

    try {
        const quoted = m.quoted;

        const target = quoted?.videoMessage;

        if (!target) return await m.reply("No video found." )

        const buffer = await downloadMediaMessage({ message: quoted }, "buffer");

        const inputPath = `./temp/video-${Date.now()}.mp4`

        const outputPath = `./temp/audio-${Date.now()}.mp3`

        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp')
            
        fs.writeFileSync(inputPath, buffer)

        await new Promise((resolve, reject) => {
            exec(`ffmpeg -i ${inputPath} -vn -ab 128k -ar 44100 -y ${outputPath}`, (err) => {
                if (err) return reject(err)
                resolve()
            })
        })

        await m.reply('', { audio: fs.readFileSync(outputPath), mimetype: 'audio/mp4', ptt: false })

        fs.unlinkSync(inputPath)
        fs.unlinkSync(outputPath)

    } catch (e) {
        console.log(e)
        await m.reply('', { text: "❌ Error converting video to audio." })
    }
}

export default { photo, tomp3 }
