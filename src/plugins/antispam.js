/**
 * Plugin Antispam — Détection de flood par fenêtre temporelle glissante (sliding window).
 * Empêche le flood de messages successifs par des membres dans les groupes.
 */
import { getSetting, setSetting } from '../db/groupSettings.js';
import { executeAntiAction } from '../utils/antiAction.js';
import { isAdmin } from '../utils/isAdmin.js';

// Niveaux de sensibilité : { maxMessages, windowSec }
const SPAM_LEVELS = {
    low: { maxMessages: 6, windowSec: 8 },
    medium: { maxMessages: 5, windowSec: 6 },
    high: { maxMessages: 4, windowSec: 5 }
};

// Suivi des timestamps par (chat:sender)
const spamTracker = new Map();

// Nettoyage périodique pour éviter toute fuite mémoire
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of spamTracker.entries()) {
        const active = timestamps.filter(t => now - t < 15000);
        if (active.length === 0) {
            spamTracker.delete(key);
        } else {
            spamTracker.set(key, active);
        }
    }
}, 60000).unref?.();

export default {
    name: 'antispam',
    aliases: ['antiflood'],
    desc: 'Protège le groupe contre le flood et le spam de messages',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    usage: '.antispam [on|off|level low|medium|high|kick|warn|null]',
    async execute({ m, args }) {
        const subCmd = args[0]?.toLowerCase();
        const current = getSetting(m.chat, 'antispam');
        const level = current.data?.level || 'low';
        const levelConf = SPAM_LEVELS[level] || SPAM_LEVELS.low;

        if (!subCmd || subCmd === 'status' || subCmd === 'info') {
            const statusTxt = current.enabled ? '🟢 *Activé*' : '🔴 *Désactivé*';
            const actionTxt = current.action || 'Suppression seule (null)';

            return await m.reply(
                `⚡ *CONFIGURATION ANTISPAM (ANTI-FLOOD)*\n\n` +
                `🔹 *Statut* : ${statusTxt}\n` +
                `🔹 *Action* : \`${actionTxt}\`\n` +
                `🔹 *Niveau* : \`${level}\` (${levelConf.maxMessages} messages en ${levelConf.windowSec}s)\n\n` +
                `📖 *Commandes :*\n` +
                `• \`.antispam on\` / \`.antispam off\`\n` +
                `• \`.antispam level low\` (6 msg / 8s)\n` +
                `• \`.antispam level medium\` (5 msg / 6s)\n` +
                `• \`.antispam level high\` (4 msg / 5s)\n` +
                `• \`.antispam kick\` / \`.antispam warn\` / \`.antispam null\``
            );
        }

        if (subCmd === 'on') {
            setSetting(m.chat, 'antispam', { enabled: true });
            return await m.reply('✅ *Antispam activé* dans ce groupe.');
        }

        if (subCmd === 'off') {
            setSetting(m.chat, 'antispam', { enabled: false });
            return await m.reply('🛑 *Antispam désactivé* dans ce groupe.');
        }

        if (subCmd === 'level') {
            const chosen = args[1]?.toLowerCase();
            if (!SPAM_LEVELS[chosen]) {
                return await m.reply('❌ Niveau invalide. Options : `low`, `medium`, `high`.');
            }
            setSetting(m.chat, 'antispam', { data: { ...current.data, level: chosen } });
            const c = SPAM_LEVELS[chosen];
            return await m.reply(`⚙️ Niveau antispam défini sur *${chosen}* (${c.maxMessages} messages / ${c.windowSec}s).`);
        }

        if (['kick', 'warn', 'null'].includes(subCmd)) {
            setSetting(m.chat, 'antispam', { action: subCmd === 'null' ? null : subCmd });
            return await m.reply(`⚙️ Action antispam configurée sur : *\`${subCmd}\`*`);
        }

        return await m.reply('❌ Sous-commande invalide. Tapez `.antispam` pour consulter l\'aide.');
    }
};

export const listeners = [
    {
        on: 'message',
        priority: 35,
        async execute({ m, client, isOwner, isSudo }) {
            if (!m.isGroup || m.fromMe) return false;

            const setting = getSetting(m.chat, 'antispam');
            if (!setting.enabled) return false;

            if (isOwner || isSudo) return false;

            // Vérifier permissions admin
            const { isBotAdmin, isSenderAdmin } = await isAdmin(client, m.chat, m.sender);
            if (!isBotAdmin || isSenderAdmin) return false;

            const level = setting.data?.level || 'low';
            const { maxMessages, windowSec } = SPAM_LEVELS[level] || SPAM_LEVELS.low;
            const windowMs = windowSec * 1000;

            const key = `${m.chat}:${m.sender}`;
            const now = Date.now();

            const history = (spamTracker.get(key) || []).filter(t => now - t <= windowMs);
            history.push(now);
            spamTracker.set(key, history);

            if (history.length > maxMessages) {
                // Réinitialiser le tracker pour éviter les alertes en rafale sur chaque nouveau message
                spamTracker.delete(key);

                await executeAntiAction({
                    client,
                    chat: m.chat,
                    sender: m.sender,
                    messageKey: m.key,
                    action: setting.action,
                    reason: `Envoi trop rapide (${history.length} msg en ${windowSec}s)`
                });

                return true;
            }

            return false;
        }
    }
];
