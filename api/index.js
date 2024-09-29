import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import sequelize from './database.js';
import cors from 'cors';

dotenv.config();


import authRouter from './routes/auth.route.js';
import eventRouter from './routes/event.route.js';
import bookingRouter from './routes/booking.route.js';

const app = express();
app.use(express.json(
  {
    'limit': '800mb',
  }
));
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173'],
    credentials: true,
}));



sequelize.sync() 
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
});


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});


app.use('/api/admin', authRouter);
app.use('/api/events',eventRouter);
app.use('/api/bookings',bookingRouter);


app.use((err,req,res,next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    })
  })
