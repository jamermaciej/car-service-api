const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const CarSchema =  mongoose.Schema({
    brand: String,
    model: String,
    type: String,
    year: String,
    registration: String,
    mileage: String,
    vin: String,
    capacity: String,
    power: String,
    fuel: String
})

CarSchema.plugin(AutoIncrement, {id: 'car_id', inc_field: 'id'});

module.exports = mongoose.model('Cars', CarSchema);