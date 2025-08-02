import connectToWhatsApp from './files/auth/authHandler.js';
import handleIncomingMessage from './files/events/messageHandler.js';
import handleIncomingGroupUpdate from './files/events/groupUpdateHandler.js';
import chalk from "chalk";
console.log(chalk.blue.bold("\nSTARTING. . . ."));
(async () => {
    await connectToWhatsApp(handleIncomingMessage, handleIncomingGroupUpdate);
    process.on('uncaughtException',(err)=>{
        console.error(chalk.red.bold(err));
    });
})();

