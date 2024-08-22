'use strict';
import fetch from "node-fetch";
import MongoConnectionFactory from "../MongoConnectionFactory.js";
import xlsx from "xlsx";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const conf = require('../conf.json');

const url = "https://docs.google.com/spreadsheets/d/1CHtXxrQBslVb0tBkFHhB23EuZYj-FDCJFYf2vIrzwyE/pub?output=xlsx";

MongoConnectionFactory.init(conf).then(async function()
{
    let response = await fetch(url);
    let buffer = await response.arrayBuffer();
    let document = xlsx.read(buffer);
    let worksheet = document.Sheets['Data sheet'];
    let db = MongoConnectionFactory.getInstance();

    for(let i = 2; i <= 14; i++)
    {
        let kith = {
            name:worksheet[`A${i}`].v,
            frailty:{
                name:worksheet[`B${i}`].v,
                mechanics:worksheet[`C${i}`].v,
            },
            birthrights:[
                {
                    name:worksheet[`D${i}`].v,
                    mechanics:worksheet[`E${i}`].v,
                },
                {
                    name:worksheet[`F${i}`].v,
                    mechanics:worksheet[`G${i}`].v,
                },
            ]
        };
        await db.collection('kiths').updateOne({name:kith.name}, {$set:kith}, {upsert:true});
    }

    for(let i = 17; i <= 30; i++)
    {
        let house = {
            name:worksheet[`A${i}`].v,
            flaw:worksheet[`B${i}`].v,
            boon:worksheet[`C${i}`].v,
        }
        await db.collection('houses').updateOne({name:house.name}, {$set:house}, {upsert:true});
    }

    for(let i = 33; i <= 52; i++)
    {
        let art = {
            name:worksheet[`A${i}`].v,
            levels:[
                {
                    name:worksheet[`B${i}`].v,
                    effect:worksheet[`C${i}`].v,
                },
                {
                    name:worksheet[`D${i}`].v,
                    effect:worksheet[`E${i}`].v,
                },
                {
                    name:worksheet[`F${i}`].v,
                    effect:worksheet[`G${i}`].v,
                },
                {
                    name:worksheet[`H${i}`].v,
                    effect:worksheet[`I${i}`].v,
                },
                {
                    name:worksheet[`J${i}`].v,
                    effect:worksheet[`K${i}`].v,
                },
            ]
        };
        await db.collection('arts').updateOne({name:art.name}, {$set:art}, {upsert:true});
    }

    MongoConnectionFactory.close().then(()=>{console.log("Done");});
});