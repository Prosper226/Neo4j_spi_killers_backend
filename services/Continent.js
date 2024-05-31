'use strict';

const neo4jSession = require('../databases/neo4jConnector')


module.exports = class Continent {

    async save(node) {
        const session = neo4jSession.start();
        try {
            let uri = node.id
            let id = uri.split('/').pop()
            let properties = {
                id: id,
                uri: uri,
                label: node.label,
                area: node.area
            };
            // Parameterized Cypher query
            let cypher = `
                MERGE (c:Continent {id: $id})
                SET c.uri = $uri,
                    c.label = $label,
                    c.area = $area
                RETURN c
            `;
            const result = await session.run(cypher, properties);
            return result.records.map(record => record.get('c').properties);
        } catch (error) {
            throw new Error('Error saving continent:', error.message);
        } finally {
            await session.close();
        }
    }

    async getAll(limit = false) {
        const session = neo4jSession.start();
        try {
            let cypher = `MATCH (k:Continent) RETURN k`;
            if (limit) {
                cypher += ` LIMIT ${limit}`;
            }
            const result = await session.run(cypher);
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error fetching continents: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async getById(id) {
        const session = neo4jSession.start();
        try {
            const cypher = `MATCH (k:Continent {id: $id}) RETURN k`;
            const result = await session.run(cypher, { id });
            if (result.records.length === 0) {
                throw new Error('Continent not found');
            }
            return result.records[0].get('k').properties;
        } catch (error) {
            throw new Error(`Error fetching continent: ${error.message}`);
        } finally {
            await session.close();
        }
    } 

    async searchByLabel(nameQuery) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Continent)
                WHERE toLower(k.label) CONTAINS toLower($nameQuery)
                RETURN k
            `;
            const result = await session.run(cypher, { nameQuery });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error searching for continent by name: ${error.message}`);
        } finally {
            await session.close();
        }
    }

}
