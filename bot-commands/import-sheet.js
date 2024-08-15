import {SlashCommandBuilder} from 'discord.js';
import MongoConnectionFactory from '../MongoConnectionFactory.js';
import Sheet from '../Character Model/Sheet.js';


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
        Sheet.fromGoogleSheetsURL(url).then(function(sheet){
            let sheetJSON = sheet.toJSON();
            let db = MongoConnectionFactory.getInstance();
            db.collection('sheets').updateOne({guildId:interaction.guildId, userId:interaction.user.id}, {$set:{sheet:sheetJSON}}, {upsert:true});
            interaction.reply({content:'Your sheet has been updated.', ephemeral:true});
        }).catch((e)=>{
            logger.warn(e);
            interaction.reply({content:e.message, ephemeral:true});
        });
    },
};