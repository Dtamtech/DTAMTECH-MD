/**
 * Plugin Filter — Auto-réponses personnalisées par mot-clé (local par chat ou global).
 * Supporte les réponses directes et les réponses par citation de message avec protection anti-boucle.
 */
import dbStore from '../db/store.js';
import { escapeRegex } from '../utils/textNormalize.js';

// Throttling en mémoire pour éviter les boucles entre bots (3 secondes par pattern dans un chat)
const filterThrottle = new Map();

function isThrottled(chat, pattern) {
    const key = `${chat}:${pattern.toLowerCase()}`;
    const now = Date.now();
    const last = filterThrottle.get(key) || 0;
    if (now - last < 3000) return true;
    filterThrottle.set(key, now);
    return false;
}

export default [
    {
        name: 'filter',
        aliases: ['autoresp', 'motcle'],
        desc: 'Crée une auto-réponse locale pour ce groupe/chat lorsqu\'un mot-clé est détecté',
        category: 'group',
        adminOnly: true,
        usage: '.filter <mot> [réponse ou répondre à un message]',
        async execute({ m, args }) {

            const pattern = args[0]?.trim();

            if (!pattern || pattern.toLowerCase() === 'list') {
                const list = dbStore.getFilters(m.chat);
                const localFilters = list.filter(f => f.jid !== 'global');
                if (localFilters.length === 0) {
                    return await m.reply(
                        'ℹ️ Aucun filtre actif pour ce chat.\n\n' +
                        'Pour en créer un :\n' +
                        '• `.filter bonjour Salut !`\n' +
                        '• Ou tapez `.filter salut` en répondant au message contenant la réponse souhaitée.'
                    );
                }

                return await m.reply(
                    `📋 *FILTRES ACTIFS DANS CE CHAT (${localFilters.length}/50) :*\n\n` +
                    localFilters.map(f => `• *\`${f.pattern}\`* ➔ ${f.response.length > 50 ? f.response.slice(0, 50) + '...' : f.response}`).join('\n') +
                    `\n\n_Pour supprimer un filtre : .stop <mot>_`
                );
            }

            if (pattern.length > 50) {
                return await m.reply('❌ Le mot-clé ne doit pas dépasser 50 caractères.');
            }

            // Réponse fournie via citation ou arguments
            let response = args.slice(1).join(' ').trim();
            if (!response && m.quoted) {
                response = m.quoted.body || m.quoted.text || '';
            }

            if (!response) {
                return await m.reply(
                    '❌ Réponse introuvable.\n' +
                    'Fournissez la réponse après le mot-clé ou répondez à un message :\n' +
                    'Exemple : `.filter regles Veuillez respecter les membres du groupe.`'
                );
            }

            if (response.length > 1000) {
                return await m.reply('❌ La réponse ne doit pas dépasser 1000 caractères.');
            }

            const existing = dbStore.getFilters(m.chat).filter(f => f.jid !== 'global');
            if (existing.length >= 50) {
                return await m.reply('❌ Limite atteinte : ce chat a déjà 50 filtres configurés.');
            }

            dbStore.addFilter(m.chat, pattern.toLowerCase(), response, 0);
            return await m.reply(`✅ Filtre enregistré !\nLorsque quelqu'un écrit *\`${pattern}\`*, le bot répondra automatiquement.`);
        }
    },

    {
        name: 'stop',
        aliases: ['delfilter', 'unfilter'],
        desc: 'Supprime une auto-réponse configurée dans ce chat',
        category: 'group',
        adminOnly: true,
        usage: '.stop <mot>',
        async execute({ m, args }) {

            const pattern = args[0]?.trim();
            if (!pattern) {
                return await m.reply('❌ Précisez le mot-clé à supprimer. Exemple : `.stop bonjour`');
            }

            const existing = dbStore.getFilter(m.chat, pattern.toLowerCase());
            if (!existing) {
                return await m.reply(`❌ Aucun filtre trouvé pour *\`${pattern}\`* dans ce chat.`);
            }

            dbStore.removeFilter(m.chat, pattern.toLowerCase());
            return await m.reply(`♻️ Le filtre pour *\`${pattern}\`* a été supprimé.`);
        }
    },

    {
        name: 'gfilter',
        aliases: ['globalfilter'],
        desc: 'Crée une auto-réponse globale active dans TOUTES les discussions (Owner only)',
        category: 'owner',
        ownerOnly: true,
        usage: '.gfilter <mot> [réponse ou citation]',
        async execute({ m, args }) {
            const pattern = args[0]?.trim();
            if (!pattern || pattern.toLowerCase() === 'list') {
                const list = dbStore.getFilters('global').filter(f => f.jid === 'global');
                if (list.length === 0) {
                    return await m.reply('ℹ️ Aucun filtre global configuré.');
                }
                return await m.reply(
                    `🌍 *FILTRES GLOBAUX ACTIFS (${list.length}) :*\n\n` +
                    list.map(f => `• *\`${f.pattern}\`* ➔ ${f.response}`).join('\n')
                );
            }

            let response = args.slice(1).join(' ').trim();
            if (!response && m.quoted) {
                response = m.quoted.body || m.quoted.text || '';
            }

            if (!response) {
                return await m.reply('❌ Veuillez préciser la réponse. Exemple : `.gfilter help Tapez .menu pour l\'aide`');
            }

            dbStore.addFilter('global', pattern.toLowerCase(), response, 0);
            return await m.reply(`✅ Filtre global enregistré pour *\`${pattern}\`*.`);
        }
    },

    {
        name: 'gstop',
        aliases: ['delgfilter'],
        desc: 'Supprime un filtre global',
        category: 'owner',
        ownerOnly: true,
        usage: '.gstop <mot>',
        async execute({ m, args }) {
            const pattern = args[0]?.trim();
            if (!pattern) {
                return await m.reply('❌ Précisez le mot-clé global à supprimer. Exemple : `.gstop help`');
            }

            dbStore.removeFilter('global', pattern.toLowerCase());
            return await m.reply(`♻️ Filtre global *\`${pattern}\`* supprimé.`);
        }
    }
];

export const listeners = [
    {
        on: 'message',
        priority: 80,
        async execute({ m }) {
            // Ignorer ses propres messages ou les messages vides
            if (m.fromMe) return false;

            const text = (m.body || m.text || '').trim();
            if (!text) return false;

            const filters = dbStore.getFilters(m.chat);
            if (filters.length === 0) return false;

            for (const f of filters) {
                const escaped = escapeRegex(f.pattern);
                // Regex avec frontières de mots insensibles à la casse
                const regex = new RegExp(`(?:^|[^a-zA-Z0-9À-ÿ])${escaped}(?:$|[^a-zA-Z0-9À-ÿ])`, 'i');

                if (regex.test(text)) {
                    if (isThrottled(m.chat, f.pattern)) {
                        return false;
                    }

                    await m.reply(f.response);
                    return true; // 1 seule réponse par message
                }
            }

            return false;
        }
    }
];
