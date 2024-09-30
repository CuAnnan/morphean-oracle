class Die
{
    diff;
    specialty;
    wyrd;
    #result;

    constructor({diff, specialty, wyrd})
    {
        this.diff = diff;
        this.specialty = !!specialty;
        this.wyrd = !!wyrd;
        this.#result = null;
    }

    get result()
    {
        if(this.#result)
        {
            return this.#result;
        }
        this.roll();
        return this.#result;
    }

    /**
     * @returns {{successes: number, numberOf10s: number, faces: number[], numberOf1s: number}}
     */
    roll()
    {
        let dieFace = Math.floor(Math.random() * 10) + 1;
        let result = {successes:0,faces:[dieFace], numberOf1s:0, numberOf10s:0};

        if(dieFace >= this.diff)
        {
            result.successes++;
            if(dieFace === 10)
            {
                result.numberOf10s++;
                if(this.specialty)
                {
                    result.successes++;
                }
                if(this.wyrd)
                {
                    let secondRoll = new Die(this.toJSON()).result;
                    result.successes += secondRoll.successes;
                    result.numberOf10s += result.numberOf10s;
                    result.numberOf1s += result.numberOf1s;
                    result.faces = result.faces.concat(secondRoll.faces);
                }
            }
        }
        else if(dieFace === 1)
        {
            result.numberOf1s ++;
            result.successes --;
        }
        this.#result = result;
        return result;
    }

    toJSON()
    {
        return {diff:this.diff, specialty:this.specialty, wyrd:this.wyrd};
    }
}

class NightmareDie extends Die
{
    #result;

    roll()
    {
        this.#result = super.roll();
        this.#result.nightmare = 0;
        for(let face of this.#result.faces)
        {
            if(face === 10)
            {
                this.#result.nightmare++;
            }
        }
        return this.#result;
    }
}


class DiceRoll
{
    constructor({traits, dicePool, valid, diff, specialty, wyrd, willpower})
    {
        this.traits = traits;
        this.dicePool = dicePool;
        this.valid = !!valid;
        this.diff = diff?diff:6;
        this.result = null;
        this.specialty = !!specialty;
        this.wyrd = !!wyrd;
        this.willpower = !!willpower;
    }

    buildDicePool()
    {
        if(this.dicePool > 100)
        {
            throw new Error('No, Denis. Bad.');
        }
        this.dice = [];
        for(let i = 0; i < this.dicePool; i++)
        {
            this.dice.push(new Die(this));
        }
    }

    resolve()
    {
        if(this.result)
        {
            return this.result;
        }
        
        let dice = [];
        let hasAnySuccesses = false;
        let successes = this.willpower?1:0;
        let hasAny1s = false;
        let faces = [];

        this.buildDicePool();

        for(let {result} of this.dice)
        {
            dice.push(result);
            successes += result.successes;
            faces = faces.concat(result.faces);
            hasAny1s = hasAny1s || result.numberOf1s > 0;
            hasAnySuccesses = hasAnySuccesses || result.successes > 0;
        }

        let botch = !hasAnySuccesses && hasAny1s;
        successes = Math.max(successes,0);
        this.result = {
            valid:this.valid,
            specialty:this.specialty,
            traits:this.traits,
            diff:this.diff,
            botch,
            successes,
            dice,
            faces,
            result:successes?'Success':(botch?'Botch':'Failure')
        };
        return this.result;
    }

    static fromJSON(json)
    {
        return new this(json);
        //return Object.assign(new this(),json);
    }
}

export {DiceRoll, Die, NightmareDie};
export default DiceRoll;