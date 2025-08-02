import fs from 'fs';

import path from 'path';

// Path to config.json
const configPath = 'config.json';

// Load config at startup
let config = {};

if (fs.existsSync(configPath)) {

    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    !config.mess? config.mess = {
        owner: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é ❗]*\nCette commande est réservée au grand patron JOKER! ",
        admin: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\nCette commande est réservée aux administrateurs ! ",
        botAdmin: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\nJe dois être Admin pour ca",
        group: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\n Cette Commande set disponible que dans les groupes bro !!! ",
        private: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\nCette commande est disponible que en privé bro! ",
        prem: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\nCette Commande est disponible pour les utilisateurs 𝗣𝗥𝗘𝗠𝗜𝗨𝗠!",
        wait: "𝗣𝗔𝗧𝗜𝗘𝗡𝗧𝗘 𝗕𝗥𝗢..." ,
        error: "*𝗨𝗡𝗘 𝗘𝗥𝗥𝗘𝗨𝗥 𝗘𝗦𝗧 𝗦𝗨𝗥𝗩𝗘𝗡𝗨𝗘 ❗",
        done: "𝗙𝗮𝗶𝘀 𝗮𝘃𝗲𝗰 𝘀𝘂𝗰𝗰è𝘀 ✅"
    } : config.mess

    !config.users? config.users = {
        
    } : config.users

} else {

    config = { 
        mess:{
            owner: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é ❗]*\nCette commande est réservée au grand patron JOKER! ",
            admin: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\nCette commande est réservée aux administrateurs ! ",
            botAdmin: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\nJe dois être Admin pour ca",
            group: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\n Cette Commande set disponible que dans les groupes bro !!! ",
            private: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\nCette commande est disponible que en privé bro! ",
            prem: "*[ 𝙰𝚌𝚌è𝚜 𝚁𝚎𝚏𝚞𝚜é❗ ]*\nCette Commande est disponible pour les utilisateurs 𝗣𝗥𝗘𝗠𝗜𝗨𝗠!",
            wait: "𝗣𝗔𝗧𝗜𝗘𝗡𝗧𝗘 𝗕𝗥𝗢..." ,
            error: "*𝗨𝗡𝗘 𝗘𝗥𝗥𝗘𝗨𝗥 𝗘𝗦𝗧 𝗦𝗨𝗥𝗩𝗘𝗡𝗨𝗘 ❗",
            done: "𝗙𝗮𝗶𝘀 𝗮𝘃𝗲𝗰 𝘀𝘂𝗰𝗰è𝘀 ✅"
        },
        users: {

        } 
    };
}

// Auto-save config when modified
const saveConfig = () => {

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

// **Direct Access Object**
export default {

    config,

    save() {

        saveConfig();
    }
};
