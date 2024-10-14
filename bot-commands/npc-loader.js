import {SlashCommandBuilder} from 'discord.js';
import MongoConnectionFactory from '../MongoConnectionFactory.js';
import KithainSheet from '../Character Model/GoogleKithainSheet.js';
import {nanoid} from 'nanoid';

import userHash from "../userHashFunction.js";

export default {
    data: new SlashCommandBuilder()
        .setName('load-npc')
        .setDescription("Load's an NPC sheet from the google document")
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription("The exported URL of the sheet to fetch")
                .setRequired(true))
    ,
    async execute(interaction) {
        if(interaction.member.roles.cache.some(role=>role.name.toLowerCase()==='storyteller'))
        {
            const url = interaction.options.getString('url').trim();
            KithainSheet.fromGoogleSheetsURL(url).then(async function(sheet){
                let sheetJSON = sheet.toJSON();
                let db = MongoConnectionFactory.getInstance();
                db.collection('npcs').updateOne({name:sheet.name.trim().toLowerCase()}, {$set:{sheet:sheetJSON, guildId:interaction.guildId, nanoid:nanoid()}}, {upsert:true});
                interaction.reply({content:`Your npc, ${sheet.name}, has been loaded.`, ephemeral:true});
            }).catch((e)=>{
                console.log(e);
                interaction.reply({content:e.message, ephemeral:true});
            });
        }
        else
        {
            interaction.reply({content:"That command needs the storyteller role", ephemeral:true});
        }
    },
};