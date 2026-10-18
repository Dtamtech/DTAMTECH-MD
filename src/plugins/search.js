import axios from 'axios';
import * as cheerio from 'cheerio';
import UserConfig from '../config/config.js';
import { logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/errorHelper.js';

/**
 * Décode les URL encapsulées par Bing (/ck/a?...)
 */
function decodeBingUrl(url) {
    if (!url) return '';
    if (!url.includes('/ck/a?')) return url;
    try {
        const uParam = new URL(url).searchParams.get('u');
        if (uParam && uParam.startsWith('a1')) {
            const b64 = uParam.slice(2);
            return Buffer.from(b64, 'base64').toString('utf-8');
        }
    } catch { }
    return url;
}

/**
 * Recherche de liens et snippets via DuckDuckGo Lite
 */
async function searchDuckDuckGoLite(query) {
    try {
        const res = await axios.post('https://lite.duckduckgo.com/lite/', 'q=' + encodeURIComponent(query), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 8000
        });
        const $ = cheerio.load(res.data);
        const results = [];
        $('table tbody tr').each((i, el) => {
            if (results.length >= 5) return;
            const link = $(el).find('a.result-link');
            if (link.length) {
                const title = link.text().trim();
                let href = link.attr('href');
                if (href && href.includes('uddg=')) {
                    const match = href.match(/uddg=([^&]+)/);
                    if (match) href = decodeURIComponent(match[1]);
                }
                const snippetTr = $(el).next();
                const snippet = snippetTr.find('.result-snippet').text().trim();
                if (title && href && !href.includes('duckduckgo.com')) {
                    results.push({ title, link: href, snippet });
                }
            }
        });
        return results;
    } catch {
        return [];
    }
}

/**
 * Moteur de recherche Web multi-sources résilient :
 * 1. Wikipedia API (résumé encyclopédique, définitions, contexte détaillé)
 * 2. DuckDuckGo Instant Answer API (réponses directes, sujets associés)
 * 3. DuckDuckGo Lite Web Search (liens web réels, titres, descriptions)
 * 4. Bing Web Search (fallback supplémentaire)
 * 5. Google Suggestions (mots-clés connexes pour aller plus loin)
 */
export async function performWebSearch(query, lang = 'fr') {
    const data = {
        query,
        summary: null,
        instantAnswer: null,
        items: [],
        suggestions: []
    };

    const wikiLang = lang === 'en' ? 'en' : 'fr';

    // 1. Wikipedia API pour résumé contextuel
    try {
        const wikiSearchUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
        const wikiRes = await axios.get(wikiSearchUrl, {
            headers: { 'User-Agent': 'DTAMTECH_BOT/4.0 (contact@dtamtech.com)' },
            timeout: 5000
        });

        const firstHit = wikiRes.data?.query?.search?.[0];
        if (firstHit) {
            const summaryUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstHit.title)}`;
            const sumRes = await axios.get(summaryUrl, {
                headers: { 'User-Agent': 'DTAMTECH_BOT/4.0 (contact@dtamtech.com)' },
                timeout: 5000
            });
            if (sumRes.data?.extract) {
                data.summary = {
                    title: sumRes.data.title,
                    description: sumRes.data.description || '',
                    extract: sumRes.data.extract,
                    url: sumRes.data.content_urls?.desktop?.page || `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(firstHit.title)}`
                };
            }
        }
    } catch { }

    // 2. DuckDuckGo Instant Answer API
    try {
        const ddgRes = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
            timeout: 4000
        });
        if (ddgRes.data?.AbstractText && !data.summary) {
            data.instantAnswer = {
                heading: ddgRes.data.Heading || query,
                text: ddgRes.data.AbstractText,
                url: ddgRes.data.AbstractURL || ''
            };
        }
    } catch { }

    // 3. DuckDuckGo Lite Web Search (Extraction fiable de liens et snippets réels)
    try {
        const ddgItems = await searchDuckDuckGoLite(query);
        if (ddgItems.length > 0) {
            data.items = ddgItems;
        }
    } catch { }

    // 4. Fallback Bing Web Search si DuckDuckGo n'a rien renvoyé
    if (data.items.length === 0) {
        try {
            const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=${wikiLang}`;
            const bingRes = await axios.get(bingUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept-Language': lang === 'en' ? 'en-US,en;q=0.9' : 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
                },
                timeout: 6000
            });

            const $ = cheerio.load(bingRes.data);
            $('li.b_algo').each((i, el) => {
                if (data.items.length >= 5) return;
                const titleEl = $(el).find('h2 a');
                const title = titleEl.text().trim();
                const rawLink = titleEl.attr('href');
                const link = decodeBingUrl(rawLink);
                const snippet = $(el).find('.b_caption p, .b_algoSlug, .b_lineclamp2').text().trim();
                if (title && link && !link.includes('javascript:')) {
                    data.items.push({ title, link, snippet });
                }
            });
        } catch { }
    }

    // 5. Suggestions Google pour suggestions intelligentes
    try {
        const suggRes = await axios.get(`https://suggestqueries.google.com/complete/search?client=firefox&hl=${wikiLang}&q=${encodeURIComponent(query)}`, {
            timeout: 3000
        });
        if (Array.isArray(suggRes.data?.[1])) {
            data.suggestions = suggRes.data[1].slice(0, 4);
        }
    } catch { }

    return data;
}

/**
 * Formate les résultats de recherche Web en message WhatsApp soigné
 */
function formatWebSearchResult(data, prefix = '.') {
    let out = `〘 🌐 RECHERCHE 〙\n`;
    out += `🔍 Requête : *${data.query}*\n\n`;

    // 1. Résumé contextuel
    if (data.summary) {
        out += `📌 Résumé : *${data.summary.title}*\n`;
        if (data.summary.description) {
            out += `_${data.summary.description}_\n`;
        }
        out += `${data.summary.extract.slice(0, 320)}${data.summary.extract.length > 320 ? '...' : ''}\n`;
        if (data.summary.url) {
            out += `🔗 _${data.summary.url}_\n`;
        }
        out += `\n`;
    } else if (data.instantAnswer) {
        out += `💡 Réponse Directe : *${data.instantAnswer.heading}*\n`;
        out += `${data.instantAnswer.text.slice(0, 320)}\n`;
        if (data.instantAnswer.url) {
            out += `🔗 _${data.instantAnswer.url}_\n`;
        }
        out += `\n`;
    }

    // 2. Résultats de liens Web
    if (data.items.length > 0) {
        out += `📑 Résultats Web :\n`;
        data.items.forEach((item, idx) => {
            out += `*[${idx + 1}]* *${item.title}*\n`;
            if (item.snippet) {
                out += `   _${item.snippet.slice(0, 140)}_\n`;
            }
            out += `   🔗 ${item.link}\n\n`;
        });
    }

    // 3. Suggestions associées
    if (data.suggestions.length > 0) {
        out += `💡 Recherches associées :\n`;
        data.suggestions.forEach(s => {
            out += ` • *${prefix}search ${s}*\n`;
        });
        out += `\n`;
    }

    out += `════════════════⊷\n> *DTAMTECH MD V4*`;
    return out;
}

/**
 * Commande .search / .research / .recherche / .google / .web — Recherche Web & Hub Réseaux
 */
export async function searchHub(m) {
    const prefix = (await UserConfig.get('prefix')) || '.';
    const lang = (await UserConfig.get('language')) || 'fr';
    const query = (m.textMessage || m.args?.join(' ') || '').trim();

    // Si une requête est fournie, exécuter la recherche sur le Web
    if (query) {
        await m.react('🔍');
        try {
            const results = await performWebSearch(query, lang);

            // Si aucun résultat trouvé nulle part
            if (!results.summary && !results.instantAnswer && results.items.length === 0) {
                await m.react('❓');
                return await m.reply(
                    `〘 🌐 RECHERCHE 〙\n` +
                    `❌ Aucun résultat trouvé pour : *${query}*\n` +
                    `════════════════⊷`
                );
            }

            const responseText = formatWebSearchResult(results, prefix);
            await m.reply(responseText);
            await m.react('✅');
        } catch (err) {
            logger.error(`Erreur recherche Web : ${err.message}`);
            await m.react('❌');
            await m.reply(formatErrorMessage(err, 'Recherche'));
        }
        return;
    }

    const guide =
        `〘 🔎 RECHERCHE 〙\n\n` +
        `🌐 Recherche Web (Google/Bing/Wiki) :\n` +
        ` • *${prefix}search <mots-clés>* — Recherches sur l'ensemble du web\n` +
        ` • *${prefix}google <mots-clés>* — Alias pour la recherche web\n\n` +
        `📺 YouTube :\n` +
        ` • *${prefix}yts <mots-clés>* — Explorer vidéos, musiques & chaînes\n` +
        ` • *${prefix}song <titre>* — Télécharger l'audio MP3\n` +
        ` • *${prefix}yt <titre/lien>* — Télécharger la vidéo MP4\n\n` +
        `🎵 TikTok :\n` +
        ` • *${prefix}tksearch <mots-clés>* — Trouver les vidéos tendances\n` +
        ` • *${prefix}tiktok <lien>* — Télécharger sans filigrane\n\n` +
        `🎧 Spotify :\n` +
        ` • *${prefix}spotifys <morceau/artiste>* — Rechercher des titres\n` +
        ` • *${prefix}spotify <titre/lien>* — Télécharger le titre\n\n` +
        `🐙 GitHub :\n` +
        ` • *${prefix}gitsearch <projet>* — Rechercher des dépôts open-source\n` +
        ` • *${prefix}gitclone <lien>* — Télécharger l'archive ZIP du code\n\n` +
        `════════════════⊷\n` +
        `> *Astuce :* Tapez *${prefix}search <mots-clés>* pour lancer une recherche Web instantanée !`;

    await m.reply(guide);
}

export default {
    name: 'search',
    description: 'Recherche Web multi-sources et hub multimédia',
    searchHub,
    performWebSearch,
    commands: [
        {
            name: 'search',
            aliases: ['google', 'research', 'recherche', 'web'],
            category: 'tools',
            description: 'Effectue une recherche sur le Web (DuckDuckGo, Wikipedia, Bing)',
            usage: '.search <mots-clés>',
            cooldown: 5,
            execute: async ({ m }) => {
                await searchHub(m);
            }
        }
    ]
};
