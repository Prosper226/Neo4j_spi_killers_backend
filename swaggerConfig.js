const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Killer API',
            version: '1.0.0',
            description: 'API documentation for managing killers data',
        },
        servers: [
            {
                url: 'http://localhost:8090/api',
                description: 'Local server',
            },
        ],
    },
    apis: ['./routes/*.js'], // Chemin vers les fichiers d'API
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
