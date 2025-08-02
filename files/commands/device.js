
import {getDevice}  from '@whiskeysockets/baileys';

export async function device(m) {


     try {
        // Execute the get device command

        const quotedMessageId = m.quoted.id;

        const device = getDevice(quotedMessageId);

        await m.reply(`_The target is using an ${device} system_`)


    } catch (error) {

        await m.reply(`_Error: Unable to get device info. ${error.message}_`);
    }


}

export default device;
