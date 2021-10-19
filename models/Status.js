const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const StatusSchema =  mongoose.Schema({
    label: String,
    value: String
})

StatusSchema.plugin(AutoIncrement, {id: 'status_id', inc_field: 'id'});

module.exports = mongoose.model('Statuses', StatusSchema);