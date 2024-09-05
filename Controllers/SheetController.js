'use strict';
import Controller from './Controller.js';
import KithainSheet from '../Character Model/KithainSheet.js';
import DiceRoll from "../DiceRoll.js";
import DiscordClientContainer from "../DiscordClientContainer.js";

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

    async showSheet(req, res)
    {
        let collection = this.db.collection('sheets');
        let sheetJSON = await collection.findOne({nanoid:req.params.hash});
        if(!sheetJSON)
        {
            res.render("noSheetFound");
            return;
        }

        let sheet = await KithainSheet.fromJSON(sheetJSON.sheet);

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

        let pool = req.body;
        let diceRoll = new DiceRoll(
            pool.pool,
            parseInt(pool.diff),
            pool.spec,
            pool.wyrd,
            pool.will
        );
        let roll = diceRoll.resolve();


        if(channelId)
        {
            let client = DiscordClientContainer.client;
            let dice = roll.dice
                .sort((x, y)=> x - y)
                .map((x)=>x === 1?`__*${x}*__`:(x >= roll.diff?`**${x}**`:x)) // italicise 1s, bold successes
                ;

            client.channels.fetch(channelId).then(
                channel=>{
                    channel.send(
                        `**Pool:** ${roll.traits.join(' + ')}\n**Difficulty:** ${roll.diff}\n**Result:** ${roll.result}\n**Dice:** ${dice.join(" ")}\n**Successes:** ${roll.successes}`
                    );
                }
            );
        }

        res.json({success:true, result:roll});
    }
}

export default SheetController;