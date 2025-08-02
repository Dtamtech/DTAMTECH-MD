
export async function modifyprem(m, list, action) {

    try {

        let targetNumber = m.args[0]
        // Handle reply to message
        if (m.isQuoted) targetNumber = m.quoted.sender.split('@')[0];

        if (!targetNumber) return await m.reply("> ❌ Please provide a number or reply to a message to connect.");

        const participant = targetNumber.replace('@s.whatsapp.net', '').trim() + '@s.whatsapp.net';

        if (action === "add") {

            if (!list.includes(participant)) {

                list.push(participant);

                await m.reply(`✅ _${participant} is now a sudo user_`);

            } else {

                await m.reply(`⚠️ _${participant} is already a sudo user_` );
            }

        } else if (action === "remove") {

            const index = list.indexOf(participant);

            if (index !== -1) {

                list.splice(index, 1);


            } else {

            }
        }
    } catch (error) {

        console.error("Error in modifySudoList:", error);

        await m.reply(`❌ Error: Unable to modify sudo users. ${error.message}` );
    }
}

// Export individual functions
export async function addprem(m, list) {

    await modifyprem(m, list, "add");
}

export async function delprem(m, list) {
    
    await modifyprem(m, list, "remove");
}

export default { addprem, delprem };
