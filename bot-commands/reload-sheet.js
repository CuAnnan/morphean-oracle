import userHash from "../userHashFunction.js";
import {SlashCommandBuilder} from 'discord.js';
import Sheet from "../Character Model/GoogleKithainSheet.js";
import MongoConnectionFactory from "../MongoConnectionFactory.js";
import SheetController from "../Controllers/SheetController.js";
let controller = new SheetController();

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

        Sheet.fromGoogleSheetsURL(sheet.url).then(async function(sheet){
            let sheetJSON = sheet.toJSON();
            db.collection('sheets').updateOne({digest:hashHex}, {$set:{sheet:sheetJSON, guildId:interaction.guildId}}, {upsert:true}).then(()=>{
                controller.getSheetByDigest(hashHex, true).then(
                    ()=>{
                        interaction.reply({content:'Your sheet has been updated.', ephemeral:true});
                    }
                );
            });

        }).catch((e)=>{
            interaction.reply({content:e.message, ephemeral:true});
        });

    },
};