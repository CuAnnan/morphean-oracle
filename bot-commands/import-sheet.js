import {SlashCommandBuilder} from 'discord.js';
import MongoConnectionFactory from '../MongoConnectionFactory.js';
import KithainSheet from '../Character Model/GoogleKithainSheet.js';
import {nanoid} from 'nanoid';

import userHash from "../userHashFunction.js";

export default {
    data: new SlashCommandBuilder()
        .setName('fetch-sheet')
        .setDescription("Fetches the sheet from the google document")
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription("The exported URL of the sheet to fetch")
                .setRequired(true))
    ,
    async execute(interaction) {
        const url = interaction.options.getString('url').trim();
        KithainSheet.fromGoogleSheetsURL(url).then(async function(sheet){
            let sheetJSON = sheet.toJSON();
            let db = MongoConnectionFactory.getInstance();

            let hashHex = await userHash(interaction);

            db.collection('sheets').updateOne({digest:hashHex}, {$set:{sheet:sheetJSON, guildId:interaction.guildId, nanoid:nanoid()}}, {upsert:true});
            interaction.reply({content:'Your sheet has been updated.', ephemeral:true});
        }).catch((e)=>{
            console.log(e);
            interaction.reply({content:e.message, ephemeral:true});
        });
    },
};