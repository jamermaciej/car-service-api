const express = require('express');
const router = express.Router();
const Status = require('../models/Status');

router.get('/', async (req, res) => {
    try {
        const statuses = await Status.find();
        res.json(statuses);
    } catch (err) {
        res.json({ message: err });
    }
})

router.post('/', async (req, res) => {
    const status = new Status({
        label: req.body.label,
        value: req.body.value
    });

    try {
        const savedStatus = await status.save();
        res.json(savedStatus);
    } catch (err) {
        res.json({ message: err });
    }
});

router.delete('/:statusId', async (req, res) => {
    try {
        const removedStatus = await Status.findOneAndDelete({ id: req.params.statusId });
        res.json(removedStatus);
    } catch (err) {
        res.json({ message: err });
    }
});

router.put('/:statusId', async (req, res) => {
    try {
        const updatedStatus = await Status.findOneAndUpdate(
            { id: req.params.statusId },
            req.body,
            { new: true }
        );

        res.status(200).json(updatedStatus);
    } catch (err) {
        res.json({ message: err });
    }
});

module.exports = router;
