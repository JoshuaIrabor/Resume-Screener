import dotenv from "dotenv";
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { parsePdf } from '../middleware/Parsing.js'; // import your PDF parser
import { parseDocx } from '../middleware/Parsing.js'; // import your DOCX parser
import OpenAI from "openai";
import {redis} from "../lib/redis.js";
import crypto from "crypto";  



dotenv.config();
let isDownloading = false;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
  export const resumeUpload = async (req, res) => {
    try {
      const file = req.file; // The file object provided by Multer
      const startTime = Date.now();
  
      // Check if the file exists in the request
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
  
      // Log the file object to verify what properties are available
      console.log('Uploaded file:', file);
      // Calculate the total response time
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Log the response time
      console.log("API Response Time:", responseTime, "ms");
  
      // If the file has been successfully uploaded, it should contain the URL
      return res.json({
        message: "File uploaded successfully",
        url: file.path, // file.path should contain the Cloudinary URL
      });
  
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Failed to upload file" });
    }
  };

export const resumeDownload = async (req, res) => {
  const startTime = Date.now();
  const { fileUrl } = req.body;

  try {
    if (isDownloading) {
      return res.status(400).json({ error: "A file is already being downloaded. Please try again later." });
    }

    if (!fileUrl) {
      return res.status(400).json({ error: "File URL is required" });
    }

    const urlHash = crypto.createHash("sha256").update(fileUrl).digest("hex");
    const cacheKey = `resume-analysis:${urlHash}`;

    try {
      const cachedResponse = await redis.get(cacheKey);
      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        console.log("Cache hit");
        console.log("Response time (cache):", responseTime, "ms");

        isDownloading = false; // Important: release lock on cache hit
        return res.json(JSON.parse(cachedResponse));
      }
    } catch (err) {
      console.error("Redis get error:", err.message);
    }

    // Set the lock to prevent concurrent downloads
    isDownloading = true;

    // Create temp directory if not exists
    const tempDir = "./temp";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Clean up old files
    try {
      const existingFiles = fs.readdirSync(tempDir);
      for (const file of existingFiles) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    } catch (err) {
      console.warn("Failed to clean temp directory:", err.message);
    }

    // Decode the filename from URL
    let decodedFileName;
    try {
      decodedFileName = decodeURIComponent(path.basename(new URL(fileUrl).pathname))
        .replace(/%20/g, ' ')
        .replace(/%28/g, '(')
        .replace(/%29/g, ')')
        .replace(/^\d+-/, '');
    } catch (err) {
      isDownloading = false;
      return res.status(500).json({ error: "Error decoding file name" });
    }

    const localFilePath = path.join(tempDir, decodedFileName);
    console.log("Downloading to:", localFilePath);

    try {
      const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(localFilePath, response.data);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      console.log("File downloaded and saved");
      console.log("Response time:", responseTime, "ms");

      // Cache the result
      await redis.setex(cacheKey, 3600, JSON.stringify({ filePath: localFilePath }));

      isDownloading = false;
      return res.json({
        message: "File downloaded and saved successfully",
        filePath: localFilePath
      });

    } catch (downloadError) {
      console.error("Download error:", downloadError.message);
      isDownloading = false;
      return res.status(500).json({ error: "Failed to download file" });
    }

  } catch (error) {
    console.error("Internal error:", error.message);
    isDownloading = false;
    return res.status(500).json({ error: "Internal server error" });
  }
};
  
  export const resumeParse = async (req, res) => {
    try {
      const { filePath } = req.body; // Get the file path from the request body
  
      // Validate if the filePath is provided
      if (!filePath) {
        return res.status(400).json({ error: "File path is required" });
      }

      const rawBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256").update(rawBuffer).digest("hex");
      const cacheKey = `resume-analysis:${hash}`;

      const startTime = Date.now();

      try {
        const cachedResponse = await redis.get(cacheKey);
      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        console.log("Cache hit");
        console.log("Response time (cache):", responseTime, "ms");
      return res.json(JSON.parse(cachedResponse));
        }
      }catch (err) {
        console.error("Redis get error:", err.message);
      }
  
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        return res.status(400).json({ error: "File does not exist" });
      }
  
      // Get the file name and extension
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(fileName).toLowerCase();
  
      let fileContent;
  
      // Parse the file based on its extension
      if (fileExtension === '.pdf') {
        fileContent = await parsePdf(filePath); // Parse PDF
      } else if (fileExtension === '.docx') {
        fileContent = await parseDocx(filePath); // Parse DOCX
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }
  
      // Log the raw parsed content before sanitizing
      
      
      const normalizedContent = fileContent.toLowerCase().replace(/\s+/g, " "); // Normalize spaces
      //console.log(normalizedContent);  // Debugging output

    // Define stop sections dynamically


    // Regex for extracting "skills" section
  const skillsMatch = normalizedContent.match(
    /(skills|key skills|core competencies|technical skills|areas of expertise)\s*([\s\S]*?)(?=(?:\s*(?:experience|work history|education|projects|summary|references|$)))/i
  );
  //console.log(fileContent);  // Debugging output

  const skills = skillsMatch
    ? skillsMatch[2]
      .split(/[\n•\-–,]/) // Handle bullets, dashes, and commas
      .map(line => line.trim())
      .filter(line => line)
      .join(", ") // Join skills with commas
  : "No skills found";

  // Regex for extracting "experience" section
  const experienceMatch = normalizedContent.match(
    /(experience|work history|professional experience)\s*([\s\S]*?)(?=(?:\s*(?:education|references|projects|$)))/i
  );
 

  const experience = experienceMatch
  ? experienceMatch[2]
      .split(/[\n•\-–,]/) // Handle bullet points, newlines, commas, etc.
      .map(line => line.trim())
      .filter(line => line)
      .join(", ") // Join experience items with commas
  : "No experience found";


      await redis.setex(cacheKey, 3600, JSON.stringify({
        success: true,
        skills: skills,
        experience: experience,
      }));
      return res.json({
        message: "File parsed successfully",
        skills: skills,
        experience: experience,
      });
  
    } catch (error) {
      console.error("Error parsing the resume:", error.message);
      return res.status(500).json({ error: "Internal server error during parsing" });
    }
  };

  export const analyzeResume = async (req, res) => {
   
    const { skills, experience, JobDescription, Requirements } = req.body;
    
    try {
      // Validate input
      if (!skills || !experience) {
        return res.status(400).json({ error: "Skills and experience are required." });
      }
  
      const inputString = `${skills}|${experience}|${JobDescription}|${Requirements}`;
      const hash = crypto.createHash("sha256").update(inputString).digest("hex");
      const cacheKey = `resume-analysis:${hash}`;

      const startTime = Date.now();

    try {
      const cachedResponse = await redis.get(cacheKey);
    if (cachedResponse) {
      const responseTime = Date.now() - startTime;
      console.log("Cache hit");
      console.log("Response time (cache):", responseTime, "ms");
    return res.json(JSON.parse(cachedResponse));
      }
    } catch (err) {
      console.error("Redis get error:", err.message);
    }//

  
     
  
      // Call OpenAI GPT API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI model that compares a resume's skills and experience to a job description and requirements to determine how well they match. You will analyze the resume as a real-world recruiter would.",
        },
        {
          role: "user",
          content: `
            Job Description:
            ${JobDescription}

            Requirements:
            ${Requirements}

            Resume Skills:
            ${skills}

            Resume Experience:
            ${experience}

            Please provide a descriptive and detailed feedback with a match score based on how well the resume's skills and experience align with the job description and requirements. (Remove any asterisk from your response)
            Rate the match from 1 to 10, where 1 means no match and 10 means a perfect match.
            Provide descriptive and detailed on how to better tailor the resume to the job provided. List any missing skills that the resume does not have. Also, provide suggestions on how the resume can reach a 10/10 and no asterisk. And Always start your response with "Match Score: /10" 
          `
        }
      ],
      max_tokens: 500,
    });

    const modelOutput = response.choices[0].message.content;
    
   


    // Extract Match Score and analysis
    const matchScore = modelOutput.match(/Match Score:\s*\d+\/\d+/i)?.[0] || "No match score found";
    const cleanOutput = modelOutput.match(/Match Score:\s*\d+\/\d+\s*([\s\S]*)/i);
    //console.log(cleanOutput);
        // Calculate the total response time
    
    if (cleanOutput && cleanOutput[1]) {
      const matchDetails = cleanOutput[1];


       

    // Cache the result for future requests (expires in 1 hour)
      await redis.setex(cacheKey, 3600, JSON.stringify({
        success: true,
        matchScore,
        analysis: matchDetails,
      }));
      return res.json({
        success: true,
        matchScore,
        analysis: matchDetails,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Match Score not found in the response",
      });
    }
  } catch (error) {
    console.error("OpenAI Error:", error);
    return res.status(500).json({
      success: false,
      message: "OpenAI API request failed.",
      error: error.message || error,
    });
  }
};


  
  
  