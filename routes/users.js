const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, '-__v -password');
        res.status(200).json(users);
    } catch (err) {
        res.json({ message: err });
    }
});

module.exports = router;
