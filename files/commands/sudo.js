export async function modifySudoList(m, list, action) {

    try {
        let targetNumber = m.args[0]
        // Handle reply to message
        if (m.isQuoted) targetNumber = m.quoted.sender.split('@')[0];

        if (!targetNumber) return await m.reply("> ❌ Please provide a number or reply to a message to connect.");

        const participant = targetNumber.replace('@s.whatsapp.net', '').trim() + '@s.whatsapp.net';

        if (action === "add") {

            if (!list.includes(participant)) {

                list.push(participant);

                await m.reply(`✅ _${participant} is now a sudo user_` );

            } else {

                await m.reply(`⚠️ _${participant} is already a sudo user_` );
            }

        } else if (action === "remove") {

            const index = list.indexOf(participant);

            if (index !== -1) {

                list.splice(index, 1);

                await m.reply(`🚫 _${participant} is no longer a sudo user_`);

            } else {

                await m.reply(`⚠️ _${participant} was not a sudo user_`);
            }
        }
    } catch (error) {

        console.error("Error in modifySudoList:", error);

        await m.reply(`❌ Error: Unable to modify sudo users. ${error.message}`)
    }
}

// Export individual functions
export async function sudo(m, list) {

    await modifySudoList(m, list, "add");
}

export async function delsudo(m, list) {
    
    await modifySudoList(m, list, "remove");
}

export default { sudo, delsudo };
