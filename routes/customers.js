const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.json({ message: err });
  }
});

router.post('/', async (req, res) => {
  const { idNumber } = req.body; // ABS123456

  const customer = new Customer({
    name: req.body.name,
    surname: req.body.surname,
    phoneNumber: req.body.phoneNumber,
    address: {
      street: req.body.address.street,
      city: req.body.address.city,
      postcode: req.body.address.postcode,
      province: req.body.address.province,
    },
    addressHtml: `${req.body.address.city}<br>${req.body.address.street}<br>${req.body.address.postcode}<br>${req.body.address.province}`,
    idNumber: idNumber,
    email: req.body.email,
  });

  try {
    const c = await Customer.findOne({ idNumber: idNumber });
    if (c) {
      res.status(400).json({
        message: `Customer with ID Number ${idNumber} exist.`,
      });
    } else {
      const savedPost = await customer.save();
      res.json(savedPost);
    }
  } catch (err) {
    res.json({ message: err });
  }
});

router.get('/:customerId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    res.json(customer);
  } catch (err) {
    res.json({ message: err });
  }
});

router.delete('/:customerId', async (req, res) => {
  try {
    const removedCustomer = await Customer.findOneAndDelete({
      id: req.params.customerId,
    });
    res.json(removedCustomer);
  } catch (err) {
    res.json({ message: err });
  }
});

router.put('/:customerId', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { id: req.params.customerId },
      req.body,
      { new: true, overwrite: true }
    );
    res.status(200).json(customer);
  } catch (err) {
    res.json({ message: err });
  }
});

router.patch('/:customerId', async (req, res) => {
  try {
    const updatedCustomer = await Customer.updateOne(
      { id: req.params.customerId },
      { $set: { name: req.body.name } }
    );
    res.json(updatedCustomer);
  } catch {
    res.json({ message: err });
  }
});

module.exports = router;
