import Sheet from './Sheet.js';

import {Trait, Attribute, Talent, Skill, Knowledge, Art, Realm, Background, Glamour, Willpower} from './Traits.js';

const constructors = {Trait, Attribute, Talent, Skill, Knowledge, Art, Realm, Background, Glamour, Willpower};

class KithainSheet extends Sheet
{
    kith;
    house;
    court;
    legacies;
    motley;
    seeming;
    secondOathSworn;
    glamour;
    glamourSpent;
    willpower;
    willpowerSpent;
    banality;
    temporaryBanality;
    nightmare;
    imbalance;


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
        this.glamour = null;
        this.glamourSpent = 0;
        this.willpower = null;
        this.willpowerSpent = 0;
        this.banality = null;
        this.temporaryBanality = 0;
        this.nightmare = null;
        this.imbalance = 0;
    }

    toJSON()
    {
        let json = {
            url:this.url, kith:this.kith, house:this.house, name:this.name, player:this.player, chronicle:this.chronicle, court:this.court, legacies:this.legacies, seeming:this.seeming, motley:this.motley, secondOathSworn:this.secondOathSworn, traits:[],
            glamourSpent:this.glamourSpent, willpowerSpent:this.willpowerSpent, temporaryBanality:this.temporaryBanality, imbalance:this.imbalance,
        };
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

    increaseNightmare(amount)
    {
        this.nightmare += amount;
        if(this.nightmare >= 10)
        {
            this.imbalance++;
            this.nightmare = 0;
        }
        return this.nightmare;
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
        if(traitJSON.type === 'Glamour' || traitJSON.type === 'Willpower')
        {
            let trait = new constructor(traitJSON.cp, traitJSON.fp, traitJSON.xp);
            trait.setFreeLevels(traitJSON.freeLevels);
            this.addTrait(trait);
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
        this.secondOathSworn = json.secondOathSworn;
        this.temporaryBanality = json.temporaryBanality?json.temporaryBanality:0;
        this.glamourSpent = json.glamourSpent?json.glamourSpent:0;
        this.willpowerSpent = json.willpowerSpent?json.willpowerSpent:0;
        this.imbalance = json.imbalance?json.imbalance:0;
    }

    spendGlamour(amount)
    {
        if(this.glamourSpent + amount < this.glamour.level)
        {
            throw new Error('You cannot afford that glamour expenditure');
        }
        this.glamourSpent += amount;
    }

    gainGlamour(amount = 1)
    {
        this.glamourSpent -= amount
        if(this.glamourSpent < 0)
        {
            this.glamourSpent = 0;
        }
    }

    spendWillpower(amount)
    {
        if(this.willpowerSpent + amount < this.willpower.level)
        {
            throw new Error('You cannot afford that willpower expenditure');
        }
        this.willpowerSpent += amount;
    }

    gainWillpower(amount= 1)
    {
        this.willpowerSpent -= amount;
        if(this.willpowerSpent < 0)
        {
            this.willpowerSpent = 0;
        }
    }

    loseTemporaryBanality(amount = 1)
    {
        this.temporaryBanality -= amount;
        if(this.temporaryBanality < 0)
        {
            this.temporaryBanality = 0;
        }
    }

    gainTemporaryBanality(amount = 1)
    {
        this.temporaryBanality += amount;
        if(this.temporaryBanality >= 10)
        {
            this.temporaryBanality = 0;
            this.banality.setFreeLevels(1);
        }
    }

    getCantripPool(traits)
    {
        let pool = this.getPool(traits);
        pool.nightmare = this.nightmare;
        return pool;
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