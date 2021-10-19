const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (err) {
        res.json({ message: err });
    }
})

router.get('/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ "user.uid": req.params.userId } );
        res.json(orders);
    } catch (err) {
        res.json({ message: err });
    }
})

router.post('/', async (req, res) => {
    const order = new Order({
        customer_id: req.body.customer_id,
        car_id: req.body.car_id,
        delivery_date: req.body.delivery_date,
        deadline: req.body.deadline,
        user: req.body.user,
        status: req.body.status,
        notes: req.body.notes,
        test_drive_agree: req.body.test_drive_agree
    });

    try {
        const savedOrder = await order.save();
        res.json(savedOrder);
    } catch (err) {
        res.json({ message: err });
    }
});

router.put('/:orderId', async (req, res) => {
    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { id: req.params.orderId },
            req.body,
            { new: true }
        );

        res.status(200).json(updatedOrder);
    } catch (err) {
        res.json({ message: err });
    }
});

module.exports = router;