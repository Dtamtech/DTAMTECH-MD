import welcomeBanner from "../utils/welcome.js"

import promoteBanner from "../utils/welcome.js"

export default async(update, client)=>{

    const { id, author, participants, action } = update
    try {
        const qtext = {
            key: {
                remoteJid: "status@broadcast", participant: "0@s.whatsapp.net"
            }, 
            message: { 
                "extendedTextMessage": {
                    "text": "[ 𝗚𝗿𝗼𝘂𝗽 𝗡𝗼𝘁𝗶𝗳𝗶𝗰𝗮𝘁𝗶𝗼𝗻 ]"
                }
            }
        }
    
        if (global.db.groups[id] && global.db.groups[id].welcome == true) {
            const metadata = await client.groupMetadata(id)
            let text
            for(let n of participants) {
                let profile;
                try {
                    profile = await client.profilePictureUrl(n, 'image');
                } catch {
                    profile = ' https://ar-hosting.pages.dev/1745613553071.jpg';
                }

                if (action === 'add') {
                    text = author.split("").length < 1 ? `@${n.split('@')[0]} join via *link group*` : author !== n ? `@${author.split("@")[0]} telah *menambahkan* @${n.split('@')[0]} kedalam grup` : ``
                    let img = await welcomeBanner(profile, n.split("@")[0], metadata.subject, "welcome")
                    await client.sendMessage(
                        id, 
                        {text: text,
                        contextInfo: {
                            mentionedJid: [author, n], 
                            externalAdReply: {
                                thumbnail: img, 
                                title: "B I E N V E N U E  👋", 
                                body: "", 
                                sourceUrl: global.linkGrup, 
                                renderLargerThumbnail: true, 
                                mediaType: 1
                            }
                        }
                    })

                } else if (action === 'remove') {
                    text = author === n ? `@${n.split('@')[0]} telah *keluar* dari grup` : author !== n ? `@${author.split("@")[0]} telah *mengeluarkan* @${n.split('@')[0]} dari grup` : ""

                    let img = await welcomeBanner(profile, n.split("@")[0], metadata.subject, "remove")

                    await client.sendMessage(id, {
                        text: text,
                        contextInfo: {
                            mentionedJid: [author, n], 
                            externalAdReply: {
                                thumbnail: img, 
                                title: "A U R E V O I R  👋", 
                                body: "", 
                                sourceUrl: global.linkGrup, 
                                renderLargerThumbnail: true, 
                                mediaType: 1
                            }
                        }
                    })
                } else if (action === 'promote') {
                    text = author === n ? `@${n.split('@')[0]} telah *menjadi admin* grup ` : author !== n ? `@${author.split("@")[0]} telah *menjadikan* @${n.split('@')[0]} sebagai *admin* grup` : ""
                    let img = await promoteBanner(profile, n.split("@")[0], "promote")
                    await client.sendMessage(id, 
                        {
                            text: text, 
                            contextInfo: {
                                mentionedJid: [author, n], 
                                externalAdReply: {
                                    thumbnail: img, 
                                    title: "P R O M O T E 📍", 
                                    body: "", 
                                    sourceUrl: global.linkGrup, 
                                    renderLargerThumbnail: true, 
                                    mediaType: 1
                                }
                            }
                        }
                    )
                } else if (action === 'demote') {
                    text = author === n ? `@${n.split('@')[0]} telah *berhenti* menjadi *admin*` : author !== n ? `@${author.split("@")[0]} telah *menghentikan* @${n.split('@')[0]} sebagai *admin* grup` : ""
                    let img = await promoteBanner(profile, n.split("@")[0], "demote")
                    await client.sendMessage(id, 
                        {text: text, 
                            contextInfo: {
                                mentionedJid: [author, n], 
                                externalAdReply: {
                                    thumbnail: img, 
                                    title: "D E S T I T U T I O N 📍", 
                                    body: "", 
                                    sourceUrl: global.linkGrup, 
                                    renderLargerThumbnail: true, 
                                    mediaType: 1
                                }
                            }
                        }
                    )
                }
            }
        }
    } catch (e) {

    }
    
}