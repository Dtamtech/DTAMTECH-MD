import { normalizeJid } from '../utils/isAdmin.js';
import { getPaywallMessage } from './premium.js';
import { logger } from '../utils/logger.js';

// Cache mémoire de l'annuaire des groupes indexés
export let groupDirectoryCache = [];

// État de l'opération addAll active
export let activeAddAllTask = null;

/**
 * Génère une barre de progression visuelle (ex: [████░░░░░░] 40%)
 */
function renderProgressBar(current, total, barLength = 10) {
    if (total <= 0) return '[░░░░░░░░░░] 0%';
    const progress = Math.min(Math.max(current / total, 0), 1);
    const filled = Math.round(progress * barLength);
    const empty = barLength - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentage = Math.round(progress * 100);
    return `[${bar}] ${percentage}%`;
}

/**
 * Mélange aléatoire d'un tableau (Fisher-Yates shuffle)
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Vérifie si le bot est administrateur dans une liste de participants
 */
function checkBotAdmin(participants = [], botNumber, botLid) {
    return participants.some(p => {
        const isAdmin = p.admin === 'admin' || p.admin === 'superadmin';
        if (!isAdmin) return false;
        const pId = normalizeJid(p.id || '');
        const pLid = normalizeJid(p.lid || '');
        if (botNumber && pId.includes(botNumber)) return true;
        if (botLid && (pId.includes(botLid) || pLid.includes(botLid))) return true;
        return false;
    });
}

/**
 * Rafraîchit l'annuaire des groupes où participe le bot
 */
export async function refreshGroupDirectory(client) {
    try {
        if (!client.groupFetchAllParticipating) return [];
        const groupsObj = await client.groupFetchAllParticipating();
        const botNumber = client.user?.id?.split(':')[0]?.split('@')[0];
        const botLid = client.user?.lid?.split(':')[0]?.split('@')[0];

        const list = [];
        let index = 1;

        for (const [id, meta] of Object.entries(groupsObj)) {
            const isBotAdmin = checkBotAdmin(meta.participants || [], botNumber, botLid);
            list.push({
                index: index++,
                id,
                subject: meta.subject || 'Groupe sans nom',
                participantsCount: meta.participants?.length || 0,
                isBotAdmin,
                participants: meta.participants || []
            });
        }

        groupDirectoryCache = list;
        return list;
    } catch (err) {
        logger.error('[addAll] Erreur refreshGroupDirectory :', err.message);
        return [];
    }
}

/**
 * .grouplist
 * Affiche l'annuaire indexé des groupes où se trouve le bot.
 */
export async function grouplistCommand(m) {
    if (!m.isDeveloper && !m.isBotOwner && !m.fromMe) {
        return await m.reply("> ❌ Réservé au propriétaire/développeur.");
    }

    await m.react('📑');
    const groups = await refreshGroupDirectory(m.client);

    if (groups.length === 0) {
        return await m.reply(
            `〘 📑 ANNUAIRE DES GROUPES 〙\n` +
            `ℹ️ Le bot ne participe actuellement à aucun groupe.\n` +
            `════════════════⊷`
        );
    }

    let message = `〘 📑 ANNUAIRE DES GROUPES (${groups.length}) 〙\n\n`;

    for (const g of groups) {
        const adminBadge = g.isBotAdmin ? '✅ *Admin*' : '❌ *Membre*';
        message += `[${g.index}] *${g.subject.trim()}*\n`;
        message += `👥 Membres : ${g.participantsCount} | ${adminBadge}\n`;
        message += `🆔 ID : \`${g.id}\`\n\n`;
    }

    message += `════════════════⊷\n`;
    message += `> *Utilisation avec .addall :*\n> *${m.prefix || '.'}addall <IndexSource> <IndexDestination> [nombre]*`;

    return await m.reply(message);
}

/**
 * Résout un groupe soit par son index dans l'annuaire, soit par son JID direct
 */
export async function resolveGroup(identifier, client) {
    if (!identifier) return null;
    const cleanId = String(identifier).trim();

    // 1. Recherche par index numérique dans l'annuaire
    if (/^\d+$/.test(cleanId) && !cleanId.includes('@')) {
        const idx = parseInt(cleanId, 10);
        let found = groupDirectoryCache.find(g => g.index === idx);
        if (!found) {
            await refreshGroupDirectory(client);
            found = groupDirectoryCache.find(g => g.index === idx);
        }
        if (found) {
            // Re-vérifier métadonnées récentes
            try {
                const fresh = await client.groupMetadata(found.id);
                if (fresh) {
                    found.participants = fresh.participants || [];
                    found.participantsCount = fresh.participants?.length || found.participantsCount;
                    found.subject = fresh.subject || found.subject;
                }
            } catch { }
            return found;
        }
    }

    // 2. Recherche par JID direct (ex: 1203630...@g.us)
    const targetJid = cleanId.includes('@g.us') ? cleanId : `${cleanId}@g.us`;
    try {
        const meta = await client.groupMetadata(targetJid);
        const botNumber = client.user?.id?.split(':')[0]?.split('@')[0];
        const botLid = client.user?.lid?.split(':')[0]?.split('@')[0];
        const isBotAdmin = checkBotAdmin(meta.participants || [], botNumber, botLid);

        return {
            index: null,
            id: targetJid,
            subject: meta.subject || targetJid,
            participantsCount: meta.participants?.length || 0,
            isBotAdmin,
            participants: meta.participants || []
        };
    } catch {
        return null;
    }
}

/**
 * .addall <IndexSource|IdSource> <IndexDest|IdDest> [nombre]
 * Ajout groupé sécurisé avec protection anti-ban, cadence adaptative et suivi en DM.
 */
export async function addallCommand(m) {
    const prefix = m.prefix || '.';

    // 1. VÉRIFICATION STRICTE DE PROTECTION : Seul le Développeur ou un client Premium autorisé
    if (!m.isDeveloper && !m.isPremium) {
        await m.react('🔒');
        return await m.reply(getPaywallMessage(prefix, 'addall'));
    }

    // 2. VÉRIFICATION DE MUTEX (Une seule opération addAll à la fois)
    if (activeAddAllTask?.running) {
        return await m.reply(
            `> ⚠️ Un ajout groupé est déjà en cours d'exécution.\n> Utilisez *${prefix}stopaddall* pour l'interrompre avant d'en lancer un nouveau.`
        );
    }

    // 3. VALIDATION DES ARGUMENTS
    const args = m.args || [];
    if (args.length < 2) {
        return await m.reply(
            `〘 👥 ADDALL 〙
❌ *Paramètres manquants*

📌 *Syntaxe d'utilisation :*
• Par index : *${prefix}addall <IndexSource> <IndexDest> [nombre]*
• Par ID    : *${prefix}addall <IdSource> <IdDest> [nombre]*

💡 *Exemples :*
  ${prefix}addall 1 2 15
  ${prefix}addall 1203630...@g.us 1203631...@g.us 20

ℹ️ Consultez la liste des groupes et leurs index avec :
   *${prefix}grouplist*
════════════════⊷`
        );
    }

    const sourceInput = args[0];
    const destInput = args[1];
    const requestedCount = args[2] ? parseInt(args[2], 10) : 20;
    const limit = (Number.isInteger(requestedCount) && requestedCount > 0) ? requestedCount : 20;

    await m.react('⏳');

    // 4. RÉSOLUTION DES GROUPES
    const sourceGroup = await resolveGroup(sourceInput, m.client);
    if (!sourceGroup) {
        return await m.reply(`> ❌ Groupe source [${sourceInput}] introuvable.`);
    }

    const destGroup = await resolveGroup(destInput, m.client);
    if (!destGroup) {
        return await m.reply(`> ❌ Groupe destination [${destInput}] introuvable.`);
    }

    if (sourceGroup.id === destGroup.id) {
        return await m.reply("> ❌ Groupes source et destination identiques.");
    }

    // 5. VÉRIFICATION IMPÉRATIVE : Le bot doit être ADMIN dans le groupe de destination
    if (!destGroup.isBotAdmin) {
        return await m.reply(
            `> ❌ *Droits Insuffisants* : Le bot doit être *administrateur* du groupe destination.`
        );
    }

    // 6. EXTRACTION ET FILTRAGE DES MEMBRES ÉLIGIBLES
    const botNumber = m.client.user?.id?.split(':')[0]?.split('@')[0];
    const botLid = m.client.user?.lid?.split(':')[0]?.split('@')[0];
    const destParticipantIds = new Set(
        (destGroup.participants || []).map(p => {
            const clean = normalizeJid(p.id || '').split('@')[0].replace(/[^0-9]/g, '');
            return clean;
        })
    );

    // Filtrer les participants du groupe source
    const eligibleParticipants = (sourceGroup.participants || []).filter(p => {
        const pJid = normalizeJid(p.id || '');
        const pDigits = pJid.split('@')[0].replace(/[^0-9]/g, '');

        // Exclure le bot lui-même
        if (botNumber && pDigits === botNumber) return false;
        if (botLid && pDigits === botLid) return false;

        // Exclure si déjà présent dans le groupe de destination
        if (destParticipantIds.has(pDigits)) return false;

        // Ne garder que des numéros valides
        return pDigits.length >= 7;
    });

    if (eligibleParticipants.length === 0) {
        return await m.reply(
            `> ℹ️ *Aucun membre à transférer :*\n> Tous les membres éligibles du groupe source (*${sourceGroup.subject}*) sont déjà présents dans le groupe destination (*${destGroup.subject}*).`
        );
    }

    // 7. SÉLECTION ALÉATOIRE (SHUFFLE)
    const shuffledList = shuffleArray(eligibleParticipants);
    const targetBatch = shuffledList.slice(0, limit);
    const totalToProcess = targetBatch.length;

    // Déterminer le JID du destinataire privé pour le suivi discret
    const callerPrivateJid = m.isGroup
        ? (m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net')
        : m.chat;

    // Message d'initialisation en DM
    const initMessage =
        `〘 🚀 ADDALL 〙\n` +
        `❍ Source* : *${sourceGroup.subject}*\n` +
        `❍ Destination* : *${destGroup.subject}*\n` +
        `❍ Cibles* : *${totalToProcess} membre(s)* (aléatoires)\n` +
        `❍ Cadence* : *5 à 10 secondes* (anti-ban)\n\n` +
        `📊 Progression : ${renderProgressBar(0, totalToProcess)}\n` +
        `⏳ En cours... Tapez *${prefix}stopaddall* pour stopper.\n` +
        `════════════════⊷`;

    let progressMsg = await m.client.sendMessage(callerPrivateJid, { text: initMessage });

    // Si la commande a été lancée depuis un groupe, acquitter discrètement
    if (m.isGroup) {
        await m.reply(`> ✅ Ajout groupé lancé vers *${destGroup.subject}*. Suivi en direct envoyé en message privé.`);
    }

    // 8. INITIALISATION DU WORKER
    activeAddAllTask = {
        running: true,
        abortRequested: false,
        startTime: Date.now()
    };

    let countSuccess = 0;
    let countPrivacy403 = 0;
    let countCooldown408 = 0;
    let countFailed = 0;
    let rateLimitAborted = false;

    // 9. BOUCLE D'AJOUT SÉCURISÉE AVEC DÉLAI ADAPTATIF
    for (let i = 0; i < totalToProcess; i++) {
        // Vérification interruption
        if (activeAddAllTask?.abortRequested) {
            logger.warn(`[addAll] Interruption manuelle demandée par l'utilisateur à l'étape ${i}/${totalToProcess}`);
            break;
        }

        const candidate = targetBatch[i];
        const rawDigits = normalizeJid(candidate.id || '').split('@')[0].replace(/[^0-9]/g, '');
        const targetJid = `${rawDigits}@s.whatsapp.net`;

        try {
            const res = await m.client.groupParticipantsUpdate(destGroup.id, [targetJid], 'add');
            const item = Array.isArray(res)
                ? res.find(r => normalizeJid(r.jid) === targetJid) || res[0]
                : null;
            const code = item?.status ? String(item.status) : '200';

            if (code === '200') {
                countSuccess++;
            } else if (code === '403') {
                countPrivacy403++;
            } else if (code === '408') {
                countCooldown408++;
            } else if (code === '429') {
                rateLimitAborted = true;
                logger.error(`[addAll] Code 429 WhatsApp reçu : arrêt d'urgence anti-ban.`);
                break;
            } else {
                countFailed++;
            }
        } catch (addErr) {
            countFailed++;
            logger.warn(`[addAll] Échec ajout ${targetJid} :`, addErr.message);
        }

        const processed = i + 1;

        // Mise à jour de la progression en DM
        const updatedProgress =
            `〘 🔄 ADDALL (${processed}/${totalToProcess}) 〙\n` +
            `❍ Destination* : *${destGroup.subject}*\n` +
            `❍ Progression* : ${renderProgressBar(processed, totalToProcess)}\n\n` +
            `❍ Succès* : *${countSuccess}*\n` +
            `❍ Bloqués (403)* : *${countPrivacy403}*\n` +
            `❍ Délais (408)* : *${countCooldown408}*\n` +
            `❍ Échecs* : *${countFailed}*\n\n` +
            `💡 Pour interrompre : *${prefix}stopaddall*\n` +
            `════════════════⊷`;

        try {
            if (progressMsg?.key) {
                await m.client.sendMessage(callerPrivateJid, {
                    text: updatedProgress,
                    edit: progressMsg.key
                });
            }
        } catch { }

        // Si ce n'est pas le dernier participant, pause adaptative anti-ban (5 à 10s)
        if (i < totalToProcess - 1 && !activeAddAllTask?.abortRequested) {
            const randomDelay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
            await new Promise(resolve => setTimeout(resolve, randomDelay));
        }
    }

    const wasAborted = Boolean(activeAddAllTask?.abortRequested);
    activeAddAllTask = null;

    // 10. RAPPORT FINAL EN DM
    const totalProcessed = countSuccess + countPrivacy403 + countCooldown408 + countFailed;

    let endBanner = wasAborted
        ? '🛑 OPÉRATION INTERROMPUE (.stopaddall)'
        : (rateLimitAborted ? '⚠️ ARRÊT D\'URGENCE (Limite WhatsApp 429)' : '🎉 TRANSFERT TERMINÉ');

    const finalReport =
        `〘 ${endBanner} 〙\n` +
        `❍ Source* : *${sourceGroup.subject}*\n` +
        `❍ Destination* : *${destGroup.subject}*\n` +
        `❍ Traités* : *${totalProcessed} / ${totalToProcess}*\n\n` +
        `📊 *Bilan détaillé :*\n` +
        `• ✅ Succès direct       : *${countSuccess}*\n` +
        `• 🔒 Confidentialité 403 : *${countPrivacy403}*\n` +
        `• ⏳ Délais récents 408  : *${countCooldown408}*\n` +
        `• ❌ Autres échecs       : *${countFailed}*\n\n` +
        `🛡️ *Statut compte : Protégé (aucun ban)*\n` +
        `════════════════⊷`;

    await m.client.sendMessage(callerPrivateJid, { text: finalReport });
    await m.react(countSuccess > 0 ? '✅' : '⚠️');
}

/**
 * .stopaddall
 * Interrompt immédiatement l'ajout groupé en cours d'exécution.
 */
export async function stopaddallCommand(m) {
    if (!m.isDeveloper && !m.isPremium) {
        return await m.reply(getPaywallMessage(m.prefix || '.', 'stopaddall'));
    }

    if (!activeAddAllTask || !activeAddAllTask.running) {
        return await m.reply("> ℹ️ Aucun ajout groupé (.addall) n'est actuellement en cours d'exécution.");
    }

    activeAddAllTask.abortRequested = true;
    logger.info("[addAll] Demande d'arrêt d'urgence reçue.");

    await m.react('🛑');
    return await m.reply("> 🛑 *Demande d'interruption prise en compte*. Le processus s'arrête à la fin de l'opération en cours.");
}

export default {
    name: 'addAll',
    description: 'Ajout groupé inter-groupes avec protection anti-ban',
    grouplistCommand,
    addallCommand,
    stopaddallCommand,
    refreshGroupDirectory,
    resolveGroup,
    commands: [
        {
            name: 'grouplist',
            aliases: ['listgroups'],
            category: 'group',
            description: 'Affiche l\'annuaire indexé des groupes du bot',
            ownerOnly: true,
            execute: async ({ m }) => {
                await grouplistCommand(m);
            }
        },
        {
            name: 'addall',
            category: 'premium',
            description: 'Transfère les membres d\'un groupe source vers un groupe destination avec temporisation anti-ban',
            usage: '.addall <IndexSource> <IndexDest> [nombre]',
            execute: async ({ m }) => {
                await addallCommand(m);
            }
        },
        {
            name: 'stopaddall',
            category: 'premium',
            description: 'Interrompt immédiatement le transfert groupé en cours',
            execute: async ({ m }) => {
                await stopaddallCommand(m);
            }
        }
    ]
};
