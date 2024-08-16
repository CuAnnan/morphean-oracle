class Rollable
{
    constructor(name, cp, fp, xp)
    {
      this.name = name;
      this.cp = cp?cp:0;
      this.fp = fp?fp:0;
      this.xp = xp?xp:0;
      this.freeLevels = 0;
      this.canRollUnlearned = this.constructor.CAN_ROLL_UNLEARNED;
      this.calculateLevel();
    }

    setFreeLevels(freeLevels)
    {
      this.freeLevels = freeLevels;
      this.calculateLevel();
    }

    removeFreeLevels()
    {
      this.freeLevels = 0;
    }

    calculateLevel()
    {
      let level= this.constructor.BASE  + this.cp + Math.floor(this.fp/this.constructor.FP_COST);
      let xpLeft = this.xp;
      let xpToLevel= level?this.constructor.XP_COST * level:this.constructor.FIRST_XP_COST;
      while(xpLeft >= xpToLevel)
      {
          xpLeft -= xpToLevel;
          level++;
          xpToLevel = this.constructor.XP_COST * level;
      }
      level += this.freeLevels;
      this.level = level;
    }

    setCP(cp)
    {
      this.cp = cp;

    }

    setXP(xp)
    {
      this.xp = xp;
    }

    toJSON()
    {
        return {
            type:this.constructor.name,
            name:this.name,
            cp:this.cp,
            xp:this.xp,
            fp:this.fp
        };
    }

    static fromJSON(json)
    {
        return new this(json.name, json.cp?json.cp:0, json.fp?json.fp:0, json.xp?json.xp:0);
    }
}
Rollable.BASE = 0;
Rollable.XP_COST;
Rollable.FP_COST;
Rollable.FIRST_XP_COST;
Rollable.CAN_ROLL_UNLEARNED = false;

class Attribute extends Rollable{};
Attribute.XP_COST = 4;
Attribute.BASE = 1;
Attribute.FP_COST = 5;

class Ability extends Rollable
{
  constructor(name, cp, fp, xp)
  {
    super(name, cp, fp, xp);
  }
}
Ability.XP_COST = 2;
Ability.FIRST_XP_COST = 3;
Ability.FP_COST = 2;
Ability.CAN_ROLL_UNLEARNED=true;
Ability.UNLEARNED_PENALTY=0;

class Talent extends Ability{};
class Skill extends Ability{};
Skill.UNLEARNED_PENALTY = +1;
class Knowledge extends Ability{};
Knowledge.CAN_ROLL_UNLEARNED=false;



class Art extends Rollable{};
Art.FP_COST = 5;
Art.XP_COST = 4;
Art.FIRST_XP_COST = 7;



class Glamour extends Rollable
{
  constructor(cp, fp, xp)
  {
    super("Glamour", cp, fp, xp);
  }
}
Glamour.XP_COST = 3;
Glamour.FP_COST = 3;

class Willpower extends Rollable
{
  constructor(cp, fp, xp)
  {
    super("Willpower", cp, fp, xp);
  }
}
Willpower.FP_COST = 1;
Willpower.XP_COST = 2;

class Realm extends Rollable
{
    constructor(name, cp, fp, xp, favoured)
    {
        super(name, cp?cp:0, fp?fp:0, xp?xp:0);
        this.favoured = favoured?favoured:false;
    }

    toJSON()
    {
        return {
            type:'Realm',
            name:this.name,
            cp:this.cp,
            xp:this.xp,
            fp:this.fp,
            favoured:this.favoured
        };
    }
}
Realm.XP_COST = 3;
Realm.FIRST_XP_COST =5;
Realm.FP_COST = 2;

class Background extends Ability{};
Background.FP_COST = 1;

export {
    Attribute, Ability, Talent, Skill, Knowledge, Art, Realm, Background
};