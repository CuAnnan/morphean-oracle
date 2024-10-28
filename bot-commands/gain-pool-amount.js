'use strict';
import {SlashCommandBuilder} from 'discord.js';
import SheetController from "../Controllers/SheetController.js";

//

import poolHelper from "./inc/poolHelper.js";

const controller = new SheetController();

export default {
    data: new SlashCommandBuilder()
        .setName('gain-pool-amount')
        .setDescription("Gains an amount of a specified pool; glamour, banality, willpower or nightmare.")
        .addStringOption(option =>
            option
                .setName('pool')
                .setDescription("The pool to set followed by a / and the amount to set it to. For example banality/0 or glamour/3")
                .setRequired(true))
    ,
    async execute(interaction) {
        poolHelper(interaction).then(({hashHex, pool, amount})=>{
            controller.getSheetByDigest(hashHex).then(
                (sheet)=>{

                    let result = sheet.gainTemporaryPool(pool, amount);
                    controller.saveSheetByDigest(hashHex).then(()=>{
                        let message = `You have gained ${amount} ${pool}`;
                        for(let change of result)
                        {
                            message += `\nYour ${change.name} is now ${change.value}`;
                        }
                        interaction.reply({content:message, ephemeral:true});
                    });
                }
            ).catch(e=>
                {
                    console.log(e);
                    interaction.reply({content:'There was an error', ephemeral:true})
                }
            );
        }).catch(e=>{
            interaction.reply({content:e, ephemeral:true});
        });
    },
};