const jwt = require('jsonwebtoken');
const captainModel = require('../models/captain.model');
const blacklistTokenModel = require('../models/blacklisttoken.model');

module.exports.captainAuth = async (req, res, next) => {
    try{
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];
        if(!token){
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const blacklistToken = await blacklistTokenModel.findOne({token});
        if(blacklistToken){
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const captain = await captainModel.findById(decoded.id);

        if(!captain){
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.captain = captain;
        
        next();
    }catch(error){
        return res.status(500).json({ message: error.message });
    }
}