const captainModel = require('../models/captain.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blacklistTokenModel = require('../models/blacklisttoken.model');
const rabbit = require('../service/rabbit');

// In-memory queue of pending long-poll responses
// Each entry is a function that, when called with a payload, responds and clears its own timeout
const pendingPolls = [];

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

module.exports.toggleAvailability = async (req, res) => {
    try{
        const captain = await captainModel.findById(req.captain.id);
        if(!captain){
            return res.status(404).json({ message: 'Captain not found'});
        }
        captain.isAvailable = !captain.isAvailable;
        await captain.save();
        res.send(captain);
    }catch(error){
        return res.status(500).json({ message: error.message});
    }
}

// Subscribe once to the 'ride.created' queue and flush any pending long-poll requests
rabbit.subscribeToRabbitMQ('ride.created', (newRide) => {
    try {
        console.log('Ride received:', newRide);
        // Flush and resolve all pending polls with the new ride
        if (pendingPolls.length > 0) {
            const listeners = pendingPolls.splice(0, pendingPolls.length);
            listeners.forEach((resolveFn) => {
                try {
                    resolveFn({ ride: newRide });
                } catch (e) {
                    // Best-effort; if a response already ended, ignore
                }
            });
        }
    } catch (err) {
        console.error('Error delivering ride to pending polls:', err);
    }
});

// Long-poll endpoint: waits up to timeout for a new ride, otherwise returns 204 No Content
module.exports.pollNewRide = async (req, res) => {
    try {
        // Ensure captain exists and is available to receive rides
        const captain = await captainModel.findById(req.captain.id);
        if (!captain) return res.status(404).json({ message: 'Captain not found' });
        if (!captain.isAvailable) return res.status(409).json({ message: 'Captain is not available for new rides' });

        const timeoutMs = 25000; // 25 seconds typical for long-polling
        let settled = false;

        // Function to resolve the poll with data
        const resolveFn = (payload) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.status(200).json(payload);
        };

        // Enqueue this request's resolver
        pendingPolls.push(resolveFn);

        // Safety timeout: if no new ride arrives within timeout, return 204 No Content
        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            // Remove from queue if still present
            const idx = pendingPolls.indexOf(resolveFn);
            if (idx !== -1) pendingPolls.splice(idx, 1);
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.status(204).send();
        }, timeoutMs);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};