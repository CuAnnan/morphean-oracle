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

import ObjectCache from "./ObjectCache.js";

import * as http from 'http';

import DiscordClientContainer from "./DiscordClientContainer.js";

const port = 3030;

ObjectCache.initialise(10000);

MongoConnectionFactory.init(conf).then(async ()=>{

     DiscordClientContainer.initialise(conf).then(container=>{
         console.log("Client container initialised");
     });



    console.log("Building Express app")
    const app = express();
    app.use(logger('dev'));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/model', express.static(path.join(__dirname, 'Character Model')));

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.use(express.json());

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

