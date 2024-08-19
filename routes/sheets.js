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


export default router;