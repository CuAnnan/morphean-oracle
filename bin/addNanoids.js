import MongoConnectionFactory from '../MongoConnectionFactory.js';
import KithainSheet from '../Character Model/KithainSheet.js';
import {nanoid} from 'nanoid';
import userHash from "../userHashFunction.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const conf = require('../conf.json');

MongoConnectionFactory.init(conf).then(async (db)=>{
    let collection = db.collection('sheets');
    let sheetCursor = collection.find({});
    for await(let {_id, sheet} of sheetCursor)
    {
        let {url} = sheet;
        if(url)
        {
            await collection.updateOne({_id}, {$set:{nano:nanoid()}}, {upsert:true});
        }
    }
    MongoConnectionFactory.close();
});