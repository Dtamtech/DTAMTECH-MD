import { logger } from '../utils/logger.js';
import { normalizeEmoji } from '../utils/interactionManager.js';

const DEFAULT_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

/**
 * Extrait un emoji d'une chaîne de texte (couvre pictographes, drapeaux et touches 1️⃣, 2️⃣...)
 */
function extractEmoji(text) {
    const emojiRegex = /(\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]{2}|[0-9#*]\uFE0F?\u20E3)/u;
    const match = text.match(emojiRegex);
    return match ? match[0] : null;
}

/**
 * Commande .poll
 * Crée un sondage interactif en direct réagissant aux votes par réactions emoji (onReact).
 *
 * Utilisation :
 * .poll Titre du sondage | Option 1 👍 | Option 2 👎
 */
export async function pollCommand(m) {
    const rawText = m.textMessage || (m.args ? m.args.join(' ') : '');
    const parts = rawText.split('|').map(p => p.trim()).filter(Boolean);

    let question = "Sondage interactif";
    let options = [];

    if (parts.length >= 3) {
        question = parts[0];
        options = parts.slice(1);
    } else if (parts.length === 2) {
        question = parts[0];
        options = [parts[1], "Autre"];
    } else {
        question = parts[0] || "Aimez-vous cette nouvelle fonctionnalité interactive ?";
        options = ["Oui absolument 👍", "Pas vraiment 👎"];
    }

    // Si exactement 2 options et qu'aucun emoji personnalisé n'est fourni, proposer 👍 et 👎
    const hasAnyCustomEmoji = options.some(opt => extractEmoji(opt) !== null);
    const fallbackEmojis = (options.length === 2 && !hasAnyCustomEmoji)
        ? ['👍', '👎']
        : DEFAULT_EMOJIS;

    // Associer un emoji à chaque option
    const parsedOptions = options.map((opt, idx) => {
        const foundEmoji = extractEmoji(opt);
        const assignedEmoji = foundEmoji || fallbackEmojis[idx % fallbackEmojis.length];
        const cleanTitle = opt.replace(assignedEmoji, '').trim();
        return {
            index: idx + 1,
            title: cleanTitle || `Option ${idx + 1}`,
            emoji: assignedEmoji,
            votes: 0
        };
    });

    const allowedEmojis = parsedOptions.map(o => o.emoji);
    const userVotes = new Map(); // senderId -> emoji voté

    function renderPollText() {
        const totalVotes = userVotes.size;
        let card =
            `〘 📊 SONDAGE INTERACTIF 〙\n` +
            `❓ *Question :*\n` +
            `*${question}*\n\n` +
            `🔘 *Votes :*\n`;

        for (const opt of parsedOptions) {
            const count = opt.votes;
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const filled = Math.round(percentage / 10);
            const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
            card += `${opt.emoji} *${opt.title}* : *${count}* vote(s) [${bar}] ${percentage}%\n`;
        }

        card +=
            `\n🗳️ *Total de votes :* ${totalVotes}\n` +
            `💡 *Votez en réagissant avec l'un des emojis indiqués !*\n` +
            `⏱️ Durée : 2 minutes\n` +
            `════════════════⊷`;
        return card;
    }

    await m.react('📊');
    const sent = await m.reply(renderPollText());

    if (!sent || typeof sent.onReact !== 'function') {
        logger.warn('[Poll] Helpers interactifs non disponibles sur le message envoyé.');
        return;
    }

    // Écoute interactive des réactions emoji sur le message du sondage
    sent.onReact(async ({ emoji, sender, client }) => {
        const voter = sender ? sender.split('@')[0].split(':')[0] : 'anonyme';
        const waClient = client || m.client;

        // Gestion du retrait d'une réaction par l'utilisateur (emoji vide)
        if (!emoji) {
            const previousEmoji = userVotes.get(voter);
            if (previousEmoji) {
                const prevOpt = parsedOptions.find(o => normalizeEmoji(o.emoji) === normalizeEmoji(previousEmoji));
                if (prevOpt && prevOpt.votes > 0) prevOpt.votes--;
                userVotes.delete(voter);
                logger.info(`[Poll] Vote retiré : ${voter}`);
                try {
                    await waClient.sendMessage(m.chat, {
                        text: renderPollText(),
                        edit: sent.key
                    });
                } catch { }
            }
            return;
        }

        const normIncoming = normalizeEmoji(emoji);
        const newOpt = parsedOptions.find(o => normalizeEmoji(o.emoji) === normIncoming);
        if (!newOpt) return;

        // Si l'utilisateur avait déjà voté pour cet emoji exact, ne rien faire
        const previousEmoji = userVotes.get(voter);
        if (previousEmoji && normalizeEmoji(previousEmoji) === normIncoming) {
            return;
        }

        // Si l'utilisateur change son vote, décrémenter l'ancienne option
        if (previousEmoji) {
            const prevOpt = parsedOptions.find(o => normalizeEmoji(o.emoji) === normalizeEmoji(previousEmoji));
            if (prevOpt && prevOpt.votes > 0) prevOpt.votes--;
        }

        // Enregistrer le nouveau vote
        userVotes.set(voter, newOpt.emoji);
        newOpt.votes++;

        logger.info(`[Poll] Vote enregistré : ${voter} a voté ${newOpt.emoji} (${newOpt.title})`);

        // Mise à jour en direct du message du sondage par édition
        try {
            await waClient.sendMessage(m.chat, {
                text: renderPollText(),
                edit: sent.key
            });
        } catch (editErr) {
            logger.warn(`[Poll] Impossible d'éditer le message : ${editErr.message}`);
        }
    }, {
        timeout: 120000, // 2 minutes
        allowedEmojis: [...allowedEmojis, ''], // Autoriser '' pour capturer les retraits
        once: false,
        onTimeout: async () => {
            try {
                await m.reply(
                    `〘 🏁 SONDAGE CLOS 〙\n` +
                    `❓ Question : *${question}*\n` +
                    `👥 Total des votes : *${userVotes.size}*\n\n` +
                    `${parsedOptions.map(o => `${o.emoji} ${o.title} : *${o.votes}* vote(s)`).join('\n')}\n` +
                    `════════════════⊷`
                );
            } catch { }
        }
    });
}

export default {
    name: 'poll',
    description: 'Sondages interactifs en direct avec réactions emoji',
    pollCommand,
    commands: [
        {
            name: 'poll',
            aliases: ['sondage'],
            category: 'tools',
            description: 'Crée un sondage interactif avec vote par réactions emoji',
            usage: '.poll Question | Option 1 | Option 2',
            cooldown: 5,
            execute: async ({ m }) => {
                await pollCommand(m);
            }
        }
    ]
};
