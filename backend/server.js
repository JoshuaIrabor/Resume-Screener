import dotenv from "dotenv";
import express from "express"
import { connnectDB } from "./lib/Mongodb.js";
import resumeRoutes from "./routes/resume.route.js";
import updateRoutes from "./routes/update.route.js";

import cors from "cors";

dotenv.config();

const PORT = process.env.PORT || 2000;
const app = express();

app.use(cors({
    origin: "http://localhost:5173", // Allow frontend
    credentials: true, // Allow cookies and auth headers
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// read files from the env files//
app.use("/api/resumes", resumeRoutes);
app.use("/api/updates", updateRoutes);

app.get("/", (req, res) => {
    res.send("Backend is running...");
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    //connnectDB();
});
