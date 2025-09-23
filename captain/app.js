const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const captainRoutes = require('./routes/captain.routes');
const connectDB = require('./db/db');
connectDB();

const rabbit = require('./service/rabbit');
rabbit.connect();



app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

app.use('/', captainRoutes)



module.exports = app;