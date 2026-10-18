import axios from 'axios';
import * as cheerio from 'cheerio';
import { getDevice } from 'baileys';
import { logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/errorHelper.js';
import UserConfig from '../config/config.js';
import { save } from './save.js';

// ═════════════════════════════════════════════════════════════════
// 1. FANCY TEXT SCRAPER
// ═════════════════════════════════════════════════════════════════
async function styletext(text) {
    return new Promise((resolve, reject) => {
        axios.get('http://qaz.wtf/u/convert.cgi?text=' + encodeURIComponent(text)).then(({ data }) => {
            const html = cheerio.load(data);
            const response = [];
            html('table > tbody > tr').each(function (a, b) {
                response.push({
                    name: html(b).find('td:nth-child(1) > span').text(),
                    result: html(b).find('td:nth-child(2)').text().trim()
                });
            });
            resolve(response);
        }).catch(reject);
    });
}

export async function fancy(m) {
    const text = m.textMessage || m.args?.join(' ');
    if (!text) return m.reply('> ❌ Texte requis.');
    await m.react('🎨');
    try {
        const response = await styletext(text);
        let output = `〘 🎨 FANCY 〙\n\n`;
        for (const i of response) {
            output += `❍ *${i.name}* : ${i.result}\n`;
        }
        output += `════════════════⊷`;
        await m.reply(output);
        await m.react('✅');
    } catch (e) {
        await m.react('❌');
        await m.reply(formatErrorMessage(e, 'Style de texte Fancy'));
    }
}

// ═════════════════════════════════════════════════════════════════
// 2. DEVICE DETECTOR
// ═════════════════════════════════════════════════════════════════
export async function device(m) {
    try {
        if (!m.quoted) {
            return m.reply("> ❌ Répondez à un message.");
        }
        const quotedMessageId = m.quoted.id;
        if (!quotedMessageId) {
            return m.reply("> ❌ Message introuvable.");
        }
        const dev = getDevice(quotedMessageId);
        await m.reply(`> *_The target is using an ${dev || 'unknown'} device_*`);
    } catch (error) {
        await m.reply(formatErrorMessage(error, 'Détection appareil'));
    }
}

// ═════════════════════════════════════════════════════════════════
// 3. GITHUB CLONE & SEARCH
// ═════════════════════════════════════════════════════════════════
export async function gitClone(m) {
    const q = (m.textMessage || m.args?.[0] || m.quoted?.textMessage || '').trim();

    if (!q) {
        return m.reply(
            `〘 🐙 GITHUB 〙\n` +
            `❍ Usage* : *.gitclone <lien du repo github>*\n` +
            `❍ Exemple* : *.gitclone https://github.com/user/repository*\n` +
            `════════════════⊷`
        );
    }

    const regex = /(?:https?:\/\/|git@)github\.com[\/:]([^\/:]+)\/([^\/\s#?]+)/i;
    const match = q.match(regex);

    if (!match) {
        return m.reply('> ❌ Lien GitHub invalide.');
    }

    const user = match[1];
    const repo = match[2].replace(/\.git$/, '');

    await m.react('⏳');

    try {
        const zipUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;

        const caption =
            `〘 🐙 GITHUB 〙\n` +
            `❍ Projet* : ${user}/${repo}\n` +
            `❍ Branche* : Principale (HEAD)\n` +
            `❍ Source*  : https://github.com/${user}/${repo}\n` +
            `════════════════⊷\n> *DTAMTECH MD V4*`;

        await m.reply('', {
            document: { url: zipUrl },
            fileName: `${repo}-main.zip`,
            mimetype: 'application/zip',
            caption: caption,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400242611705@newsletter',
                    newsletterName: 'DTAMTECH'
                }
            }
        });

        await m.react('✅');

    } catch (e) {
        logger.error(`Erreur dans github clone : ${e.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(e, 'Téléchargement GitHub'));
    }
}

export async function gitSearch(m) {
    const q = (m.textMessage || m.args?.join(' ') || '').trim();

    if (!q) {
        return m.reply(
            `〘 🐙 GITHUB 〙\n` +
            `❍ Usage* : *.gitsearch <mots-clés>*\n` +
            `❍ Exemple* : *.gitsearch whatsapp bot baileys*\n` +
            `════════════════⊷`
        );
    }

    await m.react('⌛');

    try {
        const res = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=5`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'DTAMTECH-MD-Bot',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const items = res.data?.items || [];
        if (items.length === 0) {
            await m.react('❌');
            return m.reply('> ❌ Aucun dépôt trouvé.');
        }

        let msg = `〘 🐙 GITHUB 〙\n\n`;
        items.forEach((repo, i) => {
            const desc = repo.description ? repo.description.slice(0, 60) + (repo.description.length > 60 ? '...' : '') : 'Aucune description';
            msg += `[${i + 1}] *${repo.full_name}*\n` +
                `  ⭐ *Stars*   : ${repo.stargazers_count?.toLocaleString() || 0} | 🍴 *Forks* : ${repo.forks_count?.toLocaleString() || 0}\n` +
                `  📝 *Desc*    : ${desc}\n` +
                `  🔗 *Lien*    : ${repo.html_url}\n\n`;
        });
        msg += `════════════════⊷\n\n` +
            `> Tapez *.gitclone ${items[0].html_url}* pour télécharger le dépôt !`;

        await m.reply(msg);
        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans github search : ${err.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(err, 'Recherche GitHub'));
    }
}

// ═════════════════════════════════════════════════════════════════
// 4. VIEW ONCE (Révélation de médias à vue unique)
// ═════════════════════════════════════════════════════════════════
export async function viewonce(m) {
    await save(m, m.chat);
}

// ═════════════════════════════════════════════════════════════════
// 5. BUG / ANTI-BUG HELPERS
// ═════════════════════════════════════════════════════════════════
export async function bug(m, text) {
    const isError = text.includes('❌') || text.toLowerCase().includes('error');
    const send = isError ? (t, opt) => m.reply(t, opt) : (t, opt) => m.modify(t, opt);

    await send(`> ${text}`, {
        mentions: [m.sender],
        contextInfo: {
            isForwarded: true,
            mentionedJid: [m.chat],
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363400242611705@newsletter',
                newsletterName: 'DTAM-HOST'
            },
            externalAdReply: {
                title: `Join Our WhatsApp Channel`,
                body: `DTAMTECH MD`,
                thumbnailUrl: 'https://img1.pixhost.to/images/5332/592865999_skyzopedia.jpg',
                sourceUrl: 'https://whatsapp.com/channel/0029Vb66gGi6WaKeWjuQk333',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    });
}

export async function antiBug(m) {
    if (m.messageBody) {
        if (m.messageBody.length > 50000) {
            logger.warn(`🐛 Message bug (> 50k car.) détecté et supprimé de : ${m.sender?.split('@')[0]}`);
            await m.reply("> *BUG MSG Detected*");
            await m.delete();
        }
    }
}

export async function antiBot(m) {
    if (await UserConfig.existsInList("antiBot", m.chat) && m.isGroup) {
        if (m.isBaileys) {
            logger.warn(`🤖 Bot non autorisé détecté et supprimé : ${m.sender?.split('@')[0]}`);
            await m.reply(`@${m.sender} Bot are not authorized in this group !`, { contextInfo: { mentionedJid: [m.sender] } });
            await m.delete();
        }
    }
}

export async function antiSpam(m) { }

// ═════════════════════════════════════════════════════════════════
// PLUGIN DEFINITION
// ═════════════════════════════════════════════════════════════════
export default {
    name: 'extraTools',
    description: 'Utilitaires complémentaires (Fancy, Device, GitHub, ViewOnce, Bug)',
    fancy,
    device,
    gitClone,
    gitSearch,
    viewonce,
    bug,
    antiBug,
    antiBot,
    antiSpam,
    commands: [
        {
            name: 'fancy',
            category: 'tools',
            description: 'Convertit du texte en typographies stylisées et fantaisistes',
            usage: '.fancy <texte>',
            cooldown: 5,
            execute: async ({ m }) => {
                await fancy(m);
            }
        },
        {
            name: 'device',
            category: 'tools',
            description: 'Détecte le type d\'appareil de l\'expéditeur du message cité (iOS, Android, Web)',
            usage: '.device (en répondant à un message)',
            cooldown: 3,
            execute: async ({ m }) => {
                await device(m);
            }
        },
        {
            name: 'vv',
            aliases: ['viewonce', 'rvo'],
            category: 'tools',
            description: 'Révèle et envoie dans le chat le média à vue unique (View Once) cité',
            usage: '.vv (en répondant à une photo/vidéo vue unique)',
            cooldown: 5,
            execute: async ({ m }) => {
                await viewonce(m);
            }
        },
        {
            name: 'github',
            aliases: ['gitclone'],
            category: 'tools',
            description: 'Télécharge une archive ZIP d\'un dépôt GitHub public',
            usage: '.github <lien du repo>',
            cooldown: 8,
            execute: async ({ m }) => {
                await gitClone(m);
            }
        },
        {
            name: 'gitsearch',
            aliases: ['githubs', 'githubsearch'],
            category: 'tools',
            description: 'Recherche des projets et dépôts sur GitHub',
            usage: '.gitsearch <mots-clés>',
            cooldown: 5,
            execute: async ({ m }) => {
                await gitSearch(m);
            }
        }
    ]
};
