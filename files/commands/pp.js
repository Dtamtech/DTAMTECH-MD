import { downloadMediaMessage } from '@whiskeysockets/baileys'

export async function pp(m,message) {

    try {

        const quoted = m.quoted

        const targetMsg = quoted?.imageMessage || message.message.imageMessage

        if (!targetMsg) {

            return await m.reply('Reply or send an image with the command to set as profile picture.')
        }

        const buffer = await downloadMediaMessage({ message: quoted }, "buffer");

        await m.client.updateProfilePicture(m.client.user.id, buffer)

        await m.reply('✅ Profile picture updated successfully!')

    } catch (err) {

        console.log(err)

        await m.reply( '❌ Failed to update profile picture.')
    }
}


export default pp;