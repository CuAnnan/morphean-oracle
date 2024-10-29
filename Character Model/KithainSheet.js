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
        this.nightmare.freeLevels += amount;
        if(this.nightmare.level >= 10)
        {
            this.imbalance++;
            this.nightmare.freeLevels = 0;
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
        else if (traitJSON.name === 'Nightmare' || traitJSON.name === 'Banality')
        {
            let trait = new constructor(traitJSON.name, traitJSON.cp, traitJSON.fp, traitJSON.xp);
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

    burnTemporaryPool(pool, amount)
    {
        let changes = [];
        switch(pool)
        {
            case 'banality':
                this.temporaryBanality = Math.max(this.temporaryBanality - amount, 0);
                changes.unshift({name:'Temporary Banality', value:this.temporaryBanality});
                break;
            case 'willpower':
                if(this.willpowerSpent + amount > this.willpower.level)
                {
                    throw new Error('Unaffordable expenditure');
                }
                this.willpowerSpent += amount;
                changes.unshift({name:'Temporary Willpower', value:this.willpower.level - this.willpowerSpent});
                break;
            case 'glamour':
                if(this.glamourSpent + amount > this.glamour.level)
                {
                    throw new Error('Unaffordable expenditure');
                }
                this.glamourSpent += amount;
                changes.unshift({name:'Temporary Glamour', value:this.glamour.level - this.glamourSpent});
                break;
            case 'nightmare':
                this.nightmare.setFreeLevels(Math.max(this.nightmare.freeLevels - amount, 0));
                changes.unshift({name:'Nightmare', value:this.nightmare.level});
                break;
        }
        return changes;
    }

    gainTemporaryPool(pool, amount)
    {
        let changes = [];
        switch(pool)
        {
            case 'banality':
                this.temporaryBanality += amount;
                if(this.temporaryBanality >= 10)
                {
                    this.temporaryBanality = 0;
                    this.banality.setFreeLevels(this.banality.freeLevels + 1);
                    changes.unshift({name:'Permanent Banality', value:this.banality.level});
                }
                changes.unshift({name:'Temporary Banality', value:this.temporaryBanality});
                break;
            case 'willpower':
                this.willpowerSpent -= amount;
                if(this.willpowerSpent < 0)
                {
                    this.willpowerSpent = 0;
                }
                changes.unshift({name:'Willpower', value:this.willpower.level - this.willpowerSpent});
                break;
            case 'glamour':
                this.glamourSpent -= amount;
                if(this.glamourSpent < 0)
                {
                    this.glamourSpent = 0;
                }
                changes.unshift({name:'Glamour', value:this.glamour.level - this.glamourSpent});
                break;
            case 'nightmare':
                this.nightmare.setFreeLevels(this.nightmare.level + amount);

                if(this.nightmare.level >= 10)
                {
                    this.imbalance++;
                    this.nightmare.setFreeLevels(0);
                    changes.unshift({name:'Imbalance', value:this.imbalance});
                }
                changes.unshift({name:'Nightmare', value:this.nightmare.level});
                break;
        }
        return changes;
    }

    getCantripPool(traits)
    {
        let pool = this.getPool(traits);
        pool.nightmare = this.nightmare;
        return pool;
    }

    getUnleashingPool()
    {
        let pool = this.getPool(['nightmare', 'glamour']);
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
        this.glamour = this.traits.glamour;
        this.willpower = this.traits.willpower;
        this.banality = this.traits.banality;
        this.nightmare = this.traits.nightmare;
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