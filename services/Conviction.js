'use strict';

const neo4jSession = require('../databases/neo4jConnector')


module.exports = class Conviction {

    async save(node) {
        const session = neo4jSession.start();
    try {
        let properties = {
            id: node.id,
            label: node.label,
            uri: node.uri
        };

        // Parameterized Cypher query
        let cypher = `
            MERGE (cn:Conviction {id: $id})
            ON CREATE SET 
                cn.label = $label,
                cn.uri = $uri
            ON MATCH SET
                cn.label = $label,
                cn.uri = $uri
            RETURN cn
        `;
    
        const result = await session.run(cypher, properties);

        if (result.records.length === 0) {
            throw new Error('No records found after running the query.');
        }

        console.log(properties);
        return result.records.map(record => record.get('cn').properties);
    } catch (error) {
        throw new Error(`Error saving conviction: ${error.message}`);
    } finally {
        await session.close();
    }
    }
    async getAll(limit = false){
        const session = neo4jSession.start()
        try {
            let cypher = `MATCH (c: Conviction) RETURN c`
            if(limit) {
                cypher += ` LIMIT ${limit}`
            }
            console.log(cypher)
            const result = await session.run(cypher)
            const data = result.records.map(record => record.get('c').properties)
            return data
        } catch (error) {
            throw new Error(`Error fetching convictions: ${error.message}`)
        } finally {
            await session.close()
        }
    }
    
    async getById(id) {
        const session = neo4jSession.start();
        try {
            const cypher = `MATCH (k:Conviction {id: $id}) RETURN k`;
            const result = await session.run(cypher, { id });
            if (result.records.length === 0) {
                throw new Error('Conviction not found');
            }
            return result.records[0].get('k').properties;
        } catch (error) {
            throw new Error(`Error fetching conviction: ${error.message}`);
        } finally {
            await session.close();
        }
    } 

    async searchByLabel(nameQuery) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Conviction)
                WHERE toLower(k.label) CONTAINS toLower($nameQuery)
                RETURN k
            `;
            const result = await session.run(cypher, { nameQuery });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error searching for conviction by name: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async checkConvictionsExistence(convictionIds) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (c:Conviction)
                WHERE c.id IN $convictionIds
                RETURN c.id AS id,  c.label as label
            `;
            const result = await session.run(cypher, { convictionIds });
            // return result.records.map(record => ({
            //     id: record.get('id'),
            //     label: record.get('label')
            // }));
            const existingIds = [];
            const existingLabels = [];
            result.records.forEach(record => {
                existingIds.push(record.get('id'));
                existingLabels.push(record.get('label'));
            });
            return { existingIds, existingLabels };
        } catch (error) {
            throw new Error(`Error checking convictions: ${error.message}`);
        } finally {
            await session.close();
        }
    }
}
