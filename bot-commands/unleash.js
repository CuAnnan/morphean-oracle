'use strict';
import {SlashCommandBuilder} from 'discord.js';
import SheetController from "../Controllers/SheetController.js";

import userHash from "../userHashFunction.js";
import rollParser from "./inc/poolParser.js";



const helpText = '***roll syntax***\n\n\
/unleash  <Art> [vs <diff>]\n\
This will Unleash an Art and do all of the character modifications involved. Fill in the art name vs the diff. If the Unleashing roll needs to be modified, then press tab to go to modifiers. Then fill in space separated modifiers:\
 "wy" or "wyrd", "wi" or "willpower".' ;

const controller = new SheetController();


export default {
    data: new SlashCommandBuilder()
        .setName('unleash')
        .setDescription("Unleash a cantrip")
        .addStringOption(option =>
            option
                .setName('pool')
                .setDescription("The art Unleash vs the difficulty.")
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('modifiers')
                .setDescription('A space separated list of modifiers.'))
    ,
    async execute(interaction) {
        await interaction.deferReply();
        try
        {
            let {parts, diff, mods} = rollParser(interaction, helpText);
            let hashHex = await userHash(interaction);

            let roll = await controller.resolveUnleashing(hashHex, parts, diff, mods);

            let content = `**Unleashing result:**\n**Pool:** ${roll.traits.join(' + ')}\n**Difficulty:** ${roll.diff}\n**Result:** ${roll.result}\n`;

            if(roll.normalDice.length > 0)
            {
                let normalDiceFaces =[];
                for(let die of roll.normalDice)
                {
                    for(let face of die.faces)
                    {
                        normalDiceFaces.push(face);
                    }
                }
                content += `**Normal dice:** ${normalDiceFaces.join(', ')}\n`;
            }

            if(roll.nightmareDice.length > 0)
            {
                let nightmareDice = [];
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

            await interaction.editReply(content);
        }
        catch(e)
        {
            await interaction.editReply({content:e.message, ephemeral:true});
        }
    },
};