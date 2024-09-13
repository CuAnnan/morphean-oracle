'use strict';
import express from 'express';
import ObjectCache from "../ObjectCache.js";

const router = express.Router();

router.get('/', (req, res, next)=>{
    res.send('Hello world');
});

router.get('/cache', (req, res, next)=>{

    let oc = ObjectCache.getInstance();
    res.json(oc.debugJSON);
});

export default router;