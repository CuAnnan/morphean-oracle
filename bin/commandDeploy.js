import fs from 'fs';
import { REST, Routes } from 'discord.js';

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const conf = require('../conf.json');
let {clientId, token} = conf;


const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./bot-commands').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    const module = await(import(`../bot-commands/${file}`));
    const command = module.default;
    commands.push(command.data.toJSON());
}


// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );
        
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
