'use strict';
import Controller from './Controller.js';
import KithainSheet from '../Character Model/KithainSheet.js';
import DiceRoll from "../Character Model/DiceRoll.js";
import DiscordClientContainer from "../DiscordClientContainer.js";
import {nanoid} from 'nanoid';

import userHash from "../userHashFunction.js";


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

    async getSheetByNanoID(nanoid)
    {
        let collection = this.db.collection('sheets');
        let sheetJSON = await collection.findOne({nanoid});
        if(!sheetJSON)
        {
            throw new Error('No sheet found');
        }
        return KithainSheet.fromJSON(sheetJSON.sheet);
    }

    async showSheet(req, res)
    {
        let sheet = null;
        try {
            sheet = await this.getSheetByNanoID(req.params.hash);
        }
        catch(e)
        {
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

    async rollPool(req, res)
    {
        let collection = this.db.collection('sheets');
        let sheetJSON = await collection.findOne({nanoid:req.params.hash});

        if(!sheetJSON)
        {
            res.json({success:false, error:"no sheet found"});
            return;
        }

        let {channelId} = sheetJSON;
        let poolData = req.body;
        let diceRoll = new DiceRoll(poolData);
        let roll = diceRoll.resolve();
        let nano=null;

        if(channelId)
        {
            let client = DiscordClientContainer.client;
            let dice = roll.dice
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