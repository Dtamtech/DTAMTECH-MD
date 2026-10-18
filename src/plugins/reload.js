/**
 * Plugin de rechargement à chaud des plugins (Owner only)
 */
import path from 'node:path';
import { loadPlugins, reloadFile } from '../core/loader.js';

export default {
    name: 'reload',
    aliases: ['rel', 'reloadplugins'],
    desc: 'Recharge les plugins sans redémarrer le bot',
    category: 'owner',
    ownerOnly: true,
    async execute({ m, args }) {
        const target = args[0]?.trim();
        if (target) {
            const fileName = target.endsWith('.js') ? target : `${target}.js`;
            const pluginPath = path.resolve('src/plugins', fileName);
            const ok = await reloadFile(pluginPath);
            if (ok) {
                await m.reply(`✅ Plugin *${fileName}* rechargé à chaud.`);
            } else {
                await m.reply(`❌ Échec du rechargement ou fichier introuvable : *${fileName}*`);
            }
        } else {
            const res = await loadPlugins('src/plugins', { watch: false });
            await m.reply(`🧩 *Rechargement global terminé*\n> Commandes : *${res.commandsCount}*\n> Listeners : *${res.listenersCount}*\n> Fichiers : *${res.filesCount}*`);
        }
    }
};
