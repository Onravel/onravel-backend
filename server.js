import "dotenv/config";
import express from "express";
import userRoutes from './routes/user.js';
import passport from './config/passport.js';
import connectDB from './config/db.js';
import cors from 'cors';
import cookieParser from "cookie-parser";

const PORT = 5000;
connectDB();


const app = express()
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());



app.get('/', (req, res)=>{
     res.status(200).json({
      success: true,
      message: 'you have reached your onravel end point',
     })
})

app.use('/api/user', userRoutes);

app.listen(PORT, ()=>{console.log(`backend running at ${PORT}`)})