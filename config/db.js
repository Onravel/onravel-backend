import mongoose from 'mongoose'

  const connectDB = async () => {
   try{
    await mongoose.connect(process.env.NODE_ENV === 'production' ? process.env.MONGO_URI : 'mongodb://127.0.0.1:27017/onravel', );
    console.log("MongoDB connected");

   }catch(err){
    console.error(err)
    process.exit(1);
   }
}



export default connectDB;