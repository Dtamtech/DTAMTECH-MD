import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const STATE_PATH = './src/db/pmblocker.json';
const DEFAULT_MSG = '⚠️ *Messages privés bloqués.*\nCe bot n\'accepte pas les messages privés. Contactez le propriétaire dans un groupe.';

// ─── Persistance ─────────────────────────────────────────────

export function readState() {
    try {
        if (!fs.existsSync(STATE_PATH)) return { enabled: false, message: DEFAULT_MSG };
        const data = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8') || '{}');
        return {
            enabled: !!data.enabled,
            message: typeof data.message === 'string' && data.message.trim() ? data.message : DEFAULT_MSG,
        };
    } catch {
        return { enabled: false, message: DEFAULT_MSG };
    }
}

function writeState(enabled, message) {
    try {
        const dir = path.dirname(STATE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const current = readState();
        fs.writeFileSync(STATE_PATH, JSON.stringify({
            enabled: !!enabled,
            message: typeof message === 'string' && message.trim() ? message : current.message,
        }, null, 2));
    } catch { }
}

// ─── Commande .pmblocker ──────────────────────────────────────

/**
 * Gère la commande `.pmblocker on|off|status|setmsg <texte>`
 * @param {object} sock  - Socket Baileys
 * @param {object} m     - Message sérialisé
 * @param {string} args  - Arguments après la commande
 */
export async function pmblockerCommand(sock, m, args) {
    const parts = (args || '').trim().split(' ');
    const sub = parts[0]?.toLowerCase();
    const rest = parts.slice(1).join(' ');

    const HELP = `*🚫 PM Blocker*\n\n` +
        `• *.pmblocker on* — Activer le blocage des PM\n` +
        `• *.pmblocker off* — Désactiver\n` +
        `• *.pmblocker status* — Voir l'état\n` +
        `• *.pmblocker setmsg <texte>* — Changer le message de blocage`;

    if (!sub || !['on', 'off', 'status', 'setmsg'].includes(sub)) {
        return m.reply(HELP);
    }

    if (sub === 'status') {
        const state = readState();
        return m.modify(
            `🚫 PM Blocker : *${state.enabled ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}*\n` +
            `📝 Message actuel :\n${state.message}`
        );
    }

    if (sub === 'setmsg') {
        if (!rest.trim()) return m.reply('Usage : *.pmblocker setmsg <votre message>*');
        const state = readState();
        writeState(state.enabled, rest.trim());
        return m.modify('✅ Message de PM Blocker mis à jour.');
    }

    const enable = sub === 'on';
    writeState(enable);
    return m.modify(`🚫 PM Blocker *${enable ? 'activé ✅' : 'désactivé ❌'}*`);
}

// ─── Handler (pour intercepter les PM) ─────────────────────────

/**
 * Vérifie si un message privé doit être bloqué.
 * Retourne true si le message a été bloqué (et donc doit être ignoré par la suite).
 * @param {object} sock - Socket Baileys
 * @param {object} m    - Message sérialisé
 */
export async function checkPmBlocker(sock, m) {
    if (m.isGroup || m.fromMe) return false; // ne s'applique qu'aux PM entrants

    const state = readState();
    if (!state.enabled) return false;

    logger.warn(`🚫 Message privé bloqué de : @${m.sender?.split('@')[0] || m.chat}`);
    try {
        await sock.sendMessage(m.chat, { text: state.message });
    } catch { }

    return true; // message bloqué → interrompre le traitement
}

export default {
    name: 'pmblocker',
    description: 'Blocage automatique des messages privés (PM)',
    readState,
    pmblockerCommand,
    checkPmBlocker,
    commands: [
        {
            name: 'pmblocker',
            category: 'owner',
            description: 'Active, désactive ou configure le blocage des messages privés entrants',
            usage: '.pmblocker on|off|status|setmsg <texte>',
            ownerOnly: true,
            execute: async ({ client, m, args }) => {
                await pmblockerCommand(client, m, (args || []).join(' '));
            }
        }
    ],
    listeners: [
        {
            name: 'pmblocker_listener',
            on: 'message',
            priority: 5,
            execute: async ({ client, m }) => {
                return await checkPmBlocker(client, m);
            }
        }
    ]
};
