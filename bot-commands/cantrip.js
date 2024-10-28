'use strict';
import {SlashCommandBuilder} from 'discord.js';
import SheetController from "../Controllers/SheetController.js";

import userHash from "../userHashFunction.js";
import Cantrip from "../Character Model/Cantrip.js";
import rollParser from "./inc/poolParser.js";



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
        let {parts, diff, mods} = rollParser(interaction, helpText);

        let poolArray = parts.split('+');
        if(poolArray.length !== 2)
        {
            interaction.reply({message: poolArray.join(' + ')+' is not a valid pool', ephemeral:true});
            return;
        }
        let poolParts = [];


        for(let part of poolArray)
        {
            poolParts.push(part.toLowerCase().trim());
        }
        try
        {
            let hashHex = await userHash(interaction);

            let roll = await controller.resolveCantrip(hashHex, poolParts, mods);

            let content = `**Cantrip result:**\n**Pool:** ${roll.traits.join(' + ')}\n**Difficulty:** ${roll.diff}\n**Result:** ${roll.result}\n`;

            let normalDiceFaces =[];
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
                content += `**Nightmare Gained:** ${roll.nightmareGained}\n`;
            }
            content += `**Successes:** ${roll.successes}`;
            interaction.reply({content});
        }
        catch(e)
        {
            console.log(e);
            console.log(e.message);
            interaction.reply({content:e.message, ephemeral:true});
            return;
        }



    },
};