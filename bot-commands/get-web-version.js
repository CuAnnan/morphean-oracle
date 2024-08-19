import userHash from "../userHashFunction.js";
import {SlashCommandBuilder} from 'discord.js';
import { createRequire } from "module";
import KithainSheet from "../Character Model/KithainSheet.js";
import MongoConnectionFactory from "../MongoConnectionFactory.js";
import QRCode from 'qrcode'

const require = createRequire(import.meta.url);
const {webPresence} = require('../conf.json');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
// ...


export default {
    data: new SlashCommandBuilder()
        .setName('get-web-sheet')
        .setDescription("Fetches the html version of the sheet with all the cantrips")
    ,
    async execute(interaction) {
        const hashHex = await userHash(interaction);
        const url = `${webPresence}/sheets/view/${hashHex}`;
        const db = MongoConnectionFactory.getInstance();
        const {sheet} = await db.collection('sheets').findOne({digest:hashHex});
        if(!sheet)
        {
            interaction.reply({message:"No sheet has been found for you on this server.", ephemeral:true});
        }

        const qrCode = await QRCode.toDataURL(url);
        const bufferedQRCode = new Buffer.from(qrCode.split(",")[1], "base64");
        const qrCodeAsDiscordAttachment = new AttachmentBuilder(bufferedQRCode).setName('qrcode.png');

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(sheet.name)
            .setURL(url)
            .setDescription('Your QR Code:')
            .setImage('attachment://qrcode.png');

        interaction.reply({ embeds: [embed], files:[qrCodeAsDiscordAttachment], ephemeral:true });
    },
};