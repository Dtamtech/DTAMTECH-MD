/**
 * Plugin de gestion des variables d'exécution (Runtime Vars).
 * Fournit les commandes d'administration pour inspecter et modifier
 * les configurations à chaud sans nécessiter de redémarrage.
 */
import { getVar, setVar, delVar, allVars } from '../config/vars.js';
import { getVarDefinition, maskSecret } from '../config/varSchema.js';

export default [
    {
        name: 'setvar',
        aliases: ['setv'],
        desc: 'Définit ou modifie une variable runtime (ex: .setvar PREFIX=!)',
        category: 'owner',
        usage: '.setvar CLE=valeur',
        ownerOnly: true,
        sensitive: true,
        async execute({ m, args }) {
            const rawInput = args.join(' ').trim();
            if (!rawInput) {
                return await m.reply(
                    '❌ *Syntaxe incorrecte*\n\n' +
                    'Utilisez : `.setvar CLE=valeur`\n' +
                    'Exemples :\n' +
                    '• `.setvar PREFIX=!`\n' +
                    '• `.setvar WARN_LIMIT=5`\n' +
                    '• `.setvar REJECT_CALL=true`\n' +
                    '• `.setvar BOT_LANG=en`\n\n' +
                    'Tapez `.allvar` pour voir toutes les variables disponibles.'
                );
            }

            const eqIdx = rawInput.indexOf('=');
            if (eqIdx === -1) {
                return await m.reply(
                    '❌ Format incorrect : séparateur `=` manquant.\n' +
                    'Exemple : `.setvar PREFIX=!`'
                );
            }

            const rawKey = rawInput.slice(0, eqIdx).trim();
            const rawVal = rawInput.slice(eqIdx + 1).trim();

            if (!rawKey) {
                return await m.reply('❌ Nom de variable manquant avant le `=`.');
            }

            const result = setVar(rawKey, rawVal);
            if (!result.ok) {
                return await m.reply(`❌ *Échec de validation :*\n${result.error}`);
            }

            const def = getVarDefinition(result.key);
            const displayVal = (def?.secret) ? maskSecret(result.value) : result.value;

            return await m.reply(
                `✅ *Variable mise à jour avec succès*\n\n` +
                `🔹 *Clé* : \`${result.key}\`\n` +
                `🔹 *Valeur* : \`${displayVal}\`\n` +
                `🔹 *Type* : _${def?.type || 'string'}_\n` +
                `> ${def?.description || ''}`
            );
        }
    },

    {
        name: 'getvar',
        aliases: ['getv'],
        desc: 'Affiche la valeur actuelle d\'une variable runtime',
        category: 'owner',
        usage: '.getvar CLE',
        ownerOnly: true,
        sensitive: true,
        async execute({ m, args }) {
            const rawKey = args[0]?.trim();
            if (!rawKey) {
                return await m.reply('❌ Veuillez spécifier la variable. Exemple : `.getvar PREFIX`');
            }

            const def = getVarDefinition(rawKey);
            if (!def) {
                return await m.reply(`❌ Variable inconnue : *${rawKey}*. Tapez \`.allvar\` pour voir les options.`);
            }

            const val = getVar(rawKey);
            const displayVal = (def.secret) ? maskSecret(val) : val;

            return await m.reply(
                `⚙️ *DÉTAIL VARIABLE*\n\n` +
                `🔹 *Clé* : \`${rawKey.toUpperCase()}\`\n` +
                `🔹 *Valeur actuelle* : \`${displayVal || '(vide)'}\`\n` +
                `🔹 *Valeur par défaut* : \`${def.default}\`\n` +
                `🔹 *Type* : _${def.type}_\n` +
                `> ${def.description}`
            );
        }
    },

    {
        name: 'delvar',
        aliases: ['delv', 'resetvar'],
        desc: 'Réinitialise une variable runtime à sa valeur par défaut',
        category: 'owner',
        usage: '.delvar CLE',
        ownerOnly: true,
        sensitive: true,
        async execute({ m, args }) {
            const rawKey = args[0]?.trim();
            if (!rawKey) {
                return await m.reply('❌ Veuillez spécifier la variable à réinitialiser. Exemple : `.delvar PREFIX`');
            }

            const result = delVar(rawKey);
            if (!result.ok) {
                return await m.reply(`❌ *Échec :* ${result.error}`);
            }

            return await m.reply(
                `♻️ *Variable réinitialisée*\n\n` +
                `🔹 *Clé* : \`${result.key}\`\n` +
                `🔹 *Nouvelle valeur (défaut)* : \`${result.value}\``
            );
        }
    },

    {
        name: 'allvar',
        aliases: ['allvars', 'getallvars'],
        desc: 'Affiche la liste complète de toutes les variables de configuration runtime',
        category: 'owner',
        ownerOnly: true,
        sensitive: true,
        async execute({ m }) {
            const vars = allVars({ maskSecrets: true });

            let header = `⚙️ *VARIABLES RUNTIME & CONFIGURATION*\n` +
                `_Total configuré : ${vars.length}_\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            const chunks = [];
            let currentChunk = header;

            for (const v of vars) {
                const item = `🔹 *\`${v.key}\`* = \`${v.value || '(vide)'}\`\n` +
                    `> _Type :_ ${v.type} | _Défaut :_ \`${v.defaultValue}\`${v.isSecret ? ' | 🔒 _Secret_' : ''}\n` +
                    `> ${v.description}\n\n`;

                if ((currentChunk + item).length > 3500) {
                    chunks.push(currentChunk);
                    currentChunk = item;
                } else {
                    currentChunk += item;
                }
            }

            if (currentChunk) {
                chunks.push(currentChunk);
            }

            for (let i = 0; i < chunks.length; i++) {
                const suffix = chunks.length > 1 ? `\n_Page ${i + 1}/${chunks.length}_` : '';
                await m.reply(chunks[i] + suffix);
            }
        }
    }
];
