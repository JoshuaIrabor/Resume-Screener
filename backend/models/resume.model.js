import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    name: { 
        type: String,
        required: true
    },
    email: { 
        type: String,
        required: true,
        unique: true, // Ensure email is unique
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email validation regex
    },
    url: { 
        type: String,
        required: true // Cloudinary resume URL
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", ResumeSchema);
