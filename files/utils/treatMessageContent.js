import proto, {jidDecode} from 'baileys'
import {downloadContentFromMessage} from 'baileys'
import {getDevice} from 'baileys'
import configManager from '../utils/manageConfigs.js'
import fs from 'fs'

async function downloadMediaMessage(m,filename){

    if (m.type === 'viewOnceMessage') {
        m.type = m.msg.type
    }
    if (m.type === 'imageMessage') {
        var nameJpg = filename ? filename + '.jpg' : 'undefined.jpg'
        const stream = downloadContentFromMessage(m.msg, 'image')
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        fs.writeFileSync(nameJpg, buffer)
        return fs.readFileSync(nameJpg)
    } else if (m.type === 'videoMessage') {
        var nameMp4 = filename ? filename + '.mp4' : 'undefined.mp4'
        const stream = downloadContentFromMessage(m.msg, 'video')
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        fs.writeFileSync(nameMp4, buffer)
        return fs.readFileSync(nameMp4)

    } else if (m.type === 'audioMessage') {
        var nameMp3 = filename ? filename + '.mp3' : 'undefined.mp3'
        const stream = await downloadContentFromMessage(m.msg, 'audio')
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        fs.writeFileSync(nameMp3, buffer)
        return fs.readFileSync(nameMp3)
    } else if (m.type === 'stickerMessage') {
        var nameWebp = filename ? filename + '.webp' : 'undefined.webp'
        const stream = await downloadContentFromMessage(m.msg, 'sticker')
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        fs.writeFileSync(nameWebp, buffer)
        return fs.readFileSync(nameWebp)
    } else if (m.type === 'documentMessage') {
        var ext = m.msg.fileName.split('.')[1].toLowerCase().replace('jpeg', 'jpg').replace('png', 'jpg').replace('m4a', 'mp3')
        var nameDoc = filename ? filename + '.' + ext : 'undefined.' + ext
        const stream = await downloadContentFromMessage(m.msg, 'document')
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        fs.writeFileSync(nameDoc, buffer)
        return fs.readFileSync(nameDoc)
    }
}


const msgContent = (message, client) => {

	const m = {}

	const remoteJid = message.key.remoteJid

	m.message = message

	m.client = client

	m.key = message.key

	m.remoteJid = remoteJid

	m.quoted = message.quoted || message.message?.extendedTextMessage?.contextInfo?.quotedMessage || '';

	m.isQuoted = !!m.quoted;

	const botNumber = m.myNumber = client.user.id.split(':')[0]

	m.prefix = configManager.config.users[botNumber].prefix;

	m.defaultReaction = configManager.config.users[botNumber].reaction;

	m.mode = configManager.config.users[botNumber].private;

	m.config = configManager.config.users[botNumber];

	m.isBotOwner = true;
	
	if (message.key) {
		m.id = m.key.id
		m.chat = m.key.remoteJid
		m.fromMe = m.key.fromMe

		m.isBot = m.id.startsWith('BAES') && m.id.length === 16
		m.isBaileys = m.id ? (m.id.startsWith('3EB0') || m.id.startsWith('B1E') || m.id.startsWith('BAE') || m.id.startsWith('3F8')) : false
		m.isGroup = m.chat.endsWith('@g.us')
		m.isPrivateChat = m.chat.endsWith('@s.whatsapp.net')
		m.isChannel = m.chat.endsWith('@newsletter')
		m.isBroadcast = m.chat.endsWith('@statut.broadcast')
		m.sender =m.isGroup? m.key.participant : m.chat 
		if (m.isGroup) {
			m.chatType = 'group'
			m.metadata = client.groupMetadata(m.chat)
			m.participant = message.key.participant || ""

			const userLid = client.user?.lid?.split(':')[0]+"@lid"
			m.fromMe = ( userLid === m.participant)? true : m.fromMe;
			//const userInfo =m.metadata.participants.filter(e => e.lid === m.participant)[0]
			//m.sender = userInfo.id

			m.admins = m.metadata && m.metadata.participants ? (m.metadata.participants.filter(e => e.admin !== null).map(e => e.id)) : []
			m.isAdmin = m.admins ? m.admins.includes(m.sender) : false
			m.isBotAdmin = m.admins ? m.admins.includes(botNumber+"@s.whatsapp.net") : false
		}else if(m.isPrivateChat){
			m.chatType = 'private'
			m.isContact = false
		}else if(m.isChannel){
			m.chatType = 'channel';
			m.channelJid = ''
		}else if(m.isBroadcast){
			m.chatType = 'broadcast';
			m.statutJid = ''
		}
		m.isDeveloper = (botNumber === '237670171019')
	}
	if (message.message) {

		m.deleteForMe= async (chat,messageId)=>{
			console.log('Attempting to delete message  for me.\nInfo:\n\t\t ID: '+messageId+'\n\t\tChat: '+chat+'')
			try{
				await client.chatModify(
					{ clear: { messages: [{ id: messageId, fromMe: m.fromMe }] } },
					chat
				);
			}catch (e) {
				console.log(e)
				await m.reply('❌Unable to delete this message.')
			}
		}

		m.deleteForEveryone= async (chat,messageId)=>{

			if(m.isGroup && !m.isAdmin) return await m.reply('🕊 Only Group Admins can use this command.');

			console.log('Attempting to delete message  for me.\nInfo:\n\t\t ID: '+messageId+'\n\t\tChat: '+chat+'')
			try {
				await client.sendMessage(chat, {
					delete: {
						remoteJid: chat,

						id: messageId
					}
				})
			}catch (e) {
				console.log(e)
				await m.reply('❌Unable to delete this message for everyone.')
			}
		}

		m.deleteThisForEveryone= async ()=>{
			await m.deleteForEveryone(m.chat,m.key.id)
		}
		m.deleteThisForSelf= async ()=>{
			await m.deleteForMe(m.chat,m.key.id)
		}

		/**
		 *
		 * @param {string} text
		 * @param {object} options
		 * @returns
		 */

		m.reply = async (text='',options)=>{

			if(text){
				return await client.sendMessage(remoteJid, {
					text:text,
					...options},{quoted:message}
				);
			}else{
				return await client.sendMessage(remoteJid, {	...options}, {quoted:message});
			}

		}

		m.type =
			message.message.imageMessage? 'imageMessage' :
				message.message.videoMessage? 'videoMessage' :
					message.message.audioMessage? 'audioMessage' :
						message.message.documentMessage? 'documentMessage' :
							message.message.stickerMessage? 'stickerMessage' :
								message.message.viewOnceMessage? 'viewOnceMessage' :
									''
		m.mine = m.mimetype =
			message.message.imageMessage?.mimetype ||
			message.message.videoMessage?.mimetype ||
			message.message.audioMessage?.mimetype ||
			message.message.documentMessage?.mimetype ||
			message.message.stickerMessage?.mimetype ||
			message.message.viewOnceMessage?.mimetype ||
			'text'

		m.messageBody = message.message.text ||
			message.message.extendedTextMessage?.text ||
			message.message.conversation ||
			message.message.imageMessage?.caption ||
			message.message.videoMessage?.caption ||
			message.message.buttonsResponseMessage?.selectedButtonId ||
			message.message.listResponseMessage?.singleSelectReply.selectedRowId ||
			message.message.templateButtonReplyMessage?.selectedId ||
			'' ;

		m.isCommand = m.messageBody.startsWith(m.prefix)

		if(m.isCommand){

			m.commandAndArgs = m.messageBody.slice(1).trim();

			m.parts = m.commandAndArgs.split(/\s+/);

			m.args = m.parts.slice(1)

			m.command = m.parts[0];

			m.textMessage = m.args.join(' ');
		}

		m.quoted =
			message.quoted ||
			message.message.extendedTextMessage?.contextInfo?.quotedMessage ||
			message.message.imageMessage?.contextInfo?.quotedMessage ||
			message.message.videoMessage?.contextInfo?.quotedMessage ||
			message.message.audioMessage?.contextInfo?.quotedMessage ||
			message.message.stickerMessage?.contextInfo?.quotedMessage ||
			message.message.viewOnceMessage?.contextInfo?.quotedMessage ||'';

		if (m.quoted) {
			m.quoted.textMessage = m.quoted.conversation || m.quoted.extendedTextMessage?.text;
			m.quoted.id = message.message.contextInfo?.stanzaId || message.message.extendedTextMessage?.contextInfo?.stanzaId;
			m.quoted.device = getDevice(m.quoted.id)
			m.quoted.isBot = m.quoted.id ? m.quoted.id.startsWith('BAES') && m.quoted.id.length === 16 : false
			m.quoted.isBaileys = m.quoted.id ? (m.quoted.id.startsWith('3EB0') ||
								 m.quoted.id.startsWith('B1E') ||
								 m.quoted.id.startsWith('3F8') ||
								 m.quoted.id.startsWith('BAE')) : false

			const quotedParticipant = m.isGroup ? message.message.contextInfo?.participant || message.message.extendedTextMessage?.contextInfo?.participant : m.chat

			m.quoted.sender = quotedParticipant;
			if(m.isGroup){
				const userLid = client.user?.lid?.split(':')[0]+"@lid"
				m.quoted.fromMe = ( userLid === quotedParticipant)? true : m.quoted.fromMe;
				//const userInfo =m.metadata.participants.filter(e => e.lid === quotedParticipant)[0]
				//m.quoted.sender = userInfo.id
			}

			m.quoted.fromMe = m.quoted.sender === client.user.id
			m.quoted.body = m.quoted.text ||
				m.quoted.extendedTextMessage?.text ||
				m.quoted.caption ||
				m.quoted.conversation ||
				m.quoted.selectedButtonId ||
				m.quoted.singleSelectReply?.selectedRowId ||
				m.quoted.selectedId ||
				m.quoted.contentText ||
				m.quoted.selectedDisplayText ||
				m.quoted.title ||
				''
			m.quoted.type =
				m.quoted.imageMessage? 'imageMessage' :
					m.quoted.videoMessage? 'videoMessage' :
						m.quoted.audioMessage? 'audioMessage' :
							m.quoted.documentMessage? 'documentMessage' :
								m.quoted.stickerMessage? 'stickerMessage' :
									m.quoted.viewOnceMessage? 'viewOnceMessage' :
										''
			m.quoted.mine = m.quoted.mimetype =
				m.quoted.imageMessage?.mimetype ||
				m.quoted.videoMessage?.mimetype ||
				m.quoted.audioMessage?.mimetype ||
				m.quoted.documentMessage?.mimetype ||
				m.quoted.stickerMessage?.mimetype ||
				m.quoted.viewOnceMessage?.mimetype ||
				''

			m.quoted.key = {
				remoteJid: message.message.contextInfo?.remoteJid || m.chat,
				participant: m.quoted.sender,
			}
			m.quoted.deleteForEveryone= async ()=>{
				return await m.deleteForEveryone(m.quoted.chat,m.quoted.id)
			}
			m.quoted.deleteForSelf= async ()=>{
				return await m.deleteForMe(m.quoted.chat,m.quoted.id)
			}
		}
	}
	if(m.quoted.type){
		m.quoted.download = async () => {
			const quoted = m.quoted;
			const quotedMineType = quoted.mimetype || '';
			const messageType = (m.type || quotedMineType.split('/')[0]).replace(/Message/gi, '');
			const stream = downloadContentFromMessage(quoted, messageType);
			let buffer = Buffer.from([]);
			for await (const chunk of stream) {
				buffer = Buffer.concat([buffer, chunk]);
			}
			return buffer
		}
	}

	
	m.copy = () => {return m.messageBody}


	/**
		* @param {string} name 
		* @param {string} info 
		* @param {number} number 
		* @returns 
	   */
	m.sendContact = (name, info, number) => {
		var vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 'FN:' + name + '\n' + 'ORG:' + info + ';\n' + 'TEL;type=CELL;type=VOICE;waid=' + number + ':+' + number + '\n' + 'END:VCARD'
		client.sendMessage(m.chat, { contacts: { displayName: name, contacts: [{ vcard }] } }, { quoted: m })
	}

	/**
		* 
		* @param {*} emoji 
		* @returns 
	   */
	m.react = (emoji = m.defaultReaction) => client.sendMessage(m.chat, { react: { text: emoji, key: m.key } })

	/**
		* 
		* @param {string} jid 
		* @param {boolean} forceForward 
		* @param {*} options 
		* @returns 
	   */
    m.forwardMessage = (jid, forceForward = true, options = {}) => client.copyNForward(jid, vM, forceForward,{contextInfo: {isForwarded: false}}, options)


  return m
}


export default { msgContent, downloadMediaMessage };
