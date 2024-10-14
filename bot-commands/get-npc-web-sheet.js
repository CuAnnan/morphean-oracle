import userHash from "../userHashFunction.js";
import {SlashCommandBuilder} from 'discord.js';
import { createRequire } from "module";
import MongoConnectionFactory from "../MongoConnectionFactory.js";
import QRCode from 'qrcode'

const require = createRequire(import.meta.url);
const {webPresence} = require('../conf.json');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
// ...


export default {
    data: new SlashCommandBuilder()
        .setName('get-npc-sheet')
        .setDescription('Get an NPC sheet')
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription("The name of the npc to fetch")
                .setRequired(true))
    ,
    async execute(interaction) {
        if(interaction.member.roles.cache.some(role=>role.name.toLowerCase()==='storyteller')) {
            const db = MongoConnectionFactory.getInstance();
            const name = interaction.options.getString('name');
            const {nanoid, sheet} = await db.collection('npcs').findOne({name: name.toLowerCase()});

            if (!sheet) {
                interaction.reply({
                    message: `No NPC sheet has been found for ${name} on this server.`,
                    ephemeral: true
                });
                return;
            }

            const url = `${webPresence}/npcs/view/${nanoid}`;

            const qrCode = await QRCode.toDataURL(url);
            const bufferedQRCode = new Buffer.from(qrCode.split(",")[1], "base64");
            const qrCodeAsDiscordAttachment = new AttachmentBuilder(bufferedQRCode).setName('qrcode.png');

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(sheet.name)
                .setURL(url)
                .setDescription('Your QR Code:')
                .addFields({name: 'Your link', value: url})
                .setImage('attachment://qrcode.png');

            interaction.reply({embeds: [embed], files: [qrCodeAsDiscordAttachment], ephemeral: true});
        }else{
            interaction.reply({message:"That command requires the Storyteller role", ephemeral:true});
        }
    },
};