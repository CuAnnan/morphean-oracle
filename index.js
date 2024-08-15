import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import MongoConnectionFactory from './MongoConnectionFactory.js';

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const conf = require('./conf.json');

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, 'bot-commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));



MongoConnectionFactory.init(conf).then(async ()=>{
    
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.commands = new Collection();

    for (const file of commandFiles) {
        const module = await import(`./bot-commands/${file}`);
        const command = module.default;

        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            console.log("Hoisting command "+command.data.name);
            client.commands.set(command.data.name, command);
            console.log("Command hoisted");
        } else {
            console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
        }
    }

    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;


        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found. May be from a different bot.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.log(error.message);
            console.log(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    });


    client.once(Events.ClientReady, readyClient => {
        console.log(`Ready! Logged in as ${readyClient.user.tag}, connecting to`);

    });

    // Log in to Discord with your client's token
    client.login(conf.token);
});

