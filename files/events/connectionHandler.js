import log from '../utils/Log.js'


function handleConnectionUpdate(update, reconnect) {

    const { connection, lastDisconnect } = update;

    if (connection === 'close') {

        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) reconnect();

    } else if (connection === 'open') {
        
        log('Connection opened. 💚💚💚','green');
    }
}

module.exports = handleConnectionUpdate;
