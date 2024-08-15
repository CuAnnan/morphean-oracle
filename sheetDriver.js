import MongoConnectionFactory from './MongoConnectionFactory.js';
import Sheet from './Character Model/Sheet.js';

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const conf = require('./conf.json');

MongoConnectionFactory.init(conf).then(async function(){
    Sheet.fromGoogleSheetsURL("https://docs.google.com/spreadsheets/d/1JBbYdH3wVydNUvP804H6UOt4Y5Qi8hSKjh32My3yibY/pubhtml").then(async function(sheet){
        let sheetJSON = sheet.toJSON();
        let db = MongoConnectionFactory.getInstance();
        let entry = await db.collection('sheets').findOneAndUpdate({guildId:"interaction.guildId", userId:"interaction.user.id"}, {$set:{sheet:sheetJSON}}, {upsert:true});
        await MongoConnectionFactory.close();
        let recoveredSheetJSON = entry.sheet;
        let newSheet = await Sheet.fromJSON(recoveredSheetJSON);
        console.log(newSheet);
    });
});