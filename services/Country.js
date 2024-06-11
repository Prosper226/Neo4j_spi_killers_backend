'use strict';

const neo4jSession = require('../databases/neo4jConnector')


module.exports = class Country {

    async save(node) {
        const session = neo4jSession.start();
        try {
            let uri = node.id
            let id = uri.split('/').pop()
            let continent = node.continent.split('/').pop()
            let properties = {
                id: id,
                uri: uri,
                label: node.label,
                area: node.area,
                capital: node.capital,
                continent: continent,
                iso: node.iso,
                image: node.image
            };
    
            // Parameterized Cypher query
            let cypher = `
                MERGE (p:Country {id: $id})
                ON CREATE SET 
                    p.uri = $uri,
                    p.label = $label,
                    p.capital = $capital,
                    p.area = $area,
                    p.continent = $continent,
                    p.iso = $iso,
                    p.image = $image
                ON MATCH SET
                    p.uri = $uri,
                    p.label = $label,
                    p.capital = $capital,
                    p.area = $area,
                    p.continent = $continent,
                    p.iso = $iso,
                    p.image = $image
                RETURN p
            `;
    
            const result = await session.run(cypher, properties);

            if(properties.continent){
                try{
                    this.createCountryContinentRelationship(properties.id, properties.continent)
                }catch(e){
                    console.error(`failed createCountryContinentRelationship for ${properties.label}`)
                }
            }

            return result.records.map(record => record.get('p').properties);
        } catch (error) {
            throw new Error(`Error saving country: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async getAll(limit = false){
        const session = neo4jSession.start()
        try {
            let cypher = `MATCH (p: Country) RETURN p`
            if(limit) {
                cypher += ` LIMIT ${limit}`
            }
            console.log(cypher)
            const result = await session.run(cypher)
            const data = result.records.map(record => record.get('p').properties)
            return data
        } catch (error) {
            throw new Error(`Error fetching countries: ${error.message}`)
        } finally {
            await session.close()
        }
    }

    async createCountryContinentRelationship(countryId, continentId) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (p:Country {id: $countryId})
                MATCH (c:Continent {id: $continentId})
                MERGE (c)-[:HAS_COUNTRY]->(p)
                RETURN c, p
            `;
            const result = await session.run(cypher, { countryId, continentId });
            return {
                result : result.records[0],
                // country: result.records[0].get('p').properties,
                // continent: result.records[0].get('c').properties
            };
        } catch (error) {
            throw new Error(`Error creating relationship: ${error.message}`);
        } finally {
            await session.close();
        }
    }



    async getById(id) {
        const session = neo4jSession.start();
        try {
            const cypher = `MATCH (k:Country {id: $id}) RETURN k`;
            const result = await session.run(cypher, { id });
            if (result.records.length === 0) {
                throw new Error('Country not found');
            }
            return result.records[0].get('k').properties;
        } catch (error) {
            throw new Error(`Error fetching country: ${error.message}`);
        } finally {
            await session.close();
        }
    } 

    async searchByLabel(nameQuery) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Country)
                WHERE toLower(k.label) CONTAINS toLower($nameQuery)
                RETURN k
            `;
            const result = await session.run(cypher, { nameQuery });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error searching for country by name: ${error.message}`);
        } finally {
            await session.close();
        }
    }
}
