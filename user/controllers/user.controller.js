const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blacklistTokenModel = require('../models/blacklisttoken.model');

module.exports.register = async (req, res) => {
    try{
        const {name, email, password} = req.body;
        const user = await userModel.findOne({email});

        if(user){
            return res.status(400).json({ message: 'User already exists'});
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = new userModel({name, email, password});

        await newUser.save();

        const token = jwt.sign({id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '10h'});

        res.cookie('token', token);

        res.send({ message: 'User registered successfully'});
    }catch(error){
        return res.status(500).json({ message: error.message});
    }
}

module.exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;
        const user = await userModel.findOne({email});

        if(!user){
            return res.status(400).json({ message: 'Invalid email or password'});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({ message: 'Invalid email or password'});
        }

        const token = jwt.sign({id: user._id }, process.env.JWT_SECRET, { expiresIn: '10h'});

        res.cookie('token', token);

        res.send({ message: 'User logged in successfully'});
    }catch(error){
        return res.status(500).json({ message: error.message});
    }
}

module.exports.logout = async (req, res) => {
    try{
        const token = req.cookies.token;
        const blacklistToken = new blacklistTokenModel({token});
        await blacklistToken.save();
        res.clearCookie('token');
        res.send({ message: 'User logged out successfully'});
    }catch(error){
        return res.status(500).json({ message: error.message});
    }
}
