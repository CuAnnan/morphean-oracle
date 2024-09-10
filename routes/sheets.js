'use strict';
import express from 'express';
import SheetController from "../Controllers/SheetController.js";
import userHash from "../userHashFunction.js";
import Sheet from "../Character Model/Sheet.js";

const router = express.Router();
const controller = new SheetController();

router.get('/view/:hash', (req, res, next)=>{
    controller.showSheet(req, res).catch(next);
});

router.post('/roll/:hash', (req, res, next)=>{
    controller.handleRollFetchRequest(req, res).catch((err)=>{
        res.json(err);
        console.log(err);
    });
});

router.get('/fetchJSON/:hash', (req, res, next)=>{
    controller.fetchSheetJSON(req, res).catch((err)=>{
        console.log(err);
        res.json({err});
    });
});

router.get('/cantrip/:hash', (req, res, next)=>{
    contrller.handleCantripFetchRequest(req, res).catch(err=>{
        console.log(err);
        res.json({err});
    })
});


export default router;