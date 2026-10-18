import UserConfig from '../config/config.js';
import { formatErrorMessage } from '../utils/errorHelper.js';

export async function setPrefix(m) {
    const availablePrefix = ['.', '/', ',', '!', '#', ';', ':', '$'];
    try {
        if (m.args && m.args.length > 0) {
            const prefix = m.args[0];
            if (!availablePrefix.includes(prefix)) {
                return await m.reply('> ❌ Préfixe invalide (' + availablePrefix.join(' ') + ')');
            }
            await UserConfig.set("prefix", prefix);
            await m.modify("prefix changed successfully to " + prefix);
        } else {
            await m.reply("❌ Error provide a prefix to set !");
        }
    } catch (error) {
        await m.reply(formatErrorMessage(error, 'Modification préfixe'));
    }
}

export async function setWelcome(m) {
    try {
        const welcomeMsg = m.textMessage || m.quoted?.textMessage || (m.args ? m.args.join(' ') : '');
        if (!welcomeMsg) return await m.reply("> ❌ Message de bienvenue requis.");
        m.client?.store?.setCustomMessage?.(m.chat, "group.add", welcomeMsg);
        m.client?.store?.setGroupSetting?.(m.chat, "welcome", { enabled: true });
        await m.modify("> *✅ Welcome message has been successfully set as :*\n" + welcomeMsg);
    } catch (error) {
        await m.reply(formatErrorMessage(error, 'Définition bienvenue'));
    }
}

export async function delWelcome(m) {
    try {
        if (m.client?.store?.getCustomMessage?.(m.chat, "group.add")) {
            m.client.store.deleteCustomMessage(m.chat, "group.add");
            await m.modify("> *✅ Welcome message has been successfully removed*");
        } else {
            await m.reply("> ❌ Aucun message de bienvenue défini.");
        }
    } catch (error) {
        await m.reply(formatErrorMessage(error, 'Suppression bienvenue'));
    }
}

export default {
    name: 'settings',
    description: 'Paramètres du bot (préfixe, messages personnalisés)',
    setPrefix,
    setWelcome,
    delWelcome,
    commands: [
        {
            name: 'setprefix',
            category: 'owner',
            description: 'Modifie le symbole préfixe des commandes',
            usage: '.setprefix <symbole>',
            ownerOnly: true,
            execute: async ({ m }) => {
                await setPrefix(m);
            }
        },
        {
            name: 'setwelcome',
            category: 'admin',
            description: 'Définit un message de bienvenue personnalisé pour le groupe',
            usage: '.setwelcome <texte>',
            groupOnly: true,
            adminOnly: true,
            execute: async ({ m }) => {
                await setWelcome(m);
            }
        },
        {
            name: 'delwelcome',
            category: 'admin',
            description: 'Supprime le message de bienvenue personnalisé du groupe',
            usage: '.delwelcome',
            groupOnly: true,
            adminOnly: true,
            execute: async ({ m }) => {
                await delWelcome(m);
            }
        }
    ]
};
