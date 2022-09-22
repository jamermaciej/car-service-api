const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const user = process.env.GMAIL_USERNAME;
const pass = process.env.GMAIL_PASSWORD;

router.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message  } = req.body;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
              user,
              pass
            }
        });

        const mailOptions = {
            from: email,
            replyTo: email,
            to: 'maciek77jamer@gmail.com',
            subject: `Message from ${name}: ${subject}`,
            text: `Message: ${message}
Email: ${email}
Phone: ${phone ? phone : '-'}`
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
        
    } catch (err) {
        res.json({ message: err });
    }
});

module.exports = router;