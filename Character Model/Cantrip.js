import {DiceRoll, NightmareDie, Die} from "./DiceRoll.js";

class Cantrip extends DiceRoll
{
    normalDice;
    nightmareDice;

   constructor({traits, dicePool, valid, diff, specialty, wyrd, willpower, nightmare})
    {
        super({traits, dicePool, valid, diff, specialty, wyrd, willpower});
        this.diff = diff?diff:8;
        this.nightmare = nightmare;
    }

    buildDicePool()
    {
        this.dice = [];
        for(let i = 0; i < this.nightmare.level; i++)
        {
            this.dice.push(new NightmareDie(this));
        }
        for(let i = this.nightmare.level; i < this.dicePool; i++)
        {
            this.dice.push(new Die(this));
        }

        return this;
    }

    resolve()
    {
        let result = super.resolve();
        this.normalDice = [];
        this.nightmareDice = [];


        let nightmareGained = 0;
        for(let die of this.dice)
        {
            if(die instanceof NightmareDie)
            {
                this.nightmareDice.push(die.result);
            }
            else
            {
                this.normalDice.push(die.result);
            }
            if(die.result.nightmare)
            {
                nightmareGained += die.result.nightmare;
            }
        }
        result.nightmareGained = nightmareGained;
        result.normalDice = this.normalDice;
        result.nightmareDice = this.nightmareDice;
        return result;
    }
}

export default Cantrip;