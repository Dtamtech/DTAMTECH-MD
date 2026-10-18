import botBridge from '../web/services/botBridge.js';
import { logger } from '../utils/logger.js';
import UserConfig from '../config/config.js';

export default {
    name: 'admin',
    description: 'Commandes d\'administration du bot (restart, shutdown, pm2, modes, présence, update)',
    commands: [
        {
            name: 'restart',
            category: 'owner',
            description: 'Redémarre proprement le bot WhatsApp et ses services',
            ownerOnly: true,
            execute: async (ctx) => {
                await ctx.reply('🔄 *Redémarrage du bot en cours...*\n_Le service sera de nouveau opérationnel dans quelques instants._');
                logger.info(`[Admin] Redémarrage ordonné par ${ctx.sender}`);
                setTimeout(async () => {
                    await botBridge.restart('WhatsApp .restart command');
                }, 1000);
            }
        },
        {
            name: 'shutdown',
            category: 'owner',
            description: 'Arrête complètement le processus du bot',
            ownerOnly: true,
            execute: async (ctx) => {
                await ctx.reply('🛑 *Arrêt du bot...*\n_Le processus est en train de se terminer._');
                logger.info(`[Admin] Arrêt ordonné par ${ctx.sender}`);
                setTimeout(() => {
                    process.exit(0);
                }, 1000);
            }
        },
        {
            name: 'pm2',
            category: 'owner',
            description: 'Affiche ou gère le processus PM2',
            usage: '.pm2 <status|restart|logs>',
            ownerOnly: true,
            execute: async (ctx) => {
                const isUnderPm2 = process.env.pm_id !== undefined || process.env.PM2_HOME !== undefined;
                const action = (ctx.args[0] || 'status').toLowerCase();

                if (!isUnderPm2) {
                    return ctx.reply(
                        `⚠️ *Le bot ne tourne pas actuellement sous PM2.*\n\n` +
                        `• PID : \`${process.pid}\`\n` +
                        `• Uptime : \`${Math.floor(process.uptime())}s\`\n` +
                        `• Node : \`${process.version}\`\n\n` +
                        `_Pour lancer sous PM2 :_ \`pm2 start ecosystem.config.cjs\``
                    );
                }

                if (action === 'status') {
                    const mem = process.memoryUsage();
                    return ctx.reply(
                        `📊 *Statut PM2*\n\n` +
                        `• PM2 ID : \`${process.env.pm_id}\`\n` +
                        `• PID : \`${process.pid}\`\n` +
                        `• RSS : \`${Math.round(mem.rss / 1024 / 1024)} MB\`\n` +
                        `• Heap : \`${Math.round(mem.heapUsed / 1024 / 1024)} MB\`\n` +
                        `• Uptime : \`${Math.floor(process.uptime())}s\``
                    );
                }

                if (action === 'restart') {
                    await ctx.reply('🔄 *Redémarrage PM2 demandé...*');
                    setTimeout(() => {
                        process.exit(1); // PM2 redémarre automatiquement
                    }, 500);
                    return;
                }

                return ctx.reply(`Usage : \`.pm2 status\` ou \`.pm2 restart\``);
            }
        },
        {
            name: 'presence',
            category: 'owner',
            description: 'Bascule la présence en ligne ou hors ligne du bot',
            usage: '.presence on|off',
            ownerOnly: true,
            execute: async (ctx) => {
                const sub = ctx.args[0]?.toLowerCase();
                if (sub === 'on') {
                    await ctx.client.sendPresenceUpdate('available');
                    await ctx.m.react('✅');
                    await ctx.m.modify('✅ You are now permanently marked as *online* on Whatsapp.\n\n> Use the command  *.presence off*  to disable this function!');
                } else if (sub === 'off') {
                    await ctx.client.sendPresenceUpdate('unavailable');
                    await ctx.m.react('✅');
                    await ctx.m.modify('✅ Your bot is now marked as *offline* on Whatsapp');
                } else {
                    await ctx.m.react('❌');
                    await ctx.m.modify('⚠️ Incorrect command arguments.\n\n> Give one of *on* or *off* argument to enable/disable this function!');
                }
            }
        },
        {
            name: 'public',
            aliases: ['mode'],
            category: 'owner',
            description: 'Bascule le bot en mode public accessible à tous',
            ownerOnly: true,
            execute: async (ctx) => {
                await ctx.m.react('🕊');
                await UserConfig.set("private", false);
                await ctx.m.modify("🕊 Le bot est maintenant public.");
            }
        },
        {
            name: 'private',
            category: 'owner',
            description: 'Bascule le bot en mode privé réservé au propriétaire',
            ownerOnly: true,
            execute: async (ctx) => {
                await ctx.m.react('🔒');
                await UserConfig.set("private", true);
                await ctx.m.modify("🔒 Le bot est maintenant privé.");
            }
        },
        {
            name: 'selfdel',
            category: 'owner',
            description: 'Supprime un message uniquement pour le bot (deleteForSelf)',
            ownerOnly: true,
            execute: async (ctx) => {
                if (!ctx.m.isQuoted) return await ctx.reply('> ❌ Répondez à un message.');
                await ctx.m.react('🚮');
                try {
                    await ctx.m.quoted.deleteForSelf();
                    await ctx.m.react('✅');
                } catch {
                    await ctx.m.react('❌');
                }
            }
        },
        {
            name: 'update',
            category: 'owner',
            description: 'Recherche et installe les mises à jour du bot',
            ownerOnly: true,
            execute: async (ctx) => {
                const zipUrl = await UserConfig.get('updateZipUrl');
                const { updateCommand } = await import('../utils/updater.js');
                await updateCommand(ctx.client, ctx.m, zipUrl);
            }
        }
    ]
};
