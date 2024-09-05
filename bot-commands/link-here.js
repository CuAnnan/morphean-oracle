'use strict';

import {SlashCommandBuilder} from 'discord.js';
import MongoConnectionFactory from '../MongoConnectionFactory.js';

import userHash from "../userHashFunction.js";



export default {
    data: new SlashCommandBuilder()
        .setName('link-here')
        .setDescription("Link the Morphean Oracle here for output")
    ,
    async execute(interaction) {
        let db = MongoConnectionFactory.getInstance();
        let collection = db.collection('sheets');
        let hashHex = await userHash(interaction);
        let sheetJSON = await collection.findOne({digest:hashHex});
        if(!sheetJSON)
        {
            interaction.reply({content:"No sheet was found for you on this server", ephemeral:true});
            return;
        }

        db.collection('sheets').updateOne({digest:hashHex}, {$set:{channelId:interaction.channelId}}, {upsert:true});

        interaction.reply({content:"Channel linked", ephemeral:true});
    },
};