'use strict';
import express from 'express';
import SheetController from "../Controllers/SheetController.js";
import userHash from "../userHashFunction.js";
import Sheet from "../Character Model/Sheet.js";

const router = express.Router();
const controller = new SheetController();

router.get('/view/:hash', (req, res, next)=>{
    controller.showNPCSheet(req, res).catch(next);
});

router.get('/fetchJSON/:hash', (req, res, next)=>{
    controller.fetchNPCSheetJSON(req, res).catch((err)=>{
        console.log(err);
        res.json({err});
    });
});

router.get('/qrcode/:hash', (req, res, next)=>{
    controller.fetchNPCQrCode(req, res).catch((err)=>{
        console.log(err);
        res.json({err});
    });
});

export default router;