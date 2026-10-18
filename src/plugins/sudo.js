import UserConfig from '../config/config.js';

export async function addSudo(m) {
    if (!m.isQuoted) return await m.reply("> ❌ Répondez à un message.");
    let target = m.quoted.sender;
    const tag = "@" + target.split('@')[0].trim();
    const list = (await UserConfig.get("sudoList")) || [];
    if (!list.includes(target)) {
        await UserConfig.pushToList("sudoList", target);
        await m.modify({ text: `✅ *${tag} is now a sudo user*`, mentions: [target] });
    } else {
        await m.modify({ text: `⚠️ *${tag} is already a sudo user*`, mentions: [target] });
    }
}

export async function delSudo(m) {
    if (!m.isQuoted) return await m.reply("> ❌ Répondez à un message.");
    let target = m.quoted.sender;
    const tag = "@" + target.split('@')[0].trim();
    const list = (await UserConfig.get("sudoList")) || [];
    if (list.includes(target)) {
        await UserConfig.removeFromListByValue("sudoList", target);
        await m.modify({ text: `✅ *${tag} is no longer a sudo user*`, mentions: [target] });
    } else {
        await m.modify({ text: `⚠️ *${tag} was not a sudo user*`, mentions: [target] });
    }
}

export default {
    name: 'sudo',
    description: 'Gestion des utilisateurs sudo (accès privilégié)',
    addSudo,
    delSudo,
    commands: [
        {
            name: 'sudo',
            aliases: ['addsudo'],
            category: 'owner',
            description: 'Ajoute un utilisateur à la liste des utilisateurs privilégiés (sudo)',
            usage: '.sudo (en répondant à un message)',
            ownerOnly: true,
            execute: async ({ m }) => {
                await addSudo(m);
            }
        },
        {
            name: 'delsudo',
            category: 'owner',
            description: 'Retire un utilisateur de la liste des utilisateurs privilégiés (sudo)',
            usage: '.delsudo (en répondant à un message)',
            ownerOnly: true,
            execute: async ({ m }) => {
                await delSudo(m);
            }
        }
    ]
};
