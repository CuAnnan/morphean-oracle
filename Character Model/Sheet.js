'use strict';
import xlsx from 'xlsx';
import fetch from 'node-fetch';

import {Attribute, Talent, Skill, Knowledge, Art, Realm, Background} from './Traits.js';

const constructors = {Attribute, Talent, Skill, Knowledge, Art, Realm, Background};

class Sheet
{
    constructor()
    {
        this.traits = {};
        this.kith = null;
        this.house = null;
        this.secondOathSworn = false;
    }

    setKith(kith)
    {
        this.kith = kith;
        this.favouredRealm = Sheet.FavouredRealms[kith];
    }

    setHouse(house)
    {
        this.house = house;
    }

    addTrait(trait)
    {
        this.traits[trait.name.toLowerCase()] = trait;
    }

    toJSON()
    {
        let json = {kith:this.kith, traits:[]};
        for(let [key, trait] of Object.entries(this.traits))
        {
            json.traits.push(trait.toJSON());
        }
        return json;
    }

    getPool(traitNames)
    {
        let poolData = {
            traits:traitNames,
            dicePool:0,
            valid:true
        };
        for(let traitName of traitNames)
        {
            let trait = this.traits[traitName.toLowerCase()];
            if(!trait)
            {
                throw new Error("Trait "+traitName+" not found");
            }
            console.log(trait);
            poolData.dicePool += trait.level;
            if(!trait.canRollUnlearned && trait.level === 0)
            {
                poolData.valid = false;
            }
        }
        return poolData;
    }

    finalize()
    {
        switch(this.kith)
        {
            case 'Piskie':
                this.traits.dexterity.setFreeLevels(1);
                break;
            case 'Satyr':
                this.traits.stamina.setFreeLevels(1);
                break;
            case 'Sidhe (Arcadian)':
            case 'Sidhe (Autumn)':
                console.log("Should be setting free levels on appearance to 2");
                this.traits.appearance.setFreeLevels(2);
                break;
            case 'Troll':
                this.traits.strength.setFreeLevels(this.secondOathSworn?3:1);
                break;
        }
        switch(this.house)
        {
            case 'Beaumayn':
                this.traits.perception.setFreeLevels(1);
                break;
            case 'Leanhaun':
                this.traits.charisma.setFreeLevels(1);
                break;
            case 'Scathach':
                this.traits.melee.setFreeLevels(1);
                this.traits.brawl.setFreeLevels(1);
                break;
        }
    }

    static async fromJSON(json)
    {
        let sheet = new Sheet();
        sheet.setKith(json.kith);
        for(let traitJSON of json.traits)
        {
            let constructor = constructors[traitJSON.type];
            if(traitJSON.type ==='Realm')
            {
                sheet.addTrait(new constructor(traitJSON.name, traitJSON.cp, traitJSON.fp, traitJSON.xp, traitJSON.name === sheet.favouredRealm));
            }
            else
            {
                sheet.addTrait(new constructor(traitJSON.name, traitJSON.cp, traitJSON.fp, traitJSON.xp));
            }
        }
        sheet.finalize();
        return sheet;
    }

    
    static async fromGoogleSheetsURL(url)
    {
        if(url.includes("/edit"))
        {
            throw new Error("It looks like you're trying to import from the edit URL not the export URL.");
        }

        if(url.endsWith('pubhtml'))
        {
            url = url.replace(/pubhtml$/, 'pub?output=xlsx');
        }

        let response = await fetch(url);
        let buffer = await response.arrayBuffer();
        let document = xlsx.read(buffer);
        let worksheet = document.Sheets['Build sheet'];

        let sheet = new Sheet();

        let valueFromCell = (cellAddressObject)=>{
            let cellAddress = xlsx.utils.encode_cell(cellAddressObject);
            let cell = worksheet[cellAddress];
            return cell?cell.v:0;
        };

        sheet.setKith(worksheet['P2'].v);

        if(worksheet['I3'])
        {
            sheet.setHouse(worksheet['I3'].v);
        }

        if(worksheet['J48'])
        {
            sheet.secondOathSworn = true;
        }

        let readTraitsFromRange = (traitConstructor, addressRange)=>
        {
            let list = xlsx.utils.decode_range(addressRange);
            for(let row = list.s.r; row <= list.e.r; row++)
            {
                let name_cell_address = xlsx.utils.encode_cell({c:list.s.c, r:row});
                let name = worksheet[name_cell_address]?.v;
                if(typeof name !== 'undefined')
                {
                    let cp = valueFromCell({c:list.s.c + 3, r:row});
                    let fp = valueFromCell({c:list.s.c + 4, r:row});
                    let xp = valueFromCell({c:list.s.c + 5, r:row});
                    if(traitConstructor.name === 'Realm')
                    {
                        sheet.addTrait(new traitConstructor(name, cp, fp, xp, name === sheet.favouredRealm));
                    }
                    else
                    {
                        sheet.addTrait(new traitConstructor(name, cp, fp, xp));
                    }
                }
            }
        }

        readTraitsFromRange(Talent, 'A13:F22');
        readTraitsFromRange(Skill, 'H13:M22');
        readTraitsFromRange(Knowledge,'O13:T22');
        readTraitsFromRange(Attribute,'A7:F9');
        readTraitsFromRange(Attribute,'H7:M9');
        readTraitsFromRange(Attribute,'O7:T9');
        readTraitsFromRange(Background,'A26:F31');
        readTraitsFromRange(Art,'H26:M31');
        readTraitsFromRange(Realm, 'O26:T31');
        
        sheet.finalize();

        return sheet;
    }
}

Sheet.FavouredRealms = {
    'Boggan':'Actor',
    'Clurichaun':'Actor',
    'Eshu':'Scene',
    'Nocker':'Prop',
    'Piskie':'Actor',
    'Pooka':'Nature',
    'Redcap':'Nature',
    'Satyr':'Fae',
    'Selkie':'Nature',
    'Sidhe (Autumn)':'Fae',
    'Sidhe (Arcadian)':'Time',
    'Sluagh':'Prop',
    'Troll':'Fae'
};


export default Sheet;