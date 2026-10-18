import UserConfig from "../config/config.js";
import { BOT_VERSION_TAG } from "../config/version.js";

export async function info(m) {
    const prefix = (await UserConfig.get("prefix")) || ".";
    const isPrivate = await UserConfig.get("private");
    const today = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const botUser = m.client?.user?.name || "DTAMTECH";

    const t = `  
*┏══〘 DTAMTECH 𝗠𝗗 〙══*
*┃❍ ʙᴏᴛ ɴᴀᴍᴇ* : DTAMTECH MD
*┃❍ ᴠᴇʀsɪᴏɴ* : *${BOT_VERSION_TAG}*
*┃❍ ᴅᴇᴠᴇʟᴏᴘᴇʀ* : *DTAMTECH*
*┃❍ ᴜsᴇʀɴᴀᴍᴇ* : *${botUser}*
*┃❍ ᴅᴀᴛᴇ* : ${today}
*┃❍ ᴍᴏᴅᴇ* : *${isPrivate ? 'Private' : 'Public'}*
*┃❍ ᴘʀᴇғɪx* : [ *${prefix}* ]
*┗════════════════⊷*

*ɴᴏᴛᴇ: ᴜꜱᴇ ${prefix}help <cmd> ᴛᴏ ɢᴇᴛ ᴄᴏᴍᴍᴀɴᴅ ᴅᴇᴛᴀɪʟꜱ*

*╭─❒ 👥 ɢʀᴏᴜᴩ & ᴍᴏᴅᴇʀᴀᴛɪᴏɴ ❒*
*├⬡ ${prefix}add*
*├⬡ ${prefix}kick | ${prefix}ban*
*├⬡ ${prefix}promote*
*├⬡ ${prefix}demote*
*├⬡ ${prefix}demoteall*
*├⬡ ${prefix}mute*
*├⬡ ${prefix}unmute*
*├⬡ ${prefix}gclink*
*├⬡ ${prefix}tag*
*├⬡ ${prefix}tagall*
*├⬡ ${prefix}tagadmin*
*├⬡ ${prefix}tagrespond*
*├⬡ ${prefix}settag*
*├⬡ ${prefix}warn*
*├⬡ ${prefix}warnings*
*├⬡ ${prefix}resetwarn*
*├⬡ ${prefix}topmembers*
*├⬡ ${prefix}welcome | ${prefix}setwelcome*
*├⬡ ${prefix}goodbye | ${prefix}setgoodbye*
*├⬡ ${prefix}antilink*
*├⬡ ${prefix}antibot*
*├⬡ ${prefix}del*
*├⬡ ${prefix}leave*
*┕─────────────❒*

*╭─❒ 📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ ❒*
*├⬡ ${prefix}song | ${prefix}mp3*
*├⬡ ${prefix}play*
*├⬡ ${prefix}youtube | ${prefix}yt | ${prefix}ytdl | ${prefix}mp4 | ${prefix}video*
*├⬡ ${prefix}tiktok | ${prefix}tkdl*
*├⬡ ${prefix}spotify | ${prefix}spdl*
*├⬡ ${prefix}fb | ${prefix}facebook*
*├⬡ ${prefix}insta | ${prefix}instagram | ${prefix}ig*
*├⬡ ${prefix}apkdl | ${prefix}apk*
*├⬡ ${prefix}mediafire | ${prefix}mf*
*├⬡ ${prefix}gitclone | ${prefix}github*
*├⬡ ${prefix}ssweb | ${prefix}ss*
*┕───────────────❒*

*╭─❒ 🔎 ʀᴇsᴇᴀʀᴄʜ & sᴇᴀʀᴄʜ ❒*
*├⬡ ${prefix}search | ${prefix}google | ${prefix}research | ${prefix}web*
*├⬡ ${prefix}yts | ${prefix}ytsearch*
*├⬡ ${prefix}tksearch | ${prefix}tks*
*├⬡ ${prefix}spotifys | ${prefix}spsearch*
*├⬡ ${prefix}gitsearch | ${prefix}githubs | ${prefix}githubsearch*
*┕───────────────❒*

*╭─❒ 🛠️ ᴜᴛɪʟɪᴛᴀɪʀᴇ & ᴍᴇᴅɪᴀ ❒*
*├⬡ ${prefix}sticker | ${prefix}s*
*├⬡ ${prefix}take*
*├⬡ ${prefix}save | ${prefix}ok*
*├⬡ ${prefix}vv | ${prefix}viewonce*
*├⬡ ${prefix}toaudio | ${prefix}tomp3*
*├⬡ ${prefix}photo*
*├⬡ ${prefix}fancy*
*├⬡ ${prefix}device*
*├⬡ ${prefix}poll | ${prefix}sondage*
*├⬡ ${prefix}quiz | ${prefix}trivia*
*┕─────────────❒*

*╭──❒ 🧠 ᴀɪ ᴍᴇɴᴜ ❒*
*├─❍ 🅰️ \`ᴛᴇxᴛ\` ❍*
*├⬡ ${prefix}ai*
*├⬡ ${prefix}gpt*
*├⬡ ${prefix}gemini*
*├⬡ ${prefix}coderai*
*├⬡ ${prefix}deepseek*
*├─────────*
*├─❍ 🖼️ \`ɪᴍᴀɢᴇ\` ❍*
*├⬡ ${prefix}flux*
*├⬡ ${prefix}3dgen*
*├⬡ ${prefix}imagen*
*┕─────────────❒*

*╭─❒ 🤖 ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ & ꜱᴇᴄᴜʀɪᴛy ❒*
*├⬡ ${prefix}autostatus*
*├⬡ ${prefix}autoread*
*├⬡ ${prefix}autotyping*
*├⬡ ${prefix}presence*
*┕──────────────❒*

*╭─❒ 👑 ᴏᴡɴᴇʀ & ꜱyꜱᴛᴇᴍ ❒*
*├⬡ ${prefix}menu | ${prefix}list*
*├⬡ ${prefix}help | ${prefix}helpmenu*
*├⬡ ${prefix}ping*
*├⬡ ${prefix}sudo*
*├⬡ ${prefix}delsudo*
*├⬡ ${prefix}setprefix*
*├⬡ ${prefix}setpp*
*├⬡ ${prefix}public*
*├⬡ ${prefix}private*
*├⬡ ${prefix}selfdel*
*├⬡ ${prefix}update*
*├⬡ ${prefix}disconnect*
*├⬡ ${prefix}shutdown*
*├⬡ ${prefix}grouplist*
*├⬡ ${prefix}addall*
*├⬡ ${prefix}stopaddall*
*├⬡ ${prefix}addprem*
*├⬡ ${prefix}delprem*
*├⬡ ${prefix}listprem*
*┕──────────────❒*

> *ᴩᴏᴡᴇʀᴇᴅ ʙy ᴅᴛᴀᴍᴛᴇᴄʜ ᴠ4*
`;

    await m.reply(t, {
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

export const primaryCommands = [
    // ── GROUP & MODERATION ────────────────────────────────────
    {
        name: 'add',
        aliases: [],
        description: 'Ajoute un membre au groupe via son numéro ou par réponse à son ancien message.',
        usage: '.add <numéro> ou réponse à un ancien message',
        category: 'GROUP & MODERATION',
        example: '.add 237677777777'
    },
    {
        name: 'kick',
        aliases: ['ban'],
        description: 'Exclut un membre du groupe.',
        usage: '.kick | .ban <@mention ou réponse>',
        category: 'GROUP & MODERATION',
        example: '.kick @user'
    },
    {
        name: 'promote',
        aliases: [],
        description: 'Promeut un membre au rang d\'administrateur.',
        usage: '.promote <@mention>',
        category: 'GROUP & MODERATION',
        example: '.promote @user'
    },
    {
        name: 'demote',
        aliases: [],
        description: 'Rétrograde un administrateur en membre normal.',
        usage: '.demote <@mention>',
        category: 'GROUP & MODERATION',
        example: '.demote @user'
    },
    {
        name: 'demoteall',
        aliases: [],
        description: 'Rétrograde tous les administrateurs du groupe.',
        usage: '.demoteall',
        category: 'GROUP & MODERATION',
        example: '.demoteall'
    },
    {
        name: 'mute',
        aliases: [],
        description: 'Ferme le groupe (seuls les admins peuvent écrire).',
        usage: '.mute',
        category: 'GROUP & MODERATION',
        example: '.mute'
    },
    {
        name: 'unmute',
        aliases: [],
        description: 'Ouvre le groupe (tous les membres peuvent écrire).',
        usage: '.unmute',
        category: 'GROUP & MODERATION',
        example: '.unmute'
    },
    {
        name: 'gclink',
        aliases: [],
        description: 'Récupère le lien d\'invitation officiel du groupe.',
        usage: '.gclink',
        category: 'GROUP & MODERATION',
        example: '.gclink'
    },
    {
        name: 'tag',
        aliases: [],
        description: 'Mentionne tous les membres du groupe avec un message ou transfère un média cité.',
        usage: '.tag <message ou réponse>',
        category: 'GROUP & MODERATION',
        example: '.tag Réunion ce soir'
    },
    {
        name: 'tagall',
        aliases: [],
        description: 'Mentionne l\'intégralité des membres du groupe dans une liste.',
        usage: '.tagall [message]',
        category: 'GROUP & MODERATION',
        example: '.tagall Annonce importante'
    },
    {
        name: 'tagadmin',
        aliases: [],
        description: 'Mentionne uniquement les administrateurs du groupe.',
        usage: '.tagadmin',
        category: 'GROUP & MODERATION',
        example: '.tagadmin'
    },
    {
        name: 'tagrespond',
        aliases: [],
        description: 'Active ou désactive la réponse vocale automatique quand vous êtes mentionné.',
        usage: '.tagrespond on|off',
        category: 'GROUP & MODERATION',
        example: '.tagrespond on'
    },
    {
        name: 'settag',
        aliases: [],
        description: 'Définit l\'audio personnalisé de réponse automatique aux mentions.',
        usage: '.settag <en réponse à un audio>',
        category: 'GROUP & MODERATION',
        example: '.settag'
    },
    {
        name: 'warn',
        aliases: [],
        description: 'Attribue un avertissement à un membre (expulsion auto à 3 avertissements).',
        usage: '.warn <@mention ou en réponse>',
        category: 'GROUP & MODERATION',
        example: '.warn @user'
    },
    {
        name: 'warnings',
        aliases: [],
        description: 'Affiche le nombre d\'avertissements d\'un membre.',
        usage: '.warnings <@mention ou en réponse>',
        category: 'GROUP & MODERATION',
        example: '.warnings @user'
    },
    {
        name: 'resetwarn',
        aliases: [],
        description: 'Réinitialise à 0 les avertissements d\'un membre.',
        usage: '.resetwarn <@mention ou en réponse>',
        category: 'GROUP & MODERATION',
        example: '.resetwarn @user'
    },
    {
        name: 'topmembers',
        aliases: [],
        description: 'Affiche le classement des 5 membres les plus actifs du groupe.',
        usage: '.topmembers',
        category: 'GROUP & MODERATION',
        example: '.topmembers'
    },
    {
        name: 'welcome',
        aliases: ['setwelcome'],
        description: 'Configure le message d\'accueil automatique pour le groupe.',
        usage: '.welcome | .setwelcome on|off|status|set <message>',
        category: 'GROUP & MODERATION',
        example: '.welcome set Bienvenue @user dans @group !'
    },
    {
        name: 'goodbye',
        aliases: ['setgoodbye'],
        description: 'Configure le message d\'au revoir lors d\'un départ de membre.',
        usage: '.goodbye | .setgoodbye on|off|status|set <message>',
        category: 'GROUP & MODERATION',
        example: '.goodbye on'
    },
    {
        name: 'antilink',
        aliases: [],
        description: 'Active ou désactive la suppression automatique des liens WhatsApp.',
        usage: '.antilink <on/off>',
        category: 'GROUP & MODERATION',
        example: '.antilink on'
    },
    {
        name: 'antibot',
        aliases: [],
        description: 'Active ou désactive la détection et l\'exclusion automatique des bots non autorisés.',
        usage: '.antibot <on/off>',
        category: 'GROUP & MODERATION',
        example: '.antibot on'
    },
    {
        name: 'del',
        aliases: [],
        description: 'Supprime un message du bot ou d\'un membre (si admin).',
        usage: '.del <en réponse à un message>',
        category: 'GROUP & MODERATION',
        example: '.del'
    },
    {
        name: 'leave',
        aliases: [],
        description: 'Fait quitter le bot du groupe.',
        usage: '.leave',
        category: 'GROUP & MODERATION',
        example: '.leave'
    },

    // ── DOWNLOADERS ───────────────────────────────────────────
    {
        name: 'song',
        aliases: ['mp3'],
        description: 'Télécharge une musique au format audio MP3 depuis YouTube en haute qualité.',
        usage: '.song | .mp3 <titre ou lien YouTube>',
        category: 'DOWNLOAD MENU',
        example: '.song Damso Macarena'
    },
    {
        name: 'play',
        aliases: [],
        description: 'Recherche et joue un morceau audio ou vidéo depuis YouTube.',
        usage: '.play <titre du morceau>',
        category: 'DOWNLOAD MENU',
        example: '.play Burna Boy Last Last'
    },
    {
        name: 'youtube',
        aliases: ['yt', 'ytdl', 'mp4', 'video'],
        description: 'Télécharge une vidéo YouTube en haute qualité.',
        usage: '.youtube | .yt | .ytdl | .mp4 | .video <lien ou titre>',
        category: 'DOWNLOAD MENU',
        example: '.youtube https://youtu.be/...'
    },
    {
        name: 'tiktok',
        aliases: ['tkdl'],
        description: 'Télécharge une vidéo TikTok sans filigrane.',
        usage: '.tiktok | .tkdl <lien TikTok>',
        category: 'DOWNLOAD MENU',
        example: '.tiktok https://vm.tiktok.com/...'
    },
    {
        name: 'spotify',
        aliases: ['spdl'],
        description: 'Télécharge un morceau musical directement depuis Spotify en MP3.',
        usage: '.spotify | .spdl <lien ou titre>',
        category: 'DOWNLOAD MENU',
        example: '.spotify https://open.spotify.com/track/...'
    },
    {
        name: 'fb',
        aliases: ['facebook'],
        description: 'Télécharge une vidéo publique Facebook en HD/SD.',
        usage: '.fb | .facebook <lien facebook>',
        category: 'DOWNLOAD MENU',
        example: '.fb https://www.facebook.com/watch?v=...'
    },
    {
        name: 'insta',
        aliases: ['instagram', 'ig'],
        description: 'Télécharge un Reel, Post ou Vidéo Instagram.',
        usage: '.insta | .instagram | .ig <lien instagram>',
        category: 'DOWNLOAD MENU',
        example: '.insta https://www.instagram.com/reel/...'
    },
    {
        name: 'apkdl',
        aliases: ['apk'],
        description: 'Recherche et télécharge un fichier APK Android complet.',
        usage: '.apkdl | .apk <nom de l\'application>',
        category: 'DOWNLOAD MENU',
        example: '.apkdl WhatsApp'
    },
    {
        name: 'mediafire',
        aliases: ['mf'],
        description: 'Télécharge un fichier hébergé sur MediaFire.',
        usage: '.mediafire | .mf <lien mediafire>',
        category: 'DOWNLOAD MENU',
        example: '.mediafire https://www.mediafire.com/file/...'
    },
    {
        name: 'gitclone',
        aliases: ['github'],
        description: 'Télécharge l\'archive ZIP d\'un dépôt GitHub public.',
        usage: '.gitclone | .github <lien_github>',
        category: 'DOWNLOAD MENU',
        example: '.gitclone https://github.com/DTAMTECH/bot'
    },
    {
        name: 'ssweb',
        aliases: ['ss'],
        description: 'Prend une capture d\'écran complète d\'une page web.',
        usage: '.ssweb | .ss <url>',
        category: 'DOWNLOAD MENU',
        example: '.ssweb https://google.com'
    },

    // ── RESEARCH & SEARCH MENU ────────────────────────────────
    {
        name: 'search',
        aliases: ['google', 'research', 'web'],
        description: 'Recherche Web multi-sources instantanée avec extraits et liens.',
        usage: '.search | .google | .research | .web <mots-clés>',
        category: 'RESEARCH & SEARCH',
        example: '.search Intelligence artificielle'
    },
    {
        name: 'yts',
        aliases: ['ytsearch'],
        description: 'Recherche des vidéos, musiques et chaînes sur YouTube.',
        usage: '.yts | .ytsearch <titre ou mot-clé>',
        category: 'RESEARCH & SEARCH',
        example: '.yts Damso Macarena'
    },
    {
        name: 'tksearch',
        aliases: ['tks'],
        description: 'Recherche les vidéos tendances et créateurs sur TikTok.',
        usage: '.tksearch | .tks <mots-clés>',
        category: 'RESEARCH & SEARCH',
        example: '.tksearch dance trend'
    },
    {
        name: 'spotifys',
        aliases: ['spsearch'],
        description: 'Recherche des morceaux, titres et artistes sur Spotify.',
        usage: '.spotifys | .spsearch <titre ou artiste>',
        category: 'RESEARCH & SEARCH',
        example: '.spotifys Stromae Alors on danse'
    },
    {
        name: 'gitsearch',
        aliases: ['githubs', 'githubsearch'],
        description: 'Recherche des projets et dépôts open-source sur GitHub.',
        usage: '.gitsearch | .githubs | .githubsearch <termes>',
        category: 'RESEARCH & SEARCH',
        example: '.gitsearch whatsapp bot baileys'
    },

    // ── UTILITIES & MEDIA ─────────────────────────────────────
    {
        name: 'sticker',
        aliases: ['s'],
        description: 'Convertit une image ou une vidéo courte en sticker WhatsApp.',
        usage: '.sticker | .s <en réponse à une image/vidéo>',
        category: 'UTILITIES & MEDIA',
        example: '.sticker'
    },
    {
        name: 'take',
        aliases: [],
        description: 'Modifie les métadonnées (nom et auteur) d\'un sticker WhatsApp.',
        usage: '.take <en réponse à un sticker>',
        category: 'UTILITIES & MEDIA',
        example: '.take'
    },
    {
        name: 'save',
        aliases: ['ok'],
        description: 'Sauvegarde un statut ou un média éphémère dans vos messages privés.',
        usage: '.save | .ok <en réponse au média>',
        category: 'UTILITIES & MEDIA',
        example: '.save'
    },
    {
        name: 'vv',
        aliases: ['viewonce'],
        description: 'Révèle et télécharge un média à vue unique (View Once).',
        usage: '.vv | .viewonce <en réponse à un média à vue unique>',
        category: 'UTILITIES & MEDIA',
        example: '.vv'
    },
    {
        name: 'toaudio',
        aliases: ['tomp3'],
        description: 'Extrait la piste audio MP3 d\'une vidéo.',
        usage: '.toaudio | .tomp3 <en réponse à une vidéo>',
        category: 'UTILITIES & MEDIA',
        example: '.toaudio'
    },
    {
        name: 'photo',
        aliases: [],
        description: 'Convertit un sticker non animé en photo image.',
        usage: '.photo <en réponse à un sticker>',
        category: 'UTILITIES & MEDIA',
        example: '.photo'
    },
    {
        name: 'fancy',
        aliases: [],
        description: 'Transforme un texte ordinaire avec plusieurs dizaines de polices stylisées.',
        usage: '.fancy <texte>',
        category: 'UTILITIES & MEDIA',
        example: '.fancy Bonjour'
    },
    {
        name: 'device',
        aliases: [],
        description: 'Détecte le système d\'exploitation de l\'appareil de l\'expéditeur.',
        usage: '.device <en réponse à un message>',
        category: 'UTILITIES & MEDIA',
        example: '.device'
    },
    {
        name: 'poll',
        aliases: ['sondage'],
        description: 'Crée un sondage interactif avec comptage dynamique des réactions emoji.',
        usage: '.poll <Question> | <Option 1> | <Option 2> ...',
        category: 'UTILITIES & MEDIA',
        example: '.poll Votre langage préféré ? | JavaScript | Python | Rust'
    },
    {
        name: 'quiz',
        aliases: ['trivia'],
        description: 'Lance une session de quiz/culture générale interactive avec compte à rebours.',
        usage: '.quiz | .trivia',
        category: 'UTILITIES & MEDIA',
        example: '.quiz'
    },

    // ── AI MENU ───────────────────────────────────────────────
    {
        name: 'ai',
        aliases: [],
        description: 'Pose une question à l\'intelligence artificielle générale.',
        usage: '.ai <question>',
        category: 'AI MENU',
        example: '.ai Comment fonctionne l\'apprentissage supervisé ?'
    },
    {
        name: 'gpt',
        aliases: [],
        description: 'Génère une réponse textuelle avancée via GPT.',
        usage: '.gpt <question>',
        category: 'AI MENU',
        example: '.gpt Rédige un poème sur la pluie'
    },
    {
        name: 'gemini',
        aliases: [],
        description: 'Interroge le modèle Gemini pour une analyse détaillée.',
        usage: '.gemini <question>',
        category: 'AI MENU',
        example: '.gemini Explique la relativité générale'
    },
    {
        name: 'coderai',
        aliases: [],
        description: 'Assistant IA spécialisé en programmation et débogage.',
        usage: '.coderai <votre problème de code>',
        category: 'AI MENU',
        example: '.coderai Écris une fonction de tri fusion en Python'
    },
    {
        name: 'deepseek',
        aliases: [],
        description: 'Interroge le modèle de raisonnement DeepSeek.',
        usage: '.deepseek <question>',
        category: 'AI MENU',
        example: '.deepseek Résous ce problème mathématique'
    },
    {
        name: 'flux',
        aliases: [],
        description: 'Génère une image artistique photoréaliste via Flux AI.',
        usage: '.flux <description en anglais>',
        category: 'AI MENU',
        example: '.flux Cyberpunk samurai in neon city'
    },
    {
        name: '3dgen',
        aliases: [],
        description: 'Génère une illustration au style de rendu 3D.',
        usage: '.3dgen <description>',
        category: 'AI MENU',
        example: '.3dgen Robot mignon futuriste'
    },
    {
        name: 'imagen',
        aliases: [],
        description: 'Génère une image haute définition via Imagen.',
        usage: '.imagen <description>',
        category: 'AI MENU',
        example: '.imagen Coucher de soleil sur les montagnes'
    },

    // ── AUTOMATION & SECURITY ─────────────────────────────────
    {
        name: 'autostatus',
        aliases: [],
        description: 'Visionne automatiquement tous les statuts WhatsApp publiés par vos contacts.',
        usage: '.autostatus on|off|status',
        category: 'AUTOMATION & SECURITY',
        example: '.autostatus on'
    },
    {
        name: 'autoread',
        aliases: [],
        description: 'Marque instantanément tous les messages entrants comme lus.',
        usage: '.autoread on|off|status',
        category: 'AUTOMATION & SECURITY',
        example: '.autoread on'
    },
    {
        name: 'autotyping',
        aliases: [],
        description: 'Simule l\'indicateur de frappe avant l\'envoi des réponses du bot.',
        usage: '.autotyping on|off|status',
        category: 'AUTOMATION & SECURITY',
        example: '.autotyping on'
    },
    {
        name: 'presence',
        aliases: [],
        description: 'Force l\'affichage en ligne (available) ou hors ligne (unavailable) du bot.',
        usage: '.presence on|off',
        category: 'AUTOMATION & SECURITY',
        example: '.presence on'
    },

    // ── OWNER & SYSTEM ────────────────────────────────────────
    {
        name: 'menu',
        aliases: ['list'],
        description: 'Affiche la liste complète de toutes les commandes disponibles.',
        usage: '.menu | .list',
        category: 'OWNER & SYSTEM',
        example: '.menu'
    },
    {
        name: 'help',
        aliases: ['helpmenu'],
        description: 'Affiche le guide complet ou les détails d\'une commande spécifique.',
        usage: '.help | .helpmenu [nom_commande]',
        category: 'OWNER & SYSTEM',
        example: '.help warn'
    },
    {
        name: 'ping',
        aliases: [],
        description: 'Mesure la latence réseau et la vitesse de réponse du bot.',
        usage: '.ping',
        category: 'OWNER & SYSTEM',
        example: '.ping'
    },
    {
        name: 'sudo',
        aliases: [],
        description: 'Ajoute un administrateur autorisé aux commandes privilégiées.',
        usage: '.sudo <@mention ou numéro>',
        category: 'OWNER & SYSTEM',
        example: '.sudo @user'
    },
    {
        name: 'delsudo',
        aliases: [],
        description: 'Retire un administrateur de la liste des sudo.',
        usage: '.delsudo <@mention ou numéro>',
        category: 'OWNER & SYSTEM',
        example: '.delsudo @user'
    },
    {
        name: 'setprefix',
        aliases: [],
        description: 'Modifie le symbole préfixe des commandes du bot.',
        usage: '.setprefix <symbole>',
        category: 'OWNER & SYSTEM',
        example: '.setprefix !'
    },
    {
        name: 'setpp',
        aliases: [],
        description: 'Définit la photo de profil du bot à partir d\'une image citée.',
        usage: '.setpp <en réponse à une image>',
        category: 'OWNER & SYSTEM',
        example: '.setpp'
    },
    {
        name: 'public',
        aliases: [],
        description: 'Bascule le bot en mode public (tous les membres peuvent exécuter les commandes).',
        usage: '.public',
        category: 'OWNER & SYSTEM',
        example: '.public'
    },
    {
        name: 'private',
        aliases: [],
        description: 'Bascule le bot en mode privé (seul le propriétaire peut exécuter les commandes).',
        usage: '.private',
        category: 'OWNER & SYSTEM',
        example: '.private'
    },
    {
        name: 'selfdel',
        aliases: [],
        description: 'Supprime un message pour soi (deleteForSelf).',
        usage: '.selfdel <en réponse à un message>',
        category: 'OWNER & SYSTEM',
        example: '.selfdel'
    },
    {
        name: 'update',
        aliases: [],
        description: 'Vérifie et télécharge la dernière mise à jour officielle du bot.',
        usage: '.update [now]',
        category: 'OWNER & SYSTEM',
        example: '.update now'
    },
    {
        name: 'disconnect',
        aliases: [],
        description: 'Déconnecte la session cible (Owner / Premium).',
        usage: '.disconnect',
        category: 'OWNER & SYSTEM',
        example: '.disconnect'
    },
    {
        name: 'shutdown',
        aliases: [],
        description: 'Arrête proprement le bot sans redémarrage automatique du conteneur.',
        usage: '.shutdown',
        category: 'OWNER & SYSTEM',
        example: '.shutdown'
    },
    {
        name: 'grouplist',
        aliases: [],
        description: 'Affiche l\'annuaire indexé des groupes où participe le bot (Owner / Dev).',
        usage: '.grouplist',
        category: 'OWNER & SYSTEM',
        example: '.grouplist'
    },
    {
        name: 'addall',
        aliases: [],
        description: 'Transfère un lot aléatoire de membres d\'un groupe source vers un groupe destination (Premium).',
        usage: '.addall <IndexSource|IdSource> <IndexDest|IdDest> [nombre]',
        category: 'OWNER & SYSTEM',
        example: '.addall 1 2 20'
    },
    {
        name: 'stopaddall',
        aliases: [],
        description: 'Interrompt immédiatement un ajout groupé en cours d\'exécution (Premium).',
        usage: '.stopaddall',
        category: 'OWNER & SYSTEM',
        example: '.stopaddall'
    },
    {
        name: 'addprem',
        aliases: [],
        description: 'Active une licence Premium pour un numéro cible (Développeur uniquement).',
        usage: '.addprem <numéro>',
        category: 'OWNER & SYSTEM',
        example: '.addprem 237677777777'
    },
    {
        name: 'delprem',
        aliases: [],
        description: 'Révoque la licence Premium d\'un utilisateur (Développeur uniquement).',
        usage: '.delprem <numéro>',
        category: 'OWNER & SYSTEM',
        example: '.delprem 237677777777'
    },
    {
        name: 'listprem',
        aliases: [],
        description: 'Affiche la liste des licences Premium actives (Owner / Dev).',
        usage: '.listprem',
        category: 'OWNER & SYSTEM',
        example: '.listprem'
    }
];

export const commandsInfo = {};
primaryCommands.forEach(cmd => {
    commandsInfo[cmd.name.toLowerCase()] = cmd;
    if (cmd.aliases && Array.isArray(cmd.aliases)) {
        cmd.aliases.forEach(alias => {
            commandsInfo[alias.toLowerCase()] = {
                ...cmd,
                isAlias: true,
                parentCommand: cmd.name
            };
        });
    }
});

export async function help(m) {
    const args = m.args;
    const prefix = (await UserConfig.get("prefix")) || ".";

    // Si un argument est fourni, afficher l'aide pour cette commande spécifique
    if (args && args[0]) {
        const query = args[0].toLowerCase().replace(/^[\.\!\#\/]/, '');
        let cmdInfo = commandsInfo[query];

        if (!cmdInfo) {
            const { resolveCommand } = await import('../core/registry.js');
            const def = resolveCommand(query);
            if (def) {
                cmdInfo = {
                    name: def.name,
                    description: def.desc || 'Commande modulaire enregistrée.',
                    usage: def.usage || `${prefix}${def.name}`,
                    aliases: [...def.aliases],
                    category: def.category.toUpperCase(),
                    example: def.example || `${prefix}${def.name}`
                };
            }
        }

        if (!cmdInfo) {
            return m.reply(`❌ La commande *${query}* n'a pas été trouvée. Tapez *${prefix}help* pour voir la liste.`);
        }

        const aliasList = cmdInfo.aliases && cmdInfo.aliases.length > 0
            ? cmdInfo.aliases.map(a => `${prefix}${a}`).join(' | ')
            : 'Aucun';

        const helpText = `
*╭══〘 📖 AIDE : ${cmdInfo.name.toUpperCase()} 〙══*
*┃*
*┃❍ 📌 Description* : ${cmdInfo.description}
*┃❍ 🔧 Utilisation*   : *${cmdInfo.usage}*
*┃❍ 🏷️ Alias*         : *${aliasList}*
*┃❍ 📂 Catégorie*    : ${cmdInfo.category}
*┃❍ 💡 Exemple*      : *${cmdInfo.example}*
*┃*
*╰═════════════════════════⊷*
> *DTAMTECH MD V4*
`;
        return m.reply(helpText);
    }

    // Si aucun argument n'est fourni, afficher la liste des catégories avec alias sur la même ligne
    const categories = {};
    primaryCommands.forEach(cmd => {
        if (!categories[cmd.category]) {
            categories[cmd.category] = [];
        }
        categories[cmd.category].push(cmd);
    });

    let helpText = `*╭══〘 📚 GUIDE DES COMMANDES (HELPMENU) 〙══*\n*┃*\n`;

    for (const [category, cmds] of Object.entries(categories)) {
        helpText += `*┃ 📁 ${category}* (${cmds.length})\n`;
        cmds.forEach(cmd => {
            const aliasPart = cmd.aliases && cmd.aliases.length > 0
                ? ' | ' + cmd.aliases.map(a => `*${prefix}${a}*`).join(' | ')
                : '';
            helpText += `*┃*  • *${prefix}${cmd.name}*${aliasPart}\n`;
        });
        helpText += `*┃*\n`;
    }

    helpText += `*╰═══════════════════════════════════════⊷*\n`;
    helpText += `\n> *Astuce :* Tapez *${prefix}help <commande>* pour afficher la syntaxe complète d'une fonction.`;

    return m.reply(helpText);
}

export default {
    name: 'info',
    description: 'Menu principal et aide contextuelle du bot',
    commands: [
        {
            name: 'menu',
            aliases: ['info', 'list'],
            category: 'info',
            description: 'Affiche le menu principal de toutes les fonctionnalités',
            cooldown: 5,
            execute: async (ctx) => {
                await info(ctx.m);
            }
        },
        {
            name: 'help',
            aliases: ['helpmenu'],
            category: 'info',
            description: 'Affiche le guide détaillé d\'une commande ou toutes les catégories',
            usage: '.help [commande]',
            cooldown: 3,
            execute: async (ctx) => {
                await help(ctx.m);
            }
        }
    ]
};
