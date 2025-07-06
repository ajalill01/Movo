require('dotenv').config();
const mongoose= require("mongoose");

const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.DATABASEURL);
        console.log("MongoDB connected");
        console.log("MONGODB_URI from env:", process.env.DATABASEURL);
    }catch(err){
        console.error(err.message);
        process.exit(1);
    }
}

module.exports=connectDB;