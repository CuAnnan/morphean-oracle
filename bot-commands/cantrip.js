'use strict';
import {SlashCommandBuilder} from 'discord.js';
import SheetController from "../Controllers/SheetController.js";

import userHash from "../userHashFunction.js";
import Cantrip from "../Character Model/Cantrip.js";



const helpText = '***roll syntax***\n\n\
`/roll <n>` This will roll <n> dice. Eg. `/roll 6` will roll 6 dice\n\
`/roll <Art>` + <Realm> This will roll a cantirip using these traits\n\
`/roll <Pool> vs <diff>` this allows you to specify what difficulty to roll a pool at. If no difficulty is provided, the difficulty will be 8';

const controller = new SheetController();


export default {
    data: new SlashCommandBuilder()
        .setName('cantrip')
        .setDescription("Roll a cantrip")
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
        let sheet, hashHex;
        parts = parts.trim();
        let poolData = null;
        if(Number.isNaN(parseInt(parts)))
        {
            diff = diff?diff:8;
            let poolArray = parts.split('+');

            let poolParts = [];
            for(let part of poolArray)
            {
                poolParts.push(part.toLowerCase().trim());
            }
            try
            {
                hashHex = await userHash(interaction);
                sheet = await controller.getSheetByDigest(hashHex);
                poolData = sheet.getCantripPool(poolParts);
            }
            catch(e)
            {
                console.log(e);
                console.log(e.message);
                interaction.reply({content:e.message, ephemeral:true});
                return;
            }
        }
        else
        {
            poolData = {traits: [parts], dicePool:parseInt(parts)};
        }

        try {
            let pool = Object.assign({}, poolData, {diff, specialty, wyrd, willpower, });

            let cantrip = new Cantrip(pool);
            let roll = cantrip.resolve();


            let content = `**Cantrip result:**\n**Pool:** ${roll.traits.join(' + ')}\n**Difficulty:** ${roll.diff}\n**Result:** ${roll.result}\n`;

            let normalDiceFaces =[];
            let normalFaceContent = '';
            if(roll.normalDice.length > 0)
            {
                for(let die of roll.normalDice)
                {
                    for(let face of die.faces)
                    {
                        normalDiceFaces.push(face);
                    }
                }
                content += `**Normal dice:** ${normalDiceFaces.join(', ')}\n`;
            }
            let nightmareDice = [];
            if(roll.nightmareDice.length > 0)
            {
                for(let die of roll.nightmareDice)
                {
                    for(let face of die.faces)
                    {
                        nightmareDice.push(face);
                    }
                }
                content += `**Nightmare dice:** ${nightmareDice.join(', ')}\n`;
            }



            if(roll.nightmareGained)
            {
                content += `**Nightmare Gained:** ${roll.nightmareGained}`;
                sheet.gainTemporaryPool('nightmare', roll.nightmareGained);
                await controller.saveSheetByDigest(hashHex);

            }
            interaction.reply({content});
        }
        catch(e)
        {
            console.log(e);
            interaction.reply({content:"An error occured", ephemeral:true});
        }
    },
};