/**
 * Plugin Grant — Gestion des permissions fines par commande et par utilisateur/groupe.
 * Permet d'autoriser des commandes spécifiques même si le bot est en mode privé (Private Mode).
 */
import dbStore from '../db/store.js';
import { resolveCommand } from '../core/registry.js';

export default [
    {
        name: 'grant',
        aliases: ['allowcmd', 'perm'],
        desc: 'Autorise l\'usage de commandes spécifiques pour un utilisateur ou un groupe (Owner only)',
        category: 'owner',
        ownerOnly: true,
        usage: '.grant <cmd1,cmd2|all> [@user ou dans le chat]',
        async execute({ m, args }) {
            const rawCmds = args[0]?.trim();
            if (!rawCmds) {
                return await m.reply(
                    '❌ *Syntaxe incorrecte*\n\n' +
                    'Utilisez : `.grant <commande(s)|all> [@mention ou chat actuel]`\n' +
                    'Exemples :\n' +
                    '• `.grant ping,menu` (pour ce chat)\n' +
                    '• `.grant all @utilisateur` (pour un utilisateur spécifique)'
                );
            }

            // Déterminer la cible (mention, réponse ou chat actuel)
            let targetJid = m.mentionedJid?.[0] || (m.isQuoted ? m.quoted.sender : null);
            if (!targetJid) {
                targetJid = args[1]?.trim() || m.chat;
            }

            const requestedList = rawCmds.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
            const added = [];
            const notFound = [];
            const alreadyGranted = [];

            for (const cmd of requestedList) {
                if (cmd === 'all') {
                    dbStore.addGrant(targetJid, 'all');
                    added.push('all (toutes les commandes)');
                    continue;
                }

                const def = resolveCommand(cmd);
                if (!def) {
                    notFound.push(cmd);
                    continue;
                }

                if (dbStore.hasGrant(targetJid, targetJid, def.name)) {
                    alreadyGranted.push(def.name);
                    continue;
                }

                dbStore.addGrant(targetJid, def.name);
                added.push(def.name);
            }

            let report = `🔐 *ATTRIBUTION DE PERMISSIONS*\n> Cible : \`${targetJid.split('@')[0]}\`\n\n`;
            if (added.length > 0) report += `✅ *Autorisé(s) :* \`${added.join(', ')}\`\n`;
            if (alreadyGranted.length > 0) report += `ℹ️ *Déjà accordé(s) :* \`${alreadyGranted.join(', ')}\`\n`;
            if (notFound.length > 0) report += `⚠️ *Introuvable(s) dans le registre :* \`${notFound.join(', ')}\`\n`;

            return await m.reply(report);
        }
    },

    {
        name: 'grants',
        aliases: ['listgrants', 'perms'],
        desc: 'Affiche la liste des permissions fines accordées',
        category: 'owner',
        ownerOnly: true,
        usage: '.grants [@user ou chat]',
        async execute({ m, args }) {
            let targetJid = m.mentionedJid?.[0] || (m.isQuoted ? m.quoted.sender : null) || args[0]?.trim();

            if (targetJid) {
                const list = dbStore.getGrants(targetJid);
                if (list.length === 0) {
                    return await m.reply(`ℹ️ Aucune permission accordée à \`${targetJid.split('@')[0]}\`.`);
                }
                return await m.reply(
                    `📋 *PERMISSIONS POUR \`${targetJid.split('@')[0]}\` :*\n\n` +
                    list.map(g => `• \`${g.command}\``).join('\n')
                );
            }

            const all = dbStore.getAllGrants();
            if (all.length === 0) {
                return await m.reply('ℹ️ Aucune permission fine actuellement enregistrée.');
            }

            // Grouper par JID
            const grouped = {};
            for (const g of all) {
                if (!grouped[g.jid]) grouped[g.jid] = [];
                grouped[g.jid].push(g.command);
            }

            let text = `📋 *PERMISSIONS ACCORDÉES (TOTAL : ${all.length})*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            for (const [jid, cmds] of Object.entries(grouped)) {
                text += `👤 *\`${jid.split('@')[0]}\`* :\n> \`${cmds.join(', ')}\`\n\n`;
            }

            return await m.reply(text);
        }
    },

    {
        name: 'revoke',
        aliases: ['delgrant', 'revokegrant'],
        desc: 'Révoque une ou toutes les permissions accordées à un chat ou utilisateur',
        category: 'owner',
        ownerOnly: true,
        usage: '.revoke <cmd|all> [@user ou chat]',
        async execute({ m, args }) {
            const targetCmd = args[0]?.trim().toLowerCase();
            if (!targetCmd) {
                return await m.reply('❌ Précisez la commande à révoquer (ou `all`). Exemple : `.revoke ping`');
            }

            let targetJid = m.mentionedJid?.[0] || (m.isQuoted ? m.quoted.sender : null) || args[1]?.trim() || m.chat;

            if (targetCmd === 'all') {
                dbStore.clearGrants(targetJid);
                return await m.reply(`♻️ Toutes les permissions révoquées pour \`${targetJid.split('@')[0]}\`.`);
            }

            dbStore.removeGrant(targetJid, targetCmd);
            return await m.reply(`♻️ Permission \`${targetCmd}\` révoquée pour \`${targetJid.split('@')[0]}\`.`);
        }
    }
];
