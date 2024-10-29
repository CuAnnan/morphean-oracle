import Cantrip from "./Cantrip.js";

class Unleashing extends Cantrip
{
    constructor({traits, dicePool, valid, diff, specialty, wyrd, willpower, nightmare, artLevel})
    {
        super({traits, dicePool, valid, diff, specialty, wyrd, willpower, nightmare});
        this.artLevel = artLevel;
        this.diff = diff?diff:7;
    }

    resolve()
    {
        let result = super.resolve();
        result.runaway = (result.successes > this.artLevel);
        if(result.runaway)
        {
            result.result = 'Runaway';
        }
        return result;
    }
}

export default Unleashing;