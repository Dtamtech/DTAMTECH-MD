/**
 * Plugin Antifake — Filtrage des membres par indicatif pays à leur entrée dans le groupe.
 * Supporte le mode liste blanche (allow) ou liste noire (disallow) avec exclusion mutuelle stricte.
 */
import { getSetting, setSetting } from '../db/groupSettings.js';
import { extractCountryCode, COUNTRY_CODES, sanitizeCountryCode } from '../utils/countryCodes.js';
import { isAdmin } from '../utils/isAdmin.js';
import { logger } from '../utils/logger.js';

export default {
    name: 'antifake',
    aliases: ['fakefilter'],
    desc: 'Filtre les numéros étrangers ou non désirés à l\'entrée du groupe',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    usage: '.antifake [on|off|allow <codes>|disallow <codes>|remove <code>|list|clear]',
    async execute({ m, args }) {
        const subCmd = args[0]?.toLowerCase();
        const current = getSetting(m.chat, 'antifake');
        const mode = current.data?.mode || 'non configuré';
        const codes = current.data?.codes || [];

        if (!subCmd || subCmd === 'status' || subCmd === 'info') {
            const statusTxt = current.enabled ? '🟢 *Activé*' : '🔴 *Désactivé*';
            const formattedCodes = codes.map(c => `+${c} (${COUNTRY_CODES[c]?.name || 'Autre'})`).join(', ') || 'Aucun';

            return await m.reply(
                `🌍 *CONFIGURATION ANTIFAKE*\n\n` +
                `🔹 *Statut* : ${statusTxt}\n` +
                `🔹 *Mode actif* : \`${mode}\`\n` +
                `🔹 *Indicatifs surveillés* : \`${formattedCodes}\`\n\n` +
                `📖 *Commandes disponibles :*\n` +
                `• \`.antifake on\` / \`.antifake off\`\n` +
                `• \`.antifake allow 33,225\` _(Seuls ces pays sont autorisés)_\n` +
                `• \`.antifake disallow 91,92\` _(Ces pays sont interdits)_\n` +
                `• \`.antifake remove 91\`\n` +
                `• \`.antifake list\` / \`.antifake clear\``
            );
        }

        if (subCmd === 'on') {
            setSetting(m.chat, 'antifake', { enabled: true });
            return await m.reply('✅ *Antifake activé* dans ce groupe.');
        }

        if (subCmd === 'off') {
            setSetting(m.chat, 'antifake', { enabled: false });
            return await m.reply('🛑 *Antifake désactivé* dans ce groupe.');
        }

        if (subCmd === 'allow') {
            // Règle d'exclusion mutuelle : si déjà configuré en blacklist
            if (current.data?.mode === 'blacklist' && current.data?.codes?.length > 0) {
                return await m.reply(
                    '⚠️ *Conflit de mode* : Une liste noire (disallow) est déjà active.\n' +
                    'La liste blanche et la liste noire ne peuvent pas coexister.\n' +
                    'Faites d\'abord `.antifake clear` pour changer de mode.'
                );
            }

            const rawCodes = args.slice(1).join(' ').split(',');
            const newCodes = rawCodes.map(sanitizeCountryCode).filter(c => c.length > 0);

            if (newCodes.length === 0) {
                return await m.reply('❌ Veuillez indiquer au moins un indicatif (ex: `.antifake allow 33,225`).');
            }

            const merged = Array.from(new Set([...(current.data?.codes || []), ...newCodes]));
            setSetting(m.chat, 'antifake', {
                data: { mode: 'whitelist', codes: merged }
            });

            return await m.reply(`✅ Mode *Liste Blanche* configuré avec les indicatifs : \`+${merged.join(', +')}\``);
        }

        if (subCmd === 'disallow') {
            // Règle d'exclusion mutuelle : si déjà configuré en whitelist
            if (current.data?.mode === 'whitelist' && current.data?.codes?.length > 0) {
                return await m.reply(
                    '⚠️ *Conflit de mode* : Une liste blanche (allow) est déjà active.\n' +
                    'La liste blanche et la liste noire ne peuvent pas coexister.\n' +
                    'Faites d\'abord `.antifake clear` pour changer de mode.'
                );
            }

            const rawCodes = args.slice(1).join(' ').split(',');
            const newCodes = rawCodes.map(sanitizeCountryCode).filter(c => c.length > 0);

            if (newCodes.length === 0) {
                return await m.reply('❌ Veuillez indiquer au moins un indicatif (ex: `.antifake disallow 91,92`).');
            }

            const merged = Array.from(new Set([...(current.data?.codes || []), ...newCodes]));
            setSetting(m.chat, 'antifake', {
                data: { mode: 'blacklist', codes: merged }
            });

            return await m.reply(`🚫 Mode *Liste Noire* configuré avec les indicatifs : \`+${merged.join(', +')}\``);
        }

        if (subCmd === 'remove') {
            const target = sanitizeCountryCode(args[1]);
            if (!target) {
                return await m.reply('❌ Veuillez indiquer l\'indicatif à retirer (ex: `.antifake remove 91`).');
            }

            const filtered = (current.data?.codes || []).filter(c => c !== target);
            setSetting(m.chat, 'antifake', {
                data: { ...current.data, codes: filtered }
            });

            return await m.reply(`♻️ L'indicatif \`+${target}\` a été retiré.`);
        }

        if (subCmd === 'list') {
            if (codes.length === 0) {
                return await m.reply('ℹ️ Aucun indicatif configuré.');
            }

            const items = codes.map(c => {
                const info = COUNTRY_CODES[c];
                return `• *+${c}* : ${info?.flag || '🌐'} ${info?.name || 'Inconnu'}`;
            });

            return await m.reply(
                `📋 *INDICATIFS ANTIFAKE (${mode.toUpperCase()}) :*\n\n` +
                items.join('\n')
            );
        }

        if (subCmd === 'clear') {
            setSetting(m.chat, 'antifake', { data: { mode: null, codes: [] } });
            return await m.reply('♻️ Paramètres antifake réinitialisés.');
        }

        return await m.reply('❌ Sous-commande invalide. Tapez `.antifake` pour consulter l\'aide.');
    }
};

export const listeners = [
    {
        on: 'group-participants.update',
        priority: 20,
        async execute({ ev, client }) {
            const { id, action, participants } = ev;
            if (action !== 'add' || !participants || participants.length === 0) {
                return false;
            }

            const setting = getSetting(id, 'antifake');
            if (!setting.enabled) return false;

            const mode = setting.data?.mode;
            const codes = setting.data?.codes || [];
            if (!mode || codes.length === 0) return false;

            // Vérifier que le bot est admin pour pouvoir exclure
            const botJid = client.user?.id || '';
            const { isBotAdmin } = await isAdmin(client, id, botJid);
            if (!isBotAdmin) return false;

            for (const participant of participants) {
                const pJid = typeof participant === 'string' ? participant : participant.id;
                const phone = pJid.split('@')[0];
                const countryCode = extractCountryCode(phone);

                let isRejected = false;

                if (mode === 'whitelist') {
                    // Si l'indicatif n'est pas dans la whitelist, rejeté
                    if (!countryCode || !codes.includes(countryCode)) {
                        isRejected = true;
                    }
                } else if (mode === 'blacklist') {
                    // Si l'indicatif est dans la blacklist, rejeté
                    if (countryCode && codes.includes(countryCode)) {
                        isRejected = true;
                    }
                }

                if (isRejected) {
                    try {
                        await client.groupParticipantsUpdate(id, [pJid], 'remove');
                        const countryInfo = countryCode ? COUNTRY_CODES[countryCode] : null;
                        const countryName = countryInfo ? `${countryInfo.flag} ${countryInfo.name}` : `+${countryCode || 'inconnu'}`;

                        await client.sendMessage(id, {
                            text: `🚫 *@${phone}* a été expulsé automatiquement par la protection *Antifake*.\n> Indicatif non autorisé : *${countryName}*`,
                            mentions: [pJid]
                        });
                        logger.warn(`[Antifake] Utilisateur ${phone} (+${countryCode}) expulsé de ${id}`);
                    } catch (err) {
                        logger.error(`[Antifake] Échec expulsion ${phone} : ${err.message}`);
                    }
                }
            }

            return false;
        }
    }
];
