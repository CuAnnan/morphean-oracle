import userHash from "../userHashFunction.js";
import {SlashCommandBuilder} from 'discord.js';
import { createRequire } from "module";
import MongoConnectionFactory from "../MongoConnectionFactory.js";
import QRCode from 'qrcode';

const require = createRequire(import.meta.url);
const {webPresence} = require('../conf.json');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

export default {
    data: new SlashCommandBuilder()
        .setName('get-player-sheet')
        .addStringOption(option=>
            option
                .setName('player-name')
                .setDescription("@<the player>")
                .setRequired(true)
        )
        .setDescription("Staff only function to get a player's sheet.")
    ,
    async execute(interaction) {
        let storyTellerRole =interaction.member.roles.cache.find(role=>role.name==='Storyteller');
        if(!storyTellerRole)
        {
            interaction.reply({content:'You do not have sufficient permissions to run this command', ephemeral:true});
            return;
        }


        const hashHex = await userHash(interaction);
        const db = MongoConnectionFactory.getInstance();

        let target = interaction.options.getString('player-name');


        let match = target.match(/<@(\d+)>/);
        if(match)
        {
            const member = await interaction.guild.members.fetch(match[1]);

            const searchObject = {guildId:interaction.guild.id, user:{id:member.user.id}};
            const hashHex = await userHash(searchObject);

            const {nanoid, sheet}= await db.collection('sheets').findOne({digest:hashHex});

            if(!sheet)
            {
                interaction.reply({message:"No sheet has been found for you on this server.", ephemeral:true});
                return;
            }

            const url = `${webPresence}/sheets/view/${nanoid}`;

            const qrCode = await QRCode.toDataURL(url);
            const bufferedQRCode = new Buffer.from(qrCode.split(",")[1], "base64");
            const qrCodeAsDiscordAttachment = new AttachmentBuilder(bufferedQRCode).setName('qrcode.png');

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(sheet.name)
                .setURL(url)
                .setDescription('Your QR Code:')
                .addFields({ name: 'Your link', value: url})
                .setImage('attachment://qrcode.png');

            interaction.reply({ embeds: [embed], files:[qrCodeAsDiscordAttachment], ephemeral:true });
        }



    },
};