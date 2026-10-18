import yts from 'yt-search';
import { logger } from '../utils/logger.js';
import { extractVideoId, downloadYouTubeAudio, downloadYouTubeVideo } from '../utils/youtubeCore.js';
import { formatErrorMessage } from '../utils/errorHelper.js';

/**
 * Résout l'audio (M4A en mémoire) d'une URL YouTube.
 */
export async function resolveYouTubeAudio(ytUrl) {
    return await downloadYouTubeAudio(ytUrl);
}

/**
 * Résout la vidéo (MP4 en mémoire) d'une URL YouTube.
 */
export async function resolveYouTubeVideo(ytUrl) {
    return await downloadYouTubeVideo(ytUrl);
}

/**
 * Nettoie un titre pour l'utiliser comme nom de fichier.
 */
function safeFileName(title, extension) {
    const base = String(title || 'audio').replace(/[\\/:*?"<>|\n\r]+/g, ' ').trim().slice(0, 80) || 'audio';
    return `${base}.${extension}`;
}

/**
 * Commande .song / .mp3 — Téléchargement audio YouTube
 */
export async function mp3(m) {
    const text = (m.textMessage || m.args.join(' ') || '').trim();
    if (!text) {
        return m.reply(
            `〘 🎵 YOUTUBE MP3 〙\n` +
            `❍ Usage* : *.song <titre ou lien YouTube>*\n` +
            `❍ Exemple* : *.song Burna Boy Last Last*\n` +
            `════════════════⊷`
        );
    }

    await m.react('🔎');

    let ytUrl = text;
    let title = text;
    let thumbnail = 'https://img1.pixhost.to/images/5332/592865778_skyzopedia.jpg';
    let author = 'YouTube Music';
    let duration = '';

    try {
        if (!text.startsWith('http://') && !text.startsWith('https://')) {
            const search = await yts(text);
            const video = search?.videos?.[0];
            if (!video) {
                await m.react('❌');
                return m.reply('> ❌ Aucun résultat trouvé.');
            }
            ytUrl = video.url;
            title = video.title || text;
            thumbnail = video.thumbnail || thumbnail;
            author = video.author?.name || author;
            duration = video.timestamp || '';
        }

        const audio = await resolveYouTubeAudio(ytUrl);
        const displayTitle = audio.title || title;
        const displayThumb = audio.thumbnail || thumbnail;

        await m.reply('', {
            audio: audio.buffer,
            mimetype: audio.mimetype,
            fileName: safeFileName(displayTitle, audio.extension),
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400242611705@newsletter',
                    newsletterName: 'DTAMTECH'
                },
                externalAdReply: {
                    title: displayTitle,
                    body: `${author} ${duration ? '• ' + duration : ''}`,
                    thumbnailUrl: displayThumb,
                    sourceUrl: ytUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });

        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans youtube mp3 : ${err.message}`);
        await m.react('❌');
        const isBotBlock = err.message?.includes('Sign in to confirm') || err.message?.includes('403') || err.message?.includes('indisponible');
        const fallbackSearch = title || text || 'musique';
        if (isBotBlock) {
            await m.reply(
                `*❌ Échec du téléchargement audio*\n\n` +
                `> ℹ️ *Raison* : Restriction anti-bot de Google\n` +
                `> 💡 *Solution* : Ajoutez votre variable *YOUTUBE_COOKIE* dans le fichier *.env* pour débloquer les téléchargements sur votre serveur.\n` +
                `> 🔍 Tapez *.yts ${fallbackSearch}* pour obtenir les informations et liens du morceau.`
            );
        } else {
            await m.reply(formatErrorMessage(err, 'Téléchargement audio'));
        }
    }
}

/**
 * Commande .play — Recherche et joue un morceau audio
 */
export async function play(m) {
    return await mp3(m);
}

/**
 * Commande .mp4 / .video / .yt / .ytdl — Téléchargement vidéo YouTube
 */
export async function mp4(m) {
    await m.react('ℹ️');
    return m.reply(
        `〘 🎬 YOUTUBE MP4 〙\n\n` +
        `ℹ️ Le téléchargement vidéo YouTube est désactivé pour préserver la stabilité du bot.\n` +
        `   (Protection anti-bot de Google sur les hébergeurs et serveurs VPS)\n\n` +
        `🎵 Pour la musique & l'audio :\n` +
        `  • *.song <titre ou lien>* : Télécharger en MP3 haute qualité\n` +
        `  • *.play <titre>* : Écouter un morceau\n` +
        `  • *.spotify <titre>* : Recherche & audio Spotify\n` +
        `  • *.yts <recherche>* : Rechercher des vidéos YouTube\n\n` +
        `🎬 Téléchargement vidéo 100% opérationnel sur :\n` +
        `  • *.tiktok <lien>* : Vidéo TikTok sans filigrane (HD)\n` +
        `  • *.ig <lien>* : Vidéo / Reel Instagram\n` +
        `  • *.fb <lien>* : Vidéo Facebook\n` +
        `════════════════⊷\n> *DTAMTECH MD V4*`
    );
}

/**
 * Commande .ytdl / .download
 */
export async function download(m) {
    return await mp4(m);
}

/**
 * Commande .yts / .ytsearch — Recherche de vidéos YouTube
 */
export async function search(m) {
    const query = (m.textMessage || m.args.join(' ') || '').trim();
    if (!query) {
        return m.reply(
            `〘 🔎 YOUTUBE SEARCH 〙\n` +
            `❍ Usage* : *.yts <mots-clés>*\n` +
            `❍ Exemple* : *.yts Tutoriel JavaScript*\n` +
            `════════════════⊷`
        );
    }

    await m.react('⌛');

    try {
        const data = await yts(query);
        const videos = data?.videos || [];

        if (videos.length === 0) {
            await m.react('❌');
            return m.reply('> ❌ Aucun résultat.');
        }

        const results = videos.slice(0, 6);
        let msg = `〘 📺 YOUTUBE SEARCH RESULTS 〙\n\n`;

        results.forEach((v, idx) => {
            msg += `[${idx + 1}] *${v.title}*\n` +
                `  👤 *Chaîne* : ${v.author?.name || 'Inconnu'}\n` +
                `  ⏱️ *Durée*  : ${v.timestamp}\n` +
                `  👁️ *Vues*   : ${v.views?.toLocaleString() || 'N/A'}\n` +
                `  🔗 *Lien*   : ${v.url}\n\n`;
        });

        msg += `════════════════⊷\n\n` +
            `> Tapez *.song ${results[0].title}* pour l'audio ou *.yt ${results[0].title}* pour la vidéo !`;

        const first = results[0];
        await m.reply(msg, {
            contextInfo: {
                externalAdReply: {
                    title: first.title,
                    body: `${first.author?.name} (${first.timestamp})`,
                    thumbnailUrl: first.thumbnail,
                    sourceUrl: first.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });

        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans youtube search : ${err.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(err, 'Recherche YouTube'));
    }
}

export default {
    name: 'youtube',
    description: 'Recherche et téléchargements audio/vidéo YouTube',
    resolveYouTubeAudio,
    resolveYouTubeVideo,
    mp3,
    mp4,
    download,
    play,
    search,
    commands: [
        {
            name: 'song',
            aliases: ['mp3'],
            category: 'download',
            description: 'Télécharge une piste audio depuis YouTube au format MP3/M4A',
            usage: '.song <titre ou lien>',
            cooldown: 8,
            execute: async ({ m }) => {
                await mp3(m);
            }
        },
        {
            name: 'play',
            category: 'download',
            description: 'Recherche et joue un morceau audio depuis YouTube',
            usage: '.play <titre>',
            cooldown: 8,
            execute: async ({ m }) => {
                await play(m);
            }
        },
        {
            name: 'video',
            aliases: ['youtube', 'yt', 'ytdl', 'mp4'],
            category: 'download',
            description: 'Informations et options sur le téléchargement vidéo YouTube',
            usage: '.video <titre ou lien>',
            cooldown: 5,
            execute: async ({ m }) => {
                await mp4(m);
            }
        },
        {
            name: 'yts',
            aliases: ['ytsearch'],
            category: 'download',
            description: 'Recherche des vidéos et chaînes sur YouTube',
            usage: '.yts <mots-clés>',
            cooldown: 5,
            execute: async ({ m }) => {
                await search(m);
            }
        }
    ]
};
