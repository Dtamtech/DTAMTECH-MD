/**
 * Plugin Chatbot — Assistant conversationnel automatique par chat (groupe ou privé).
 * Maintient une mémoire courte (derniers échanges) et dispose d'un prompt système paramétrable.
 */
import axios from 'axios';
import { getSetting, setSetting } from '../db/groupSettings.js';
import { getVar } from '../config/vars.js';
import { logger } from '../utils/logger.js';

// Mémoire courte : Map LRU des 200 chats les plus récents (jusqu'à 6 messages par chat)
const chatMemory = new Map();
const lastResponseTime = new Map();

function updateMemory(chat, role, content) {
    if (!chatMemory.has(chat)) {
        if (chatMemory.size >= 200) {
            const firstKey = chatMemory.keys().next().value;
            chatMemory.delete(firstKey);
        }
        chatMemory.set(chat, []);
    }
    const history = chatMemory.get(chat);
    history.push({ role, content });
    if (history.length > 6) {
        history.shift();
    }
}

async function queryAi(prompt, history = [], systemPrompt = '') {
    const formattedHistory = history
        .map(h => `${h.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${h.content}`)
        .join('\n');

    const fullPrompt = formattedHistory
        ? `${formattedHistory}\nUtilisateur: ${prompt}\nAssistant:`
        : prompt;

    // Tentative 1 : Pollinations Text API
    try {
        const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`, {
            params: {
                system: systemPrompt,
                model: 'openai',
                seed: Math.floor(Math.random() * 10000)
            },
            timeout: 12000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (res.data && typeof res.data === 'string' && res.data.trim().length > 0) {
            return res.data.trim();
        }
    } catch { }

    // Fallback simple
    try {
        const fallback = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`, {
            timeout: 10000
        });
        if (fallback.data && typeof fallback.data === 'string') {
            return fallback.data.trim();
        }
    } catch { }

    return null;
}

export default {
    name: 'chatbot',
    aliases: ['lydia', 'ai-chat'],
    desc: 'Active ou désactive l\'assistant conversationnel automatique pour ce chat',
    category: 'ai',
    usage: '.chatbot [on|off|status]',
    async execute({ m, args, isGroup, isAdmin, isOwner, isSudo }) {
        if (isGroup && !isAdmin && !isOwner && !isSudo) {
            return await m.reply('❌ Seuls les administrateurs du groupe peuvent activer le chatbot.');
        }

        const subCmd = args[0]?.toLowerCase();
        const current = getSetting(m.chat, 'chatbot');

        if (!subCmd || subCmd === 'status') {
            const statusTxt = current.enabled ? '🟢 *Activé*' : '🔴 *Désactivé*';
            return await m.reply(
                `🤖 *ASSISTANT CONVERSATIONNEL (CHATBOT)*\n\n` +
                `🔹 *Statut pour ce chat* : ${statusTxt}\n` +
                `🔹 *Mémoire active* : ${chatMemory.get(m.chat)?.length || 0} messages retenus\n\n` +
                `📖 *Commandes :*\n` +
                `• \`.chatbot on\` : Active les réponses automatiques\n` +
                `• \`.chatbot off\` : Désactive le chatbot`
            );
        }

        if (subCmd === 'on') {
            setSetting(m.chat, 'chatbot', { enabled: true });
            return await m.reply('✅ *Chatbot activé !* Je répondrai désormais aux conversations de ce chat.');
        }

        if (subCmd === 'off') {
            setSetting(m.chat, 'chatbot', { enabled: false });
            chatMemory.delete(m.chat);
            return await m.reply('🛑 *Chatbot désactivé.* Mémoire de discussion réinitialisée.');
        }

        return await m.reply('❌ Utilisation : `.chatbot on` ou `.chatbot off`.');
    }
};

export const listeners = [
    {
        on: 'message',
        priority: 95, // Priorité basse : s'exécute après filtres et commandes
        async execute({ m }) {
            // Ignorer ses propres messages (évite les boucles)
            if (m.fromMe) return false;

            const setting = getSetting(m.chat, 'chatbot');
            if (!setting.enabled) return false;

            const text = (m.body || m.text || '').trim();
            if (!text) return false;

            // Ignorer si le message ressemble à une commande
            const prefix = getVar('PREFIX', '.');
            if (text.startsWith(prefix) || text.startsWith('!') || text.startsWith('#') || text.startsWith('/')) {
                return false;
            }

            // Rate limit strict : 1 réponse toutes les 3 secondes par chat
            const now = Date.now();
            const last = lastResponseTime.get(m.chat) || 0;
            if (now - last < 3000) {
                return false;
            }

            const history = chatMemory.get(m.chat) || [];
            const systemPrompt = getVar('CHATBOT_PROMPT', 'Tu es un assistant WhatsApp bienveillant, concis et réactif.');

            try {
                const answer = await queryAi(text, history, systemPrompt);
                if (answer) {
                    lastResponseTime.set(m.chat, Date.now());
                    updateMemory(m.chat, 'user', text);
                    updateMemory(m.chat, 'assistant', answer);
                    await m.reply(answer);
                    return true;
                }
            } catch (err) {
                logger.warn(`[Chatbot] Erreur de génération : ${err.message}`);
            }

            return false;
        }
    }
];
