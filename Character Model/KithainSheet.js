import Sheet from './Sheet.js';

import {Attribute, Talent, Skill, Knowledge, Art, Realm, Background} from './Traits.js';
import fetch from "node-fetch";
import xlsx from "xlsx";

const constructors = {Attribute, Talent, Skill, Knowledge, Art, Realm, Background};

class KithainSheet extends Sheet
{
    constructor(url)
    {
        super(url);
        this.kith = null;
        this.house = null;
        this.court = null;
        this.legacies = {seelie:null, unseelie:null};
        this.motley = null;
        this.seeming = null;
        this.secondOathSworn = false;
    }

    toJSON()
    {
        let json = {url:this.url, kith:this.kith, house:this.house, name:this.name, player:this.player, chronicle:this.chronicle, court:this.court, legacies:this.legacies, seeming:this.seeming, motley:this.motley, traits:[]};
        for(let [key, trait] of Object.entries(this.traits))
        {
            try
            {
                json.traits.push(trait.toJSON());
            }
            catch(e)
            {
                console.warn('Trait not parsing json');
                console.log(trait);
            }
        }
        return json;
    }


    setKith(kith)
    {
        this.kith = kith;
        this.favouredRealm = KithainSheet.FavouredRealms[kith];
    }

    setHouse(house)
    {
        this.house = house;
    }

    addTraitFromJSON(traitJSON)
    {
        let constructor = constructors[traitJSON.type];
        if(traitJSON.type ==='Realm')
        {
            this.addTrait(new constructor(traitJSON.name, traitJSON.cp, traitJSON.fp, traitJSON.xp, traitJSON.name === this.favouredRealm));
        }
        else
        {
            let trait = new constructor(traitJSON.name, traitJSON.cp, traitJSON.fp, traitJSON.xp);
            if(traitJSON.specialty)
            {
                trait.setSpecialty(traitJSON.specialty);
            }
            this.addTrait(trait);
        }
    }

    applySplatJSON(json)
    {
        this.setKith(json.kith);
        this.setHouse(json.house);
        this.court = json.court;
        this.legacies = json.legacies;
        this.house = json.house;
        this.seeming = json.seeming;
        this.motley = json.motley;
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

        let sheet = new this(url);

        let valueFromCell = (cellAddressObject)=>{
            let cellAddress = xlsx.utils.encode_cell(cellAddressObject);
            let cell = worksheet[cellAddress];
            return cell?cell.v:0;
        };

        // set kith and house
        sheet.setKith(worksheet['P2'].v);
        if(worksheet['I3'])
        {
            sheet.setHouse(worksheet['I3'].v);
        }

        // troll stuff to handle how the free strength dots work
        if(worksheet['J48'])
        {
            sheet.secondOathSworn = true;
        }
        sheet.name = worksheet['B1']?.v;
        sheet.player = worksheet['B2']?.v;
        sheet.chronicle = worksheet['B3']?.v;
        sheet.court = worksheet['I1']?.v;
        sheet.legacies.seelie = worksheet['I2']?.v;
        sheet.legacies.unseelie = worksheet['J2']?.v;
        sheet.seeming = worksheet['P1']?.v;
        sheet.motley = worksheet['P3']?.v;


        // helper function that only matters here.
        // doing it this way erases the need to address scope. Because the worksheet and sheet variables only exist in this function.
        let readTraitsFromRange = (traitConstructor, addressRange)=>
        {
            let list = xlsx.utils.decode_range(addressRange);
            for(let row = list.s.r; row <= list.e.r; row++)
            {
                let nameCellAddress = xlsx.utils.encode_cell({c:list.s.c, r:row});
                let name = worksheet[nameCellAddress]?.v;
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
                        let trait = new traitConstructor(name, cp, fp, xp);
                        let specCellAddress = xlsx.utils.encode_cell({c:list.s.c + 1, r:row});
                        let spec = worksheet[specCellAddress]?.v;

                        if(typeof spec !== 'undefined')
                        {
                            trait.setSpecialty(spec);
                        }
                        sheet.addTrait(trait);
                    }
                }
            }
        }

        // actually do the reading of traits
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

KithainSheet.FavouredRealms = {
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

export default KithainSheet;