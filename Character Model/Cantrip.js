import {DiceRoll, NightmareDie, Die} from "./DiceRoll.js";

class Cantrip extends DiceRoll
{
    /**
     * KithainSheet
     */
    sheet;

    constructor({traits, dicePool, valid, diff, specialty, wyrd, willpower, nightmare})
    {
        super({traits, dicePool, valid, diff, specialty, wyrd, willpower});
        this.diff = diff?diff:8;
        this.nightmare = nightmare;
    }

    buildDicePool()
    {
        this.dice = [];
        for(let i = 0; i < this.nightmare; i++)
        {
            this.dice.push(new NightmareDie(this));
        }
        for(let i = this.nightmare; i < this.dicePool; i++)
        {
            this.dice.push(new Die(this));
        }
    }

    resolve()
    {
        let result = super.resolve();
        let nightmareGained = 0;
        for(let die of this.dice)
        {
            if(die.result.nightmare)
            {
                nightmareGained += die.result.nightmare;
            }
        }
        result.nightmareGained = nightmareGained;
        return result;
    }
}

export default Cantrip;