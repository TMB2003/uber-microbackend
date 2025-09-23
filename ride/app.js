const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const rideRoutes = require('./routes/ride.routes');
const connectDB = require('./db/db');
connectDB();

const cookieParser = require('cookie-parser');
const rabbit = require('./service/rabbit');
rabbit.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());    

app.use('/', rideRoutes);


module.exports = app;