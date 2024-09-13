'use strict';

class Sheet
{
    constructor(url)
    {
        this.name = null;
        this.player = null;
        this.chronicle = null;
        this.traits = {};
        this.structuredTraits = {};
        this.url = url;
    }


    addTrait(trait)
    {
        let cName = trait.constructor.name.toLowerCase();
        let traitKey = trait.name.toLowerCase();
        if(cName === 'background')
        {
            traitKey += (trait.specialty?('-'+trait.specialty):'');
        }
        this.traits[traitKey] = trait;

        if(!this.structuredTraits[cName])
        {
            this.structuredTraits[cName] = {};
        }
        this.structuredTraits[cName][traitKey] = trait;
    }

    toJSON()
    {

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
    }

    applySplatJSON(json)
    {

    }

    addTraitFromJSON(traitJSON)
    {
    }

    static async fromJSON(json)
    {
        let sheet = new this(json.url);
        for(let traitJSON of json.traits)
        {
            sheet.addTraitFromJSON(traitJSON);
        }
        sheet.name = json.name;
        sheet.player = json.player;
        sheet.chronicle = json.chronicle;
        sheet.applySplatJSON(json);
        sheet.finalize();
        return sheet;
    }

    

}


export default Sheet;