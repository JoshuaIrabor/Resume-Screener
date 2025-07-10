import express from "express";
import { tailorResume, generateCoverLetter  } from "../controllers/update.controller.js";

const router = express.Router();

router.post("/update", tailorResume);
router.post("/generate", generateCoverLetter);


export default router;