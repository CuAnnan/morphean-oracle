'use strict';

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

import express from 'express';
import logger from 'morgan';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';

import sheetsRoute from './routes/sheets.js';
import indexRoute from './routes/index.js';


import * as http from 'http';

const port = 3030;


MongoConnectionFactory.init(conf).then(async ()=>{

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.commands = new Collection();

    for (const file of commandFiles) {
        const module = await import(`./bot-commands/${file}`);
        const command = module.default;

        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.error(`Discord-Bot: The command at ${file} is missing a required "data" or "execute" property.`);
        }
    }

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

    console.log("")
    // Log in to Discord with your client's token
    client.login(conf.token)
        .then(()=>{
            console.log("Login resolved");
        });


    console.log("Building Express app")
    const app = express();
    app.use(logger('dev'));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.use('/', indexRoute);
    app.use('/sheets/', sheetsRoute);




    app.use(function(req, res, next) {
        next(createError(404));
    });

    app.use(function(err, req, res, next) {
        console.warn(err.message);
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });



    app.set('port', port);
    console.log("Hoisting http server");
    const server = http.createServer(app);
    server.listen(port);
    server.on('error', (error)=>{
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
    server.on('listening', ()=>{
        const addr = server.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        console.log('Listening on ' + bind);
    })


});

