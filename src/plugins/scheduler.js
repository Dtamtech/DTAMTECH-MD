/**
 * Plugin Scheduler — Commandes de programmation de messages, rappels et fermetures horaires.
 */
import { scheduleJob, cancelJob, listActiveJobs } from '../core/scheduler.js';
import { parseWhen } from '../utils/timeParse.js';
import { getVar } from '../config/vars.js';

function formatTimestamp(sec) {
    return new Date(sec * 1000).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: getVar('TZ', 'UTC')
    });
}

export default [
    {
        name: 'setschedule',
        aliases: ['schedule', 'planifier'],
        desc: 'Programme l\'envoi automatique d\'un message à une heure ou un délai précis',
        category: 'tools',
        usage: '.setschedule <in 10m|demain 9h|14:30> [message ou citation]',
        sudoOnly: true,
        async execute({ m, args }) {

            if (args.length === 0) {
                return await m.reply(
                    '❌ *Syntaxe incorrecte*\n\n' +
                    'Utilisez : `.setschedule <quand> <message>`\n' +
                    'Exemples :\n' +
                    '• `.setschedule in 10m Pensez à voter`\n' +
                    '• `.setschedule demain 9h Bonjour l\'équipe`\n' +
                    '• `.setschedule 14:30 Réunion dans 5 min`'
                );
            }

            let timeStr = args[0]?.trim();
            let msgTokens = args.slice(1);
            if (['in', 'dans'].includes(timeStr?.toLowerCase()) && args.length >= 2) {
                timeStr = `${args[0]} ${args[1]}`.trim();
                msgTokens = args.slice(2);
            }

            let text = msgTokens.join(' ').trim();
            if (!text && m.quoted) {
                text = m.quoted.body || m.quoted.text || '';
            }

            const parsed = parseWhen(timeStr, Date.now(), getVar('TZ', 'UTC'));

            if (parsed.error || !parsed.runAt) {
                return await m.reply(`❌ ${parsed.error || 'Date invalide'}`);
            }

            if (!text) {
                return await m.reply('❌ Veuillez indiquer le message à programmer ou répondre à un message.');
            }

            scheduleJob('message', {
                jid: m.chat,
                runAt: parsed.runAt,
                recurrence: parsed.recurrence,
                payload: { text },
                createdBy: m.sender
            });

            return await m.reply(
                `✅ *Message programmé avec succès*\n\n` +
                `🔹 *Destination* : \`${m.chat.split('@')[0]}\`\n` +
                `🔹 *Date prévue* : \`${formatTimestamp(parsed.runAt)}\`\n` +
                `🔹 *Récurrence* : \`${parsed.recurrence || 'Aucune (unique)'}\`\n` +
                `🔹 *Message* : _${text.length > 60 ? text.slice(0, 60) + '...' : text}_`
            );
        }
    },

    {
        name: 'getschedule',
        aliases: ['listschedule', 'jobs'],
        desc: 'Affiche la liste des tâches et messages programmés actifs',
        category: 'tools',
        usage: '.getschedule',
        async execute({ m, isOwner, isSudo }) {
            if (!isOwner && !isSudo) {
                return await m.reply('❌ Commande réservée à l\'administrateur.');
            }

            const jobs = listActiveJobs();
            if (jobs.length === 0) {
                return await m.reply('ℹ️ Aucune tâche actuellement programmée.');
            }

            let listTxt = `⏰ *TÂCHES PROGRAMMÉES ACTIVES (${jobs.length})*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            for (const j of jobs) {
                let p = {};
                try { p = JSON.parse(j.payload || '{}'); } catch { }
                listTxt += `🔹 *#${j.id}* [_${j.type}_] ➔ \`${formatTimestamp(j.runAt)}\`\n` +
                    `> Dest : \`${j.jid.split('@')[0]}\`\n` +
                    (j.recurrence ? `> Récurrence : \`${j.recurrence}\`\n` : '') +
                    `> Note : ${p.text ? (p.text.length > 40 ? p.text.slice(0, 40) + '...' : p.text) : 'Sans texte'}\n\n`;
            }

            listTxt += `_Pour annuler une tâche : .delschedule <id>_`;
            return await m.reply(listTxt);
        }
    },

    {
        name: 'delschedule',
        aliases: ['cancelschedule', 'deljob'],
        desc: 'Annule une tâche ou un message programmé par son identifiant',
        category: 'tools',
        usage: '.delschedule <id>',
        async execute({ m, args, isOwner, isSudo }) {
            if (!isOwner && !isSudo) {
                return await m.reply('❌ Commande réservée à l\'administrateur.');
            }

            const id = Number.parseInt(args[0], 10);
            if (!id || Number.isNaN(id)) {
                return await m.reply('❌ Numéro d\'identifiant de tâche manquant. Tapez `.getschedule` pour voir les IDs.');
            }

            cancelJob(id);
            return await m.reply(`♻️ La tâche *#${id}* a été annulée avec succès.`);
        }
    },

    {
        name: 'remind',
        aliases: ['rappel', 'remember'],
        desc: 'Définit un rappel automatique (ex: .remind in 10m Acheter du pain)',
        category: 'tools',
        usage: '.remind <délai|heure> <note>',
        async execute({ m, args }) {
            if (args.length < 2) {
                return await m.reply(
                    '❌ *Syntaxe incorrecte*\n\n' +
                    'Utilisez : `.remind <délai> <note>`\n' +
                    'Exemples :\n' +
                    '• `.remind in 15m Sortir le plat du four`\n' +
                    '• `.remind dans 2h Appeler le médecin`\n' +
                    '• `.remind demain 8h Réunion projet`'
                );
            }

            // Première partie : expression de temps
            let timeToken = args[0];
            let noteTokens = args.slice(1);

            // Cas "in 10m" ou "dans 2h" (2 tokens)
            if (['in', 'dans'].includes(timeToken.toLowerCase()) && args.length >= 3) {
                timeToken = `${args[0]} ${args[1]}`;
                noteTokens = args.slice(2);
            }

            const note = noteTokens.join(' ').trim();
            const parsed = parseWhen(timeToken, Date.now(), getVar('TZ', 'UTC'));

            if (parsed.error || !parsed.runAt) {
                return await m.reply(`❌ ${parsed.error || 'Délai non reconnu'}`);
            }

            scheduleJob('reminder', {
                jid: m.chat,
                runAt: parsed.runAt,
                recurrence: parsed.recurrence,
                payload: { text: note, sender: m.sender },
                createdBy: m.sender
            });

            return await m.reply(
                `⏰ *Rappel enregistré !*\n\n` +
                `Je vous le rappellerai le *${formatTimestamp(parsed.runAt)}* :\n` +
                `> _${note}_`
            );
        }
    },

    {
        name: 'amute',
        aliases: ['automute'],
        desc: 'Programme la fermeture automatique quotidienne du groupe à une heure donnée',
        category: 'group',
        groupOnly: true,
        adminOnly: true,
        botAdminRequired: true,
        usage: '.amute <HH:mm> [message]',
        async execute({ m, args }) {
            const time = args[0]?.trim();
            if (!time) {
                return await m.reply('❌ Veuillez spécifier l\'heure quotidienne. Exemple : `.amute 22:30 Le groupe ferme pour la nuit.`');
            }

            const parsed = parseWhen(time, Date.now(), getVar('TZ', 'UTC'));
            if (!parsed.runAt) {
                return await m.reply('❌ Format d\'heure invalide (utilisez HH:mm ou HHh, ex: 22:30, 23h).');
            }

            const note = args.slice(1).join(' ').trim() || '🔒 Fermeture automatique du groupe.';

            scheduleJob('group-mute', {
                jid: m.chat,
                runAt: parsed.runAt,
                recurrence: 'daily',
                payload: { text: note },
                createdBy: m.sender
            });

            return await m.reply(`✅ *Fermeture quotidienne programmée* chaque jour à *${time}* pour ce groupe.`);
        }
    },

    {
        name: 'aunmute',
        aliases: ['autounmute'],
        desc: 'Programme la réouverture automatique quotidienne du groupe',
        category: 'group',
        groupOnly: true,
        adminOnly: true,
        botAdminRequired: true,
        usage: '.aunmute <HH:mm> [message]',
        async execute({ m, args }) {
            const time = args[0]?.trim();
            if (!time) {
                return await m.reply('❌ Veuillez spécifier l\'heure quotidienne. Exemple : `.aunmute 07:00 Bonjour à tous !`');
            }

            const parsed = parseWhen(time, Date.now(), getVar('TZ', 'UTC'));
            if (!parsed.runAt) {
                return await m.reply('❌ Format d\'heure invalide (utilisez HH:mm ou HHh, ex: 07:00, 7h).');
            }

            const note = args.slice(1).join(' ').trim() || '🔓 Réouverture automatique du groupe.';

            scheduleJob('group-unmute', {
                jid: m.chat,
                runAt: parsed.runAt,
                recurrence: 'daily',
                payload: { text: note },
                createdBy: m.sender
            });

            return await m.reply(`✅ *Réouverture quotidienne programmée* chaque jour à *${time}* pour ce groupe.`);
        }
    }
];
