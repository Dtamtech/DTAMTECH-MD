/**
 * Plugin Language — Commande de sélection de la langue active du bot (fr / en).
 */
import UserConfig from '../config/config.js';
import { setVar, getVar } from '../config/vars.js';

export default [
    {
        name: 'lang',
        aliases: ['language', 'langue', 'setlang'],
        desc: 'Modifie ou affiche la langue principale du bot (fr / en)',
        category: 'config',
        ownerOnly: true,
        usage: '.lang <fr|en>',
        async execute({ m, args }) {
            const currentLang = (getVar('LANGUAGE') || (await UserConfig.get('language').catch(() => 'fr')) || 'fr').toLowerCase();

            if (args.length === 0) {
                return await m.reply(
                    `🌐 *PARAMÈTRES DE LANGUE (i18n)*\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `🔹 *Langue active* : ${currentLang === 'fr' ? '🇫🇷 Français (fr)' : '🇬🇧 English (en)'}\n\n` +
                    `*Langues disponibles :*\n` +
                    `• \`.lang fr\` ➔ Français 🇫🇷\n` +
                    `• \`.lang en\` ➔ English 🇬🇧\n\n` +
                    `_Utilisez .lang <code_langue> pour basculer._`
                );
            }

            const chosen = args[0].toLowerCase().trim();
            if (!['fr', 'en'].includes(chosen)) {
                return await m.reply(
                    '❌ *Langue non supportée*\n\n' +
                    'DTAMTECH MD V4 supporte strictement :\n' +
                    '• `fr` (Français)\n' +
                    '• `en` (English)\n\n' +
                    'Exemple : `.lang en`'
                );
            }

            // Mise à jour synchronisée des deux systèmes de config
            setVar('LANGUAGE', chosen);
            setVar('BOT_LANG', chosen);
            await UserConfig.set('language', chosen);

            if (chosen === 'fr') {
                return await m.reply('✅ La langue du bot a été définie sur : *Français (fr)* 🇫🇷');
            } else {
                return await m.reply('✅ Bot language has been successfully set to: *English (en)* 🇬🇧');
            }
        }
    }
];
