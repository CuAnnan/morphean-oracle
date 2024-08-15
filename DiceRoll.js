class DiceRoll
{
    constructor({traits, dicePool, valid}, diff = 6, spec = false, wyrd = false)
    {
        this.traits = traits;
        this.dicePool = dicePool;
        this.valid = valid;
        this.diff = diff;
        this.result = null;
        this.spec = spec;
        this.wyrd = wyrd;
    }

    resolve()
    {
        if(this.result)
        {
            return this.result;
        }
        
        let dice = [];
        let hasAnySuccesses = false;
        let successes = 0;
        let diceRemaining = this.dicePool;
        let handle10s = (this.spec || this.wyrd);
        let hasAny1s = false;
        while(diceRemaining > 0)
        {
            let die = Math.floor(Math.random() * 10) + 1;
            dice.push(die);
            if(die === 1)
            {
                hasAny1s = true;
                successes --;
            }
            else if(die >= this.diff)
            {
                hasAnySuccesses = true;
                successes++;
                if(die === 10 && handle10s)
                {
                    if(this.spec)
                    {
                        successes++;
                    }
                    if(this.wyrd)
                    {
                        diceRemaining++;
                    }
                }
            }
            diceRemaining --;
        }
        let botch = !hasAnySuccesses && hasAny1s;
        successes = Math.max(successes,0);
        this.result = {
            traits:this.traits,
            diff:this.diff,
            successes,
            dice,
            result:successes?'Success':(botch?'Botch':'Failure')
        };
        return this.result;
    }

    static fromJSON(json)
    {
        return Object.assign(new this(),json);
    }
}

export default DiceRoll;