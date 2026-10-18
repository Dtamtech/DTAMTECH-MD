/**
 * Plugin StickerCmd — Déclenchement de commandes du bot par stickers WhatsApp.
 */
import dbStore from '../db/store.js';
import { extractStickerHash } from '../utils/stickerHash.js';
import { dispatch } from '../core/dispatcher.js';

export const listeners = [
    {
        priority: 85,
        async handler({ m, client: sock }) {
            // Vérifier si le message est un sticker
            const isSticker = m.type === 'stickerMessage' ||
                m.msg?.mimetype?.includes('webp') ||
                m.mimetype?.includes('webp');

            if (!isSticker) return false;

            const hash = await extractStickerHash(m);
            if (!hash) return false;

            const record = dbStore.getStickerCmd(hash);
            if (!record) return false;

            const rawCmd = record.command.trim();
            const parts = rawCmd.split(/\s+/);
            const cmdName = parts[0].replace(/^[.#!?]/, '').toLowerCase();
            const prefix = m.prefix || '.';

            // Synthèse d'un message commande exécutable par le Dispatcher
            const syntheticMsg = Object.assign(Object.create(Object.getPrototypeOf(m)), m, {
                isCommand: true,
                command: cmdName,
                args: parts.slice(1),
                text: parts.slice(1).join(' '),
                messageBody: `${prefix}${rawCmd}`,
                body: `${prefix}${rawCmd}`
            });

            const handled = await dispatch(syntheticMsg, sock);
            return Boolean(handled);
        }
    }
];

export default [
    {
        name: 'setcmd',
        aliases: ['cmd', 'setstickercmd'],
        desc: 'Associe une commande du bot à un sticker WhatsApp',
        category: 'tools',
        usage: '.setcmd <commande [arguments]> (en réponse à un sticker)',
        sudoOnly: true,
        async execute({ m, args }) {
            const isQuotedSticker = m.quoted && (
                m.quoted.type === 'stickerMessage' ||
                m.quoted.stickerMessage ||
                m.quoted.mimetype?.includes('webp')
            );

            if (!isQuotedSticker) {
                return await m.reply(
                    '❌ *Répondez à un sticker WhatsApp* avec la commande à exécuter.\n\n' +
                    'Exemple :\n' +
                    '• Répondre à un sticker avec `.setcmd ping`\n' +
                    '• Répondre à un sticker avec `.setcmd menu`'
                );
            }

            const commandStr = args.join(' ').trim();
            if (!commandStr) {
                return await m.reply('❌ Précisez la commande à exécuter lorsque ce sticker sera envoyé.');
            }

            const hash = await extractStickerHash(m);
            if (!hash) {
                return await m.reply('❌ Impossible de calculer l\'empreinte unique de ce sticker.');
            }

            dbStore.addStickerCmd(hash, commandStr, m.sender);

            return await m.reply(
                `✅ *Sticker-Command enregistrée !*\n\n` +
                `🔹 *Commande associée* : \`.${commandStr.replace(/^[.#!?]/, '')}\`\n` +
                `🔹 *Hash du sticker* : \`${hash.slice(0, 16)}...\`\n\n` +
                `Désormais, envoyer ce sticker exécutera automatiquement la commande.`
            );
        }
    },

    {
        name: 'getcmd',
        aliases: ['listcmd', 'stickercmds'],
        desc: 'Affiche la liste des commandes associées à des stickers',
        category: 'tools',
        usage: '.getcmd',
        sudoOnly: true,
        async execute({ m }) {
            const cmds = dbStore.getAllStickerCmds();
            if (cmds.length === 0) {
                return await m.reply('ℹ️ Aucune commande n\'est actuellement liée à un sticker.');
            }

            let text = `🏷️ *COMMANDES PAR STICKER (${cmds.length})*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            for (const c of cmds) {
                text += `🔹 \`.${c.command}\`\n` +
                    `> Empreinte : \`${c.hash.slice(0, 16)}...\`\n` +
                    `> Par : \`${c.createdBy?.split('@')[0] || 'Inconnu'}\`\n\n`;
            }

            text += `_Pour dissocier : .delcmd <commande> ou répondez au sticker avec .delcmd_`;
            return await m.reply(text);
        }
    },

    {
        name: 'delcmd',
        aliases: ['dstickercmd', 'delcmdstick'],
        desc: 'Supprime l\'association d\'un sticker avec une commande',
        category: 'tools',
        usage: '.delcmd <commande | en réponse à un sticker>',
        sudoOnly: true,
        async execute({ m, args }) {
            // Cas 1 : Réponse directe au sticker
            if (m.quoted && (m.quoted.type === 'stickerMessage' || m.quoted.mimetype?.includes('webp'))) {
                const hash = await extractStickerHash(m);
                if (hash) {
                    dbStore.deleteStickerCmd(hash);
                    return await m.reply('♻️ L\'association de ce sticker a été supprimée avec succès.');
                }
            }

            // Cas 2 : Par nom de commande
            const targetCmd = args.join(' ').replace(/^[.#!?]/, '').trim();
            if (!targetCmd) {
                return await m.reply('❌ Spécifiez le nom de la commande à retirer ou répondez au sticker avec `.delcmd`.');
            }

            dbStore.deleteStickerCmdByCommand(targetCmd);
            return await m.reply(`♻️ Toutes les liaisons vers la commande \`.${targetCmd}\` ont été supprimées.`);
        }
    }
];
