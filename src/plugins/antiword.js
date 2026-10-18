/**
 * Plugin Antiword — Détection et censure des insultes et mots interdits dans les groupes.
 * Exploite la normalisation robuste (accents, leetspeak, ponctuation intercalée).
 */
import { getSetting, setSetting } from '../db/groupSettings.js';
import { findForbiddenWord } from '../utils/textNormalize.js';
import { executeAntiAction } from '../utils/antiAction.js';
import { isAdmin } from '../utils/isAdmin.js';

export default {
    name: 'antiword',
    aliases: ['antibadword', 'antimot'],
    desc: 'Configure le filtre des mots interdits et insultes dans le groupe',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    usage: '.antiword [on|off|kick|warn|null|add <mot>|remove <mot>|list|clear]',
    async execute({ m, args }) {
        const subCmd = args[0]?.toLowerCase();
        const current = getSetting(m.chat, 'antiword');

        if (!subCmd || subCmd === 'status' || subCmd === 'info') {
            const statusTxt = current.enabled ? '🟢 *Activé*' : '🔴 *Désactivé*';
            const actionTxt = current.action || 'Suppression seule (null)';
            const wordsCount = current.data?.words?.length || 0;

            return await m.reply(
                `🤬 *CONFIGURATION ANTI-MOTS*\n\n` +
                `🔹 *Statut* : ${statusTxt}\n` +
                `🔹 *Action* : \`${actionTxt}\`\n` +
                `🔹 *Mots configurés* : *${wordsCount}/200*\n\n` +
                `📖 *Commandes disponibles :*\n` +
                `• \`.antiword on\` / \`.antiword off\`\n` +
                `• \`.antiword kick\` / \`.antiword warn\` / \`.antiword null\`\n` +
                `• \`.antiword add mot1,mot2\`\n` +
                `• \`.antiword remove mot1\`\n` +
                `• \`.antiword list\` / \`.antiword clear\``
            );
        }

        if (subCmd === 'on') {
            setSetting(m.chat, 'antiword', { enabled: true });
            return await m.reply('✅ *Antiword activé* dans ce groupe.');
        }

        if (subCmd === 'off') {
            setSetting(m.chat, 'antiword', { enabled: false });
            return await m.reply('🛑 *Antiword désactivé* dans ce groupe.');
        }

        if (['kick', 'warn', 'null'].includes(subCmd)) {
            setSetting(m.chat, 'antiword', { action: subCmd === 'null' ? null : subCmd });
            return await m.reply(`⚙️ Action antiword configurée sur : *\`${subCmd}\`*`);
        }

        if (subCmd === 'add') {
            const rawWords = args.slice(1).join(' ').split(',');
            const existing = new Set(current.data?.words || []);

            const added = [];
            for (const rw of rawWords) {
                const w = rw.trim().toLowerCase();
                if (w && w.length <= 40 && existing.size < 200) {
                    existing.add(w);
                    added.push(w);
                }
            }

            if (added.length === 0) {
                return await m.reply('❌ Aucun mot valide à ajouter (max 40 caractères par mot, limite 200 mots).');
            }

            setSetting(m.chat, 'antiword', {
                data: { ...current.data, words: Array.from(existing) }
            });

            return await m.reply(`✅ Mots interdits ajoutés : \`${added.join(', ')}\``);
        }

        if (subCmd === 'remove' || subCmd === 'del') {
            const toRemove = args.slice(1).join(' ').toLowerCase().trim();
            if (!toRemove) {
                return await m.reply('❌ Précisez le mot à retirer. Exemple : `.antiword remove insult`');
            }

            const words = (current.data?.words || []).filter(w => w !== toRemove);
            setSetting(m.chat, 'antiword', { data: { ...current.data, words } });
            return await m.reply(`♻️ Le mot *\`${toRemove}\`* a été retiré de la liste.`);
        }

        if (subCmd === 'list') {
            const words = current.data?.words || [];
            if (words.length === 0) {
                return await m.reply('ℹ️ Aucun mot interdit n\'est actuellement configuré.');
            }
            return await m.reply(
                `📋 *MOTS INTERDITS (${words.length}) :*\n\n` +
                words.map(w => `• ${w}`).join('\n')
            );
        }

        if (subCmd === 'clear') {
            setSetting(m.chat, 'antiword', { data: { ...current.data, words: [] } });
            return await m.reply('♻️ Tous les mots interdits ont été effacés.');
        }

        return await m.reply('❌ Sous-commande invalide. Tapez `.antiword` pour voir le guide.');
    }
};

export const listeners = [
    {
        on: 'message',
        priority: 30,
        async execute({ m, client, isOwner, isSudo }) {
            if (!m.isGroup || m.fromMe) return false;

            const setting = getSetting(m.chat, 'antiword');
            if (!setting.enabled) return false;

            if (isOwner || isSudo) return false;

            const body = m.body || m.text || '';
            if (!body) return false;

            const words = setting.data?.words || [];
            if (words.length === 0) return false;

            const detected = findForbiddenWord(body, words);
            if (!detected) return false;

            // Vérifier les permissions admin
            const { isBotAdmin, isSenderAdmin } = await isAdmin(client, m.chat, m.sender);
            if (!isBotAdmin) return false;
            if (isSenderAdmin) return false;

            await executeAntiAction({
                client,
                chat: m.chat,
                sender: m.sender,
                messageKey: m.key,
                action: setting.action,
                reason: `Mot interdit détecté ("${detected}")`
            });

            return true;
        }
    }
];
