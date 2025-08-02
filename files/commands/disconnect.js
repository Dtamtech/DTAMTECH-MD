
import fs from 'fs';

import path from 'path';

async function disconnect(m) {

    let targetNumber = m.args[0]
    // Handle reply to message
    if (m.isQuoted) targetNumber = m.quoted.sender.split('@')[0];

    if (!targetNumber) return await m.reply("> ❌ Please provide a number or reply to a message to connect.");

    targetNumber = targetNumber.replace('@s.whatsapp.net', '').trim();

    const sessionPath = path.join(`./files/sessions/${targetNumber}`);

    if (fs.existsSync(sessionPath)) {

        try {

            fs.rmdirSync(sessionPath, { recursive: true });

            await m.reply(`✅ Auth information for ${targetNumber} deleted successfully.`);

        } catch (error) {

            await m.reply(`❌ Error deleting auth info for ${targetNumber}:`, error);
        }

    } else {

        await m.reply(`❌ No auth information found for ${targetNumber}.`);
    }
}

export default disconnect;
