import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.js";
import { getPaywallMessage } from "./premium.js";

function clearDirectory(directoryPath) {
    try {
        if (!fs.existsSync(directoryPath)) return;
        const files = fs.readdirSync(directoryPath);
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
                fs.unlinkSync(filePath);
            }
        }
        logger.success('All session files have been deleted successfully.');
    } catch (error) {
        logger.error(`Error while trying to delete files: ${error.message}`);
    }
}

export async function disconnect(m) {
    await m.reply("🚨🚨🚨 *You will be disconnected in 60 seconds.*\n\n_*Use .stop Command to stop the action and the bot too*_");
    setTimeout(async () => {
        await m.modify('> *Bot is disconnecting...*');
        await clearDirectory('./src/auth_info_baileys');
        try { await m.client.logout(); } catch { }
        try {
            const { gracefulShutdown } = await import('../../index.js');
            await gracefulShutdown({ reason: 'WhatsApp .disconnect command', exitCode: 0 });
        } catch {
            process.exit(0);
        }
    }, 60000);
}

export default {
    name: 'disconnect',
    description: 'Déconnexion à distance du bot et réinitialisation de session',
    disconnect,
    commands: [
        {
            name: 'disconnect',
            category: 'premium',
            description: 'Déconnecte la session WhatsApp du bot et supprime les identifiants locaux',
            ownerOnly: true,
            execute: async ({ m }) => {
                if (!m.isDeveloper && !m.isPremium) {
                    return await m.reply(getPaywallMessage(m.prefix || '.', 'disconnect'));
                }
                await m.react('🔗');
                await disconnect(m);
            }
        }
    ]
};
