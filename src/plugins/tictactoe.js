/**
 * Plugin Tic-Tac-Toe — Jeu du Morpion interactif dans les groupes.
 */
import { createGame, renderBoard, makeMove } from '../games/tictactoe.js';

const activeGames = new Map();

// Nettoyage automatique des parties inactives après 5 minutes
function pruneOldGames() {
    const now = Date.now();
    for (const [chat, game] of activeGames.entries()) {
        if (now - game.lastMoveAt > 5 * 60 * 1000) {
            activeGames.delete(chat);
        }
    }
}
setInterval(pruneOldGames, 60000).unref?.();

export const listeners = [
    {
        priority: 70,
        async handler({ m }) {
            if (!m.isGroup || !m.body) return false;

            const trimmed = m.body.trim();
            // Détection si le message est un simple chiffre entre 1 et 9
            if (!/^[1-9]$/.test(trimmed)) return false;

            const game = activeGames.get(m.chat);
            if (!game || game.status !== 'playing') return false;

            const expectedPlayer = game.currentTurn === 'X' ? game.playerX : game.playerO;
            if (m.sender !== expectedPlayer) return false;

            const res = makeMove(game, m.sender, Number.parseInt(trimmed, 10));
            if (!res.ok) {
                await m.reply(`⚠️ ${res.error}`);
                return true;
            }

            if (res.winner) {
                activeGames.delete(m.chat);
                await m.reply(
                    `🎉 *VICTOIRE !*\n\n` +
                    `Le joueur @${res.winner.split('@')[0]} remporte la partie !\n\n` +
                    `${res.boardText}`,
                    { mentions: [res.winner] }
                );
                return true;
            }

            if (res.isDraw) {
                activeGames.delete(m.chat);
                await m.reply(
                    `🤝 *MATCH NUL !*\n\n` +
                    `Aucun vainqueur pour cette manche.\n\n` +
                    `${res.boardText}`
                );
                return true;
            }

            // Coup suivant
            await m.reply(
                `🎮 *TIC-TAC-TOE*\n\n` +
                `${res.boardText}\n\n` +
                `👉 Tour de @${res.nextTurn.split('@')[0]} (${game.currentTurn === 'X' ? '❌' : '⭕'})\n` +
                `_Tapez un chiffre de 1 à 9 pour jouer._`,
                { mentions: [res.nextTurn] }
            );
            return true;
        }
    }
];

export default [
    {
        name: 'ttt',
        aliases: ['morpion', 'tictactoe'],
        desc: 'Lance ou joue une partie de Morpion dans le groupe',
        category: 'games',
        groupOnly: true,
        usage: '.ttt [@adversaire | 1-9 | end]',
        async execute({ m, args }) {
            const sub = args[0]?.toLowerCase().trim();

            // 1. Annulation
            if (sub === 'end' || sub === 'stop' || sub === 'cancel') {
                if (!activeGames.has(m.chat)) {
                    return await m.reply('ℹ️ Aucune partie active à interrompre.');
                }
                activeGames.delete(m.chat);
                return await m.reply('🛑 Partie de Tic-Tac-Toe annulée.');
            }

            // 2. Jouer un coup directement via la commande (.ttt 5)
            if (sub && /^[1-9]$/.test(sub)) {
                const game = activeGames.get(m.chat);
                if (!game || game.status !== 'playing') {
                    return await m.reply('ℹ️ Aucune partie en cours. Tapez `.ttt @ami` pour démarrer.');
                }

                const res = makeMove(game, m.sender, Number.parseInt(sub, 10));
                if (!res.ok) {
                    return await m.reply(`⚠️ ${res.error}`);
                }

                if (res.winner) {
                    activeGames.delete(m.chat);
                    return await m.reply(
                        `🎉 *VICTOIRE !*\n\n` +
                        `Le joueur @${res.winner.split('@')[0]} remporte la partie !\n\n` +
                        `${res.boardText}`,
                        { mentions: [res.winner] }
                    );
                }

                if (res.isDraw) {
                    activeGames.delete(m.chat);
                    return await m.reply(
                        `🤝 *MATCH NUL !*\n\n` +
                        `Aucun vainqueur pour cette manche.\n\n` +
                        `${res.boardText}`
                    );
                }

                return await m.reply(
                    `🎮 *TIC-TAC-TOE*\n\n` +
                    `${res.boardText}\n\n` +
                    `👉 Tour de @${res.nextTurn.split('@')[0]} (${game.currentTurn === 'X' ? '❌' : '⭕'})\n` +
                    `_Tapez un chiffre [1-9] pour jouer._`,
                    { mentions: [res.nextTurn] }
                );
            }

            // 3. Lancer une nouvelle partie
            if (activeGames.has(m.chat)) {
                const game = activeGames.get(m.chat);
                if (game.status === 'playing') {
                    return await m.reply(
                        `⚠️ Une partie est déjà en cours dans ce groupe !\n\n` +
                        `${renderBoard(game.board)}\n\n` +
                        `_Pour abandonner : .ttt end_`
                    );
                }
            }

            const opponentJid = m.mentionedJid?.[0] || m.quoted?.sender;
            if (!opponentJid) {
                return await m.reply(
                    '❌ *Adversaire manquant*\n\n' +
                    'Mentionnez un joueur ou répondez à son message :\n' +
                    '• `.ttt @ami`\n' +
                    '• Tapez `.ttt end` pour stopper une partie.'
                );
            }

            if (opponentJid === m.sender) {
                return await m.reply('❌ Vous ne pouvez pas jouer contre vous-même.');
            }

            const newGame = createGame(m.sender, opponentJid);
            activeGames.set(m.chat, newGame);

            return await m.reply(
                `🎮 *NOUVELLE PARTIE DE TIC-TAC-TOE*\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `❌ *Joueur 1* : @${m.sender.split('@')[0]}\n` +
                `⭕ *Joueur 2* : @${opponentJid.split('@')[0]}\n\n` +
                `${renderBoard(newGame.board)}\n\n` +
                `👉 @${m.sender.split('@')[0]} (❌), commencez en envoyant un chiffre de 1 à 9 !`,
                { mentions: [m.sender, opponentJid] }
            );
        }
    }
];
