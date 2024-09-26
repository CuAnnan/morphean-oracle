import MongoConnectionFactory from './MongoConnectionFactory.js';
import Sheet from './Character Model/GoogleKithainSheet.js';

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const conf = require('./conf.json');

let poolParts = ['dexterity', 'melee', 3];

MongoConnectionFactory.init(conf).then(async function(){
    Sheet.fromGoogleSheetsURL("https://docs.google.com/spreadsheets/d/1JBbYdH3wVydNUvP804H6UOt4Y5Qi8hSKjh32My3yibY/pubhtml")
        .then(async function(sheet){
            let pool = sheet.getPool(poolParts);
            console.log(pool);
            MongoConnectionFactory.close();
        });
});