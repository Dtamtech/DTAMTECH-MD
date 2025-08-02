import chalk from 'chalk'

/**
 * 
 * @param {string} txt 
 * @param {string} color 
 * @param {string} type 
 * @param {string} style 
 * @param {string} bg 
 * @returns 
 */
async function log(
    txt,
    color = 'white',
    type = 'default',
    style = null,
    bg = null
){
    !color ? color = 'white' : null

    switch (type.toLowerCase()) {
        case 'e':

            color = 'red'
            bg = bgWhite
            style = 'bold'
            
            break;

        case 'w':

            color = 'orange'
            bg = bgWhite
            style = 'bold'
            
            break;

        case 'i':

            color = 'orange'
            bg = bgWhite
            style = 'bold'
            
            break;

        case 'd':

            color = 'green'
            bg = bgWhite
            style = 'bold'
            
            break;
    
        case 'default':

            break;

    }
    
    txt = `\n====================================
   ----------------------------
          ${txt}
   ----------------------------
=====================================
\n`

    if (chalk[color]) {

        
        if (chalk[style]) {

            if (chalk[bg]) {

                return console.log(chalk[color][bg][style](
                    
                ))
                
            }
            return console.log( chalk[color][style]( txt ) )
            
        }

        if (chalk[bg]) {

            return console.log( chalk[color][bg]( txt ) )

        }

        return console.log( chalk[color]( txt ) )
        

    }


        

}


export default log;