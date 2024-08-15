'use strict';

import {SlashCommandBuilder} from 'discord.js';
import MongoConnectionFactory from '../MongoConnectionFactory.js';
import Sheet from '../Character Model/Sheet.js';
import DiceRoll from '../DiceRoll.js';

let helpText = '***roll syntax***\n\n\
`/roll <n>` This will roll <n> dice. Eg. `/roll 6` will roll 6 dice\n\
`/roll <Trait>` + <Trait>[ + <Trait>....] This will roll a pool of dice made up of the values of the given traits. eg. `/roll Perception + Kenning` will roll your pool for Perception + Kenning.\n\
`/roll <Pool> vs <diff>` this allows you to specify what difficulty to roll a pool at. If no difficulty is provided, the difficulty will be 6';


export default {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription("Roll some dice")
        .addStringOption(option =>
            option
                .setName('pool')
                .setDescription("The pool to roll. For syntax just enter help")
                .setRequired(true))
    ,
    async execute(interaction) {
        let args = interaction.options.getString('pool').toLowerCase();
        if(args === 'help')
        {
            interaction.reply({content:helpText});
            return;
        }

        let [parts, diff] = args.split('vs');
        parts = parts.trim();
        let poolData = null;
        if(Number.isNaN(parseInt(parts)))
        {
            diff = diff?diff:6;
            let poolArray = parts.split('+');

            let poolParts = [];
            for(let part of poolArray)
            {
                poolParts.push(part.trim());
            }
            
            try
            {
                let db = MongoConnectionFactory.getInstance();
                let collection = db.collection('sheets');
                let sheetJSON = await collection.findOne({guildId: interaction.guildId, userId: interaction.user.id});
                let sheet = await Sheet.fromJSON(sheetJSON.sheet);
                poolData = sheet.getPool(poolParts);
            }
            catch(e)
            {
                console.log(e);
                console.log(e.message);
                interaction.reply({content:e.message, ephemeral:true});
            }
        }
        else
        {
            poolData = {traits: [parts], dicePool:parseInt(parts)};
        }
        let roll = new DiceRoll(poolData, diff).resolve();
        let dice = roll.dice.map((x)=>x == 1?`__*${x}*__`:(x >= roll.diff?`**${x}**`:x));
        
        interaction.reply({content:`**Pool:** ${roll.traits.join(' + ')}\n**Difficulty:** ${roll.diff}\n**Result:** ${roll.result}\n**Dice:** ${dice.join(" ")}\n**Successes:** ${roll.successes}`});
    },
};