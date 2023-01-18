const nodemailer = require('nodemailer');

const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: process.env.GMAIL_HOST,
        port: process.env.GMAIL_PORT,
        auth: {
          user: process.env.GMAIL_USERNAME,
          pass: process.env.GMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: 'Maciej Jamer <maciek77jamer@gmail.com>',
        // replyTo: options.email,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;