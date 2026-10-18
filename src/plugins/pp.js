import { downloadMediaMessage } from 'baileys';
import { logger } from '../utils/logger.js';

export async function pp(m, message) {
    try {
        const quoted = m.quoted;
        const targetMsg = quoted?.imageMessage || message?.message?.imageMessage;
        if (!targetMsg) {
            return await m.reply('Reply or send an image with the command to set as profile picture.');
        }
        const buffer = await downloadMediaMessage({ message: quoted || message.message }, "buffer");
        await m.client.updateProfilePicture(m.client.user.id, buffer);
        await m.reply('✅ Profile picture updated successfully!');
    } catch (err) {
        logger.error(`Failed to update profile picture: ${err.message}`);
        await m.reply('❌ Failed to update profile picture.');
    }
}

export default {
    name: 'pp',
    description: 'Gestion de la photo de profil du bot WhatsApp',
    pp,
    commands: [
        {
            name: 'setpp',
            aliases: ['pp'],
            category: 'owner',
            description: 'Change la photo de profil du bot avec l\'image citée',
            usage: '.setpp (en répondant à une image)',
            ownerOnly: true,
            execute: async ({ m }) => {
                await pp(m, m);
            }
        }
    ]
};
