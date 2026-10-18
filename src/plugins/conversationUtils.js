/**
 * Utilitaires de conversation : vérification de numéro WhatsApp (.ison)
 * et statistiques de messages dans le groupe (.msgs).
 */
import dbStore from '../db/store.js';

export default [
    {
        name: 'ison',
        aliases: ['onwa', 'checkwa'],
        desc: 'Vérifie si un numéro de téléphone est actif et enregistré sur WhatsApp',
        category: 'tools',
        usage: '.ison <numéro de téléphone>',
        async execute({ m, args, client }) {
            const raw = args.join(' ').replace(/[^\d]/g, '');
            if (!raw || raw.length < 7) {
                return await m.reply('❌ Numéro invalide. Spécifiez l\'indicatif complet (ex: `.ison 237650190573`).');
            }

            try {
                const results = await client.onWhatsApp(raw);
                const info = results?.[0];

                if (info && info.exists) {
                    return await m.reply(
                        `✅ *Numéro actif sur WhatsApp*\n\n` +
                        `🔹 *Numéro* : \`+${raw}\`\n` +
                        `🔹 *JID exact* : \`${info.jid}\``
                    );
                } else {
                    return await m.reply(`❌ Le numéro \`+${raw}\` n'est pas enregistré sur WhatsApp.`);
                }
            } catch (err) {
                return await m.reply(`❌ Erreur de vérification : ${err.message}`);
            }
        }
    },

    {
        name: 'msgs',
        aliases: ['msgcount', 'topmsgs'],
        desc: 'Affiche les statistiques des messages du groupe',
        category: 'group',
        groupOnly: true,
        usage: '.msgs',
        async execute({ m }) {
            try {
                const chat = dbStore.getChat(m.chat);
                const unread = chat?.unreadCount || 0;

                return await m.reply(
                    `📊 *STATISTIQUES DE MESSAGES*\n\n` +
                    `🔹 *Discussion* : ${chat?.name || m.chat}\n` +
                    `🔹 *Messages non lus archivés* : \`${unread}\`\n` +
                    `> Base SQLite active en mode WAL.`
                );
            } catch (err) {
                return await m.reply(`❌ Erreur : ${err.message}`);
            }
        }
    }
];
