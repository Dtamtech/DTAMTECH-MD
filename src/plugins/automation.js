import UserConfig from '../config/config.js';
import { logger } from '../utils/logger.js';
import { getVar, setVar } from '../config/vars.js';

// ─── Auto-Status Viewer ───────────────────────────────────────

/**
 * Traite les statuts entrants (status@broadcast).
 * À appeler dans messages.upsert quand remoteJid === 'status@broadcast'.
 * @param {object} sock
 * @param {object} message - message brut Baileys
 */
export async function handleStatus(sock, message) {
    const enabled = await UserConfig.get('autoViewStatut');
    if (!enabled) return;

    try {
        await sock.readMessages([message.key]);
        logger.info(`👁️ Statut vu automatiquement pour @${(message.key.participant || '').split('@')[0] || 'Inconnu'}`);
    } catch { }
}

/**
 * Commande `.autostatus on|off|status`
 */
export async function autoStatusCommand(m) {
    const sub = m.args?.[0]?.toLowerCase();

    if (!sub || !['on', 'off', 'status'].includes(sub)) {
        return await m.reply(
            `*👁️ Auto-Status Viewer*\n\n` +
            `• *.autostatus on* — Marquer automatiquement les statuts comme vus\n` +
            `• *.autostatus off* — Désactiver\n` +
            `• *.autostatus status* — Voir l'état actuel`
        );
    }

    if (sub === 'status') {
        const val = await UserConfig.get('autoViewStatut');
        return await m.modify(`👁️ Auto-Status : *${val ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}*`);
    }

    const enable = sub === 'on';
    await UserConfig.set('autoViewStatut', enable);
    return await m.modify(`👁️ Auto-Status *${enable ? 'activé ✅' : 'désactivé ❌'}*`);
}

// ─── Auto-Read ────────────────────────────────────────────────

/**
 * Marque un message comme lu si autoReadMessage est activé.
 * À appeler dans messageHandler.js pour chaque message entrant.
 * @param {object} sock
 * @param {object} m - message sérialisé
 */
export async function autoRead(sock, m) {
    const enabled = await UserConfig.get('autoReadMessage');
    if (!enabled || m.fromMe) return;
    try {
        await sock.readMessages([m.key]);
    } catch { }
}

/**
 * Commande `.autoread on|off|status`
 */
export async function autoReadCommand(m) {
    const sub = m.args?.[0]?.toLowerCase();

    if (!sub || !['on', 'off', 'status'].includes(sub)) {
        return await m.reply(
            `*✅ Auto-Read*\n\n` +
            `• *.autoread on* — Marquer tous les messages comme lus\n` +
            `• *.autoread off* — Désactiver\n` +
            `• *.autoread status* — Voir l'état`
        );
    }

    if (sub === 'status') {
        const val = await UserConfig.get('autoReadMessage');
        return await m.modify(`✅ Auto-Read : *${val ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}*`);
    }

    const enable = sub === 'on';
    await UserConfig.set('autoReadMessage', enable);
    return await m.modify(`✅ Auto-Read *${enable ? 'activé ✅' : 'désactivé ❌'}*`);
}

// ─── Auto-Typing ──────────────────────────────────────────────

/**
 * Simule l'indicateur "en train d'écrire" avant une réponse.
 * Retourne une fonction stop() pour arrêter le typage.
 * @param {object} sock
 * @param {string} chatId
 * @param {number} durationMs - durée du typing (défaut 1200ms)
 */
export async function simulateTyping(sock, chatId, durationMs = 1200) {
    const enabled = await UserConfig.get('autoTyping');
    if (!enabled) return;
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(r => setTimeout(r, durationMs));
        await sock.sendPresenceUpdate('paused', chatId);
    } catch { }
}

/**
 * Commande `.autotyping on|off|status`
 */
export async function autoTypingCommand(m) {
    const sub = m.args?.[0]?.toLowerCase();

    if (!sub || !['on', 'off', 'status'].includes(sub)) {
        return await m.reply(
            `*⌨️ Auto-Typing*\n\n` +
            `• *.autotyping on* — Simuler l'indicateur "en train d'écrire"\n` +
            `• *.autotyping off* — Désactiver\n` +
            `• *.autotyping status* — Voir l'état`
        );
    }

    if (sub === 'status') {
        const val = getVar('PRESENCE_SIMULATION', 'true') === 'true';
        return await m.modify(`⌨️ Auto-Typing : *${val ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}*`);
    }

    const enable = sub === 'on';
    setVar('PRESENCE_SIMULATION', enable ? 'true' : 'false');
    await UserConfig.set('autoTyping', enable);
    await UserConfig.set('presenceSimulation', enable);
    return await m.modify(`⌨️ Auto-Typing *${enable ? 'activé ✅' : 'désactivé ❌'}*`);
}

/**
 * Commande `.presencesim on|off|status`
 * Configuration du comportement humain simulé antiban
 */
export async function presenceSimCommand(m) {
    const sub = m.args?.[0]?.toLowerCase();
    const current = getVar('PRESENCE_SIMULATION', 'true') === 'true';

    if (!sub || !['on', 'off', 'status'].includes(sub)) {
        const stateTxt = current ? '🟢 *ACTIVÉ*' : '🔴 *DÉSACTIVÉ*';
        return await m.reply(
            `🛡️ *COMPORTEMENT HUMAIN SIMULÉ (ANTIBAN)*\n\n` +
            `🔹 *État actuel* : ${stateTxt}\n\n` +
            `_Le bot émet les paquets « typing... » (en train d'écrire) avant de délivrer chaque réponse pour éviter les détections algorithmiques WhatsApp._\n\n` +
            `📖 *Commandes disponibles :*\n` +
            `• \`.presencesim on\` — Activer la simulation humaine\n` +
            `• \`.presencesim off\` — Désactiver la simulation\n` +
            `• \`.presencesim status\` — Voir le statut actuel`
        );
    }

    if (sub === 'status') {
        return await m.modify(`🛡️ Comportement humain simulé : *${current ? '🟢 ACTIVÉ (Antiban)' : '🔴 DÉSACTIVÉ'}*`);
    }

    const enable = sub === 'on';
    setVar('PRESENCE_SIMULATION', enable ? 'true' : 'false');
    await UserConfig.set('presenceSimulation', enable);
    await UserConfig.set('autoTyping', enable);

    return await m.modify(
        enable
            ? `✅ *Comportement humain simulé activé !* 🟢\n_Le bot émet désormais les indicateurs d'écriture avant chaque réponse pour sécuriser le compte._`
            : `⚠️ *Comportement humain simulé désactivé.* 🔴\n_Les réponses seront immédiates sans délai d'écriture humaine._`
    );
}

export default {
    name: 'automation',
    description: 'Automatismes WhatsApp (Auto-Status, Auto-Read, Auto-Typing, Présence Simulée)',
    handleStatus,
    autoStatusCommand,
    autoRead,
    autoReadCommand,
    simulateTyping,
    autoTypingCommand,
    presenceSimCommand,
    commands: [
        {
            name: 'autostatus',
            category: 'owner',
            description: 'Active ou désactive la consultation automatique des statuts WhatsApp',
            usage: '.autostatus <on|off|status>',
            ownerOnly: true,
            execute: async ({ m }) => {
                await autoStatusCommand(m);
            }
        },
        {
            name: 'autoread',
            category: 'owner',
            description: 'Active ou désactive la lecture automatique des messages reçus',
            usage: '.autoread <on|off|status>',
            ownerOnly: true,
            execute: async ({ m }) => {
                await autoReadCommand(m);
            }
        },
        {
            name: 'autotyping',
            category: 'owner',
            description: 'Active ou désactive l\'effet indicateur d\'écriture avant une réponse',
            usage: '.autotyping <on|off|status>',
            ownerOnly: true,
            execute: async ({ m }) => {
                await autoTypingCommand(m);
            }
        },
        {
            name: 'presencesim',
            aliases: ['presencesimulation', 'humansim', 'simpresence'],
            category: 'owner',
            description: 'Active ou désactive le comportement humain simulé (antiban)',
            usage: '.presencesim <on|off|status>',
            ownerOnly: true,
            execute: async ({ m }) => {
                await presenceSimCommand(m);
            }
        }
    ]
};
