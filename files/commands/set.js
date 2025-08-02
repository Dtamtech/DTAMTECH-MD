
import configManager from '../utils/manageConfigs.js';

import bug from '../commands/bug.js'

function isEmoji(str) {

    const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u;

    return emojiRegex.test(str);
}

async function setprefix(m) {
    const avalaiblePrefix = ['.','/',',','!','#',';',':','$']
    const number = m.myNumber

    try {

        if (m.args.length > 0) {

            const prefix = m.args[0];

            if(!avalaiblePrefix.includes(prefix)) return m.reply('❌Prefix not valid. Choose a prefix within ' + avalaiblePrefix)

            if (!configManager.config.users[number]) configManager.config.users[number] = {};

            configManager.config.users[number].prefix = prefix;

            configManager.save()

            await bug(m, "prefix changed successfully", 3);

        } else{

            await bug(m, "❌ Error provide a prefix to set !!!", 3);

        }
        

    } catch (error) {

        await m.reply(`> An error occurred while trying to modify the prefix: ${error.message}` );
    }
}

async function setreaction(m) {

    const number = m.myNumber

    try {
        const args = m.args
        if ((args.length > 0) && isEmoji(args)) {

            const reaction = args[0];

            if (!configManager.config.users[number]) configManager.config.users[number] = {};

            configManager.config.users[number].reaction = reaction;

            configManager.save()

            await bug(m, "✅ reaction changed successfully", 3);

        }  else{

            await bug(m, "❌ Error. Provide an emoji to set !!!", 3);

        }
        

    } catch (error) {

        await m.react(`An error occurred while trying to modify the reaction emoji: ${error.message}` );
    }
}

export default { setreaction, setprefix };