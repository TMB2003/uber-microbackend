const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const blacklistTokenModel = require('../models/blacklisttoken.model');

module.exports.userAuth = async (req, res, next) => {
    try{
        const authHeader = req.headers && req.headers.authorization ? req.headers.authorization : '';
        const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (authHeader.includes(' ') ? authHeader.split(' ')[1] : '');
        const token = req.cookies?.token || bearerToken;
        if(!token){
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const blacklistToken = await blacklistTokenModel.findOne({token});
        if(blacklistToken){
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if(!user){
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = user;
        
        next();
    }catch(error){
        return res.status(500).json({ message: error.message });
    }
}