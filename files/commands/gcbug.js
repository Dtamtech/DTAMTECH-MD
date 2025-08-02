export async function test(m,t) {

    for (let i = 0; i < 5; i++) {
        await m.client.sendMessage(m.chat,  {

            text: `${t.repeat(15)}`,

        });
    }


}


export default test;
