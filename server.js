"use strict";

const express = require('express');
const bodyPaser = require('body-parser');
require('dotenv').config()
const apiRoutes = require('./routes/router');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig');

const app = express();
const neo4jDriver = require('./databases/neo4jConnector')




process.env.TZ = "Africa/Ouagadougou"

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    next();
});


app.use(bodyPaser.json());

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/', apiRoutes);
app.get('*', (req, res) => { res.status(400).send({error: 'Resource not found.'}) })

module.exports = app; 

const port = process.env.PORT || 3000
app.listen(port, () => { 
    console.log(`Server is running on http://localhost:${port}`);
});
// process.on('exit', () => { neo4jDriver.close(); });
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await neo4jDriver.close();
    process.exit(0);
});