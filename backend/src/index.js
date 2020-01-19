const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const routes = require('./routes');
const { setupWebsocket } = require('./websocket');

const app = express();
const server = http.Server(app);

setupWebsocket(server);

const port = 3333;

const dbUser = 'mongodb';
const dbPassword = 'dbmongo';
const dbName = 'test';
mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0-rinrp.mongodb.net/${dbName}?retryWrites=true&w=majority`, { 
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(cors());
app.use(express.json());
app.use(routes);

server.listen(port);