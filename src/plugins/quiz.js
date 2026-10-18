import { logger } from '../utils/logger.js';

/**
 * Banque de questions de culture générale pour le Quiz interactif
 */
export const QUIZ_QUESTIONS = [
    {
        category: "🌍 Géographie",
        question: "Quelle est la capitale politique du Cameroun ?",
        options: ["A) Douala", "B) Yaoundé", "C) Bafoussam", "D) Garoua"],
        answerKey: "B",
        answerText: "yaounde",
        explanation: "Yaoundé est la capitale politique du Cameroun, tandis que Douala en est la capitale économique."
    },
    {
        category: "💻 Informatique",
        question: "Qui est le créateur principal du système d'exploitation Linux ?",
        options: ["A) Bill Gates", "B) Steve Jobs", "C) Linus Torvalds", "D) Mark Zuckerberg"],
        answerKey: "C",
        answerText: "linus torvalds",
        explanation: "Linus Torvalds a lancé le noyau Linux en 1991 à l'université d'Helsinki."
    },
    {
        category: "🔬 Sciences",
        question: "Quel élément chimique a pour symbole 'Fe' dans le tableau périodique ?",
        options: ["A) Fer", "B) Fluor", "C) Francium", "D) Fructose"],
        answerKey: "A",
        answerText: "fer",
        explanation: "Le symbole 'Fe' provient du mot latin 'Ferrum' désignant le fer."
    },
    {
        category: "📚 Histoire",
        question: "En quelle année s'est terminée la Seconde Guerre mondiale ?",
        options: ["A) 1943", "B) 1944", "C) 1945", "D) 1948"],
        answerKey: "C",
        answerText: "1945",
        explanation: "La Seconde Guerre mondiale s'est achevée en 1945 avec la capitulation de l'Allemagne puis du Japon."
    },
    {
        category: "⚽ Sport",
        question: "Quel pays a remporté la Coupe du Monde de la FIFA 2022 ?",
        options: ["A) France", "B) Brésil", "C) Argentine", "D) Croatie"],
        answerKey: "C",
        answerText: "argentine",
        explanation: "L'Argentine a remporté la finale 2022 face à la France lors d'une séance de tirs au but mémorable."
    },
    {
        category: "🌌 Astronomie",
        question: "Quelle planète est la plus proche du Soleil ?",
        options: ["A) Vénus", "B) Mercure", "C) Mars", "D) Jupiter"],
        answerKey: "B",
        answerText: "mercure",
        explanation: "Mercure est la première planète du système solaire par ordre d'éloignement au Soleil."
    },
    {
        category: "🎵 Art & Musique",
        question: "Combien de cordes possède une guitare classique standard ?",
        options: ["A) 4", "B) 5", "C) 6", "D) 8"],
        answerKey: "C",
        answerText: "6",
        explanation: "Une guitare standard est équipée de 6 cordes (Mi, La, Ré, Sol, Si, Mi)."
    }
];

/**
 * Commande .quiz
 * Démarre une session de Quiz interactif exploitant onReply / waitForReply.
 */
export async function quizCommand(m) {
    const randomQuestion = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
    const playerName = m.pushName || m.sender?.split('@')[0] || 'Joueur';

    const questionCard =
`〘 🧠 QUIZ INTERACTIF 〙
📁 Thème : *${randomQuestion.category}*
👤 Joueur : *${playerName}*

❓ *Question :*
${randomQuestion.question}

🔘 *Options :*
${randomQuestion.options.map(opt => `• ${opt}`).join('\n')}

⏱️ *Délai : 30 secondes*
💬 *Répondez en CITANT ce message* avec votre lettre (*A, B, C ou D*) !
════════════════⊷`;

    await m.react('🧠');
    const sent = await m.reply(questionCard);

    if (!sent || typeof sent.waitForReply !== 'function') {
        logger.warn('[Quiz] Helpers interactifs non disponibles sur le message envoyé.');
        return;
    }

    try {
        // Attente asynchrone de la réponse du joueur par citation stricte
        const replyMsg = await sent.waitForReply({
            timeout: 30000,
            senderId: m.sender // Seul le joueur ayant demandé le quiz peut répondre
        });

        if (!replyMsg) {
            // Timeout écoulé
            await m.reply(
`〘 ⏱️ TEMPS ÉCOULÉ 〙
⌛ Les 30 secondes sont passées sans réponse.
💡 La bonne réponse était : *${randomQuestion.answerKey}) ${randomQuestion.answerText}*
ℹ️ ${randomQuestion.explanation}
════════════════⊷`
            );
            return;
        }

        const rawAnswer = (replyMsg.messageBody || '').trim().toLowerCase();
        const expectedKey = randomQuestion.answerKey.toLowerCase();
        const expectedText = randomQuestion.answerText.toLowerCase();

        const isCorrect =
            rawAnswer === expectedKey ||
            rawAnswer.startsWith(expectedKey + ')') ||
            rawAnswer.startsWith(expectedKey + ' ') ||
            rawAnswer.includes(expectedText);

        if (isCorrect) {
            await replyMsg.react('🎉');
            await replyMsg.reply(
`〘 🎉 BONNE RÉPONSE 〙
✅ Bravo @${replyMsg.sender.split('@')[0]} ! C'est la bonne réponse !
🏆 *Option :* *${randomQuestion.answerKey}*
📖 *Explication :* ${randomQuestion.explanation}
════════════════⊷`,
                { mentions: [replyMsg.sender] }
            );
        } else {
            await replyMsg.react('❌');
            await replyMsg.reply(
`〘 ❌ MAUVAISE RÉPONSE 〙
😔 Dommage @${replyMsg.sender.split('@')[0]} ! Votre réponse était incorrecte.
💡 La bonne réponse était : *${randomQuestion.answerKey}*
📖 *Explication :* ${randomQuestion.explanation}
════════════════⊷`,
                { mentions: [replyMsg.sender] }
            );
        }

    } catch (err) {
        logger.error('[Quiz] Erreur de gestion du quiz interactif :', err.message);
    }
}

export default {
    name: 'quiz',
    description: 'Quiz interactif de culture générale avec réponse par citation',
    quizCommand,
    QUIZ_QUESTIONS,
    commands: [
        {
            name: 'quiz',
            aliases: ['trivia'],
            category: 'fun',
            description: 'Lance une session de quiz interactif de culture générale',
            usage: '.quiz',
            cooldown: 5,
            execute: async ({ m }) => {
                await quizCommand(m);
            }
        }
    ]
};
