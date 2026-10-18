import UserConfig from '../config/config.js';
import { getVar } from '../config/vars.js';
import { normalizeJid } from '../utils/isAdmin.js';
import { logger } from '../utils/logger.js';
import { formatErrorMessage } from '../utils/errorHelper.js';

export function findParticipant(allParticipants = [], targetJid) {
    if (!targetJid || !Array.isArray(allParticipants)) return null;
    const normTarget = normalizeJid(targetJid);
    const targetDigits = normTarget.split('@')[0].replace(/[^0-9]/g, '');
    const isTargetLid = normTarget.endsWith('@lid');

    return allParticipants.find(p => {
        const pId = normalizeJid(p.id || '');
        const pLid = normalizeJid(p.lid || '');

        if (pId === normTarget || (pLid && pLid === normTarget)) return true;

        if (!isTargetLid && pId.endsWith('@s.whatsapp.net')) {
            const pDigits = pId.split('@')[0].replace(/[^0-9]/g, '');
            if (pDigits && targetDigits && pDigits === targetDigits) return true;
        }

        if (isTargetLid && pLid && pLid.endsWith('@lid')) {
            const pLidDigits = pLid.split('@')[0].replace(/[^0-9]/g, '');
            if (pLidDigits && targetDigits && pLidDigits === targetDigits) return true;
        }

        return false;
    }) || null;
}

export async function add(m) {
    try {
        const groupMetadata = (await m.metadata) || (await m.client.groupMetadata(m.chat));
        const allParticipants = groupMetadata?.participants || [];
        const groupSubject = (groupMetadata?.subject || 'Groupe').trim();

        let target = null;
        const rawArgs = m.args ? m.args.join(' ').trim() : '';
        const cleanDigits = rawArgs.replace(/[^0-9]/g, '');

        if (cleanDigits.length >= 7) {
            target = `${cleanDigits}@s.whatsapp.net`;
        } else if (m.isQuoted) {
            const contextInfo = m.message?.extendedTextMessage?.contextInfo
                || m.message?.imageMessage?.contextInfo
                || m.message?.videoMessage?.contextInfo
                || m.message?.contextInfo;
            const quotedSender = m.quoted?.sender
                || m.quoted?.participant
                || contextInfo?.participant;

            if (quotedSender) {
                target = normalizeJid(quotedSender);
            }
        }

        if (!target) {
            const cmdPrefix = m.prefix || '.';
            const cmdName = m.command || 'add';
            return await m.reply(
                `> ❌ *Paramètre manquant pour l'ajout :*\n` +
                `> • *Par son numéro :* ${cmdPrefix}${cmdName} 237677777777\n` +
                `> • *Par réponse a l'un des ancien messages de l'utilisateur*\n` +
                `════════════════⊷`
            );
        }

        const targetDigits = target.split('@')[0].replace(/[^0-9]/g, '');
        const targetTag = `@${targetDigits}`;

        const existingMember = findParticipant(allParticipants, target);
        if (existingMember) {
            const memberJid = normalizeJid(existingMember.id || target);
            return await m.reply(
                `> ℹ️ (${targetTag}) est déjà membre de ce groupe.`,
                { mentions: [memberJid] }
            );
        }

        const updateResult = await m.client.groupParticipantsUpdate(m.chat, [target], 'add');
        const resItem = Array.isArray(updateResult)
            ? updateResult.find(r => normalizeJid(r.jid) === target) || updateResult[0]
            : null;
        const statusCode = resItem?.status ? String(resItem.status) : '200';

        logger.info(`Action groupe : add sur ${targetTag} dans "${groupSubject}" (statut ${statusCode})`);

        async function getInviteLink() {
            try {
                const code = await m.client.groupInviteCode(m.chat);
                return code ? `https://chat.whatsapp.com/${code}` : null;
            } catch {
                return null;
            }
        }

        if (statusCode === '200') {
            const successMsg = `> ✅ ${targetTag} a été ajouté(e) avec succès au groupe *${groupSubject}*.\n════════════════⊷`;
            return await m.reply(successMsg, { mentions: [target] });
        } else if (statusCode === '403') {
            const link = await getInviteLink();
            let msg = `> ⚠️ Impossible d'ajouter ${targetTag} en raison de ses paramètres de confidentialité.`;
            if (link) msg += `\n>\n> 🔗 *Lien d'invitation au groupe :*\n> ${link}`;
            return await m.reply(msg, { mentions: [target] });
        } else if (statusCode === '408') {
            const link = await getInviteLink();
            let msg = `> ⚠️ Impossible d'ajouter ${targetTag}.`;
            if (link) msg += `\n>\n> 🔗 *Lien d'invitation au groupe :*\n> ${link}`;
            return await m.reply(msg, { mentions: [target] });
        } else if (statusCode === '409') {
            return await m.reply(`> ℹ️ ${targetTag} est déjà membre de ce groupe.`, { mentions: [target] });
        } else {
            return await m.reply(`> ⚠️ Impossible d'ajouter ${targetTag}.`);
        }

    } catch (error) {
        logger.error(`Erreur commande add dans ${m.chat} :`, error.message);
        return await m.reply(formatErrorMessage(error, 'Ajout de membre'));
    }
}

export async function handleGroupAction(m, action) {
    if (action === 'add') return await add(m);

    try {
        const groupMetadata = (await m.metadata) || (await m.client.groupMetadata(m.chat));
        const allParticipants = groupMetadata?.participants || [];
        const groupSubject = (groupMetadata?.subject || 'Groupe').trim();

        let target = null;
        const rawArgs = m.args ? m.args.join(' ').trim() : '';
        const cleanDigits = rawArgs.replace(/[^0-9]/g, '');

        if (m.isQuoted) {
            target = normalizeJid(m.quoted?.sender || m.quoted?.participant || m.message?.extendedTextMessage?.contextInfo?.participant);
        } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = normalizeJid(m.message.extendedTextMessage.contextInfo.mentionedJid[0]);
        } else if (cleanDigits.length >= 7) {
            target = `${cleanDigits}@s.whatsapp.net`;
        }

        if (!target) {
            return await m.reply(`> ❌ utilisateur requis (numéro, mention ou réponse).`);
        }

        const participant = findParticipant(allParticipants, target);
        if (!participant) {
            const targetTag = `@${target.split('@')[0].replace(/[^0-9]/g, '')}`;
            return await m.reply(`> ❌ ${targetTag} n'est pas dans ce groupe.`);
        }

        const targetJid = normalizeJid(participant.id || target);
        const targetTag = `@${targetJid.split('@')[0].replace(/[^0-9]/g, '')}`;

        await m.client.groupParticipantsUpdate(m.chat, [targetJid], action);
        logger.info(`Action groupe : ${action} sur ${targetTag} dans "${groupSubject}"`);

        const actionMessages = {
            remove: `〘 👥 GROUPE 〙\n❍ Group name* : *${groupSubject}*\n❍ Action* : 👋 *BAN/LEFT*\n❍ Message* : ${targetTag} n'est plus membre de ce groupe.\n════════════════⊷`,
            promote: `〘 👥 GROUPE 〙\n❍ Group name* : *${groupSubject}*\n❍ Action* : 🎖 *Promote*\n❍ Message* : ${targetTag} est maintenant administrateur de ce groupe.\n════════════════⊷`,
            demote: `〘 👥 GROUPE 〙\n❍ Group name* : *${groupSubject}*\n❍ Action* : 📉 *Demote*\n❍ Message* : ${targetTag} n'est plus administrateur de ce groupe.\n════════════════⊷`
        };

        await m.reply(actionMessages[action], { mentions: [targetJid] });
    } catch (error) {
        logger.error(`Erreur group action (${action}) :`, error.message);
        await m.reply(formatErrorMessage(error, `Action groupe (${action})`));
    }
}

export async function kick(m) { await handleGroupAction(m, 'remove'); }
export async function promote(m) { await handleGroupAction(m, 'promote'); }
export async function demote(m) { await handleGroupAction(m, 'demote'); }

export async function bye(m) {
    try {
        await m.modify("BYE!");
        await m.client.groupLeave(m.chat);
    } catch (error) {
        m.react("❌");
    }
}

export async function dall(m) {
    try {
        const { participants } = await m.metadata;
        const botNumber = m.myNumber;
        const admins = participants.filter(p => p.admin && p.id !== botNumber).map(p => p.id);
        if (admins.length > 0) {
            await m.client.groupParticipantsUpdate(m.chat, admins, 'demote');
            await m.react('✅');
        }
    } catch (error) {
        await m.reply(formatErrorMessage(error, 'Rétrogradation participants'));
    }
}

export async function mute(m) {
    try {
        await m.client.groupSettingUpdate(m.chat, 'announcement');
        await m.modify('The group has been muted.');
    } catch (error) {
        await m.modify(formatErrorMessage(error, 'Fermeture groupe'));
    }
}

export async function unmute(m) {
    try {
        await m.client.groupSettingUpdate(m.chat, 'not_announcement');
        await m.modify('The group has been unmuted.');
    } catch (error) {
        await m.modify(formatErrorMessage(error, 'Ouverture groupe'));
    }
}

export async function gclink(m) {
    if (m.isAdmin) {
        const code = await m.client.groupInviteCode(m.chat);
        const link = `https://chat.whatsapp.com/${code}`;
        try { m.client.store?.updateGroupLink?.(m.chat, link); } catch { }
        await m.modify(`Join and share \n\n${link}`);
    } else {
        await m.modify(`_You are not admin_`);
    }
}

export async function antibot(m) {
    const text = (m.textMessage || m.args?.join(' ') || '').toLowerCase();
    if (text.includes('on')) {
        await UserConfig.pushToList("antiBot", m.chat);
        await m.modify('✅ Antibot has been successfully turned on');
    } else if (text.includes('off')) {
        await UserConfig.removeFromListByValue("antiBot", m.chat);
        await m.modify('✅ Antibot has been successfully turned off');
    } else {
        await m.reply(`Usage : *${m.prefix || '.'}antibot on* ou *${m.prefix || '.'}antibot off*`);
    }
}

export async function antiBot(m) {
    const isGlobal = getVar('ANTI_BOT', 'false') === 'true';
    if ((isGlobal || await UserConfig.existsInList("antiBot", m.chat)) && m.isGroup) {
        if (m.isBaileys) {
            logger.warn(`🤖 Bot non autorisé détecté et supprimé : ${m.sender?.split('@')[0]}`);
            await m.reply(`@${m.sender} Bot are not authorized in this group !`, { contextInfo: { mentionedJid: [m.sender] } });
            await m.delete();
        }
    }
}

export default {
    name: 'groupAdmin',
    description: 'Administration et modération de groupe',
    commands: [
        {
            name: 'add',
            category: 'group',
            description: 'Ajoute un membre au groupe',
            usage: '.add <numéro> ou en répondant à un message',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await ctx.m.react("➕");
                await add(ctx.m);
            }
        },
        {
            name: 'kick',
            aliases: ['ban'],
            category: 'group',
            description: 'Expulse un membre du groupe',
            usage: '.kick [@membre ou réponse]',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await ctx.m.react("🦵🏾");
                await kick(ctx.m);
            }
        },
        {
            name: 'promote',
            category: 'group',
            description: 'Nomme un membre administrateur du groupe',
            usage: '.promote [@membre ou réponse]',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await ctx.m.react("👑");
                await promote(ctx.m);
            }
        },
        {
            name: 'demote',
            category: 'group',
            description: 'Rétrograde un administrateur en membre simple',
            usage: '.demote [@membre ou réponse]',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await ctx.m.react("📉");
                await demote(ctx.m);
            }
        },
        {
            name: 'demoteall',
            category: 'group',
            description: 'Rétrograde tous les administrateurs sauf le bot',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await ctx.m.react("👑");
                await dall(ctx.m);
            }
        },
        {
            name: 'mute',
            category: 'group',
            description: 'Ferme le groupe (seuls les admins peuvent écrire)',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await ctx.m.react("🔇");
                await mute(ctx.m);
            }
        },
        {
            name: 'unmute',
            category: 'group',
            description: 'Ouvre le groupe (tous les membres peuvent écrire)',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await ctx.m.react("🔊");
                await unmute(ctx.m);
            }
        },
        {
            name: 'gclink',
            category: 'group',
            description: 'Obtient le lien d\'invitation du groupe',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await gclink(ctx.m);
            }
        },
        {
            name: 'leave',
            category: 'group',
            description: 'Fait quitter le groupe au bot',
            groupOnly: true,
            ownerOnly: true,
            execute: async (ctx) => {
                await bye(ctx.m);
            }
        },
        {
            name: 'antibot',
            category: 'group',
            description: 'Active ou désactive l\'expulsion automatique des bots tiers',
            usage: '.antibot on|off',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                await antibot(ctx.m);
            }
        },
        {
            name: 'del',
            aliases: ['delete'],
            category: 'group',
            description: 'Supprime le message cité pour tout le monde',
            usage: '.del (en répondant à un message)',
            groupOnly: true,
            adminOnly: true,
            botAdminRequired: true,
            execute: async (ctx) => {
                if (!ctx.m.isQuoted) return await ctx.reply('> ❌ Répondez à un message à supprimer.');
                await ctx.m.react('🚮');
                try {
                    await ctx.m.quoted.delete();
                } catch {
                    await ctx.reply('> ❌ Impossible de supprimer ce message.');
                }
            }
        }
    ]
};
