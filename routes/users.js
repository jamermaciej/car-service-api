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

router.delete('/:userId', async (req, res) => {
    try {
      const removedOUser = await User.findOneAndDelete({
        _id: req.params.userId,
      });
      console.log(req.params.userId)
      res.status(200).json({
        _id: removedOUser._id,
        name: removedOUser.name,
        email: removedOUser.email,
        token: removedOUser.token,
        emailVerified: removedOUser.emailVerified,
        created_at: removedOUser.created_at,
        last_login_at: removedOUser.last_login_at,
        roles: removedOUser.roles,
        phoneNumber: removedOUser.phoneNumber,
        photo: removedOUser.photo
    });
    } catch (err) {
      res.json({ message: err });
    }
});

module.exports = router;
