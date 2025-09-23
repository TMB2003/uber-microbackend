const jwt = require('jsonwebtoken');
const axios = require('axios');

module.exports.userAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers && req.headers.authorization ? req.headers.authorization : '';
        const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (authHeader.includes(' ') ? authHeader.split(' ')[1] : '');
        const token = req.cookies?.token || bearerToken;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const response = await axios.get(`${process.env.BASE_URL}/user/profile`,  {
            headers : {
                Authorization : `Bearer ${token}`
            }
        })

        const user = response.data;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = user;
        next();
    } catch (error) {
        const status = error.response?.status || 500;
        res.status(status).json({ message: error.response?.data?.message || 'Server Error' });
    }
};

module.exports.captainAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers && req.headers.authorization ? req.headers.authorization : '';
        const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (authHeader.includes(' ') ? authHeader.split(' ')[1] : '');
        const token = req.cookies?.token || bearerToken;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const response = await axios.get(`${process.env.BASE_URL}/captain/profile`,  {
            headers : {
                Authorization : `Bearer ${token}`
            }
        })

        const captain = response.data;
        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.captain = captain;
        next();
    } catch (error) {
        const status = error.response?.status || 500;
        res.status(status).json({ message: error.response?.data?.message || 'Server Error' });
    }
};