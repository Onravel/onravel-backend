import "dotenv/config";
import express from "express";

// Routes
import userRoutes from './routes/user.js';
import managementRoutes from "./routes/admin/management.js";
import productRoutes from "./routes/admin/product.js"

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
       origin: [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
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
app.use('/api/admin/management', managementRoutes);
app.use('/api/product', productRoutes);

app.listen(PORT, ()=>{console.log(`backend running at ${PORT}`)})