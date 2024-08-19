'use strict';
import express from 'express';

const router = express.Router();

router.get('/', (req, res, next)=>{
    res.send('Hello world');
});

export default router;