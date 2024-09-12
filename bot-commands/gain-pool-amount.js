import userHash from "../userHashFunction.js";
import {SlashCommandBuilder} from 'discord.js';
import { createRequire } from "module";
import MongoConnectionFactory from "../MongoConnectionFactory.js";
import QRCode from 'qrcode'
import KithainSheet from "../Character Model/KithainSheet.js";

const require = createRequire(import.meta.url);
const {webPresence} = require('../conf.json');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
// ...


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
        const db = MongoConnectionFactory.getInstance();
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

        db.collection('sheets').findOne({digest:hashHex}).then(
            sheetJSON=>{
                if(!sheetJSON)
                {
                    interaction.reply({content:"No sheet was found for you on this server", ephemeral:true});
                    return;
                }
                KithainSheet.fromJSON(sheetJSON.sheet).then(
                    /**
                     * @param sheet {KithainSheet}
                     */
                    function(sheet){
                        let result = sheet.gainTemporaryPool(pool, amount);
                        let message = `You have gained ${amount} ${pool}`;
                        for(let change of result)
                        {
                            message += `\nYour ${change.name} is now ${change.value}`;
                        }
                        interaction.reply({content:message, ephemeral:true});
                    }
                );
            }
        ).catch(e=>
            {
                interaction.reply({content:'There was an error', ephemeral:true})
            }
        );
    },
};