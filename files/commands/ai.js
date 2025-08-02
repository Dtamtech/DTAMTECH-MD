async function fetch_response(url,params = {}) {
    try{
        const response = await fetch(url, params);
        if (response.ok) {
            return await response.text()
        } else {
            return 'ERROR OCCURED'
        }
    }catch(error){
        return 'AN ERROR OCCURED'
    }
}

async function doRequest(type, prompt, params, systemMessage = "You are a helpful assistant named DTAMAI developped by Dtamtech(a programmer who is passionate by creating new solutions with artificial intelligence) you do not have torepeat this every time when we ask anpther question, just respond cleary at the question.for text parsing use Whatsapp Markdown Technologie", model="llama" ) {
    if(params.model){
        model = params.model
       } 
    switch (type) {
        case 'txt':
            return await fetch_response('https://text.pollinations.ai/',{
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messages: [
                      {
                          role: "system",
                          content: systemMessage,
                      },
                      {
                          role: "user",
                          content: prompt,
                      },
                  ],
                  model: model,
                  private: true
                })});
        case 'img':
            const imgSys = `TEXT-TO-IMAGE PROMPT GENERATOR

## OBJECTIVE

Convert user input into a concise, effective text-to-image prompt.

## OUTPUT STRUCTURE

- Single paragraph, comma-separated

- Maximum 50 words, aim for 30-40

- Always start with: "masterpiece, best quality, 8k"

- Include: style, main subject, key scene elements

## INSTRUCTIONS

1. If the user prompt length exceed 300 return the original user prompt as your response

2. Extract key visual elements from user input

3. Determine style:

   - Use explicitly mentioned style if provided

   - If no style mentioned, infer from description or use "photorealistic"

4. Prioritize main subject and essential scene elements

5. Add brief details on composition, lighting, or color if word count allows

6. Generate ONE prompt in English

7. Return **ONLY** the generated prompt

## EXAMPLES

User Input: "A cat sitting on a windowsill"

Output: masterpiece, best quality, 8k, photorealistic, orange tabby cat, alert posture, sunlit wooden windowsill, soft focus cityscape outside, warm afternoon light

User Input: "Futuristic city in anime style"

Output: masterpiece, best quality, 8k, anime, sprawling futuristic metropolis, towering skyscrapers, flying vehicles, neon lights, dynamic composition, vibrant color pallette`;
            return await fetch_response('https://text.pollinations.ai/',{
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messages: [
                      {
                          role: "system",
                          content: imgSys,
                      },
                      {
                          role: "user",
                          content: prompt,
                      },
                  ],
                  model: "llama" ,
                  private: true
                })});
        default:
            break;
    }
    
    
}


async function respondAi(m, type, params) {

    const remoteJid = m.chat;

    let reelMessage = m.textMessage;

    const client = m.client

    if(!reelMessage){
        reelMessage = "Who are you?" 
    } 
    await m.react('🧠')

    const response = await doRequest(type, reelMessage,  params)

    switch (response) {
        case "ERROR OCCURED":
            await m.reply('> ERROR OCCURED')
            break;

        case "AN ERROR OCCURED":
            await m.reply('> AN ERROR OCCURED')
            break;
    
        default:
            if(type === 'txt'){

                m.reply('',{image: { url: "files/medias/images/dtamai.jpg" }, caption: '*𝗗𝗧𝗔𝗠𝗔𝗜*\n\n'+response+"\n\n> Powered by dtamtech " });

            }else{

                if(type === 'img'){

                    const imgPath = "https://image.pollinations.ai/prompt/"+response+"?seed="+Math.ceil(Math.random()*1000)+"&model="+params.model
                          client.sendMessage(remoteJid, { image: { url: imgPath },

                    caption: `*IMAGE GENERATED FOR PROMPT :*\n${reelMessage}\n\n\n> Powered by DTAMTECH`, });
    
                }
            }
            break;   
        }
    }

export default respondAi ;