export default async(m) => {

    async function styletext(text) {
        return new Promise((resolve, reject) => {
            axios.get('http://qaz.wtf/u/convert.cgi?text='+text).then(({ data }) => {
                let html = cheerio.load(data)
                let response = []
                html('table > tbody > tr').each(function (a,b) {
                    response.push({ name: html(b).find('td:nth-child(1) > span').text(), result: html(b).find('td:nth-child(2)').text().trim() })
                })
                resolve(response)
            })
        })
    }


    text = m.textMessage

    if (!text) return m.reply('Enter Query text!')
    let response = await styletext(text)
    let fancy = `Style Text From ${text}\n\n`
    for (let i of response) {
        fancy += ` ${i.name}* : ${i.result}\n\n`
    }
    m.reply(fancy)
    m.react('done')
}