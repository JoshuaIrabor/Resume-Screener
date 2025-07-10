import mongoose from "mongoose";

//connect to database//
export const connnectDB = async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    }catch(error){
        console.error("Error connection to MongoDB", error.message);
        process.exit(1);
    }
}