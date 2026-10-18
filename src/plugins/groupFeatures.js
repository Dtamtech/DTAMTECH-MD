import store from '../db/store.js';
import { logger } from '../utils/logger.js';

export function incrementMessageCount(groupId, userId) {
    if (!groupId || !userId) return;
    store.incrementMessageCount(groupId, userId);
}

/**
 * Rétrocompatibilité pour le cycle d'arrêt propre.
 * Les écritures sont désormais synchronisées directement en base SQLite via store.js.
 */
export function flushCounts() {
    // Les compteurs étant synchronisés directement dans SQLite, rien à vider en mémoire.
}

export async function topMembersCommand(sock, m) {
    if (!m.isGroup) return m.reply('> ❌ Groupe uniquement.');

    const sorted = store.getTopMembers(m.chat, 5);
    if (!sorted || sorted.length === 0) {
        return m.reply('📊 Aucune activité enregistrée dans ce groupe.');
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    let msg = `〘 📊 TOP MEMBRES 〙\n`;
    msg += `❍ Groupe* : ${m.groupMetadata?.subject || m.chat}\n\n`;
    sorted.forEach((item, i) => {
        msg += `${medals[i]} @${item.userJid.split('@')[0]} — *${item.count}* message(s)\n`;
    });
    msg += `════════════════⊷`;

    await sock.sendMessage(m.chat, {
        text: msg,
        mentions: sorted.map((item) => item.userJid)
    });
}

const DEFAULT_WELCOME = (user, groupName, count) =>
    `〘 👋 BIENVENUE 〙\n` +
    `❍ Membre* : @${user}\n` +
    `❍ Groupe* : ${groupName}\n` +
    `❍ Membres* : ${count}\n` +
    `════════════════⊷`;

const DEFAULT_GOODBYE = (user, groupName) =>
    `〘 👋 AU REVOIR 〙\n` +
    `❍ Membre* : @${user}\n` +
    `❍ Groupe* : ${groupName}\n` +
    `════════════════⊷`;

export async function handleGroupParticipantEvent(sock, ev) {
    const { id: groupId, participants, action } = ev;
    if (!['add', 'remove', 'promote', 'demote'].includes(action)) return;

    let meta;
    try { meta = await sock.groupMetadata(groupId); } catch { return; }
    const groupName = meta?.subject || groupId;
    const count = meta?.participants?.length || 0;

    if (action === 'add') {
        const setting = store.getGroupSetting(groupId, 'welcome');
        if (!setting.enabled) return;
        const customRow = store.getCustomMessage(groupId, 'group.add');
        const template = customRow?.message || DEFAULT_WELCOME('{user}', groupName, '{count}');
        for (const participant of participants) {
            const jid = typeof participant === 'string' ? participant : participant.id;
            const user = jid.split('@')[0];
            const msg = template
                .replace(/{user}/g, `@${user}`)
                .replace(/\[TAG\]/g, `@${user}`)
                .replace(/{group}/g, groupName)
                .replace(/{count}/g, count);
            try {
                await sock.sendMessage(groupId, { text: msg, mentions: [jid] });
            } catch (e) {
                logger?.error?.(`Welcome error for ${jid}: ${e.message}`);
            }
        }
    } else if (action === 'remove') {
        const setting = store.getGroupSetting(groupId, 'goodbye');
        if (!setting.enabled) return;
        const customRow = store.getCustomMessage(groupId, 'group.remove');
        const template = customRow?.message || DEFAULT_GOODBYE('{user}', groupName);
        for (const participant of participants) {
            const jid = typeof participant === 'string' ? participant : participant.id;
            const user = jid.split('@')[0];
            const msg = template
                .replace(/{user}/g, `@${user}`)
                .replace(/\[TAG\]/g, `@${user}`)
                .replace(/{group}/g, groupName);
            try {
                await sock.sendMessage(groupId, { text: msg, mentions: [jid] });
            } catch (e) {
                logger?.error?.(`Goodbye error for ${jid}: ${e.message}`);
            }
        }
    } else if (action === 'promote' || action === 'demote') {
        const customRow = store.getCustomMessage(groupId, 'group.' + action);
        if (!customRow) return;
        for (const participant of participants) {
            const jid = typeof participant === 'string' ? participant : participant.id;
            const user = jid.split('@')[0];
            const msg = customRow.message
                .replace(/{user}/g, `@${user}`)
                .replace(/\[TAG\]/g, `@${user}`)
                .replace(/{group}/g, groupName);
            try {
                await sock.sendMessage(groupId, { text: msg, mentions: [jid] });
            } catch (e) {
                logger?.error?.(`${action} custom message error: ${e.message}`);
            }
        }
    }
}

export async function welcomeCommand(sock, m) {
    if (!m.isGroup) return m.reply('> ❌ Groupe uniquement.');
    if (!m.isAdmin && !m.fromMe) return m.reply('> ❌ Admins uniquement.');

    const [sub, ...rest] = m.args || [];
    const text = rest.join(' ');
    const welcomeSetting = store.getGroupSetting(m.chat, 'welcome');
    const customWelcome = store.getCustomMessage(m.chat, 'group.add');

    let groupName = m.groupMetadata?.subject;
    if (!groupName) {
        try {
            const meta = await sock.groupMetadata(m.chat);
            groupName = meta?.subject || m.chat;
        } catch {
            groupName = m.chat;
        }
    }

    const HELP = `*👋 Welcome*\n\n` +
        `• *.welcome on* — Activer\n` +
        `• *.welcome off* — Désactiver\n` +
        `• *.welcome status* — Voir l'état\n` +
        `• *.welcome setmsg <texte>* — Message custom\n` +
        `• *.welcome delmsg* — Supprimer message custom\n` +
        `\n> Variables : {user}, {group}, {count}`;

    if (!sub || !['on', 'off', 'status', 'setmsg', 'delmsg'].includes(sub.toLowerCase())) {
        return m.reply(HELP);
    }

    const action = sub.toLowerCase();

    if (action === 'status') {
        const welcomeText = customWelcome?.message || DEFAULT_WELCOME('{user}', groupName, '{count}');
        const prefixStatus = welcomeSetting.enabled ? '✅ *(Welcome actif)*\n\n' : `⚠️ *(Welcome actuellement désactivé)*\n\n`;
        return m.reply(`${prefixStatus}${welcomeText}`);
    }

    if (action === 'setmsg') {
        if (!text) return m.reply('> ❌ Message de bienvenue requis.');
        store.setCustomMessage(m.chat, 'group.add', text);
        return m.reply(`*Message de bienvenue enregistré dans la DB :*\n${text}`);
    }

    if (action === 'delmsg') {
        store.deleteCustomMessage(m.chat, 'group.add');
        return m.reply('🗑️ Message de bienvenue personnalisé supprimé (le modèle par défaut sera utilisé si activé).');
    }

    const enable = action === 'on';
    store.setGroupSetting(m.chat, 'welcome', { enabled: enable });

    if (enable) {
        const welcomeText = customWelcome?.message || DEFAULT_WELCOME('{user}', groupName, '{count}');
        return m.modify(`*Welcome activé avec succès ✅:*\n${welcomeText}`);
    }

    return m.modify(`👋 Welcome *désactivé ❌* pour le groupe *${groupName}*.`);
}

export async function goodbyeCommand(sock, m) {
    if (!m.isGroup) return m.reply('> ❌ Groupe uniquement.');
    if (!m.isAdmin && !m.fromMe) return m.reply('> ❌ Admins uniquement.');

    const [sub, ...rest] = m.args || [];
    const text = rest.join(' ');
    const goodbyeSetting = store.getGroupSetting(m.chat, 'goodbye');
    const customGoodbye = store.getCustomMessage(m.chat, 'group.remove');

    let groupName = m.groupMetadata?.subject;
    if (!groupName) {
        try {
            const meta = await sock.groupMetadata(m.chat);
            groupName = meta?.subject || m.chat;
        } catch {
            groupName = m.chat;
        }
    }

    const HELP = `*🚪 Goodbye*\n\n` +
        `• *.goodbye on* — Activer\n` +
        `• *.goodbye off* — Désactiver\n` +
        `• *.goodbye status* — Voir l'état\n` +
        `• *.goodbye setmsg <texte>* — Message custom\n` +
        `• *.goodbye delmsg* — Supprimer message custom\n` +
        `\n> Variables : {user}, {group}`;

    if (!sub || !['on', 'off', 'status', 'setmsg', 'delmsg'].includes(sub.toLowerCase())) {
        return m.reply(HELP);
    }

    const action = sub.toLowerCase();

    if (action === 'status') {
        const goodbyeText = customGoodbye?.message || DEFAULT_GOODBYE('{user}', groupName);
        const prefixStatus = goodbyeSetting.enabled ? '✅ *(Goodbye actif)*\n\n' : `⚠️ *(Goodbye actuellement désactivé)*\n\n`;
        return m.modify(`${prefixStatus}${goodbyeText}`);
    }

    if (action === 'setmsg') {
        if (!text) return m.reply('> ❌ Message requis. Variables : {user}, {group}');
        store.setCustomMessage(m.chat, 'group.remove', text);
        return m.reply(`*Message d'au revoir enregistré dans la DB :*\n${text}`);
    }

    if (action === 'delmsg') {
        store.deleteCustomMessage(m.chat, 'group.remove');
        return m.reply('🗑️ Message d\'au revoir personnalisé supprimé (le modèle par défaut sera utilisé si activé).');
    }

    const enable = action === 'on';
    store.setGroupSetting(m.chat, 'goodbye', { enabled: enable });

    if (enable) {
        const goodbyeText = customGoodbye?.message || DEFAULT_GOODBYE('{user}', groupName);
        return m.modify(`*Goodbye activé avec succès ✅:*\n${goodbyeText}`);
    }

    return m.modify(`🚪 Goodbye *désactivé ❌* avec succès.`);
}

export default {
    name: 'groupFeatures',
    description: 'Fonctionnalités avancées de groupe (classement, messages d\'accueil/départ personnalisés)',
    commands: [
        {
            name: 'topmembers',
            aliases: ['activecount'],
            category: 'group',
            description: 'Affiche le classement des membres les plus actifs',
            groupOnly: true,
            cooldown: 5,
            execute: async (ctx) => {
                await topMembersCommand(ctx.client, ctx.m);
            }
        },
        {
            name: 'welcome',
            aliases: [],
            category: 'group',
            description: 'Configure le message de bienvenue pour les nouveaux membres',
            usage: '.welcome on|off|status|setmsg <texte>',
            groupOnly: true,
            adminOnly: true,
            execute: async (ctx) => {
                await welcomeCommand(ctx.client, ctx.m);
            }
        },
        {
            name: 'goodbye',
            aliases: ['setgoodbye'],
            category: 'group',
            description: 'Configure le message de départ des membres quittant le groupe',
            usage: '.goodbye on|off|status|setmsg <texte>',
            groupOnly: true,
            adminOnly: true,
            execute: async (ctx) => {
                await goodbyeCommand(ctx.client, ctx.m);
            }
        }
    ]
};
