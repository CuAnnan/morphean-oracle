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
        let sheetJSON = await collection.findOne({digest:req.params.hash});
        let sheet = await KithainSheet.fromJSON(sheetJSON.sheet);
        res.render('sheets/kithainsheet', {sheet, sheetStructure});
    }
}

export default SheetController;