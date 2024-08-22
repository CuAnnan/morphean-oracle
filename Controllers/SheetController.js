'use strict';
import Controller from './Controller.js';
import KithainSheet from '../Character Model/KithainSheet.js';

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
        let sheetJSON = await collection.findOne({nano:req.params.hash});
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

        res.render('sheets/kithainsheet', {sheet, sheetStructure, kith, house, arts, title});
    }
}

export default SheetController;