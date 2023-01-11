const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const verifyToken = require("../middleware/auth");

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, passwordConfirm } = req.body;

        if (!(email && password)) {
            res.status(400).send('Email and password input is required');
        }

        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        const user = await User.create({
            name: name ? name : null,
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            password,
            passwordConfirm,
            emailVerified: false
        });

        sendVerificationEmail(user, res);

        res.status(201).json({ _id: user._id, name: name ? user.name : null, email: user.email });
    } catch (err) {
        console.log(err);
        res.status(400).json(err.errors.name.message);
    }
});

const nodemailer = require('nodemailer');
const UserVerification = require("../models/UserVerification");
const { v4: uuidv4 } = require('uuid');

const user = process.env.GMAIL_USERNAME;
const pass = process.env.GMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
      user,
      pass
    }
});

const sendVerificationEmail = async ({ _id, email }, res) => {
    const currentUrl = "http://localhost:4200/en/login/";
    const uniqueString = uuidv4() + _id;

    console.log(_id)

    const mailOptions = {
        from: user,
        replyTo: email,
        to: email,
        subject: `Verify your Email`,
        html: `<p>Verify your Email address to compplete the signup and login into your account.</p><p>The link
        <b>expires in 6 hours.</b></p><p>Press <a href=${
            currentUrl + "auth/verify/" + _id + "/" + uniqueString
        }>here</a> to proceed.</p>`,
    };

    const saltRounds = 10;
    const hashedUniqueString = await bcrypt.hash(uniqueString, saltRounds);

    const userVerify = await UserVerification.findOne({ userId: _id });

    if (userVerify) {
        const updatedVerification = await UserVerification.updateOne({
            uniqueString: hashedUniqueString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 21600000
        });
    } else {
        const newVerification = await UserVerification.create({
            userId: _id,
            uniqueString: hashedUniqueString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 21600000
        });
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(400).json('Email has not been sent, please try again later');
        } else {
            console.log('Email sent: ' + info.response);
            res.json('Email has been sent');
        }
    });
}

router.get('/verify/:userId/:uniqueString', async (req, res) => {
    let { userId, uniqueString } = req.params;

    const user = await UserVerification.findOne({ userId });

    if (!user) {
        res.status(400).send("Account record doesn't exist or has been verified already.");
    }

    if (user) {
        const { expiresAt } = user;
        const hashedUniqueString = user.uniqueString

        if (expiresAt.getTime() < new Date()) {
            const removedUser = await UserVerification.deleteOne({ userId });

            res.status(400).send("Link has expired. Please log in and send new link from your profile account or contact with administrator.");
        } else {
            if (await bcrypt.compare(uniqueString, hashedUniqueString)) {
                const updatedUser = await User.findOneAndUpdate({ _id: userId }, { emailVerified: true }, { new: true });
                const removedUser = await UserVerification.deleteOne({ userId });

                res.status(200).json({
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    token: updatedUser.token,
                    emailVerified: updatedUser.emailVerified,
                    created_at: updatedUser.created_at,
                    last_login_at: updatedUser.last_login_at,
                    roles: updatedUser.roles,
                    phoneNumber: updatedUser.phoneNumber,
                    photo: updatedUser.photo
                });
            } else {
                res.status(400).send("Link has expired. Check the propriety of the link or contact with administrator.");
            }
        }
    }
});

router.post('/send-verify-email', verifyToken, async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            res.status(400).send("There is no account with the given e-mail address in the system");
        }
        
        sendVerificationEmail({ _id: user._id, email: user.email }, res);

        res.status(200).json({ message: 'Email send.' });
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!(email && password)) {
            res.status(400).send("All input is required");
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(400).send("There is no account with the given e-mail address in the system");
        }

        if (user && await user.correctPassword(password, user.password)) {
            const token = jwt.sign(
              { id: user._id, email },
              process.env.TOKEN_KEY,
              {
                expiresIn: "2h",
              }
            );
      
            user.token = token;

            await User.findByIdAndUpdate(user._id, { '$set' : { 'last_login_at' : Date.now() } }, { new : true });
      
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: user.token,
                emailVerified: user.emailVerified,
                created_at: user.created_at,
                last_login_at: user.last_login_at,
                roles: user.roles,
                phoneNumber: user.phoneNumber,
                photo: user.photo
            });
        } else {
            res.status(400).send("Invalid Credentials");
        }
         
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.get('/users/me', verifyToken, async (req, res) => {
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

router.put('/users/:userId', upload.single('photo'), async (req, res) => {
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
            token: updatedUser.token,
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

module.exports = router;