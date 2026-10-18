/**
 * Plugin Antilink — Détection et modération des liens partagés dans les groupes.
 * Supporte la liste blanche (allow), la liste noire (disallow), et les actions kick/warn/null.
 */
import { getSetting, setSetting } from '../db/groupSettings.js';
import { normalizeUrl, extractDomains } from '../utils/url.js';
import { executeAntiAction } from '../utils/antiAction.js';
import { isAdmin } from '../utils/isAdmin.js';

export default {
    name: 'antilink',
    aliases: ['linkprotect'],
    desc: 'Configure la protection anti-liens dans le groupe',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    usage: '.antilink [on|off|kick|warn|null|allow <domain>|disallow <domain>|list|clear]',
    async execute({ m, args, client }) {
        const subCmd = args[0]?.toLowerCase();
        const current = getSetting(m.chat, 'antilink');

        if (!subCmd || subCmd === 'status' || subCmd === 'info') {
            const statusTxt = current.enabled ? '🟢 *Activé*' : '🔴 *Désactivé*';
            const actionTxt = current.action || 'Suppression seule (null)';
            const allowList = current.data?.allow?.length ? current.data.allow.join(', ') : 'Aucun (tous interdits)';
            const disallowList = current.data?.disallow?.length ? current.data.disallow.join(', ') : 'Aucun';

            return await m.reply(
                `🛡️ *CONFIGURATION ANTILINK*\n\n` +
                `🔹 *Statut* : ${statusTxt}\n` +
                `🔹 *Action* : \`${actionTxt}\`\n` +
                `🔹 *Liste blanche (autorisés)* : \`${allowList}\`\n` +
                `🔹 *Liste noire (bloqués)* : \`${disallowList}\`\n\n` +
                `📖 *Commandes disponibles :*\n` +
                `• \`.antilink on\` / \`.antilink off\`\n` +
                `• \`.antilink kick\` / \`.antilink warn\` / \`.antilink null\`\n` +
                `• \`.antilink allow youtube.com,google.com\`\n` +
                `• \`.antilink disallow telegram.org\`\n` +
                `• \`.antilink clear [allow|disallow]\``
            );
        }

        if (subCmd === 'on') {
            setSetting(m.chat, 'antilink', { enabled: true });
            return await m.reply('✅ *Antilink activé* dans ce groupe.');
        }

        if (subCmd === 'off') {
            setSetting(m.chat, 'antilink', { enabled: false });
            return await m.reply('🛑 *Antilink désactivé* dans ce groupe.');
        }

        if (['kick', 'warn', 'null'].includes(subCmd)) {
            setSetting(m.chat, 'antilink', { action: subCmd === 'null' ? null : subCmd });
            return await m.reply(`⚙️ Action de modération antilink définie sur : *\`${subCmd}\`*`);
        }

        if (subCmd === 'allow') {
            const rawDomains = args.slice(1).join(' ').split(',');
            const toAdd = rawDomains.map(normalizeUrl).filter(d => d.includes('.'));
            if (toAdd.length === 0) {
                return await m.reply('❌ Veuillez spécifier un ou plusieurs domaines valides (ex: `.antilink allow youtube.com,github.com`).');
            }

            const currentAllow = new Set(current.data?.allow || []);
            toAdd.forEach(d => currentAllow.add(d));
            const updated = setSetting(m.chat, 'antilink', {
                data: { ...current.data, allow: Array.from(currentAllow) }
            });

            return await m.reply(`✅ Domaines ajoutés à la liste blanche :\n\`${toAdd.join(', ')}\``);
        }

        if (subCmd === 'disallow') {
            const rawDomains = args.slice(1).join(' ').split(',');
            const toAdd = rawDomains.map(normalizeUrl).filter(d => d.includes('.'));
            if (toAdd.length === 0) {
                return await m.reply('❌ Veuillez spécifier un ou plusieurs domaines valides (ex: `.antilink disallow t.me,bit.ly`).');
            }

            const currentDisallow = new Set(current.data?.disallow || []);
            toAdd.forEach(d => currentDisallow.add(d));
            setSetting(m.chat, 'antilink', {
                data: { ...current.data, disallow: Array.from(currentDisallow) }
            });

            return await m.reply(`🚫 Domaines ajoutés à la liste noire :\n\`${toAdd.join(', ')}\``);
        }

        if (subCmd === 'clear') {
            const target = args[1]?.toLowerCase();
            if (target === 'allow') {
                setSetting(m.chat, 'antilink', { data: { ...current.data, allow: [] } });
                return await m.reply('♻️ Liste blanche antilink réinitialisée.');
            }
            if (target === 'disallow') {
                setSetting(m.chat, 'antilink', { data: { ...current.data, disallow: [] } });
                return await m.reply('♻️ Liste noire antilink réinitialisée.');
            }
            setSetting(m.chat, 'antilink', { data: { allow: [], disallow: [] } });
            return await m.reply('♻️ Listes blanche et noire antilink vidées.');
        }

        if (subCmd === 'list') {
            const allowList = current.data?.allow?.length ? current.data.allow.join('\n• ') : '(aucune)';
            const disallowList = current.data?.disallow?.length ? current.data.disallow.join('\n• ') : '(aucune)';
            return await m.reply(
                `📋 *LISTES DE DOMAINES ANTILINK*\n\n` +
                `🟢 *Autorisés (allow) :*\n• ${allowList}\n\n` +
                `🔴 *Interdits (disallow) :*\n• ${disallowList}`
            );
        }

        return await m.reply('❌ Sous-commande inconnue. Tapez `.antilink` pour voir le guide.');
    }
};

export const listeners = [
    {
        on: 'message',
        priority: 30,
        async execute({ m, client, isOwner, isSudo }) {
            if (!m.isGroup || m.fromMe) return false;

            const setting = getSetting(m.chat, 'antilink');
            if (!setting.enabled) return false;

            // Ne jamais sanctionner le bot lui-même, l'owner ou un utilisateur sudo
            if (isOwner || isSudo) return false;

            // Extraire le texte du message
            const body = m.body || m.text || '';
            if (!body) return false;

            const domains = extractDomains(body);
            if (domains.length === 0) return false;

            // Vérifier le statut de l'expéditeur et du bot dans le groupe
            const { isBotAdmin, isSenderAdmin } = await isAdmin(client, m.chat, m.sender);
            if (!isBotAdmin) return false; // Le bot ne peut pas sévir s'il n'est pas admin
            if (isSenderAdmin) return false; // Les admins sont exemptés de l'anti-lien

            const allowList = setting.data?.allow || [];
            const disallowList = setting.data?.disallow || [];

            let isViolation = false;
            for (const d of domains) {
                // 1. Liste noire explicite
                if (disallowList.includes(d)) {
                    isViolation = true;
                    break;
                }
                // 2. Si une liste blanche existe, tout ce qui n'en fait pas partie est interdit
                if (allowList.length > 0 && !allowList.includes(d)) {
                    isViolation = true;
                    break;
                }
                // 3. Si aucune liste blanche n'est définie, tout lien constitue une infraction
                if (allowList.length === 0) {
                    isViolation = true;
                    break;
                }
            }

            if (isViolation) {
                await executeAntiAction({
                    client,
                    chat: m.chat,
                    sender: m.sender,
                    messageKey: m.key,
                    action: setting.action,
                    reason: 'Lien non autorisé'
                });
                return true; // Interrompt la chaîne pour ne pas traiter ce message plus loin
            }

            return false;
        }
    }
];
