import DiceRoll from "./DiceRoll.js";

class Cantrip extends DiceRoll
{
    constructor({traits, dicePool, valid, diff, specialty, wyrd, willpower, nightmare})
    {
        super({traits, dicePool, valid, diff, specialty, wyrd, willpower});
        this.diff = diff?diff:8;
        this.nightmare = nightmare?nightmare:0;
    }

    resolve()
    {
        let result = super.resolve();
        let nightmareDice = Math.min(this.nightmare, this.dicePool);
        let nightmareGained = 0;
        for(let i = 0; i < nightmareDice; i++)
        {
            if(result.dice[i] === 10)
            {
                nightmareGained ++;
                if(this.wyrd)
                {
                    nightmareDice++;
                }
            }
        }
        result.nightmareGained = nightmareGained;
        return result;
    }
}

export default Cantrip;