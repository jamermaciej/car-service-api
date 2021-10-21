const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const OrderSchema = mongoose.Schema({
  customer: { type: Object, ref: 'Customer' },
  car: { type: Object, ref: 'Car' },
  delivery_date: Date,
  deadline: Date,
  user: Object,
  status: String,
  notes: String,
  test_drive_agree: Boolean,
});

OrderSchema.plugin(AutoIncrement, { id: 'order_id', inc_field: 'id' });

module.exports = mongoose.model('Order', OrderSchema);
