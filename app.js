const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv/config');

const http = require('http');
const initWebsocket = require('./websocket');
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

//Import Routes

const customersRoute = require('./routes/customers');
const carsRoute = require('./routes/cars');
const statusesRoute = require('./routes/statuses');
const messagesRoute = require('./routes/messages');
const ordersRoute = require('./routes/orders');
const emailsRoute = require('./routes/emails');

app.use('/customers', customersRoute);
app.use('/cars', carsRoute);
app.use('/statuses', statusesRoute);
app.use('/messages', messagesRoute);
app.use('/orders', ordersRoute);
app.use('/emails', emailsRoute);

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

initWebsocket(server);
    
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Listening on port ${port}...`));
