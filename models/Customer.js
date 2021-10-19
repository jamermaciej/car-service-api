const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const CustomerSchema =  mongoose.Schema({
    name: String,
    surname: String,
    phoneNumber: String,
    address: {
        street: String,
        city: String,
        postcode: String,
        province: String
    },
    idNumber: { type: String, required: true, unique: true },
    email: String
})

CustomerSchema.plugin(AutoIncrement, {id: 'customer_id', inc_field: 'id'});

module.exports = mongoose.model('Customers', CustomerSchema);