const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blacklistTokenModel = require('../models/blacklisttoken.model');
const rabbit = require('../service/rabbit');

// In-memory queue for user long-poll requests to get rides
const pendingRidePolls = [];

module.exports.register = async (req, res) => {
    try{
        const {name, email, password} = req.body;
        const user = await userModel.findOne({email});

        if(user){
            return res.status(400).json({ message: 'User already exists'});
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = new userModel({name, email, password: hash});

        await newUser.save();

        const token = jwt.sign({id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '10h'});

        delete newUser._doc.password;
        
        res.cookie('token', token);

        res.send({ token, newUser });
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

        delete user._doc.password;

        res.cookie('token', token);

        res.send({ token, user });
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

module.exports.getProfile = async (req, res) => {
    try{
        const user = await userModel.findById(req.user.id);
        if(!user){
            return res.status(404).json({ message: 'User not found'});
        }
        delete user._doc.password;
        res.send(user);
    }catch(error){
        return res.status(500).json({ message: error.message});
    }
}

module.exports.getRides = async (req, res) => {
    try {
        const timeoutMs = 25000;
        let settled = false;

        const resolveFn = (payload) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.status(200).json(payload);
        };

        pendingRidePolls.push(resolveFn);

        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            const idx = pendingRidePolls.indexOf(resolveFn);
            if (idx !== -1) pendingRidePolls.splice(idx, 1);
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.status(204).send();
        }, timeoutMs);
    } catch (error) {
        return res.status(500).json({ message: error.message});
    }
}

// Subscribe once to ride.created and flush pending user polls
rabbit.subscribeToRabbitMQ('ride.created', (ride) => {
    try {
        if (pendingRidePolls.length > 0) {
            const listeners = pendingRidePolls.splice(0, pendingRidePolls.length);
            listeners.forEach((resolveFn) => {
                try { resolveFn({ ride }); } catch (_) {}
            });
        }
    } catch (err) {
        console.error('Error delivering ride to user polls:', err);
    }
});
