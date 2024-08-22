import userHash from "../userHashFunction.js";
import {SlashCommandBuilder} from 'discord.js';
import KithainSheet from "../Character Model/KithainSheet.js";
import MongoConnectionFactory from "../MongoConnectionFactory.js";

export default {
    data: new SlashCommandBuilder()
        .setName('reload-sheet')
        .setDescription("reloads the sheet")
    ,
    async execute(interaction) {
        const hashHex = await userHash(interaction);
        const db = MongoConnectionFactory.getInstance();
        const {sheet} = await db.collection('sheets').findOne({digest:hashHex});
        if(!sheet)
        {
            interaction.reply({message:"No sheet has been found for you on this server.", ephemeral:true});
            return;
        }

        KithainSheet.fromGoogleSheetsURL(sheet.url).then(async function(sheet){
            let sheetJSON = sheet.toJSON();
            db.collection('sheets').updateOne({digest:hashHex}, {$set:{sheet:sheetJSON, guildId:interaction.guildId}}, {upsert:true});
            interaction.reply({content:'Your sheet has been updated.', ephemeral:true});
        }).catch((e)=>{
            interaction.reply({content:e.message, ephemeral:true});
        });

    },
};