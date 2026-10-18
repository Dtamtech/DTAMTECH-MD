/**
 * Plugin Tools — Réactions, chaînes WhatsApp (newsletters), transfert sécurisé et profil.
 */
import dbStore from '../db/store.js';

const EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})(\uFE0F|\p{Emoji_Modifier})?$/u;

export default [
    {
        name: 'react',
        aliases: ['reaction', 'reagir'],
        desc: 'Réagit avec un emoji au message cité',
        category: 'tools',
        usage: '.react <emoji> (en réponse à un message)',
        async execute({ m, args, client: sock }) {
            if (!m.quoted) {
                return await m.reply('❌ Veuillez répondre à un message avec l\'emoji souhaité.');
            }

            const emoji = args[0]?.trim();
            if (!emoji || !EMOJI_REGEX.test(emoji)) {
                return await m.reply('❌ Veuillez spécifier un emoji unique valide. Exemple : `.react ❤️`');
            }

            try {
                await sock.sendMessage(m.chat, {
                    react: {
                        text: emoji,
                        key: m.quoted.key
                    }
                });
            } catch (err) {
                return await m.reply(`❌ Échec de la réaction : ${err.message}`);
            }
        }
    },

    {
        name: 'cinfo',
        aliases: ['channelinfo', 'chinfo'],
        desc: 'Affiche les informations d\'une chaîne WhatsApp (newsletter)',
        category: 'tools',
        usage: '.cinfo <lien_chaine>',
        async execute({ m, args, client: sock }) {
            const input = args[0]?.trim();
            if (!input) {
                return await m.reply('❌ Veuillez fournir le lien de la chaîne. Exemple : `.cinfo https://whatsapp.com/channel/123456789`');
            }

            const match = input.match(/whatsapp\.com\/channel\/([a-zA-Z0-9]+)/i);
            const inviteCode = match ? match[1] : input.replace(/^@/, '');

            if (!sock.newsletterMetadata) {
                return await m.reply('❌ La version actuelle de connexion ne supporte pas l\'inspection de chaîne.');
            }

            try {
                const meta = await sock.newsletterMetadata('invite', inviteCode);
                if (!meta) {
                    return await m.reply('❌ Chaîne introuvable ou lien expiré.');
                }

                const subCount = meta.subscribers_count ? Number(meta.subscribers_count).toLocaleString('fr-FR') : 'Inconnu';
                const verified = meta.verification === 'VERIFIED' ? '✅ Vérifiée' : '⚪ Standard';
                const created = meta.creation_time
                    ? new Date(Number(meta.creation_time) * 1000).toLocaleDateString('fr-FR')
                    : 'Inconnue';

                const card = `📢 *CHAÎNE WHATSAPP : ${meta.name || 'Sans titre'}*\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `🔹 *Statut* : ${verified}\n` +
                    `🔹 *Abonnés* : \`${subCount}\`\n` +
                    `🔹 *Création* : \`${created}\`\n` +
                    `🔹 *Identifiant JID* : \`${meta.id || 'N/A'}\`\n\n` +
                    (meta.description ? `📝 *Description* :\n> ${meta.description.slice(0, 300)}\n\n` : '') +
                    `🔗 \`https://whatsapp.com/channel/${inviteCode}\``;

                if (meta.picture) {
                    return await sock.sendMessage(m.chat, {
                        image: { url: meta.picture },
                        caption: card
                    }, { quoted: m });
                }

                return await m.reply(card);
            } catch (err) {
                return await m.reply(`❌ Erreur lors de la récupération des détails de la chaîne : ${err.message}`);
            }
        }
    },

    {
        name: 'forward',
        aliases: ['fwd', 'retransmettre'],
        desc: 'Retransmet le message cité vers des destinataires spécifiés',
        category: 'tools',
        usage: '.forward <numéro ou jid> [jid2, jid3...]',
        sudoOnly: true,
        async execute({ m, args, client: sock }) {

            if (!m.quoted) {
                return await m.reply('❌ Répondez au message que vous souhaitez retransmettre.');
            }

            if (args.length === 0) {
                return await m.reply('❌ Précisez au moins un destinataire (numéro ou lien). Exemple : `.forward 237600000000`');
            }

            const rawTargets = args.flatMap(a => a.split(',')).map(t => t.trim()).filter(Boolean);
            const targets = rawTargets.map(t => {
                if (t.includes('@')) return t;
                const cleanDigits = t.replace(/\D/g, '');
                return cleanDigits ? `${cleanDigits}@s.whatsapp.net` : null;
            }).filter(Boolean);

            if (targets.length === 0) {
                return await m.reply('❌ Aucun numéro de destinataire valide trouvé.');
            }

            const limitedTargets = targets.slice(0, 10);
            let successCount = 0;

            for (const targetJid of limitedTargets) {
                try {
                    await sock.copyNForward(targetJid, m.quoted.fakeObj || m.quoted, true);
                    successCount++;
                } catch {
                    // Fallback texte simple si copyNForward échoue
                    if (m.quoted.body) {
                        await sock.sendMessage(targetJid, { text: m.quoted.body }).catch(() => {});
                        successCount++;
                    }
                }
                // Temporisation 2 secondes anti-ban
                await new Promise(r => setTimeout(r, 2000));
            }

            return await m.reply(`✅ Message retransmis avec succès vers *${successCount}/${limitedTargets.length}* destinataire(s).`);
        }
    },

    {
        name: 'profile',
        aliases: ['profil', 'whois', 'userinfo'],
        desc: 'Affiche la fiche profil complète d\'un utilisateur',
        category: 'tools',
        usage: '.profile [@mention ou en réponse]',
        async execute({ m, client: sock }) {
            let targetJid = m.quoted?.sender || m.mentionedJid?.[0] || m.sender;

            const numOnly = targetJid.split('@')[0];
            let name = targetJid === m.sender ? (m.pushName || numOnly) : numOnly;
            let bio = 'Aucune bio disponible';
            let profilePic = null;

            try {
                const statusObj = await sock.fetchStatus?.(targetJid);
                if (statusObj?.status) bio = statusObj.status;
            } catch { }

            try {
                profilePic = await sock.profilePictureUrl?.(targetJid, 'image');
            } catch { }

            const afk = dbStore.getAfk?.(targetJid);
            const afkStatus = afk ? `🔴 AFK depuis ${new Date(afk.since * 1000).toLocaleTimeString('fr-FR')} : _${afk.reason}_` : '🟢 En ligne';

            const card = `👤 *PROFIL UTILISATEUR*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `🔹 *Nom* : ${name}\n` +
                `🔹 *Numéro* : \`+${numOnly}\`\n` +
                `🔹 *Statut* : ${afkStatus}\n` +
                `🔹 *Bio* : _${bio}_\n` +
                `🔹 *JID* : \`${targetJid}\``;

            if (profilePic) {
                return await sock.sendMessage(m.chat, {
                    image: { url: profilePic },
                    caption: card
                }, { quoted: m });
            }

            return await m.reply(card);
        }
    },

    {
        name: 'spam',
        aliases: ['repspam', 'flood'],
        desc: 'Répète un message un certain nombre de fois avec délai anti-ban',
        category: 'tools',
        ownerOnly: true,
        usage: '.spam <nombre 1-20> <texte>',
        async execute({ m, args, client: sock }) {
            const count = Number.parseInt(args[0], 10);
            if (!count || Number.isNaN(count) || count < 1) {
                return await m.reply('❌ Veuillez indiquer un nombre entre 1 et 20. Exemple : `.spam 5 Bonjour !`');
            }

            const safeCount = Math.min(count, 20);
            const text = args.slice(1).join(' ').trim();
            if (!text) {
                return await m.reply('❌ Précisez le texte à répéter. Exemple : `.spam 3 Alerte générale`');
            }

            for (let i = 0; i < safeCount; i++) {
                await sock.sendMessage(m.chat, { text }).catch(() => {});
                // Temporisation 1 seconde anti-ban
                if (i < safeCount - 1) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    }
];
