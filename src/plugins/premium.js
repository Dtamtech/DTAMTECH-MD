import UserConfig from '../config/config.js';
import { DEVELOPER_NUMBER } from '../utils/treatMessageContent.js';
import { logger } from '../utils/logger.js';

/**
 * Génère le message de paywall commercial affiché lors d'une tentative
 * d'accès à une commande Extra / Premium par un utilisateur non autorisé.
 *
 * @param {string} prefix - Préfixe actuel du bot (ex: '.')
 * @param {string} commandName - Nom de la commande demandée (ex: 'addall')
 * @returns {string} Message formaté avec lien WhatsApp direct vers le développeur
 */
export function getPaywallMessage(prefix = '.', commandName = 'addall') {
    return `〘 🔒 FONCTIONNALITÉ PREMIUM 〙
❌ *Licence Requise*

📌 La commande *${prefix}${commandName}* est une exclusivité
   réservée à la version *DTAMTECH MD PREMIUM*.

✨ *Ce que débloque la version Premium :*
• 👥 Ajout groupé sécurisé avec protection anti-ban (*${prefix}addall*)
• ⚡ Cadence adaptative (5 à 10s) & interruption (*${prefix}stopaddall*)
• 🔗 Déconnexion à distance avancée (*${prefix}disconnect*)
• 🚀 Accès prioritaire à toutes les futures commandes VIP
• 🛠️ Support direct et mises à jour garanties

💳 *Pour activer votre licence sur cette instance :*
Contactez directement le Développeur officiel :
👉 *WhatsApp* : https://wa.me/${DEVELOPER_NUMBER}
════════════════⊷`;
}

/**
 * .addprem <numéro ou réponse>
 * Commande strictement réservée au Développeur pour accorder une licence Premium.
 */
export async function addprem(m) {
    if (!m.isDeveloper) {
        return await m.reply("> ❌ *Accès Refusé* : Seul le Développeur principal peut accorder une licence Premium.");
    }

    let target = null;
    const rawNumber = m.args ? m.args.join('').replace(/[^0-9]/g, '') : '';

    if (rawNumber.length >= 7) {
        target = `${rawNumber}@s.whatsapp.net`;
    } else if (m.isQuoted) {
        target = m.quoted?.sender || m.quoted?.participant;
    }

    if (!target) {
        return await m.reply(`> ❌ Usage : *${m.prefix || '.'}addprem <numéro>*`);
    }

    const cleanNum = target.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    const cleanJid = `${cleanNum}@s.whatsapp.net`;
    const list = (await UserConfig.get("premiumList")) || [];

    const isAlreadyPrem = list.some(item => {
        const itemNum = item.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        return itemNum === cleanNum;
    });

    if (isAlreadyPrem) {
        return await m.reply(`> ⚠️ @${cleanNum} possède déjà une licence *Premium active*.`, {
            mentions: [cleanJid]
        });
    }

    await UserConfig.pushToList("premiumList", cleanJid);
    logger.success(`[Licence] Nouvel utilisateur Premium activé : ${cleanNum} par le Développeur`);

    const confirmationMsg =
        `〘 🌟 LICENCE PREMIUM 〙
✅ *Licence Premium Activée avec Succès !*

👤 Bénéficiaire : @${cleanNum}
👑 Validé par   : Développeur Officiel
🚀 Statut       : *ACTIF (VIP & Extras déverrouillés)*
════════════════⊷`;

    return await m.reply(confirmationMsg, { mentions: [cleanJid] });
}

/**
 * .delprem <numéro ou réponse>
 * Commande strictement réservée au Développeur pour révoquer une licence Premium.
 */
export async function delprem(m) {
    if (!m.isDeveloper) {
        return await m.reply("> ❌ *Accès Refusé* : Seul le Développeur principal peut révoquer une licence Premium.");
    }

    let target = null;
    const rawNumber = m.args ? m.args.join('').replace(/[^0-9]/g, '') : '';

    if (rawNumber.length >= 7) {
        target = `${rawNumber}@s.whatsapp.net`;
    } else if (m.isQuoted) {
        target = m.quoted?.sender || m.quoted?.participant;
    }

    if (!target) {
        return await m.reply(`> ❌ Usage : *${m.prefix || '.'}delprem <numéro>*`);
    }

    const cleanNum = target.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    const list = (await UserConfig.get("premiumList")) || [];

    const matchedEntry = list.find(item => {
        const itemNum = item.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        return itemNum === cleanNum;
    });

    if (!matchedEntry) {
        return await m.reply(`> ⚠️ @${cleanNum} ne figure pas dans la liste des utilisateurs Premium.`, {
            mentions: [`${cleanNum}@s.whatsapp.net`]
        });
    }

    await UserConfig.removeFromListByValue("premiumList", matchedEntry);
    logger.info(`[Licence] Licence Premium révoquée pour : ${cleanNum}`);

    return await m.reply(
        `> 🗑️ La licence *Premium* de @${cleanNum} a été révoquée.`,
        { mentions: [`${cleanNum}@s.whatsapp.net`] }
    );
}

/**
 * .listprem
 * Affiche la liste des licences Premium actives (accessible au Développeur et Bot Owner).
 */
export async function listprem(m) {
    if (!m.isDeveloper && !m.isBotOwner && !m.fromMe) {
        return await m.reply("> ❌ Réservé au propriétaire/développeur.");
    }

    const list = (await UserConfig.get("premiumList")) || [];

    if (list.length === 0) {
        return await m.reply(
            `〘 🌟 PREMIUM 〙
ℹ️ Aucune licence Premium n'est actuellement enregistrée.
════════════════⊷`
        );
    }

    let report = `〘 🌟 PREMIUM (${list.length}) 〙\n\n`;
    const mentions = [];

    list.forEach((item, index) => {
        const num = item.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        const jid = `${num}@s.whatsapp.net`;
        mentions.push(jid);
        report += `[${index + 1}] @${num}\n`;
    });

    report += `\n════════════════⊷`;

    return await m.reply(report, { mentions });
}

export default {
    name: 'premium',
    description: 'Gestion des licences DTAMTECH MD Premium',
    getPaywallMessage,
    addprem,
    delprem,
    listprem,
    commands: [
        {
            name: 'addprem',
            category: 'developer',
            description: 'Accorde une licence Premium (Développeur uniquement)',
            usage: '.addprem <numéro ou réponse>',
            developerOnly: true,
            execute: async ({ m }) => {
                await addprem(m);
            }
        },
        {
            name: 'delprem',
            category: 'developer',
            description: 'Révoque une licence Premium (Développeur uniquement)',
            usage: '.delprem <numéro ou réponse>',
            developerOnly: true,
            execute: async ({ m }) => {
                await delprem(m);
            }
        },
        {
            name: 'listprem',
            category: 'owner',
            description: 'Affiche la liste des licences Premium actives',
            ownerOnly: true,
            execute: async ({ m }) => {
                await listprem(m);
            }
        }
    ]
};
