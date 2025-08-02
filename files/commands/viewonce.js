
import { normalizeMessageContent } from '../utils/normalizeContent.js';

import { downloadMediaMessage } from '@whiskeysockets/baileys';

import fs from 'fs';

import path from 'path';

export async function viewonce(m) {
    // Get the quoted message
    const quotedMessage = m.quoted

    // Check if it's a valid ViewOnce message
    if (!quotedMessage?.imageMessage?.viewOnce && !quotedMessage?.videoMessage?.viewOnce && !quotedMessage?.audioMessage?.viewOnce) return await m.reply('_Reply to a valid ViewOnce message._');

    const content = normalizeMessageContent(quotedMessage);

    // Function to modify the 'viewOnce' property
    function modifyViewOnce(obj) {

        if (typeof obj !== 'object' || obj === null) return;

        for (const key in obj) {

            if (key === 'viewOnce' && typeof obj[key] === 'boolean') {

                obj[key] = false; // Disable 'viewOnce'

            } else if (typeof obj[key] === 'object') {

                modifyViewOnce(obj[key]);
            }
        }
    }

    // Modify the content
    modifyViewOnce(content);

    try {

        if (content?.imageMessage) {

            // Download the media
            const mediaBuffer = await downloadMediaMessage(

                { message: content }, // Pass the modified content

                'buffer', // Save as a buffer

                {} // Provide authentication details if necessary
            );

            if (!mediaBuffer) {

                console.error('Failed to download media.');

                return await m.reply('_Failed to download the ViewOnce media. Please try again._');
            }

            // Save the media temporarily
            const tempFilePath = path.resolve('./temp_view_once_image.jpeg');

            fs.writeFileSync(tempFilePath, mediaBuffer);

            // Send the downloaded media
            await m.reply('', {

                image: { url: tempFilePath },
                
            });

            // Clean up the temporary file
            fs.unlinkSync(tempFilePath);

        } else if (content?.videoMessage) {

            // Download the media
            const mediaBuffer = await downloadMediaMessage(

                { message: content }, // Pass the modified content

                'buffer', // Save as a buffer

                {} // Provide authentication details if necessary
            );

            if (!mediaBuffer) {

                console.error('Failed to download media.');

                return await m.reply('_Failed to download the ViewOnce media. Please try again._');
            }

            // Save the media temporarily
            const tempFilePath = path.resolve('./temp_view_once_image.mp4');

            fs.writeFileSync(tempFilePath, mediaBuffer);

            // Send the downloaded media
            await m.reply('', {

                video: { url: tempFilePath },
                
            });

            // Clean up the temporary file
            fs.unlinkSync(tempFilePath);

        } else if (content?.audioMessage) {

            // Download the media
            const mediaBuffer = await downloadMediaMessage(

                { message: content }, // Pass the modified content

                'buffer', // Save as a buffer

                {} // Provide authentication details if necessary
            );

            if (!mediaBuffer) {

                console.error('Failed to download media.');

                return await m.reply('_Failed to download the ViewOnce media. Please try again._');
            }

            // Save the media temporarily
            const tempFilePath = path.resolve('./temp_view_once_image.mp3');

            fs.writeFileSync(tempFilePath, mediaBuffer);

            // Send the downloaded media
            await m.reply('', {

                audio: { url: tempFilePath },
                
            });

            // Clean up the temporary file
            fs.unlinkSync(tempFilePath);

        }else {

            console.error('No imageMessage found in the quoted message.');

            await m.reply('_No valid imageMessage to modify and send._');
        }
    } catch (error) {

        console.error('Error modifying and sending ViewOnce message:', error);

        await m.reply('_An error occurred while processing the ViewOnce message._');
    }
}

export default viewonce;
