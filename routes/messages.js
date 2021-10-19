const express = require('express');
const router = express.Router();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

router.post('/status', async (req, res) => {
    try {
        const order = req.body;
        const message = await client.messages
          .create({
             body: `Order ${order.id} status: ${order.status}`,
             from: '+12143075579',
             to: '+48512183547'
           })
        
        res.json({ message });
    } catch (err) {
        res.json({ message: err });
    }
});

module.exports = router;