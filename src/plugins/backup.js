import { createBackupArchive, sendBackupToTelegram, getLastBackupMeta } from '../utils/backupService.js';
import store from '../db/store.js';
import { logger } from '../utils/logger.js';

export default {
    name: 'backup',
    description: 'Sauvegarde cloud et locale de session et de base de données',
    commands: [
        {
            name: 'backup',
            category: 'owner',
            description: 'Gère les sauvegardes de session Baileys et de base de données',
            usage: '.backup <now|auth|status>',
            ownerOnly: true,
            sensitive: true,
            cooldown: 15,
            execute: async (ctx) => {
                const sub = (ctx.args[0] || 'now').toLowerCase();

                if (sub === 'status') {
                    const last = getLastBackupMeta();
                    const hasTg = Boolean(store.getVar('TELEGRAM_BOT_TOKEN', '') && store.getVar('TELEGRAM_CHAT_ID', ''));
                    const hasPass = Boolean(store.getVar('BACKUP_PASSPHRASE', ''));

                    return ctx.reply(
                        `📦 *Statut des sauvegardes DTAMTECH MD*\n\n` +
                        `• Cible Telegram : ${hasTg ? '✅ Configuré' : '❌ Non configuré'}\n` +
                        `• Chiffrement AES-256 : ${hasPass ? '🔒 Activé (Passphrase définie)' : '🔓 Désactivé (Zip clair)'}\n` +
                        `• Dernière sauvegarde : ${last ? `\`${last.filename}\` (${Math.round(last.size / 1024)} Ko)` : '_Aucune cette session_'}\n\n` +
                        `_Commandes :_\n` +
                        `• \`.backup now\` : Sauvegarde session + base SQLite\n` +
                        `• \`.backup auth\` : Sauvegarde uniquement les clés auth Baileys`
                    );
                }

                if (sub === 'now' || sub === 'auth') {
                    const includeDb = sub === 'now';
                    await ctx.reply('⏳ *Création de l\'archive de sauvegarde en cours...*');

                    try {
                        const backup = await createBackupArchive({ includeDb });
                        let report = `✅ *Sauvegarde créée avec succès !*\n\n` +
                            `• Fichier : \`${backup.filename}\`\n` +
                            `• Taille : \`${Math.round(backup.size / 1024)} Ko\`\n` +
                            `• Chiffré : ${backup.encrypted ? '🔒 Oui (AES-256-GCM)' : '🔓 Non'}\n` +
                            `• Fichiers archivés : \`${backup.filesCount}\``;

                        // Tentative d'envoi Telegram si configuré
                        const tgRes = await sendBackupToTelegram({
                            buffer: backup.buffer,
                            filename: backup.filename,
                            caption: `📦 Sauvegarde DTAMTECH MD (${backup.filename})`
                        });

                        if (tgRes.ok) {
                            report += `\n• Relais Telegram : 🚀 Envoyé (msg ID ${tgRes.messageId})`;
                        } else if (tgRes.error && !tgRes.error.includes('non configurés')) {
                            report += `\n• Relais Telegram : ⚠️ Échec (${tgRes.error})`;
                        }

                        // Envoi direct du fichier document dans la conversation WhatsApp
                        if (ctx.client?.sendMessage) {
                            await ctx.client.sendMessage(ctx.jid, {
                                document: backup.buffer,
                                fileName: backup.filename,
                                mimetype: backup.encrypted ? 'application/octet-stream' : 'application/zip',
                                caption: report
                            }, ctx.rawMessage ? { quoted: ctx.rawMessage } : undefined);
                        } else {
                            await ctx.reply(report);
                        }

                        logger.info(`[Backup] Sauvegarde ${backup.filename} terminée avec succès.`);
                    } catch (err) {
                        logger.error(`[Backup] Échec : ${err.message}`);
                        return ctx.reply(`❌ *Échec de la sauvegarde :* ${err.message}`);
                    }
                    return;
                }

                return ctx.reply(`Usage : \`.backup now\`, \`.backup auth\`, ou \`.backup status\``);
            }
        }
    ]
};
