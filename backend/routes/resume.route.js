import express from "express";

import { 
    resumeDownload,
    resumeUpload, 
    resumeParse,
    analyzeResume
 } from "../controllers/resume.controller.js";
import { upload } from "../lib/Cloudinary.js";

const router = express.Router();


router.post("/upload",upload.single("file"), resumeUpload);
router.post("/download", resumeDownload);
router.post("/parse", resumeParse);
router.post("/analyze",analyzeResume);


export default router;

//FWuse5MTBzxG4aGL