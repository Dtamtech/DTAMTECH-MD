async function send(id,client,params) {

    await client.sendMessage(id,params)
    
}


async function replyToMessage(message,client,params) {

    const remoteJid = message.key.remoteJid;

    params.quoted = message

    await send(remoteJid,client,params)

}

export default {replyToMessage}