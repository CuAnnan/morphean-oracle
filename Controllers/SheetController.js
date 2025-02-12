'use strict';
import Controller from './Controller.js';
import KithainSheet from '../Character Model/KithainSheet.js';
import DiceRoll from "../Character Model/DiceRoll.js";
import DiscordClientContainer from "../DiscordClientContainer.js";
import {nanoid} from 'nanoid';
import Cantrip from '../Character Model/Cantrip.js';
import Unleashing from '../Character Model/Unleashing.js';

import userHash from "../userHashFunction.js";
import QRCode from 'qrcode';
import {createRequire} from "module";
const require = createRequire(import.meta.url);
const {webPresence} = require('../conf.json');

const sheetStructure = {
    attributes:{
        Physical:['Strength', 'Dexterity', 'Stamina'],
        Social:['Charisma', 'Manipulation', 'Appearance'],
        Mental:['Perception', 'Intelligence', 'Wits']
    },
    abilities:{
        Talents:['Alertness','Athletics','Brawl','Empathy','Expression','Intimidation', 'Kenning','Leadership','Streetwise','Subterfuge'],
        Skills:['Animal Ken','Crafts','Drive','Etiquette','Firearms','Larceny','Melee','Performance','Stealth','Survival'],
        Knowledges:['Academics','Computer','Enigmas','Gremayre','Investigation','Law','Medicine','Politics','Science','Technology']
    }
};

class SheetController extends Controller
{
    async getSheetDocumentByNanoID(nanoid)
    {
        let collection = this.db.collection('sheets');
        let sheetJSON = await collection.findOne({nanoid});
        if(!sheetJSON)
        {
            throw new Error('No sheet found');
        }
        return sheetJSON;
    }

    async getQRCode(req, res)
    {
        const url = `${webPresence}/sheets/view/${req.params.nanoid}`;
        const qrCode = await QRCode.toBuffer(url);
        res.json({dataURL:qrCode});
    }

    async fetchNPCQrCode(req, res)
    {
        const url = `${webPresence}/npcs/view/${req.params.nanoid}`;
        const qrCode = await QRCode.toBuffer(url);
        res.send(qrCode);
    }
    async getSheetDocumentByDigest(digest)
    {
        let collection = this.db.collection('sheets');
        let sheetJSON = await collection.findOne({digest});
        if(!sheetJSON)
        {
            throw new Error('No sheet found');
        }
        return sheetJSON;
    }

    async getSheetByDigest(digest, forceReload = false)
    {
        let cachedSheet = this.cache.get(digest);
        if(!cachedSheet || forceReload)
        {
            let document = await this.getSheetDocumentByDigest(digest);
            let sheet= await KithainSheet.fromJSON(document.sheet);
            this.cache.put(digest, sheet);
            this.cache.link(digest, document.nanoid);
            cachedSheet = sheet;
        }
        return cachedSheet;
    }

    async getSheetByNanoID(nanoid, forceReload = false)
    {
        let cachedSheet = this.cache.get(nanoid);
        if(!cachedSheet || forceReload)
        {
            let document = await this.getSheetDocumentByNanoID(nanoid);
            let sheet= await KithainSheet.fromJSON(document.sheet);
            this.cache.put(nanoid, sheet);
            this.cache.link(nanoid, document.digest);
            cachedSheet = sheet;
        }
        return cachedSheet;
    }

    async saveSheetByDigest(digest)
    {
        let cachedSheet = this.cache.get(digest);
        if(!cachedSheet)
        {
            throw new Error("Trying to update a sheet that is not in the cache");
        }
        let sheet = cachedSheet.toJSON();
        this.db.collection('sheets').updateOne({digest:digest}, {$set:{sheet}}, {upsert:true});
    }

    async getChannelIdFromRequest(req)
    {
        return (await this.getSheetDocumentByNanoID(req.params.hash)).channelId;
    }

    async showNPCSheet(req, res)
    {
        let sheet = null;
        const nanoid = req.params.hash;
        let cachedSheet = this.cache.get(nanoid);


        if(!cachedSheet)
        {
            let collection = this.db.collection('npcs');
            let sheetJSON = await collection.findOne({nanoid:nanoid});

            if(!sheetJSON)
            {
                res.render("noSheetFound");
                return;
            }

            sheet= await KithainSheet.fromJSON(sheetJSON.sheet);
            this.cache.put(nanoid, sheet);
            this.cache.link(nanoid, sheetJSON.digest);
            cachedSheet = sheet;
        }
        else
        {
            sheet = cachedSheet;
        }

        let kith = null;
        if(sheet.kith)
        {
            kith = await this.db.collection('kiths').findOne({name:sheet.kith});
        }
        let house = null;
        if(sheet.house)
        {
            house = await this.db.collection('houses').findOne({name:sheet.house});
        }


        let arts = [];
        for(let [name, knownArt] of Object.entries(sheet.structuredTraits.art))
        {
            let art = {name:knownArt.name, cantrips:[]};
            let artData = await this.db.collection('arts').findOne({name:art.name});
            for(let i = 0; i < knownArt.level; i++)
            {
                art.cantrips.push(artData.levels[i])
            }
            arts.push(art);
        }
        let title = sheet.name;

        res.render('sheets/kithainsheet', {hash:req.params.hash, sheet, sheetStructure, kith, house, arts, title, nanoid});
    }

    async showSheet(req, res)
    {
        let sheet = null;
        try {
            sheet = await this.getSheetByNanoID(req.params.hash);
        }
        catch(e)
        {
            console.log(e);
            res.render("noSheetFound");
            return;
        }

        let kith = null;
        if(sheet.kith)
        {
            kith = await this.db.collection('kiths').findOne({name:sheet.kith});
        }
        let house = null;
        if(sheet.house)
        {
            house = await this.db.collection('houses').findOne({name:sheet.house});
        }

        let arts = [];
        for(let [name, knownArt] of Object.entries(sheet.structuredTraits.art))
        {
            let art = {name:knownArt.name, cantrips:[]};
            let artData = await this.db.collection('arts').findOne({name:art.name});
            for(let i = 0; i < knownArt.level; i++)
            {
                art.cantrips.push(artData.levels[i])
            }
            arts.push(art);
        }
        let title = sheet.name;

        res.render('sheets/kithainsheet', {hash:req.params.hash, sheet, sheetStructure, kith, house, arts, title});
    }

    async fetchSheetJSON(req, res)
    {
        let sheet = null;
        try {
            sheet = await this.getSheetByNanoID(req.params.hash);
            res.json(sheet.toJSON());
        }
        catch(e)
        {
            res.json({error:e.message});
        }
    }

    async resolveCantrip(digest, poolData, diff, mods)
    {
        let sheet = await this.getSheetByDigest(digest);
        let cantripPool = await sheet.getCantripPool(poolData);
        let pool = Object.assign({}, cantripPool, mods);

        let cantrip = new Cantrip(pool);

        let result = cantrip.resolve();
        if(result.nightmareGained)
        {
            sheet.gainTemporaryPool('nightmare', result.nightmareGained);

            await this.saveSheetByDigest(digest);
        }
        return result;
    }

    async resolveUnleashing(digest, artName, diff, mods)
    {
        let sheet= await this.getSheetByDigest(digest);
        let art = sheet.traits[artName];
        if(!art)
        {
            throw Error('Art '+artName+' not found on your sheet');
        }
        if(art.constructor.name !== 'Art')
        {
            throw Error(artName+' is not an art');
        }


        sheet.gainTemporaryPool('nightmare', 1);
        let unleashingPool = sheet.getUnleashingPool();

        let pool = Object.assign({}, unleashingPool, mods);
        pool.artLevel = art.level;

        let unleashing = new Unleashing(pool);
        let result = unleashing.resolve();

        if(result.nightmareGained)
        {
            sheet.gainTemporaryPool('nightmare', result.nightmareGained);

            //await this.saveSheetByDigest(digest);
        }
        return result;
    }

    async handleCantripFetchRequest(req, res)
    {
        this.getSheetDocumentByNanoID(req.params.hash).then((document)=>{
            let {channelId} = {document};
            KithainSheet.fromJSON(document.sheet).then(sheet=>{
                //
                let traits = sheet.getCantripPool([req.body.art, req.body.realm]);
                let poolData = Object.assign({}, traits, {
                    diff:req.body.diff?req.body.diff:8,
                    specialty:!!req.body.specialty,
                    wyrd:!!req.body.wyrd,
                    willpower:!!req.body.willpower
                });
                let cantrip = new Cantrip(poolData).resolve();
                if(cantrip.nightmareGained)
                {
                    sheet.increaseNightmare(cantrip.nightmareGained);
                    this.db.collection('sheets').updateOne({_id:document._id}, {'sheet.nightmare':sheet.nightmare});
                }
                res.json(cantrip);
            });
        });
    }

    async handleRollFetchRequest(req, res)
    {
        let channelId = await this.getChannelIdFromRequest(req);

        let poolData = req.body;
        let diceRoll = new DiceRoll(poolData);
        let roll = diceRoll.resolve();
        let nano=null;

        if(channelId)
        {
            let client = DiscordClientContainer.client;
            let dice = roll.faces
                .sort((x, y)=> x - y)
                .map((x)=>x === 1?`__*${x}*__`:(x >= roll.diff?`**${x}**`:x)) // italicise 1s, bold successes
                ;
            nano = nanoid();

            client.channels.fetch(channelId).then(
                channel=>{
                    channel.send(
                        `**Pool:** ${roll.traits.join(' + ')}\n**Difficulty:** ${roll.diff}\n**Result:** ${roll.result}\n**Dice:** ${dice.join(" ")}\n**Successes:** ${roll.successes}\nNID: ${nano}`
                    );
                }
            );
        }

        res.json({success:true, result:roll, nano});
    }
}

export default SheetController;