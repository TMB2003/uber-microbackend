const rideModel = require('../models/ride.model');

module.exports = createRide = async (req, res, next) => {
    try {
        const {pickup, destination} = req.body;

        const newRide = new rideModel({
            user : req.user._id,
            pickup,
            destination
        });

        await newRide.save();
        res.status(201).json(newRide);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
