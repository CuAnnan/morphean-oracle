import userHash from "../userHashFunction.js";
import {SlashCommandBuilder} from 'discord.js';
import { createRequire } from "module";
import QRCode from 'qrcode';
import SheetController from "../Controllers/SheetController.js";

const require = createRequire(import.meta.url);
const {webPresence} = require('../conf.json');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
// ...

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
        const hashHex = await userHash(interaction);
        let args = interaction.options.getString('pool').toLowerCase();

        if(!args.match(/[a-z]+\/\d+/))
        {
            interaction.reply({content:'The format of the set-pool-command option is <pool>/<amount>. Pool can be one of banality, glamour, willpower, or nightmare. Amount must be a number.', ephemeral:true});
            return;
        }

        let [pool, amount] = args.split('/');
        amount = parseInt(amount);
        if(['glamour','willpower','banality','nightmare'].indexOf(pool) < 0)
        {
            interaction.reply({content:'The only valid pools for this command are glamour, willpower, banality, and nightmare.', ephemeral:true});
            return;
        }

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
                interaction.reply({content:'There was an error', ephemeral:true})
            }
        );
    },
};