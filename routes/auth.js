const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const verifyToken = require("../middleware/auth");
const sendEmail = require("../utils/email");
const RefreshToken = require("../models/RefreshToken");
const { TokenExpiredError } = jwt;

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
            const accessToken = jwt.sign(
              { id: user._id, email },
              process.env.ACCESS_TOKEN_KEY,
              {
                expiresIn: "15m",
              }
            );

            const refreshToken = jwt.sign(
                { id: user._id },
                process.env.REFRESH_TOKEN_KEY,
                {
                    expiresIn: "1d",
                }
            );
      
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;

            await User.findByIdAndUpdate(user._id, { '$set' : { 'last_login_at' : Date.now(), 'refreshToken': refreshToken } }, { new : true });

            res.cookie('refreshToken', refreshToken, { sameSite: 'None', httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 });
      
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                accessToken: user.accessToken,
                // refreshToken: user.refreshToken,
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

router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(403).json({ message: "Refresh Token is required!" });
        }

        const user = await User.findOne({ refreshToken });

        if (!user) {
            res.status(403).json({ message: "There is no user with this refresh token!" });
        }

        try {
            await jwt.verify(user.refreshToken, process.env.REFRESH_TOKEN_KEY);
        } catch (err) {
            if (err instanceof TokenExpiredError) {
                await User.findByIdAndUpdate(user._id, { '$unset' : { refreshToken: 1 }})
                res.status(403).json({ message: "Refresh token was expired. Please make a new signin request." });
            }
        }


        const newAccessToken = jwt.sign(
            { id: user._id },
            process.env.ACCESS_TOKEN_KEY,
            {
                expiresIn: "15m",
            }
        );

        res.status(200).json({
            accessToken: newAccessToken
        });
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.get('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh Token is required!" });
        }

        const user = await User.findOne({ refreshToken });

        if (!user) {
            res.status(403).json({ message: "There is no user with this refresh token!" });
        }

        try {
            await jwt.verify(user.refreshToken, process.env.REFRESH_TOKEN_KEY);
        } catch (err) {
            if (err instanceof TokenExpiredError) {
                await User.findByIdAndUpdate(user._id, { '$unset' : { refreshToken: 1 }})
                res.status(403).json({ message: "Refresh token was expired. Please make a new signin request." });
            }
        }

        const newAccessToken = jwt.sign(
            { id: user._id },
            process.env.ACCESS_TOKEN_KEY,
            {
                expiresIn: "1m",
            }
        );

        res.status(200).json({
            accessToken: newAccessToken
        });
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.post('/change-email', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { password, email } = req.body;

        if (!(password && email)) {
            res.status(400).send("Password and email are required");
        }

        const user = await User.findOne({ _id: userId });

        if (email === user.email) {
            res.status(400).send("This email is the same as you use now, give other email address.");
        }

        if (user && await user.correctPassword(password, user.password)) {
            const updatedUser = await User.findByIdAndUpdate(userId, { '$set' : { 'email' : email } }, { new : true });

            res.status(200).json({
                _id: updatedUser._id,
                name: updatedUser.name,
                accessToken: req.user.accessToken,
                email: updatedUser.email,
                emailVerified: updatedUser.emailVerified,
                created_at: updatedUser.created_at,
                last_login_at: updatedUser.last_login_at,
                roles: updatedUser.roles,
                phoneNumber: updatedUser.phoneNumber,
                photo: updatedUser.photo
            });
        } else {
            res.status(400).send("Password incorrect, please provide correct password!");
        }
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { password, newPassword } = req.body;

        if (!(password && newPassword)) {
            res.status(400).send("Password and new password are required");
        }

        const user = await User.findOne({ _id: userId });

        if (user && await user.correctPassword(password, user.password)) {
            if ( await user.correctPassword(newPassword, user.password) ) {
                res.status(400).send("New password are the same as old, please provide different password!");
            } else {
            const newHashedPassword = await bcrypt.hash(newPassword, 12);;
            const updatedUser = await User.findByIdAndUpdate(userId, { '$set' : { 'password' : newHashedPassword, 'passwordChangedAt': Date.now() } }, { new : true });

            res.status(200).json({
                _id: updatedUser._id,
                name: updatedUser.name,
                accessToken: req.user.accessToken,
                email: updatedUser.email,
                emailVerified: updatedUser.emailVerified,
                created_at: updatedUser.created_at,
                last_login_at: updatedUser.last_login_at,
                roles: updatedUser.roles,
                phoneNumber: updatedUser.phoneNumber,
                photo: updatedUser.photo
            });
            }
        } else {
            res.status(400).send("Password incorrect, please provide correct password!");
        }
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.delete('/delete-account', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const { password } = req.body;

        if (!userId) {
            res.status(400).send("User doesn't exist.");
        }
        
        const user = await User.findOne({ _id: userId });
       
        if (password && user && await user.correctPassword(password, user.password)) {
            const removedUser = await User.findOneAndDelete({
                _id: userId,
            });

            res.status(200).json({
                message: `Account ${removedUser.email} has been deleted successfully.`
            });
        } else {
            res.status(400).send("Password incorrect, please provide correct password!");
        }
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).send("Email address is required.");
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(400).send("There is no user with email address.");
        }

        const resetToken = await user.createPasswordResetToken(user._id);
        await user.save({  validateBeforeSave: false });

        // const resetURL = `${req.protocol}://${req.get('host')}/en/auth/resetPassword/${resetToken}`;
        const resetURL = `http://localhost:4200/en/reset-password/${resetToken}`;
        const message = `
        Forgot your password? Submit a PATCH request with your new password and passwordConfrim to: ${resetURL}.<br />
         If you didn't forgot your password, please ignore this email!
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: `Your password reset token (valid for 10 min)`,
                message,
            });
    
            res.status(200).json({
                status: 'success',
                message: 'Email has been sent!'
            });
        } catch(err) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({  validateBeforeSave: false });
            
            res.status(500).send("There was an error sending the email. Try again later!");
        }
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password, passwordConfirm } = req.body;

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            // co gdy token wygasnie - usuwamy z bazy?
            res.status(400).send("Token is invalid or has expired.");
        }

        if ( await user.correctPassword(password, user.password) ) {
            res.status(400).send("New password are the same as old, please provide different password!");
        }

        user.password = password;
        user.passwordConfirm = passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password has been changed!'
        });
    } catch (err) {
        console.log(err);
        res.json(err);
    }
});

module.exports = router;