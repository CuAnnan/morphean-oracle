'use strict';

import {SlashCommandBuilder} from 'discord.js';
import MongoConnectionFactory from '../MongoConnectionFactory.js';
import KithainSheet from '../Character Model/KithainSheet.js';
import DiceRoll from '../DiceRoll.js';

import userHash from "../userHashFunction.js";


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
        .addStringOption(option =>
                option
                    .setName('modifiers')
                    .setDescription('A space separated list of modifiers. "wi" or "willpower", "wy" or "wyrd", "spec" or "specialty"'))
    ,
    async execute(interaction) {
        let args = interaction.options.getString('pool').toLowerCase();
        if(args === 'help')
        {
            interaction.reply({content:helpText});
            return;
        }

        
        let modsRaw = interaction.options.getString('modifiers');
        let mods = [];
        if(modsRaw)
        {
            mods = modsRaw.toLowerCase().split(' ');
        }
        
        let willpower = false;
        let wyrd = false;
        let specialty = false;
        for(let mod of mods)
        {
            if(mod === 'wi' || mod === 'willpower')
            {
                willpower = true;
            }
            else if(mod === 'wy' || mod === 'wyrd')
            {
                wyrd = true;
            }
            else if(mod === 'spec' || mod === 'specialty')
            {
                specialty = true;
            }
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
                let hashHex = await userHash(interaction);
                let sheetJSON = await collection.findOne({digest:hashHex});
                let sheet = await KithainSheet.fromJSON(sheetJSON.sheet);
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
        let roll = new DiceRoll(poolData, diff, specialty, wyrd, willpower).resolve();
        let dice = roll.dice.map((x)=>x == 1?`__*${x}*__`:(x >= roll.diff?`**${x}**`:x));
        
        interaction.reply({content:`**Pool:** ${roll.traits.join(' + ')}\n**Difficulty:** ${roll.diff}\n**Result:** ${roll.result}\n**Dice:** ${dice.join(" ")}\n**Successes:** ${roll.successes}`});
    },
};