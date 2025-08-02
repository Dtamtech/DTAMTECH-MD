
import configManager from '../utils/manageConfigs.js';

import bug from '../commands/bug.js'


export async function autoreact(m) {

    const number = m.myNumber

    try {

        if (m.args.length === 0) return await m.reply("Please provide 'on', 'off'.")

        const input = m.args[0].toLowerCase();

        if (!configManager.config.users[number]) {

            configManager.config.users[number] = {};
        }

        const userConfig = configManager.config.users[number];

        if (input === 'on') {

            userConfig.autoreact = true;

            configManager.save();

            await bug(m,`Auto-react has been turned *${input.toUpperCase()}*.`);
        
        } else if (input === "off"){

             userConfig.autoreact = false;

            configManager.save();

            await bug(m,`Auto-react has been turned *${input.toUpperCase()}*.`);

        } else{

            await m.reply("_*Select an option: On/off*_" );
        }

    } catch (error) {

        await m.reply(`❌ Error while updating autoreact settings: ${error.message}`);
    }
}

export default { autoreact };