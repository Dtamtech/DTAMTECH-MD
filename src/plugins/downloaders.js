import axios from 'axios';
import * as cheerio from 'cheerio';
import yts from 'yt-search';
import { logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/errorHelper.js';
import { resolveYouTubeAudio } from './youtube.js';

// ═════════════════════════════════════════════════════════════════
// 1. TIKTOK DOWNLOADER & SEARCH
// ═════════════════════════════════════════════════════════════════
const TIKWM_BASE = 'https://www.tikwm.com';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const TRENDING_REGIONS = ['US', 'FR', 'GB'];

async function tikwmPost(path, params, timeout = 15000) {
    const res = await axios.post(`${TIKWM_BASE}${path}`, new URLSearchParams(params).toString(), {
        timeout,
        headers: {
            'User-Agent': BROWSER_UA,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
    });
    if (res.data?.code !== 0) {
        throw new Error(res.data?.msg || `Réponse TikWM invalide (${path})`);
    }
    return res.data.data;
}

function isTikTokUrl(value) {
    try {
        const { protocol, hostname } = new URL(value);
        return (protocol === 'https:' || protocol === 'http:') &&
            /(^|\.)(tiktok\.com|douyin\.com)$/i.test(hostname);
    } catch {
        return false;
    }
}

async function downloadVideoBuffer(videoUrl) {
    const res = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: MAX_VIDEO_BYTES,
        maxBodyLength: MAX_VIDEO_BYTES,
        headers: { 'User-Agent': BROWSER_UA }
    });
    const buffer = Buffer.from(res.data);
    if (buffer.length === 0) throw new Error('Vidéo TikTok vide.');
    return buffer;
}

async function extractTikTokVideo(url) {
    let data;
    try {
        data = await tikwmPost('/api/', { url, hd: 1 });
    } catch (err) {
        logger.warn(`TikWM extraction : ${err.message}`);
        throw new Error(`Impossible d'extraire la vidéo TikTok (${err.message}).`);
    }

    const rawUrl = data.hdplay || data.play || data.wmplay;
    if (!rawUrl) throw new Error('Impossible d\'extraire la vidéo TikTok (aucun flux disponible).');

    return {
        url: rawUrl.startsWith('http') ? rawUrl : `${TIKWM_BASE}${rawUrl}`,
        title: data.title || 'TikTok Video',
        author: data.author?.nickname || data.author?.unique_id || 'TikToker',
        likes: data.digg_count || 0,
        comments: data.comment_count || 0,
        shares: data.share_count || 0
    };
}

export async function tiktokDownload(m) {
    const url = (m.args[0] || m.textMessage || m.quoted?.textMessage || '').trim();

    if (!isTikTokUrl(url)) {
        return m.reply(
            `〘 🎵 TIKTOK DOWNLOADER 〙\n` +
            `❍ Usage* : *.tiktok <lien tiktok>*\n` +
            `❍ Exemple* : *.tiktok https://vm.tiktok.com/...*\n` +
            `════════════════⊷`
        );
    }

    await m.react('⏳');

    try {
        const video = await extractTikTokVideo(url);

        let media;
        try {
            media = await downloadVideoBuffer(video.url);
        } catch (err) {
            logger.warn(`TikTok buffer indisponible, envoi par URL : ${err.message}`);
            media = { url: video.url };
        }

        await m.reply('', {
            video: media,
            mimetype: 'video/mp4',
            caption:
                `〘 🎵 TIKTOK VIDEO 〙\n` +
                `❍ Auteur*  : ${video.author}\n` +
                `❍ Titre*   : ${video.title.substring(0, 100)}\n` +
                (video.likes ? `❍ Likes*   : ${video.likes.toLocaleString()}\n` : '') +
                (video.comments ? `❍ Comm.*   : ${video.comments.toLocaleString()}\n` : '') +
                `════════════════⊷\n> *DTAMTECH MD V4*`
        });

        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans tiktok download : ${err.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(err, 'Téléchargement TikTok'));
    }
}

function normalizeTikTokVideo(v) {
    const authorId = v.author?.unique_id || v.author?.uniqueId || 'user';
    return {
        title: v.title || '',
        author: authorId,
        play_count: v.play_count || 0,
        digg_count: v.digg_count || 0,
        url: `https://www.tiktok.com/@${authorId}/video/${v.video_id || v.id}`
    };
}

async function searchTikTok(query) {
    try {
        const data = await tikwmPost('/api/feed/search', { keywords: query, count: 8, cursor: 0, web: 1, hd: 1 }, 10000);
        const videos = (data?.videos || []).map(normalizeTikTokVideo);
        if (videos.length > 0) return { videos, mode: 'search' };
    } catch (err) {
        logger.warn(`TikWM search indisponible : ${err.message}`);
    }

    const feeds = await Promise.allSettled(
        TRENDING_REGIONS.map((region) => tikwmPost('/api/feed/list', { region, count: 20 }))
    );
    const trending = feeds
        .filter((f) => f.status === 'fulfilled' && Array.isArray(f.value))
        .flatMap((f) => f.value)
        .map(normalizeTikTokVideo);

    if (trending.length === 0) {
        throw new Error('Le service TikTok est injoignable pour le moment.');
    }

    const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
    const matched = trending
        .map((v) => ({ v, score: tokens.filter((t) => `${v.title} ${v.author}`.toLowerCase().includes(t)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.v);

    return matched.length > 0
        ? { videos: matched, mode: 'trending-match' }
        : { videos: trending, mode: 'trending' };
}

export async function tiktokSearch(m) {
    const query = (m.textMessage || m.args.join(' ') || '').trim();

    if (!query) {
        return m.reply(
            `〘 🔎 TIKTOK SEARCH 〙\n` +
            `❍ Usage* : *.tksearch <mots-clés>*\n` +
            `❍ Exemple* : *.tksearch dance trend*\n` +
            `════════════════⊷`
        );
    }

    await m.react('⌛');

    try {
        const { videos, mode } = await searchTikTok(query);

        const notes = {
            search: '',
            'trending-match': `ℹ️ Recherche directe indisponible : résultats filtrés parmi les tendances.\n\n`,
            trending: `⚠️ Recherche directe indisponible et aucune tendance ne correspond.\n🔥 Voici les vidéos tendances du moment :\n\n`
        };

        let msg = `〘 🎵 TIKTOK SEARCH RESULTS 〙\n\n` + notes[mode];
        videos.slice(0, 5).forEach((v, i) => {
            msg += `[${i + 1}] *${(v.title || 'Vidéo TikTok').substring(0, 100)}*\n` +
                `  👤 *Auteur* : @${v.author}\n` +
                (v.play_count ? `  👁️ *Vues*   : ${v.play_count.toLocaleString()}\n` : '') +
                (v.digg_count ? `  ❤️ *Likes*  : ${v.digg_count.toLocaleString()}\n` : '') +
                `  🔗 *Lien*   : ${v.url}\n\n`;
        });
        msg += `════════════════⊷\n\n` +
            `> Tapez *.tiktok <lien>* pour télécharger !`;

        await m.reply(msg);
        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans tiktok search : ${err.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(err, 'Recherche TikTok'));
    }
}

// ═════════════════════════════════════════════════════════════════
// 2. FACEBOOK DOWNLOADER
// ═════════════════════════════════════════════════════════════════
async function extractFacebookVideo(targetUrl) {
    try {
        const ruhend = await import('ruhend-scraper');
        const fbdl = ruhend.fbdl || ruhend.default?.fbdl;
        if (typeof fbdl === 'function') {
            const res = await fbdl(targetUrl);
            const videoUrl = res?.video || res?.hd || res?.sd || res?.url;
            if (videoUrl) {
                return {
                    url: videoUrl,
                    title: res.title || 'Facebook Video'
                };
            }
        }
    } catch { }

    try {
        const cobaltRes = await axios.post('https://api.cobalt.tools/', {
            url: targetUrl
        }, {
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if (cobaltRes.data?.url) {
            return {
                url: cobaltRes.data.url,
                title: 'Facebook Video'
            };
        }
    } catch { }

    try {
        const apiRes = await axios.get(`https://api.hanggts.xyz/download/facebook?url=${encodeURIComponent(targetUrl)}`, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = apiRes.data;
        if (data?.result?.video || data?.result?.hd || data?.result?.sd || data?.url) {
            return {
                url: data.result.hd || data.result.video || data.result.sd || data.url,
                title: data.result.title || 'Facebook Video'
            };
        }
    } catch { }

    throw new Error('Impossible d\'extraire la vidéo Facebook. Vérifiez que la vidéo est publique.');
}

export async function facebook(m) {
    const url = (m.textMessage || m.args[0] || m.quoted?.textMessage || '').trim();

    if (!url) {
        return m.reply(
            `〘 📥 FACEBOOK DOWNLOADER 〙\n` +
            `❍ Usage* : *.fb <lien facebook>*\n` +
            `❍ Exemple* : *.fb https://www.facebook.com/watch?v=...*\n` +
            `════════════════⊷`
        );
    }

    if (!url.includes('facebook.com') && !url.includes('fb.watch') && !url.includes('fb.gg')) {
        return m.reply('> ❌ Lien Facebook invalide.');
    }

    await m.react('⏳');

    try {
        let resolvedUrl = url;
        try {
            const redirectRes = await axios.get(url, {
                timeout: 8000,
                maxRedirects: 5,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            if (redirectRes?.request?.res?.responseUrl) {
                resolvedUrl = redirectRes.request.res.responseUrl;
            }
        } catch { }

        const video = await extractFacebookVideo(resolvedUrl);

        await m.reply('', {
            video: { url: video.url },
            mimetype: 'video/mp4',
            caption:
                `〘 📥 FACEBOOK VIDEO 〙\n` +
                `❍ Titre* : ${video.title}\n` +
                `════════════════⊷\n> *DTAMTECH MD V4*`
        });

        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans facebook download : ${err.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(err, 'Téléchargement Facebook'));
    }
}

// ═════════════════════════════════════════════════════════════════
// 3. INSTAGRAM DOWNLOADER
// ═════════════════════════════════════════════════════════════════
async function extractInstagramMedia(url) {
    try {
        const ruhend = await import('ruhend-scraper');
        const igdl = ruhend.igdl || ruhend.default?.igdl;
        if (typeof igdl === 'function') {
            const res = await igdl(url);
            const list = res?.data || res;
            if (Array.isArray(list) && list.length > 0) {
                return list.map(item => item.url || item.downloadUrl || item);
            }
        }
    } catch { }

    try {
        const cobaltRes = await axios.post('https://api.cobalt.tools/', {
            url: url
        }, {
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if (cobaltRes.data?.url) {
            return [cobaltRes.data.url];
        }
        if (Array.isArray(cobaltRes.data?.picker)) {
            return cobaltRes.data.picker.map(item => item.url);
        }
    } catch { }

    try {
        const res = await axios.get(`https://api.hanggts.xyz/download/instagram?url=${encodeURIComponent(url)}`, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = res.data;
        if (Array.isArray(data?.result) && data.result.length > 0) {
            return data.result.map(i => i.url || i.downloadUrl || i);
        }
        if (data?.result?.url) return [data.result.url];
    } catch { }

    try {
        const res = await axios.get(`https://api.giftedtech.web.id/api/download/instagram?apikey=gifted&url=${encodeURIComponent(url)}`, {
            timeout: 15000
        });
        const data = res.data;
        if (data?.success && data?.result) {
            if (Array.isArray(data.result)) return data.result.map(i => i.url || i);
            if (typeof data.result === 'string') return [data.result];
        }
    } catch { }

    throw new Error('Impossible de récupérer le média Instagram. Assurez-vous que le compte/post est public.');
}

export async function instagram(m) {
    const url = (m.textMessage || m.args[0] || m.quoted?.textMessage || '').trim();

    if (!url) {
        return m.reply(
            `〘 📥 INSTAGRAM DOWNLOADER 〙\n` +
            `❍ Usage* : *.insta <lien instagram>*\n` +
            `❍ Exemple* : *.insta https://www.instagram.com/reel/...*\n` +
            `════════════════⊷`
        );
    }

    if (!url.includes('instagram.com') && !url.includes('instagr.am')) {
        return m.reply('> ❌ Lien Instagram invalide.');
    }

    await m.react('⏳');

    try {
        const mediaList = await extractInstagramMedia(url);

        if (!mediaList || mediaList.length === 0) {
            await m.react('❌');
            return m.reply('> ❌ Média introuvable ou privé.');
        }

        const toSend = mediaList.slice(0, 3);

        for (const mediaUrl of toSend) {
            const isVideo = /\.(mp4|mov|avi|mkv|webm)/i.test(mediaUrl) ||
                url.includes('/reel/') ||
                url.includes('/tv/');

            if (isVideo) {
                await m.reply('', {
                    video: { url: mediaUrl },
                    mimetype: 'video/mp4',
                    caption: `〘 📥 INSTAGRAM VIDEO 〙\n════════════════⊷\n> *DTAMTECH MD*`
                });
            } else {
                await m.reply('', {
                    image: { url: mediaUrl },
                    mimetype: 'image/jpeg',
                    caption: `〘 📥 INSTAGRAM PHOTO 〙\n════════════════⊷\n> *DTAMTECH MD*`
                });
            }
        }

        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans instagram download : ${err.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(err, 'Téléchargement Instagram'));
    }
}

// ═════════════════════════════════════════════════════════════════
// 4. SPOTIFY DOWNLOADER & SEARCH
// ═════════════════════════════════════════════════════════════════
export async function spotifySearch(m) {
    const query = (m.textMessage || m.args.join(' ') || '').trim();

    if (!query) {
        return m.reply(
            `〘 🎵 SPOTIFY SEARCH 〙\n` +
            `❍ Usage* : *.spotifys <nom du morceau ou artiste>*\n` +
            `❍ Exemple* : *.spotifys Damso Macarena*\n` +
            `════════════════⊷`
        );
    }

    await m.react('⌛');

    try {
        const searchResults = await yts(query);
        const videos = searchResults?.videos || [];

        if (videos.length === 0) {
            await m.react('❌');
            return m.reply('> ❌ Aucun résultat trouvé.');
        }

        const topTracks = videos.slice(0, 5);
        let listMsg = `〘 🎵 RÉSULTATS SPOTIFY 〙\n\n`;

        topTracks.forEach((track, i) => {
            listMsg += `[${i + 1}] *${track.title}*\n` +
                `  👤 *Artiste* : ${track.author?.name || 'Inconnu'}\n` +
                `  ⏱️ *Durée*   : ${track.timestamp}\n` +
                `  🔗 *Lien*    : ${track.url}\n\n`;
        });

        listMsg += `════════════════⊷\n\n` +
            `> Tapez *.spotify ${topTracks[0].title}* pour télécharger le morceau !`;

        const first = topTracks[0];
        await m.reply(listMsg, {
            contextInfo: {
                externalAdReply: {
                    title: first.title,
                    body: `Par ${first.author?.name || 'Artiste'} (${first.timestamp})`,
                    thumbnailUrl: first.thumbnail,
                    sourceUrl: first.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });

        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans spotify search : ${err.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(err, 'Recherche Spotify'));
    }
}

async function getSpotifyOembed(url) {
    try {
        const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await axios.get(oembedUrl, { timeout: 8000 });
        if (res.data?.title) {
            return {
                title: res.data.title,
                thumbnail: res.data.thumbnail_url,
                author: res.data.author_name || ''
            };
        }
    } catch { }
    return null;
}

async function resolveAudioStream(trackTitle, ytUrl = null) {
    let targetYtUrl = ytUrl;
    if (!targetYtUrl) {
        const search = await yts(`${trackTitle} audio official`);
        const video = search?.videos?.[0];
        if (!video) throw new Error('Aucune piste audio correspondante trouvée.');
        targetYtUrl = video.url;
    }
    return await resolveYouTubeAudio(targetYtUrl);
}

export async function spotifyDownload(m) {
    const input = (m.textMessage || m.args.join(' ') || '').trim();

    if (!input) {
        return m.reply(
            `〘 📥 SPOTIFY DOWNLOADER 〙\n` +
            `❍ Usage* : *.spotify <lien ou nom de musique>*\n` +
            `❍ Exemple 1* : *.spotify https://open.spotify.com/track/...*\n` +
            `❍ Exemple 2* : *.spotify The Weeknd Blinding Lights*\n` +
            `════════════════⊷`
        );
    }

    await m.react('🎧');

    try {
        let trackName = input;
        let coverUrl = 'https://img1.pixhost.to/images/5332/592865778_skyzopedia.jpg';
        let author = 'Spotify Music';

        if (input.includes('spotify.com/')) {
            const meta = await getSpotifyOembed(input);
            if (meta) {
                trackName = meta.title;
                coverUrl = meta.thumbnail || coverUrl;
                author = meta.author || author;
            }
        }

        const search = await yts(trackName);
        const video = search?.videos?.[0];

        if (!video) {
            await m.react('❌');
            return m.reply('> ❌ Piste introuvable.');
        }

        const audioData = await resolveAudioStream(trackName, video.url);

        await m.reply('', {
            audio: audioData.buffer,
            mimetype: audioData.mimetype,
            fileName: `${(video.title || trackName).replace(/[\\/:*?"<>|\n\r]+/g, ' ').trim().slice(0, 80)}.${audioData.extension}`,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363400242611705@newsletter',
                    newsletterName: 'DTAMTECH'
                },
                externalAdReply: {
                    title: video.title || trackName,
                    body: `Spotify • ${video.author?.name || author} (${video.timestamp || 'Audio'})`,
                    thumbnailUrl: video.thumbnail || coverUrl,
                    sourceUrl: input.includes('spotify.com') ? input : video.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });

        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans spotify download : ${err.message}`);
        await m.react('❌');
        const isBotBlock = err.message?.includes('Sign in to confirm') || err.message?.includes('403') || err.message?.includes('indisponible');
        if (isBotBlock) {
            await m.reply(
                `*❌ Échec du téléchargement audio*\n\n` +
                `> ℹ️ *Raison* : Restriction anti-bot de Google.\n` +
                `> 💡 *Solution* : Définissez votre variable *YOUTUBE_COOKIE* dans le fichier *.env* pour autoriser le téléchargement sur ce serveur.\n` +
                `> 🔍 Tapez *.spotifys ${input}* pour voir les titres et métadonnées.`
            );
        } else {
            await m.reply(formatErrorMessage(err, 'Téléchargement Spotify'));
        }
    }
}

// ═════════════════════════════════════════════════════════════════
// 5. APK DOWNLOADER
// ═════════════════════════════════════════════════════════════════
export async function apkdl(m) {
    const text = (m.textMessage || m.args.join(' ') || '').trim();

    if (!text) {
        return m.reply(
            `〘 📦 APK DOWNLOADER 〙\n` +
            `❍ Usage* : *.apk <nom de l'application>*\n` +
            `❍ Exemple* : *.apk WhatsApp*\n` +
            `════════════════⊷`
        );
    }

    await m.react('👨🏽‍💻');

    try {
        const aptoideUrl = `http://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(text)}&limit=5`;
        const res = await axios.get(aptoideUrl, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const appList = res?.data?.datalist?.list;
        if (!appList || appList.length === 0) {
            await m.react('❌');
            return m.reply('> ❌ Application introuvable.');
        }

        const app = appList[0];
        const appName = app.name || text;
        const developer = app.developer?.name || 'Inconnu';
        const version = app.file?.vername || 'Dernière';
        const rawSize = app.file?.filesize || 0;
        const sizeMb = rawSize ? (rawSize / (1024 * 1024)).toFixed(1) + ' MB' : 'N/A';
        const icon = app.icon || 'https://raw.githubusercontent.com/dtamtech/assets/main/apk.png';
        const downloadUrl = app.file?.path;

        if (!downloadUrl) {
            await m.react('❌');
            return m.reply('> ❌ Impossible de telecharger l\'application.');
        }

        const caption =
            `〘 📦 APK DOWNLOADER 〙\n` +
            `❍ Nom*       : ${appName}\n` +
            `❍ Développeur* : ${developer}\n` +
            `❍ Version*   : ${version}\n` +
            `❍ Taille*    : ${sizeMb}\n` +
            `❍ lien*    : ${downloadUrl}\n` +
            `════════════════⊷\n> *Powered by DTAMTECH MD*`;

        if (rawSize && rawSize < 90 * 1024 * 1024) {
            await m.reply('', {
                document: { url: downloadUrl },
                fileName: `${appName.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}_v${version}.apk`,
                mimetype: 'application/vnd.android.package-archive',
                caption: caption,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363400242611705@newsletter',
                        newsletterName: 'DTAMTECH'
                    },
                    externalAdReply: {
                        title: appName,
                        body: `Par ${developer} (${sizeMb})`,
                        thumbnailUrl: icon,
                        sourceUrl: downloadUrl,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            });
        } else {
            await m.reply(
                caption + `\n\n⚠️ *Fichier volumineux (${sizeMb})*, téléchargez l'application via le lien direct.`,
                {
                    contextInfo: {
                        externalAdReply: {
                            title: appName,
                            body: `Télécharger (${sizeMb})`,
                            thumbnailUrl: icon,
                            sourceUrl: downloadUrl,
                            renderLargerThumbnail: true
                        }
                    }
                }
            );
        }

        await m.react('✅');

    } catch (err) {
        logger.error(`Erreur dans apkdl : ${err.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(err, 'Téléchargement APK'));
    }
}

// ═════════════════════════════════════════════════════════════════
// 6. MEDIAFIRE DOWNLOADER
// ═════════════════════════════════════════════════════════════════
async function scrapeMediafire(url) {
    const res = await axios.get(url, {
        timeout: 15000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    const $ = cheerio.load(res.data);

    let downloadLink = $('#downloadButton').attr('href') ||
        $('a#downloadButton').attr('href') ||
        $('a.input.popsok').attr('href') ||
        $('a[aria-label="Download file"]').attr('href');

    if (!downloadLink) {
        const match = res.data.match(/https?:\/\/download\d+\.mediafire\.com\/[^\s"']+/);
        if (match) downloadLink = match[0];
    }

    if (!downloadLink) {
        throw new Error('Lien de téléchargement direct introuvable sur la page MediaFire.');
    }

    let fileName = $('.promoDownloadName').text().trim() ||
        $('.dl-btn-labelWrap div').text().trim() ||
        $('div.filename').text().trim() ||
        $('div.dl-info h2').text().trim();

    if (!fileName) {
        try {
            const urlParts = downloadLink.split('/');
            fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'mediafire_file');
        } catch {
            fileName = 'mediafire_file';
        }
    }

    const size = $('ul.dl-info li:first-child span').text().trim() ||
        $('.dl-info span:contains("MB"), .dl-info span:contains("KB"), .dl-info span:contains("GB")').first().text().trim() ||
        'N/A';

    const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'bin';

    return {
        name: fileName,
        size: size,
        ext: ext,
        downloadUrl: downloadLink
    };
}

export async function mediafireDownload(m) {
    const q = (m.textMessage || m.args[0] || m.quoted?.textMessage || '').trim();

    if (!q) {
        return m.reply(
            `〘 📦 MEDIAFIRE DOWNLOADER 〙\n` +
            `❍ Usage* : *.mediafire <lien mediafire>*\n` +
            `❍ Exemple* : *.mediafire https://www.mediafire.com/file/...*\n` +
            `════════════════⊷`
        );
    }

    if (!q.includes('mediafire.com')) {
        return m.reply('> ❌ Lien MediaFire invalide.');
    }

    await m.react('⏳');

    try {
        const fileData = await scrapeMediafire(q);

        const caption =
            `〘 📦 MEDIAFIRE FILE 〙\n` +
            `❍ Nom*    : ${fileData.name}\n` +
            `❍ Taille* : ${fileData.size}\n` +
            `❍ Type*   : .${fileData.ext}\n` +
            `════════════════⊷\n> *DTAMTECH MD V4*`;

        await m.reply('', {
            document: { url: fileData.downloadUrl },
            fileName: fileData.name,
            mimetype: `application/${fileData.ext}`,
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

    } catch (err) {
        logger.error(`Erreur dans mediafire download : ${err.message}`);
        await m.react('❌');
        await m.reply(formatErrorMessage(err, 'Téléchargement MediaFire'));
    }
}

// ═════════════════════════════════════════════════════════════════
// 7. SSWEB (SCREENSHOT WEB)
// ═════════════════════════════════════════════════════════════════
export async function ssweb(m) {
    let url = (m.args[0] || m.textMessage || '').trim();

    if (!url) {
        return m.reply(
            `〘 🌐 SSWEB 〙\n` +
            `❍ Usage* : *.ssweb <url>*\n` +
            `❍ Exemple* : *.ssweb https://google.com*\n` +
            `════════════════⊷`
        );
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    await m.react('📸');

    try {
        let buffer = null;

        try {
            const res = await axios.get(`https://image.thum.io/get/width/1200/crop/800/noanimate/${encodeURIComponent(url)}`, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (res.data?.length > 1000) buffer = Buffer.from(res.data);
        } catch { }

        if (!buffer) {
            try {
                const res = await axios.get(`https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1280&h=800`, {
                    responseType: 'arraybuffer',
                    timeout: 15000
                });
                if (res.data?.length > 1000) buffer = Buffer.from(res.data);
            } catch { }
        }

        if (!buffer) {
            try {
                const res = await axios.get(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`, {
                    timeout: 15000
                });
                const imgUrl = res.data?.data?.screenshot?.url;
                if (imgUrl) {
                    const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 12000 });
                    if (imgRes.data?.length > 1000) buffer = Buffer.from(imgRes.data);
                }
            } catch { }
        }

        if (!buffer) {
            await m.react('❌');
            return m.reply('> ❌ Capture impossible.');
        }

        await m.reply('', {
            image: buffer,
            caption: `〘 🌐 SSWEB 〙\n` +
                `❍ URL* : ${url}\n` +
                `════════════════⊷\n> *DTAMTECH MD V4*`
        }, { quoted: m });

        await m.react('✅');

    } catch (e) {
        await m.react('❌');
        return m.reply(formatErrorMessage(e, 'Capture web'));
    }
}

// ═════════════════════════════════════════════════════════════════
// PLUGIN DEFINITION
// ═════════════════════════════════════════════════════════════════
export default {
    name: 'downloaders',
    description: 'Téléchargement multi-plateformes (TikTok, Facebook, Instagram, Spotify, APK, MediaFire, SSWeb)',
    tiktokDownload,
    tiktokSearch,
    facebook,
    instagram,
    spotifySearch,
    spotifyDownload,
    apkdl,
    mediafireDownload,
    ssweb,
    commands: [
        {
            name: 'tiktok',
            aliases: ['tkdl'],
            category: 'download',
            description: 'Télécharge une vidéo TikTok sans filigrane en haute définition',
            usage: '.tiktok <lien TikTok>',
            cooldown: 8,
            execute: async ({ m }) => {
                await tiktokDownload(m);
            }
        },
        {
            name: 'tksearch',
            aliases: ['tks'],
            category: 'download',
            description: 'Recherche des vidéos tendances ou par mots-clés sur TikTok',
            usage: '.tksearch <mots-clés>',
            cooldown: 5,
            execute: async ({ m }) => {
                await tiktokSearch(m);
            }
        },
        {
            name: 'fb',
            aliases: ['facebook'],
            category: 'download',
            description: 'Télécharge une vidéo publique Facebook en qualité HD/SD',
            usage: '.fb <lien Facebook>',
            cooldown: 8,
            execute: async ({ m }) => {
                await facebook(m);
            }
        },
        {
            name: 'insta',
            aliases: ['instagram', 'ig'],
            category: 'download',
            description: 'Télécharge une publication, vidéo ou Reel Instagram',
            usage: '.insta <lien Instagram>',
            cooldown: 8,
            execute: async ({ m }) => {
                await instagram(m);
            }
        },
        {
            name: 'spotify',
            aliases: ['spdl'],
            category: 'download',
            description: 'Télécharge un morceau de musique depuis Spotify',
            usage: '.spotify <lien ou titre>',
            cooldown: 8,
            execute: async ({ m }) => {
                await spotifyDownload(m);
            }
        },
        {
            name: 'spotifys',
            aliases: ['spsearch'],
            category: 'download',
            description: 'Recherche des morceaux et albums sur Spotify',
            usage: '.spotifys <titre>',
            cooldown: 5,
            execute: async ({ m }) => {
                await spotifySearch(m);
            }
        },
        {
            name: 'apk',
            aliases: ['apkdl'],
            category: 'download',
            description: 'Recherche et télécharge un package d\'application Android APK',
            usage: '.apk <nom de l\'application>',
            cooldown: 10,
            execute: async ({ m }) => {
                await apkdl(m);
            }
        },
        {
            name: 'mediafire',
            aliases: ['mf'],
            category: 'download',
            description: 'Télécharge un fichier hébergé sur MediaFire',
            usage: '.mediafire <lien MediaFire>',
            cooldown: 10,
            execute: async ({ m }) => {
                await mediafireDownload(m);
            }
        },
        {
            name: 'ssweb',
            aliases: ['ss'],
            category: 'download',
            description: 'Capture d\'écran en direct d\'une page web',
            usage: '.ssweb <url>',
            cooldown: 8,
            execute: async ({ m }) => {
                await ssweb(m);
            }
        }
    ]
};
