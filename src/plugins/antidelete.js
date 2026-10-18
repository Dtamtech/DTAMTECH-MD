/**
 * Plugin Antidelete & Antiedit — Récupération des messages supprimés et modifiés.
 * Destination configurable via les variables d'exécution ANTI_DELETE et ANTI_EDIT :
 * - 'off' : désactivé
 * - 'chat' : notification dans la discussion d'origine
 * - 'pms' : transmission privée au bot owner
 * - 'all' : notification dans la discussion + envoi privé
 */
import { getVar, setVar } from '../config/vars.js';

export default [
    {
        name: 'antidelete',
        aliases: ['deleteprotect', 'antidel'],
        desc: 'Configure la destination de récupération des messages supprimés',
        category: 'owner',
        ownerOnly: true,
        usage: '.antidelete [off|chat|pms|all]',
        async execute({ m, args }) {
            const current = getVar('ANTI_DELETE', 'off');
            const target = args[0]?.toLowerCase();

            if (!target) {
                return await m.reply(
                    `🗑️ *CONFIGURATION ANTI-DELETE*\n\n` +
                    `🔹 *Mode actuel* : \`${current}\`\n\n` +
                    `📖 *Modes disponibles :*\n` +
                    `• \`.antidelete off\` : Désactivé\n` +
                    `• \`.antidelete chat\` : Révélation dans le chat d'origine\n` +
                    `• \`.antidelete pms\` : Envoi discret en message privé à l'owner\n` +
                    `• \`.antidelete all\` : Révélation dans le chat + copie en privé`
                );
            }

            if (!['off', 'chat', 'pms', 'all'].includes(target)) {
                return await m.reply('❌ Mode invalide. Choix : `off`, `chat`, `pms`, `all`.');
            }

            setVar('ANTI_DELETE', target);
            return await m.reply(`✅ *Anti-delete* configuré sur : *\`${target}\`*`);
        }
    },

    {
        name: 'antiedit',
        aliases: ['editprotect'],
        desc: 'Configure la notification des messages modifiés',
        category: 'owner',
        ownerOnly: true,
        usage: '.antiedit [off|chat|pms|all]',
        async execute({ m, args }) {
            const current = getVar('ANTI_EDIT', 'off');
            const target = args[0]?.toLowerCase();

            if (!target) {
                return await m.reply(
                    `✏️ *CONFIGURATION ANTI-EDIT*\n\n` +
                    `🔹 *Mode actuel* : \`${current}\`\n\n` +
                    `📖 *Modes disponibles :*\n` +
                    `• \`.antiedit off\` : Désactivé\n` +
                    `• \`.antiedit chat\` : Affichage de l'ancien texte dans le chat\n` +
                    `• \`.antiedit pms\` : Transmission discrète en privé à l'owner\n` +
                    `• \`.antiedit all\` : Chat d'origine + copie privée`
                );
            }

            if (!['off', 'chat', 'pms', 'all'].includes(target)) {
                return await m.reply('❌ Mode invalide. Choix : `off`, `chat`, `pms`, `all`.');
            }

            setVar('ANTI_EDIT', target);
            return await m.reply(`✅ *Anti-edit* configuré sur : *\`${target}\`*`);
        }
    }
];
