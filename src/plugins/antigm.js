/**
 * Plugin Antigm — Détection et blocage des mentions massives de groupe (@everyone) et statuts abusifs.
 * Protège les membres contre le spam de notifications abusif de la part de participants non-admins.
 */
import { getSetting, setSetting } from '../db/groupSettings.js';
import { executeAntiAction } from '../utils/antiAction.js';
import { isAdmin } from '../utils/isAdmin.js';

export default {
    name: 'antigm',
    aliases: ['antitagall', 'antigrouptag'],
    desc: 'Empêche les mentions massives de tous les membres par des non-admins',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    usage: '.antigm [on|off|kick|warn|null]',
    async execute({ m, args }) {
        const subCmd = args[0]?.toLowerCase();
        const current = getSetting(m.chat, 'antigm');

        if (!subCmd || subCmd === 'status' || subCmd === 'info') {
            const statusTxt = current.enabled ? '🟢 *Activé*' : '🔴 *Désactivé*';
            const actionTxt = current.action || 'Suppression seule (null)';

            return await m.reply(
                `📢 *CONFIGURATION ANTI-MENTION DE MASSE (ANTIGM)*\n\n` +
                `🔹 *Statut* : ${statusTxt}\n` +
                `🔹 *Action* : \`${actionTxt}\`\n\n` +
                `Intercepte les messages mentionnant plus de 80% des participants ou utilisant les mentions de groupe.\n\n` +
                `📖 *Commandes :*\n` +
                `• \`.antigm on\` / \`.antigm off\`\n` +
                `• \`.antigm kick\` / \`.antigm warn\` / \`.antigm null\``
            );
        }

        if (subCmd === 'on') {
            setSetting(m.chat, 'antigm', { enabled: true });
            return await m.reply('✅ *Antigm activé* dans ce groupe.');
        }

        if (subCmd === 'off') {
            setSetting(m.chat, 'antigm', { enabled: false });
            return await m.reply('🛑 *Antigm désactivé* dans ce groupe.');
        }

        if (['kick', 'warn', 'null'].includes(subCmd)) {
            setSetting(m.chat, 'antigm', { action: subCmd === 'null' ? null : subCmd });
            return await m.reply(`⚙️ Action antigm configurée sur : *\`${subCmd}\`*`);
        }

        return await m.reply('❌ Sous-commande invalide. Utilisez : `.antigm on|off|kick|warn|null`');
    }
};

export const listeners = [
    {
        on: 'message',
        priority: 25,
        async execute({ m, client, isOwner, isSudo }) {
            if (!m.isGroup || m.fromMe) return false;

            const setting = getSetting(m.chat, 'antigm');
            if (!setting.enabled) return false;

            if (isOwner || isSudo) return false;

            // Détection de statut de groupe mentionné
            const isGroupStatusMention = Boolean(
                m.message?.groupStatusMentionMessage ||
                m.message?.protocolMessage?.type === 'GROUP_STATUS_MENTION'
            );

            // Extraction des mentions
            const mentions = Array.isArray(m.mentionedJid) ? m.mentionedJid : [];

            // Si ni statut group ni mentions, rien à vérifier
            if (!isGroupStatusMention && mentions.length < 5) {
                return false;
            }

            // Vérification des droits admins
            const { isBotAdmin, isSenderAdmin } = await isAdmin(client, m.chat, m.sender);
            if (!isBotAdmin || isSenderAdmin) return false;

            let isViolation = isGroupStatusMention;

            if (!isViolation && mentions.length >= 5) {
                try {
                    const metadata = await client.groupMetadata(m.chat);
                    const totalParticipants = metadata.participants?.length || 1;
                    const ratio = mentions.length / totalParticipants;

                    // Si le message mentionne 80% ou plus du groupe
                    if (ratio >= 0.8 || (totalParticipants > 20 && mentions.length >= 15)) {
                        isViolation = true;
                    }
                } catch { }
            }

            if (isViolation) {
                await executeAntiAction({
                    client,
                    chat: m.chat,
                    sender: m.sender,
                    messageKey: m.key,
                    action: setting.action,
                    reason: isGroupStatusMention ? 'Statut de groupe abusif' : 'Mention de masse (@everyone)'
                });
                return true;
            }

            return false;
        }
    }
];
