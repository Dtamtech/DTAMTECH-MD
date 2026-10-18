import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const STATE_PATH = './src/db/anticall.json';

// ─── Persistance ─────────────────────────────────────────────

function readState() {
    try {
        if (!fs.existsSync(STATE_PATH)) return { enabled: false };
        return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8') || '{}');
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        const dir = path.dirname(STATE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATE_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch { }
}

// ─── Commande .anticall ────────────────────────────────────────

/**
 * Gère la commande `.anticall on|off|status`
 * @param {object} sock   - Socket Baileys
 * @param {object} m      - Message sérialisé
 * @param {string} args   - Arguments après la commande
 */
export async function anticallCommand(sock, m, args) {
    const sub = (args || '').trim().toLowerCase();

    if (!sub || !['on', 'off', 'status'].includes(sub)) {
        return m.reply(
            `*📵 Anti-Call*\n\n` +
            `Usage :\n` +
            `• *.anticall on* — Activer le blocage d'appels\n` +
            `• *.anticall off* — Désactiver\n` +
            `• *.anticall status* — Voir l'état actuel`
        );
    }

    if (sub === 'status') {
        const state = readState();
        return m.modify(`📵 Anti-Call : *${state.enabled ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}*`);
    }

    const enable = sub === 'on';
    writeState(enable);
    return m.modify(`📵 Anti-Call *${enable ? 'activé ✅' : 'désactivé ❌'}*`);
}

// ─── Handler d'appel (à brancher dans index.js) ───────────────

/**
 * Handler à passer à sock.ev.on('call', ...) dans index.js.
 * Rejette l'appel, notifie l'appelant et le bloque si anti-call est activé.
 * @param {object} sock    - Socket Baileys
 * @param {object[]} calls - Tableau d'appels reçus
 */
export async function handleCall(sock, calls) {
    const state = readState();
    if (!state.enabled) return;

    // Mémoriser les appelants notifiés pour éviter le spam (TTL 60s)
    if (!handleCall._notified) handleCall._notified = new Set();

    for (const call of calls) {
        const callerJid = call.from || call.peerJid || call.chatId;
        if (!callerJid) continue;

        // Tenter de rejeter l'appel
        try {
            if (typeof sock.rejectCall === 'function' && call.id) {
                await sock.rejectCall(call.id, callerJid);
            }
        } catch { }

        // Notifier une seule fois par fenêtre de 60s
        if (!handleCall._notified.has(callerJid)) {
            handleCall._notified.add(callerJid);
            setTimeout(() => handleCall._notified.delete(callerJid), 60_000);
            logger.warn(`📵 Appel rejeté et bloqué de : @${callerJid.split('@')[0]}`);

            await sock.sendMessage(callerJid, {
                text: '📵 *Anti-Call activé.*\nVotre appel a été rejeté automatiquement.\nVeuillez contacter le propriétaire en message.'
            });
        }

        // Bloquer après 800ms (laisser le reject se propager)
        setTimeout(async () => {
            try { await sock.updateBlockStatus(callerJid, 'block'); } catch { }
        }, 800);
    }
}

export default {
    name: 'anticall',
    description: 'Rejet automatique et blocage des appels vocaux et vidéo WhatsApp',
    anticallCommand,
    handleCall,
    commands: [
        {
            name: 'anticall',
            category: 'owner',
            description: 'Active ou désactive le rejet automatique des appels WhatsApp',
            usage: '.anticall on|off|status',
            ownerOnly: true,
            execute: async ({ client, m, args }) => {
                await anticallCommand(client, m, (args || []).join(' '));
            }
        }
    ],
    listeners: [
        {
            name: 'anticall_listener',
            on: 'call',
            execute: async ({ client, calls }) => {
                await handleCall(client, calls);
            }
        }
    ]
};
