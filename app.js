const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv/config');

const http = require('http');
const initWebsocket = require('./websocket');
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

app.use('/uploads', express.static('uploads'))

const verifyToken = require('./middleware/auth');
const verifyRoles = require('./middleware/verifyRoles')

//Import Routes

const authRoute = require('./routes/auth');
const usersRoute = require('./routes/users');
const customersRoute = require('./routes/customers');
const carsRoute = require('./routes/cars');
const statusesRoute = require('./routes/statuses');
const messagesRoute = require('./routes/messages');
const ordersRoute = require('./routes/orders');
const emailsRoute = require('./routes/emails');

app.use('/auth', authRoute);
app.use('/users', verifyToken, verifyRoles(['Admin', 'Employee', 'Manager']), usersRoute);
app.use('/customers', customersRoute);
app.use('/cars', carsRoute);
app.use('/statuses', verifyToken, verifyRoles(['Admin', 'Employee']), statusesRoute);
app.use('/messages', messagesRoute);
app.use('/orders', ordersRoute);
app.use('/emails', emailsRoute);

//ROUTES//
app.get('/', (req,res) => {
    res.send('Start');
})

require("./config/database")

initWebsocket(server);
    
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Listening on port ${port}...`));
