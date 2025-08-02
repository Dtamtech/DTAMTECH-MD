
export const normalizeMessageContent = (message) => {

    if (!message) return null;

    return message.viewOnceMessageV2?.message || message;
}

