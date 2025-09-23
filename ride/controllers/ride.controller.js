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
