const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv/config');

app.use(cors());
app.use(bodyParser.json());

//Import Routes

const customersRoute = require('./routes/customers');
const carsRoute = require('./routes/cars');
const statusesRoute = require('./routes/statuses');
const messagesRoute = require('./routes/messages');
const ordersRoute = require('./routes/orders');

app.use('/customers', customersRoute);
app.use('/cars', carsRoute);
app.use('/statuses', statusesRoute);
app.use('/messages', messagesRoute);
app.use('/orders', ordersRoute);

//ROUTES//
app.get('/', (req,res) => {
    res.send('Start');
})

//Connect To DB
mongoose.connect(
    process.env.DB_CONNECTION,
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false },
    () => console.log('connected do DB!')
);
    
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
