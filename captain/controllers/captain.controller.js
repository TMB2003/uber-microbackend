const captainModel = require('../models/captain.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blacklistTokenModel = require('../models/blacklisttoken.model');

module.exports.register = async (req, res) => {
    try{
        const {name, email, password} = req.body;
        const captain = await captainModel.findOne({email});

        if(captain){
            return res.status(400).json({ message: 'Captain already exists'});
        }

        const hash = await bcrypt.hash(password, 10);
        const newcaptain = new captainModel({name, email, password: hash});

        await newcaptain.save();

        const token = jwt.sign({id: newcaptain._id }, process.env.JWT_SECRET, { expiresIn: '10h'});

        delete newcaptain._doc.password;
        
        res.cookie('token', token);

        res.send({ token, newcaptain });
    }catch(error){
        return res.status(500).json({ message: error.message});
    }
}

module.exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;
        const captain = await captainModel.findOne({email});

        if(!captain){
            return res.status(400).json({ message: 'Invalid email or password'});
        }

        const isMatch = await bcrypt.compare(password, captain.password);

        if(!isMatch){
            return res.status(400).json({ message: 'Invalid email or password'});
        }

        const token = jwt.sign({id: captain._id }, process.env.JWT_SECRET, { expiresIn: '10h'});

        delete captain._doc.password;

        res.cookie('token', token);

        res.send({ token, captain });
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
        res.send({ message: 'Captain logged out successfully'});
    }catch(error){
        return res.status(500).json({ message: error.message});
    }
}

module.exports.getProfile = async (req, res) => {
    try{
        const captain = await captainModel.findById(req.captain.id);
        if(!captain){
            return res.status(404).json({ message: 'Captain not found'});
        }
        delete captain._doc.password;
        res.send(captain);
    }catch(error){
        return res.status(500).json({ message: error.message});
    }
}
