/**
 * Plugin AI — Intelligence Artificielle Texte & Image (.ai, .gemini, .groq, .coderai, .deepseek, .flux, .3dgen, .imagen).
 */
import axios from 'axios';
import { askAi } from '../utils/aiProvider.js';
import { getVar } from '../config/vars.js';
import { logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/errorHelper.js';

/**
 * Moteur IA multi-modèles (Texte & Image) compatible avec l'ancienne signature
 * @param {object} m - Message
 * @param {'txt' | 'img'} mode - Mode de génération
 * @param {object} params - Paramètres (modèle, etc.)
 */
export async function respondAi(m, mode, params = {}) {
    let rawQuestion = (m.textMessage || (m.args ? m.args.join(' ') : '')).trim();
    if (!rawQuestion && m.quoted) {
        rawQuestion = (m.quoted.textMessage || m.quoted.body || '').trim();
    }
    if (!rawQuestion) {
        rawQuestion = mode === 'img' ? 'a futuristic city with neon lights' : "Présente-toi brièvement en tant qu'assistant DTAMTECH AI.";
    }

    const dtamAiSystem = "Tu es DTAM-AI, un assistant intelligent et serviable développé par DTAMTECH. Réponds de façon claire, structurée et précise en utilisant le markdown de WhatsApp (*gras*, _italique_, `code`).";
    await m.react?.('🧠');

    const encodedPrompt = encodeURIComponent(rawQuestion);
    const model = params.model || 'openai';

    switch (mode) {
        case 'txt': {
            let answer = null;
            try {
                const res = await axios.get(`https://text.pollinations.ai/${encodedPrompt}`, {
                    params: {
                        system: dtamAiSystem,
                        model: model,
                        seed: Math.floor(Math.random() * 10000)
                    },
                    timeout: 20000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                if (res.data && typeof res.data === 'string' && res.data.length > 0) {
                    answer = res.data;
                }
            } catch { }

            if (!answer) {
                try {
                    const fallbackRes = await axios.get(`https://text.pollinations.ai/${encodedPrompt}?model=openai`, {
                        timeout: 15000
                    });
                    if (fallbackRes.data && typeof fallbackRes.data === 'string') {
                        answer = fallbackRes.data;
                    }
                } catch { }
            }

            if (!answer) {
                await m.react?.('❌');
                return await m.reply('> ❌ Service IA indisponible.');
            }

            await m.reply(answer.trim());
            await m.react?.('✅');
            break;
        }

        case 'img': {
            await m.react?.('🎨');
            const imgModel = params.model || 'flux';
            const imgUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${imgModel}&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;

            try {
                await m.reply('', {
                    image: { url: imgUrl },
                    caption:
                        `〘 🎨 IA IMAGE 〙\n` +
                        `❍ Prompt* : ${rawQuestion}\n` +
                        `❍ Modèle* : ${imgModel.toUpperCase()}\n` +
                        `════════════════⊷\n> *Powered by DTAMTECH MD*`
                });
                await m.react?.('✅');
            } catch (err) {
                logger.error(`Erreur génération image IA : ${err.message}`);
                await m.react?.('❌');
                await m.reply(formatErrorMessage(err, 'Génération image IA'));
            }
            break;
        }
    }
}

export default [
    {
        name: 'ai',
        aliases: ['gpt', 'bot', 'ask', 'ia'],
        desc: 'Interroge l\'intelligence artificielle (Gemini, Groq ou Pollinations)',
        category: 'ai',
        usage: '.ai <votre question ou message>',
        async execute({ m, args }) {
            let prompt = args.join(' ').trim();
            if (!prompt && m.quoted) {
                prompt = m.quoted.body || m.quoted.text || '';
            }

            if (!prompt) {
                return await m.reply('> ⚠️ *Provide a question*');
            }

            await m.react('🧠');
            const systemPrompt = getVsar('CHATBOT_PROMPT', 'Tu es un assistant IA intelligent, précis et serviable.');

            try {
                const { answer, provider } = await askAi(prompt, systemPrompt);
                await m.react?.('✅');
                return await m.reply(answer);
            } catch (err) {
                logger.error(err)
                await m.react?.('❌');
                return await m.reply(`❌ Échec de génération IA`);

            }
        }
    },

    {
        name: 'gemini',
        aliases: ['bard'],
        desc: 'Interroge directement le modèle Google Gemini',
        category: 'ai',
        usage: '.gemini <question>',
        async execute({ m, args }) {
            const prompt = args.join(' ').trim() || m.quoted?.body;
            if (!prompt) {
                return await m.reply('❌ Veuillez poser votre question. Exemple : `.gemini Quelle est la capitale de l\'Islande ?`');
            }

            await m.react?.('✨');
            try {
                const { answer } = await askAi(prompt, 'Tu es Gemini, l\'IA avancée de Google.');
                await m.react?.('✅');
                return await m.reply(`✨ *Google Gemini*\n━━━━━━━━━━━━━━━━━━━━━━\n\n${answer}`);
            } catch (err) {
                await m.react?.('❌');
                return await m.reply(`❌ Erreur Gemini : ${err.message}`);
            }
        }
    },

    {
        name: 'groq',
        aliases: ['llama'],
        desc: 'Interroge le moteur à ultra-haute vitesse Groq (Llama 3)',
        category: 'ai',
        usage: '.groq <question>',
        async execute({ m, args }) {
            const prompt = args.join(' ').trim() || m.quoted?.body;
            if (!prompt) {
                return await m.reply('❌ Veuillez poser votre question. Exemple : `.groq Écris un poème court sur le code`');
            }

            await m.react?.('⚡');
            try {
                const { answer } = await askAi(prompt, 'Tu es Llama 3 propulsé par Groq.');
                await m.react?.('✅');
                return await m.reply(`⚡ *Groq Llama 3*\n━━━━━━━━━━━━━━━━━━━━━━\n\n${answer}`);
            } catch (err) {
                await m.react?.('❌');
                return await m.reply(`❌ Erreur Groq : ${err.message}`);
            }
        }
    },

    {
        name: 'coderai',
        category: 'ai',
        desc: 'Assistant IA spécialisé en programmation et algorithmes',
        usage: '.coderai <question ou code>',
        async execute({ m }) {
            await respondAi(m, 'txt', { model: 'qwen-coder' });
        }
    },

    {
        name: 'deepseek',
        category: 'ai',
        desc: 'Interroge le modèle DeepSeek LLM',
        usage: '.deepseek <question>',
        async execute({ m }) {
            await respondAi(m, 'txt', { model: 'deepseek' });
        }
    },

    {
        name: 'flux',
        category: 'ai',
        desc: 'Génère une image ultra-réaliste avec le modèle Flux',
        usage: '.flux <description en anglais>',
        async execute({ m }) {
            await respondAi(m, 'img', { model: 'flux' });
        }
    },

    {
        name: '3dgen',
        aliases: ['3d'],
        category: 'ai',
        desc: 'Génère une image en rendu 3D',
        usage: '.3dgen <description>',
        async execute({ m }) {
            await respondAi(m, 'img', { model: '3d' });
        }
    },

    {
        name: 'imagen',
        category: 'ai',
        desc: 'Génère une image avec le modèle Imagen',
        usage: '.imagen <description>',
        async execute({ m }) {
            await respondAi(m, 'img', { model: 'imagen' });
        }
    }
];
