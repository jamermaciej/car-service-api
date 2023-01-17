const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/me', async (req, res) => {
    try {
        res.status(200).json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            token: req.user.token,
            emailVerified: req.user.emailVerified,
            created_at: req.user.created_at,
            last_login_at: req.user.last_login_at,
            roles: req.user.roles,
            phoneNumber: req.user.phoneNumber,
            photo: req.user.photo
        });
    } catch (err) {
      res.json({ message: err });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, '-__v -password');
        res.status(200).json(users);
    } catch (err) {
        res.json({ message: err });
    }
});


const multer  = require('multer');

// Multer File upload settings
const DIR = './uploads/photos/';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    // const fileName = req.body._id + '.' + file.originalname.split('.').pop();
    cb(null, fileName)
  }
});

// Multer Mime Type Validation
const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
      }
    }
});

router.put('/:userId', upload.single('photo'), async (req, res) => {
    try {
        const url = req.protocol + '://' + req.get('host');
        let photo = null;

        if (req.file) {
            photo = url + '/uploads/photos/' + req.file.filename;
            // photo = url + '/uploads/photos/' + req.body._id + '.' + req.file.filename.split('.').pop();
        } else {
            photo = req.body.photo;
        }

        const newUser = {
            ...req.body,
            photo: photo
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: req.params.userId },
            newUser,
            { new: true }
        );

        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            token: req.user.token,
            emailVerified: updatedUser.emailVerified,
            created_at: updatedUser.created_at,
            last_login_at: updatedUser.last_login_at,
            roles: updatedUser.roles,
            phoneNumber: updatedUser.phoneNumber,
            photo: updatedUser.photo
        });
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.delete('/:userId', async (req, res) => {
    try {
      const removedOUser = await User.findOneAndDelete({
        _id: req.params.userId,
      });

      res.status(200).json({
        _id: removedOUser._id,
        name: removedOUser.name,
        email: removedOUser.email,
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
