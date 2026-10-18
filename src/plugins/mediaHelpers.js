/**
 * Plugin MediaHelpers — Synthèse vocale (TTS), traduction (TRT), météo en direct et détourage (RMBG).
 */
import { getVar } from '../config/vars.js';

const WMO_WEATHER_CODES = {
    0: { desc: 'Ciel dégagé / Ensoleillé', emoji: '☀️' },
    1: { desc: 'Généralement dégagé', emoji: '🌤️' },
    2: { desc: 'Partiellement nuageux', emoji: '⛅' },
    3: { desc: 'Couvert', emoji: '☁️' },
    45: { desc: 'Brouillard', emoji: '🌫️' },
    48: { desc: 'Brouillard givrant', emoji: '🌫️' },
    51: { desc: 'Bruine légère', emoji: '🌦️' },
    53: { desc: 'Bruine modérée', emoji: '🌦️' },
    55: { desc: 'Bruine dense', emoji: '🌧️' },
    61: { desc: 'Pluie faible', emoji: '🌧️' },
    63: { desc: 'Pluie modérée', emoji: '🌧️' },
    65: { desc: 'Pluie forte', emoji: '🌧️' },
    71: { desc: 'Chute de neige faible', emoji: '🌨️' },
    73: { desc: 'Chute de neige modérée', emoji: '❄️' },
    75: { desc: 'Forte chute de neige', emoji: '❄️' },
    80: { desc: 'Averses légères', emoji: '🌦️' },
    81: { desc: 'Averses modérées', emoji: '🌧️' },
    82: { desc: 'Averses violentes', emoji: '⛈️' },
    95: { desc: 'Orage', emoji: '⛈️' },
    96: { desc: 'Orage avec grêle légère', emoji: '⛈️' },
    99: { desc: 'Orage violent avec grêle', emoji: '🌩️' }
};

export default [
    {
        name: 'tts',
        aliases: ['voice', 'say', 'parle'],
        desc: 'Convertit un texte en note vocale (TTS)',
        category: 'media',
        usage: '.tts [lang] <texte ou citation>',
        async execute({ m, args, client: sock }) {
            let lang = 'fr';
            let textTokens = args;

            // Détection du premier argument comme code de langue (ex: fr, en, es, de, it, ar)
            if (args.length > 0 && /^[a-z]{2}(-[a-z]{2})?$/i.test(args[0])) {
                lang = args[0].toLowerCase();
                textTokens = args.slice(1);
            }

            let text = textTokens.join(' ').trim();
            if (!text && m.quoted) {
                text = m.quoted.body || m.quoted.text || '';
            }

            if (!text) {
                return await m.reply(
                    '❌ *Syntaxe incorrecte*\n\n' +
                    'Utilisez : `.tts [lang] <texte>` ou répondez à un message texte avec `.tts`.\n' +
                    'Exemples :\n' +
                    '• `.tts Bonjour tout le monde`\n' +
                    '• `.tts en Welcome to DTAMTECH`'
                );
            }

            // Limitation à 250 caractères pour Google TTS sans clé
            const cleanText = text.slice(0, 250);
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${lang}&client=tw-ob`;

            try {
                const res = await fetch(ttsUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    }
                });

                if (!res.ok) {
                    return await m.reply(`❌ Échec de la synthèse vocale (Code ${res.status}).`);
                }

                const arrayBuf = await res.arrayBuffer();
                const audioBuffer = Buffer.from(arrayBuf);

                return await sock.sendMessage(m.chat, {
                    audio: audioBuffer,
                    mimetype: 'audio/mp4',
                    ptt: true
                }, { quoted: m });
            } catch (err) {
                return await m.reply(`❌ Erreur lors de la génération audio : ${err.message}`);
            }
        }
    },

    {
        name: 'trt',
        aliases: ['translate', 'trad', 'traduire'],
        desc: 'Traduit un texte instantanément vers une langue cible',
        category: 'media',
        usage: '.trt [lang_cible] <texte ou citation>',
        async execute({ m, args }) {
            let targetLang = 'fr';
            let textTokens = args;

            if (args.length > 0 && /^[a-z]{2}(-[a-z]{2})?$/i.test(args[0])) {
                targetLang = args[0].toLowerCase();
                textTokens = args.slice(1);
            }

            let text = textTokens.join(' ').trim();
            if (!text && m.quoted) {
                text = m.quoted.body || m.quoted.text || '';
            }

            if (!text) {
                return await m.reply(
                    '❌ *Syntaxe incorrecte*\n\n' +
                    'Utilisez : `.trt [lang] <texte>` ou répondez à un message avec `.trt`.\n' +
                    'Exemples :\n' +
                    '• `.trt en Bonjour les amis`\n' +
                    '• `.trt fr How are you doing?`'
                );
            }

            try {
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=autodetect|${targetLang}`;
                const res = await fetch(url);
                if (!res.ok) {
                    return await m.reply('❌ Service de traduction indisponible actuellement.');
                }

                const data = await res.json();
                const translated = data?.responseData?.translatedText;

                if (!translated) {
                    return await m.reply('❌ Aucune traduction trouvée pour ce contenu.');
                }

                return await m.reply(
                    `🌐 *TRADUCTION [➔ ${targetLang.toUpperCase()}]*\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `> ${translated}`
                );
            } catch (err) {
                return await m.reply(`❌ Erreur traduction : ${err.message}`);
            }
        }
    },

    {
        name: 'weather',
        aliases: ['meteo', 'climat'],
        desc: 'Affiche la météo en direct et les conditions actuelles d\'une ville',
        category: 'tools',
        usage: '.weather <ville>',
        async execute({ m, args }) {
            const city = args.join(' ').trim();
            if (!city) {
                return await m.reply('❌ Précisez une ville. Exemple : `.weather Douala` ou `.weather Paris`.');
            }

            try {
                // Étape 1 : Géocodage
                const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`;
                const geoRes = await fetch(geoUrl);
                const geoData = await geoRes.json();

                if (!geoData.results || geoData.results.length === 0) {
                    return await m.reply(`❌ Ville "${city}" introuvable.`);
                }

                const place = geoData.results[0];
                const { latitude, longitude, name, country } = place;

                // Étape 2 : Météo actuelle
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`;
                const weatherRes = await fetch(weatherUrl);
                const weatherData = await weatherRes.json();

                const cur = weatherData.current;
                const weatherInfo = WMO_WEATHER_CODES[cur.weather_code] || { desc: 'Variable', emoji: '🌤️' };

                const card = `🌤️ *MÉTÉO ACTUELLE — ${name.toUpperCase()} (${country || ''})*\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `🔹 *Conditions* : ${weatherInfo.emoji} ${weatherInfo.desc}\n` +
                    `🔹 *Température* : \`${cur.temperature_2m}°C\` (Ressenti : \`${cur.apparent_temperature}°C\`)\n` +
                    `🔹 *Humidité* : \`${cur.relative_humidity_2m}%\`\n` +
                    `🔹 *Vent* : \`${cur.wind_speed_10m} km/h\`\n` +
                    `🔹 *Précipitations* : \`${cur.precipitation} mm\``;

                return await m.reply(card);
            } catch (err) {
                return await m.reply(`❌ Erreur lors de la récupération météo : ${err.message}`);
            }
        }
    },

    {
        name: 'rmbg',
        aliases: ['nobg', 'removebg'],
        desc: 'Supprime l\'arrière-plan d\'une image via remove.bg',
        category: 'media',
        usage: '.rmbg (en réponse à une image)',
        async execute({ m, client: sock }) {
            const apiKey = getVar('RMBG_KEY', '');
            if (!apiKey) {
                return await m.reply(
                    '❌ *Clé API remove.bg manquante*\n\n' +
                    'Pour activer le détourage d\'image :\n' +
                    '1. Obtenez une clé gratuite sur https://www.remove.bg\n' +
                    '2. Enregistrez-la avec : `.setvar RMBG_KEY votre_clé`\n' +
                    'Ou renseignez-la directement sur le Dashboard Web.'
                );
            }

            const target = (m.quoted && (m.quoted.type === 'imageMessage' || m.quoted.imageMessage || m.quoted.mimetype?.includes('image')))
                ? m.quoted
                : (m.type === 'imageMessage' || m.mimetype?.includes('image') ? m : null);

            if (!target) {
                return await m.reply('❌ Veuillez envoyer ou répondre à une image avec `.rmbg`.');
            }

            if (typeof target.download !== 'function') {
                return await m.reply('❌ Impossible de télécharger cette image.');
            }

            try {
                await m.reply('⏳ *Détourage en cours...*');

                const imageBuffer = await target.download();
                if (!imageBuffer || imageBuffer.length === 0) {
                    return await m.reply('❌ Échec du téléchargement de l\'image.');
                }

                const formData = new FormData();
                formData.append('size', 'auto');
                formData.append('image_file_b64', imageBuffer.toString('base64'));

                const res = await fetch('https://api.remove.bg/v1.0/removebg', {
                    method: 'POST',
                    headers: {
                        'X-Api-Key': apiKey
                    },
                    body: formData
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    const errMsg = errData.errors?.[0]?.title || `Erreur HTTP ${res.status}`;
                    return await m.reply(`❌ Échec détourage : ${errMsg}`);
                }

                const resultBuf = Buffer.from(await res.arrayBuffer());

                return await sock.sendMessage(m.chat, {
                    document: resultBuf,
                    mimetype: 'image/png',
                    fileName: `nobg-${Date.now()}.png`,
                    caption: '✨ *Image détourée avec succès par DTAMTECH MD*'
                }, { quoted: m });
            } catch (err) {
                return await m.reply(`❌ Erreur remove.bg : ${err.message}`);
            }
        }
    }
];
