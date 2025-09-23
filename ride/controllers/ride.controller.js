const rideModel = require('../models/ride.model');
const rabbit = require('../service/rabbit');

module.exports.createRide = async (req, res, next) => {
    try {
        const {pickup, destination} = req.body;

        const newRide = new rideModel({
            user : req.user._id,
            pickup,
            destination
        });

        await newRide.save();
        res.status(201).json(newRide);

        rabbit.publishToRabbitMQ('ride.created', newRide);


    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.acceptRide = async (req, res, next) => {
    try {
        const rideId = req.params.rideId || req.query.rideId || req.body.rideId;
        if (!rideId) {
            return res.status(400).json({ message: 'rideId is required' });
        }
        const ride = await rideModel.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        if (ride.status !== 'requested') {
            return res.status(400).json({ message: 'Ride is not in requested state' });
        }
        ride.status = 'accepted';
        await ride.save();
        res.status(200).json(ride);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.rejectRide = async (req, res, next) => {
    try {
        const rideId = req.params.rideId || req.query.rideId || req.body.rideId;
        if (!rideId) {
            return res.status(400).json({ message: 'rideId is required' });
        }
        const ride = await rideModel.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        if (ride.status !== 'requested') {
            return res.status(400).json({ message: 'Ride is not in requested state' });
        }
        ride.status = 'rejected';
        await ride.save();
        res.status(200).json(ride);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
