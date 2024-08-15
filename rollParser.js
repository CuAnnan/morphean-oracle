function parseRoll(rawString, guildId, userId)
{
    let [stringToParse, comment] = rawString.split('#');
    stringToParse = stringToParse.trim();
    comment = comment?comment.trim():null;

    let parts = stringToParse.split(' ');
    let toRoll = parts.shift().trim();
    let pool;
    let roll;

    let basicRoll = toRoll.match(/^(\d+)k(\d+)/i);
    if(basicRoll)
    {
        pool = new Pool(parseInt(basicRoll[1]), parseInt(basicRoll[2]));
        //roll(emphasis= false, bonusToRoll = 0, bonusToKeep = 0, bonusToResult = 0, reroll10s = true, rerollValue = 10)
    }
}

module.exports = parseRoll;