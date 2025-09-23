const express = require('express');
const router = express.Router();
const captainController = require('../controllers/captain.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', captainController.register);
router.post('/login', captainController.login);
router.get('/logout', captainController.logout);
router.get('/profile', authMiddleware.captainAuth, captainController.getProfile);
router.patch('/toggle-availability', authMiddleware.captainAuth, captainController.toggleAvailability);
// Long-poll for a new ride (returns 200 with ride data when available or 204 on timeout)
router.get('/new-ride', authMiddleware.captainAuth, captainController.pollNewRide);

module.exports = router;