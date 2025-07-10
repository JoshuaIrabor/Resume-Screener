import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary"; // Import CloudinaryStorage
import { v2 as cloudinary } from "cloudinary"; // Import Cloudinary
import dotenv from "dotenv"; // To load environment variables

dotenv.config(); // Load environment variables from .env file

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary, 
  params: {
    folder: "uploads", 
    resource_type: "raw", // Ensure it works for non-image files like PDFs
    access_mode: "public", // Ensure file is publicly accessible
    format: async (req, file) => "pdf", 
    public_id: (req, file) => `${Date.now()}-${file.originalname.split(".")[0]}`,
  },
});


// Set up multer to use CloudinaryStorage
export const upload = multer({ storage });

export default upload;
