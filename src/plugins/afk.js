/**
 * Plugin AFK — Notification d'absence et levée automatique au retour de l'utilisateur.
 * Alerte les participants lorsqu'ils mentionnent un membre absent (avec throttling).
 */
import dbStore from '../db/store.js';

// Throttling des alertes AFK : 1 notification toutes les 10 minutes par (chat:afkUser)
const afkAlertThrottle = new Map();

function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
}

export default {
    name: 'afk',
    aliases: ['absent', 'brb'],
    desc: 'Définit votre statut d\'absence avec une raison optionnelle',
    category: 'general',
    usage: '.afk [raison]',
    async execute({ m, args }) {
        const reason = args.join(' ').trim() || 'Aucune raison spécifiée';
        dbStore.setAfk(m.sender, reason);

        return await m.reply(
            `💤 *MODE ABSENT (AFK) ACTIVÉ*\n\n` +
            `> Raison : _${reason}_\n` +
            `_Le bot informera ceux qui vous mentionnent et désactivera l'AFK dès votre prochain message._`
        );
    }
};

export const listeners = [
    {
        on: 'message',
        priority: 85,
        async execute({ m }) {
            if (!m.sender) return false;

            const now = Math.floor(Date.now() / 1000);

            // 1. Si l'expéditeur du message est lui-même AFK, lever l'AFK
            const selfAfk = dbStore.getAfk(m.sender);
            if (selfAfk) {
                dbStore.clearAfk(m.sender);
                const durationSec = Math.max(0, now - (selfAfk.since || now));
                await m.reply(
                    `👋 *Bon retour @${m.sender.split('@')[0]} !*\n` +
                    `Votre statut AFK est levé (absence de *${formatDuration(durationSec)}*).`,
                    { mentions: [m.sender] }
                );
            }

            // 2. Si le message mentionne un utilisateur AFK
            const targets = new Set(Array.isArray(m.mentionedJid) ? m.mentionedJid : []);
            if (m.isQuoted && m.quoted?.sender) {
                targets.add(m.quoted.sender);
            }

            for (const targetJid of targets) {
                if (targetJid === m.sender) continue;

                const afkInfo = dbStore.getAfk(targetJid);
                if (afkInfo) {
                    const throttleKey = `${m.chat}:${targetJid}`;
                    const lastAlert = afkAlertThrottle.get(throttleKey) || 0;

                    // Throttling 10 minutes (600s)
                    if (now - lastAlert >= 600) {
                        afkAlertThrottle.set(throttleKey, now);
                        const durationSec = Math.max(0, now - (afkInfo.since || now));
                        await m.reply(
                            `💤 *@${targetJid.split('@')[0]}* est actuellement *AFK* (depuis ${formatDuration(durationSec)}).\n` +
                            `> Raison : _${afkInfo.reason}_`,
                            { mentions: [targetJid] }
                        );
                        return true;
                    }
                }
            }

            return false;
        }
    }
];
