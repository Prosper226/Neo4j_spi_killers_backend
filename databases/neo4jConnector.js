'use strict';
require('dotenv').config()

const neo4j = require('neo4j-driver');

const uri = process.env.URI
const user =  process.env.USERNAME
const password =  process.env.PASSWORD
const database =  process.env.DATABASE


const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))

async function verifyConnection() {
    try {
        await driver.verifyConnectivity();
        console.info('Connexion à Neo4j réussie!');
        console.info(`Database ${database} is selected.`);
    } catch (err) {
        console.error('Erreur de connexion à Neo4j:', err);
    }
}

verifyConnection();

module.exports = {
    driver,
    start: () => driver.session({ database: database }),
    close: async () => {
        await driver.close();
    }
};
