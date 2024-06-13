'use strict';

const neo4jSession = require('../databases/neo4jConnector')
// const CONFIG = require('./Config')
// let config = new CONFIG()

module.exports = class Victim {

    async save(node) {
        const session = neo4jSession.start();
        try {
            let uri = node.id
            let id = uri.split('/').pop()
            let country = node.country.split('/').pop()
            let killer = node.killer.split('/').pop()

            // Extraire les propriétés de l'objet `node`
            const {
                label, lastname, firstname, birthday, placeOfBirthday, nationality, 
                image, killerName, placeOfDeath, placeOfDeathLabel, dateOfDeath,
                countryOfDeath, countryOfDeathLabel
            } = node;
            // Construire l'objet des propriétés en n'incluant que les propriétés définies
            const properties = {
                id, uri, label, lastname, firstname, birthday, placeOfBirthday, 
                country, nationality, image, killer, killerName,
                ...(image && { image }),
                ...(placeOfDeath && { placeOfDeath: placeOfDeath.split('/').pop() }),
                ...(placeOfDeathLabel && { placeOfDeathLabel }),
                ...(dateOfDeath && { dateOfDeath }),
                ...(countryOfDeath && { countryOfDeath: countryOfDeath.split('/').pop() }),
                ...(countryOfDeathLabel && { countryOfDeathLabel }),
            };
        
            // Construire dynamiquement les parties de la requête Cypher
            const setClauses = Object.keys(properties).map(prop => `v.${prop} = $${prop}`).join(', ');
            const cypher = `
                MERGE (v:Victim {id: $id})
                ON CREATE SET ${setClauses}
                ON MATCH SET ${setClauses}
                RETURN v
            `;
            
            const result = await session.run(cypher, properties);

            if(properties.country != 'null'){
                try{
                    this.createVictimCountryRelationship(properties.id, properties.country)
                }catch(e){
                    console.error(`failed createVictimCountryRelationship for ${properties.label}`)
                }
            }
            if(properties.placeOfDeath != 'null'){
                try{
                    this.createVictimDeathCountryRelationship(properties.id, properties.countryOfDeath, properties.dateOfDeath, properties.placeOfDeathLabel)
                }catch(e){
                    console.error(`failed createVictimDeathCountryRelationship for ${properties.label}`)
                }
            }
            
            if (properties.killer != 'null') {
                try{
                    this.createVictimKillerRelationship(properties.id, properties.killer, properties.dateOfDeath);
                }catch(e){
                    console.error(`failed createVictimKillerRelationship for ${properties.label}`)
                }
            }

            return result.records.map(record => record.get('v').properties);
        } catch (error) {
            throw new Error(`Error saving victim: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async createVictimCountryRelationship(victimId, countryId) {
        console.log(`Creating relationship between victim ${victimId} and country ${countryId}`);
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Victim {id: $victimId})
                MATCH (c:Country {id: $countryId})
                MERGE (k)-[:HAS_NATIONALITY]->(c)
                RETURN k, c
            `;
            const result = await session.run(cypher, { victimId, countryId });
    
            if (result.records.length === 0) {
                console.error('No matching records found for the given victim or country.');
                return null
            }
    
            return {
                result : result.records[0],
                // killer: result.records[0].get('k').properties,
                // country: result.records[0].get('c').properties
            };
        } catch (error) {
            throw new Error(`Error creating relationship: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async createVictimKillerRelationship(victimId, killerId, dateOfDeath) {
        console.log(`Creating relationship between victim ${victimId} and killer ${killerId} at ${dateOfDeath}`);
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (v:Victim {id: $victimId})
                MATCH (k:Killer {id: $killerId})
                MERGE (v)-[:KILLED_BY {dateOfDeath: $dateOfDeath}]->(k)
                RETURN v, k
            `;
            const result = await session.run(cypher, { victimId, killerId, dateOfDeath});
    
            if (result.records.length === 0) {
                console.log('No matching records found for the given victim or killer.');
                return null
            }
    
            return {
                result : result.records[0],
                // killer: result.records[0].get('k').properties,
                // country: result.records[0].get('c').properties
            };
        } catch (error) {
            throw new Error(`Error creating relationship: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async createVictimDeathCountryRelationship(victimId, countryId, dateOfDeath, placeOfDeath){
        console.log(`Creating relationship between victim ${victimId} DIED_IN country ${countryId}`);
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (v:Victim {id: $victimId})
                MATCH (c:Country {id: $countryId})
                MERGE (v)-[:DIED_IN {dateOfDeath: $dateOfDeath, placeOfDeath: $placeOfDeath}]->(c)
                RETURN v, c
            `;
            const result = await session.run(cypher, { victimId, countryId, dateOfDeath, placeOfDeath});
    
            if (result.records.length === 0) {
                throw new Error('No matching records found for the given victim or country.');
            }
    
            return {
                result : result.records[0],
                // killer: result.records[0].get('v').properties,
                // country: result.records[0].get('c').properties
            };
        } catch (error) {
            throw new Error(`Error creating relationship: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async #findEntityName(entityId){
        try{
            const sparqlQuery = `
                SELECT ?itemLabel WHERE {
                    wd:${entityId} rdfs:label ?itemLabel.
                    FILTER(LANG(?itemLabel) = "fr")
                }
            `;
            // Execution de la requete sparql depuis wikidata
            const results = await this.#fetchWikiData(sparqlQuery)
            return results[0].itemLabel.value
        }catch(err){
            throw new Error(err)
        }
    }
    
    // Requete de type HTTP vers `query.wikidata.org` avec Axios js
    #fetchWikiData = async(sparqlQuery) => {
        try {
            const axios = require('axios');
            const url = 'https://query.wikidata.org/sparql';
            const response = await axios.get(url, {
                params: {
                query: sparqlQuery,
                format: 'json'
                },
                headers: {
                'Accept': 'application/sparql-results+json'
                }
            });
            return response.data.results.bindings;
        } catch (error) {
            console.error('Error fetching data from WikiData:', error);
            throw new Error(error.message)
        }
    }
    


    //###################################################################//
    //###################################################################//
    //###################################################################//

    // Méthode pour récupérer toutes les victimes
    async getAll(limit = false) {
        const session = neo4jSession.start();
        try {
            let cypher = `MATCH (v:Victim) RETURN v`;
            if (limit) {
                cypher += ` LIMIT ${limit}`;
            }
            console.log(cypher);
            const result = await session.run(cypher);
            const data = result.records.map(record => record.get('v').properties);
            return data;
        } catch (error) {
            throw new Error(`Error fetching victims: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    // Méthode pour récupérer une victime par ID
    async getById(id) {
        const session = neo4jSession.start();
        try {
            const cypher = `MATCH (v:Victim {id: $id}) RETURN v`;
            const result = await session.run(cypher, { id });
            if (result.records.length === 0) {
                throw new Error('Victim not found');
            }
            return result.records[0].get('v').properties;
        } catch (error) {
            throw new Error(`Error fetching victim: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    // Méthode pour modifier une victime
    async update(id, updates) {
        const session = neo4jSession.start();
        try {
            const setClauses = Object.keys(updates).map(prop => `v.${prop} = $${prop}`).join(', ');
            const cypher = `
                MATCH (v:Victim {id: $id})
                SET ${setClauses}
                RETURN v
            `;
            const result = await session.run(cypher, { id, ...updates });
            if (result.records.length === 0) {
                throw new Error('Victim not found');
            }
            return result.records[0].get('v').properties;
        } catch (error) {
            throw new Error(`Error updating victim: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    // Méthode pour supprimer une victime par ID
    async delete(id) {
        const session = neo4jSession.start();
        try {
            const cypher = `MATCH (v:Victim {id: $id}) DETACH DELETE v`;
            await session.run(cypher, { id });
            return { message: 'Victim deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting victim: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async searchByLabel(nameQuery) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Victim)
                WHERE toLower(k.lastname) CONTAINS toLower($nameQuery)
                    OR toLower(k.firstname) CONTAINS toLower($nameQuery)
                    OR toLower(k.label) CONTAINS toLower($nameQuery)
                RETURN k
            `;
            const result = await session.run(cypher, { nameQuery });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error searching for killer by name: ${error.message}`);
        } finally {
            await session.close();
        }
    }


    async #generateUniqueNumber(){
        // Obtenir les 3 derniers chiffres du timestamp courant
        const timestamp = Date.now().toString();
        const lastThreeDigits = timestamp.substr(timestamp.length - 3);
        // Générer un chiffre aléatoire entre 0 et 9
        const randomDigit = Math.floor(Math.random() * 10).toString();
        // Concaténer les chiffres pour former le numéro unique
        const uniqueNumber = lastThreeDigits + randomDigit;
        return `V${uniqueNumber}`;
    }

    async addVictim(node) {
        const session = neo4jSession.start();
        try {
            const id = await this.#generateUniqueNumber()
            // Extraire les propriétés de l'objet `node`
            const {
                label, lastname, firstname, birthday, placeOfBirthday, nationality, 
                image, killerName, placeOfDeath, placeOfDeathLabel, dateOfDeath,
                countryOfDeath, countryOfDeathLabel
            } = node;
            // Construire l'objet des propriétés en n'incluant que les propriétés définies
            const properties = {
                id, uri, label, lastname, firstname, birthday, placeOfBirthday, 
                country, nationality, image, killer, killerName,
                ...(image && { image }),
                ...(placeOfDeath && { placeOfDeath: placeOfDeath}),
                ...(placeOfDeathLabel && { placeOfDeathLabel }),
                ...(dateOfDeath && { dateOfDeath }),
                ...(countryOfDeath && { countryOfDeath: countryOfDeath}),
                ...(countryOfDeathLabel && { countryOfDeathLabel }),
            };
        
            // Construire dynamiquement les parties de la requête Cypher
            const setClauses = Object.keys(properties).map(prop => `v.${prop} = $${prop}`).join(', ');
            const cypher = `
                MERGE (v:Victim {id: $id})
                ON CREATE SET ${setClauses}
                ON MATCH SET ${setClauses}
                RETURN v
            `;
            
            const result = await session.run(cypher, properties);

            if(properties.country != 'null'){
                try{
                    this.createVictimCountryRelationship(properties.id, properties.country)
                }catch(e){
                    console.error(`failed createVictimCountryRelationship for ${properties.label}`)
                }
            }
            if(properties.placeOfDeath != 'null'){
                try{
                    this.createVictimDeathCountryRelationship(properties.id, properties.countryOfDeath, properties.dateOfDeath, properties.placeOfDeathLabel)
                }catch(e){
                    console.error(`failed createVictimDeathCountryRelationship for ${properties.label}`)
                }
            }
            
            if (properties.killer != 'null') {
                try{
                    this.createVictimKillerRelationship(properties.id, properties.killer, properties.dateOfDeath);
                }catch(e){
                    console.error(`failed createVictimKillerRelationship for ${properties.label}`)
                }
            }
            return result.records.map(record => record.get('v').properties);
        } catch (error) {
            throw new Error(`Error saving killer: ${error.message}`);
        } finally {
            await session.close();
        }
    }
}
