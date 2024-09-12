import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import {Client, Collection, Events, GatewayIntentBits} from "discord.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, 'bot-commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];



class DiscordClientContainer
{
    static #client;
    static #initialised = false;

    static get client()
    {
        if(!this.#client || !this.#initialised)
        {
            throw new Error('Client not insitialised');
        }
        return this.#client;
    }

    static async initialise(conf)
    {
        if(this.#initialised)
        {
            return this;
        }

        for (const file of commandFiles)
        {
            const module = await import(`./bot-commands/${file}`);
            const command = module.default;

            if ('data' in command && 'execute' in command) {
                commands.push(command);
            } else {
                console.error(`Discord-Bot: The command at ${file} is missing a required "data" or "execute" property.`);
            }
        }

        const client = new Client({ intents: [GatewayIntentBits.Guilds] });

        client.commands = new Collection();

        for (const command of commands)
        {
            client.commands.set(command.data.name, command);
        }
        console.log("Adding command event listener");
        client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.warn(`Discord-Bot: No command matching ${interaction.commandName} was found. May be from a different bot.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Discord-Bot: '+ error.message);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        });

        client.once(Events.ClientReady, readyClient => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}, connecting to`);
        });

        // Log in to Discord with your client's token
        await client.login(conf.token);
        console.log("Login resolved");
        this.#client = client;
        this.#initialised = true;
        return this;
    }

}

export default DiscordClientContainer;