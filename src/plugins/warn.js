import fs from 'fs';
import path from 'path';
import { isAdmin } from '../utils/isAdmin.js';
import { logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/errorHelper.js';

const WARNINGS_PATH = './src/db/warnings.json';
const MAX_WARNS = 3;

function loadWarnings() {
    try {
        if (!fs.existsSync(WARNINGS_PATH)) return {};
        return JSON.parse(fs.readFileSync(WARNINGS_PATH, 'utf8') || '{}');
    } catch { return {}; }
}

function saveWarnings(data) {
    try {
        const dir = path.dirname(WARNINGS_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(WARNINGS_PATH, JSON.stringify(data, null, 2));
    } catch { }
}

export async function warnCommand(sock, m) {
    if (!m.isGroup) return m.reply('❌ Cette commande ne fonctionne qu\'en groupe.');

    const target = m.args?.[0] || (m.isQuoted ? m.quoted?.sender : null);
    if (!target) return m.reply('❌ Mentionne un utilisateur ou réponds à son message.');

    const meta = await sock.groupMetadata(m.chat);
    const targetParticipant = meta.participants.find(p => p.id === target || p.lid === target);
    if (targetParticipant?.admin) return m.reply('⚠️ Impossible d\'avertir un admin.');

    await new Promise(r => setTimeout(r, 500));

    const warns = loadWarnings();
    if (!warns[m.chat]) warns[m.chat] = {};
    warns[m.chat][target] = (warns[m.chat][target] || 0) + 1;
    const count = warns[m.chat][target];
    saveWarnings(warns);

    const warnMsg =
        `〘 ⚠️ AVERTISSEMENT 〙\n` +
        `❍ Utilisateur* : @${target.split('@')[0]}\n` +
        `❍ Avertissements* : ${count}/${MAX_WARNS}\n` +
        `❍ Par* : @${m.sender.split('@')[0]}\n` +
        `❍ Date* : ${new Date().toLocaleString('fr-FR')}\n` +
        `════════════════⊷`;

    await sock.sendMessage(m.chat, {
        text: warnMsg,
        mentions: [target, m.sender]
    });
    logger.warn(`⚠️ Warn (${count}/${MAX_WARNS}) pour @${target.split('@')[0]} dans ${m.chat}`);

    if (count >= MAX_WARNS) {
        await new Promise(r => setTimeout(r, 1000));
        try {
            await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
            delete warns[m.chat][target];
            saveWarnings(warns);
            logger.warn(`👢 Kick auto de @${target.split('@')[0]} après 3 avertissements dans ${m.chat}`);
            await sock.sendMessage(m.chat, {
                text: `*🚫 KICK AUTO* : @${target.split('@')[0]} a été retiré après ${MAX_WARNS} avertissements.`,
                mentions: [target]
            });
        } catch (e) {
            await m.reply(formatErrorMessage(e, 'Expulsion'));
        }
    }
}

export async function resetWarnCommand(sock, m) {
    if (!m.isGroup) return m.reply('> ❌ Groupe uniquement.');
    const target = m.args?.[0] || (m.isQuoted ? m.quoted?.sender : null);
    if (!target) return m.reply('❌ Mentionne un utilisateur ou réponds à son message.');

    const warns = loadWarnings();
    if (warns[m.chat]?.[target]) {
        delete warns[m.chat][target];
        saveWarnings(warns);
    }
    await sock.sendMessage(m.chat, {
        text: `✅ Avertissements de @${target.split('@')[0]} remis à zéro.`,
        mentions: [target]
    });
}

export async function warningsCommand(sock, m) {
    if (!m.isGroup) return m.reply('> ❌ Groupe uniquement.');

    const target = m.args?.[0] || (m.isQuoted ? m.quoted?.sender : null) || m.sender;
    const warns = loadWarnings();
    const count = warns[m.chat]?.[target] || 0;

    await sock.sendMessage(m.chat, {
        text: `⚠️ @${target.split('@')[0]} a *${count}/${MAX_WARNS}* avertissement(s).`,
        mentions: [target]
    });
}

export default {
    name: 'warn',
    description: 'Système d\'avertissement et sanctions automatiques de groupe',
    commands: [
        {
            name: 'warn',
            category: 'group',
            description: 'Donne un avertissement à un membre (kick automatique à 3 warns)',
            usage: '.warn [@membre ou réponse]',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await warnCommand(ctx.client, ctx.m);
            }
        },
        {
            name: 'warnings',
            category: 'group',
            description: 'Affiche le nombre d\'avertissements d\'un membre',
            usage: '.warnings [@membre ou réponse]',
            groupOnly: true,
            execute: async (ctx) => {
                await warningsCommand(ctx.client, ctx.m);
            }
        },
        {
            name: 'resetwarn',
            category: 'group',
            description: 'Réinitialise les avertissements d\'un membre',
            usage: '.resetwarn [@membre ou réponse]',
            groupOnly: true,
            adminOnly: true,
            execute: async (ctx) => {
                await resetWarnCommand(ctx.client, ctx.m);
            }
        }
    ]
};
