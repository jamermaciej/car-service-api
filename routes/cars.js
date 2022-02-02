const express = require('express');
const router = express.Router();
const Car = require('../models/Car');

router.get('/', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (err) {
    res.json({ message: err });
  }
});

router.post('/', async (req, res) => {
  const car = new Car({
    brand: req.body.brand,
    model: req.body.model,
    type: req.body.type,
    year: req.body.year,
    registration: req.body.registration,
    mileage: req.body.mileage,
    vin: req.body.vin,
    capacity: req.body.capacity,
    power: req.body.power,
    fuel: req.body.fuel,
  });

  try {
    const savedCar = await car.save();
    res.json(savedCar);
  } catch (err) {
    res.json({ message: err });
  }
});

router.put('/:carId', async (req, res) => {
  try {
    const updatedCar = await Car.findOneAndUpdate(
      { id: req.params.carId },
      req.body,
      { new: true }
    );
    res.status(200).json(updatedCar);
  } catch (err) {
    res.json({ message: err });
  }
});

router.delete('/:carId', async (req, res) => {
  try {
    const removedCar = await Car.findOneAndDelete({
      id: req.params.carId,
    });
    res.json(removedCar);
  } catch (err) {
    res.json({ message: err });
  }
});

module.exports = router;
