const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const userRoutes = require('./routes/user.routes');
const connectDB = require('./db/db');

connectDB();


app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

app.use('/', userRoutes)



module.exports = app;