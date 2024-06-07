'use strict';

const neo4jSession = require('../databases/neo4jConnector')
const CONVICTION = require('./Conviction')
// const CONFIG = require('./Config')
// let config = new CONFIG()

module.exports = class Killer {

    // Utiliser au momemt du chargment initial des donnee
    async save(node) {
        const session = neo4jSession.start();
        try {

            let uri = node.id
            let id = uri.split('/').pop()
            let country = node.country.split('/').pop()
            let convicted = node.convicted.split(',').map(element => {
                return element.split('/').pop();
            });
            
            // Extraire les propriétés de l'objet `node`
            const {
                label, lastname, firstname, birthday, placeOfBirthday, nationality, image, victimsOfKiller, workPeriodStart, workPeriodEnd
            } = node;
    
            // Construire l'objet des propriétés en n'incluant que les propriétés définies
            const properties = {
                id, uri, label, lastname, firstname, birthday, placeOfBirthday, country, nationality, convicted,
                ...(image && { image }),
                ...(victimsOfKiller && { victimsOfKiller }),
                ...(workPeriodStart && { workPeriodStart }),
                ...(workPeriodEnd && { workPeriodEnd })
            };
    
            // Construire dynamiquement les parties de la requête Cypher
            const setClauses = Object.keys(properties).map(prop => `k.${prop} = $${prop}`).join(', ');
    
            const cypher = `
                MERGE (k:Killer {id: $id})
                ON CREATE SET ${setClauses}
                ON MATCH SET ${setClauses}
                RETURN k
            `;
    
            const result = await session.run(cypher, properties);

            if(properties.country){
                try{
                    this.createKillerCountryRelationship(properties.id, properties.country)
                }catch(e){
                    console.error(`failed createKillerCountryRelationship for ${properties.label}`)
                }
            }

            if (properties.convicted) {
                var conviction = new CONVICTION();
                const listConvicted = properties.convicted // .split(',');
                // Utilisation de Promise.all avec map pour gérer chaque condamnation de manière asynchrone
                await Promise.all(listConvicted.map(async (convicted) => {
                    let entityId = convicted // .split('/').pop()
                    console.log({entityId})
                    let label = await this.#findEntityName(entityId)
                    let uri = `http://www.wikidata.org/entity/${entityId}`
                    // Enregistrement de la condamnation si elle n'existe pas déjà
                    await conviction.save({ id: convicted, label: label, uri : uri });
                    // Création de la relation entre le tueur et la condamnation
                    await this.createKillerConvictionRelationship(properties.id, convicted);
                }));
            }
            

            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error saving killer: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    // utiliser par le controller pour ajouter un nouveau criminel.
    async addKiller(node) {
        const session = neo4jSession.start();
        try {
            const id = await this.#generateUniqueNumber()
            const {
                label, lastname, firstname, birthday, placeOfBirthday, country, nationality, convicted, image, victimsOfKiller, workPeriodStart, workPeriodEnd
            } = node;
            const properties = {
                id, label, lastname, firstname, birthday, placeOfBirthday, country, nationality, convicted,
                ...(image && { image }),
                ...(victimsOfKiller && { victimsOfKiller }),
                ...(workPeriodStart && { workPeriodStart }),
                ...(workPeriodEnd && { workPeriodEnd })
            };
            const setClauses = Object.keys(properties).map(prop => `k.${prop} = $${prop}`).join(', ');
            const cypher = `
                MERGE (k:Killer {id: $id})
                ON CREATE SET ${setClauses}
                ON MATCH SET ${setClauses}
                RETURN k
            `;
            const result = await session.run(cypher, properties);
            if(properties.country){
                await this.createKillerCountryRelationship(properties.id, properties.country);
            }
            if (properties.convicted) {
                await Promise.all(properties.convicted.map(async (convicted) => {
                    await this.createKillerConvictionRelationship(properties.id, convicted);
                }));
            }
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error saving killer: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async createKillerCountryRelationship(killerId, countryId) {
        console.log(`Creating relationship between killer ${killerId} and country ${countryId}`);
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Killer {id: $killerId})
                MATCH (c:Country {id: $countryId})
                MERGE (k)-[:HAS_NATIONALITY]->(c)
                RETURN k, c
            `;
            const result = await session.run(cypher, { killerId, countryId });
    
            if (result.records.length === 0) {
                console.error('No matching records found for the given killer or country.');
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

    async createKillerConvictionRelationship(killerId, convictionId) {
        console.log(`Creating relationship between killer ${killerId} and conviction ${convictionId}`);
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Killer {id: $killerId})
                MATCH (c:Conviction {id: $convictionId})
                MERGE (k)-[:CONVICTED_OF]->(c)
                RETURN k, c
            `;
            const result = await session.run(cypher, { killerId, convictionId });
    
            if (result.records.length === 0) {
                throw new Error('No matching records found for the given killer or convicted.');
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
    

    async #generateUniqueNumber(){
        // Obtenir les 3 derniers chiffres du timestamp courant
        const timestamp = Date.now().toString();
        const lastThreeDigits = timestamp.substr(timestamp.length - 3);
        // Générer un chiffre aléatoire entre 0 et 9
        const randomDigit = Math.floor(Math.random() * 10).toString();
        // Concaténer les chiffres pour former le numéro unique
        const uniqueNumber = lastThreeDigits + randomDigit;
        return `K${uniqueNumber}`;
    }

    //###################################################################//
    //###################################################################//
    //###################################################################//

    async getAll(limit = false) {
        const session = neo4jSession.start();
        try {
            let cypher = `MATCH (k:Killer) RETURN k 
            ORDER BY k.birthday DESC`;
            if (limit) {
                cypher += ` LIMIT ${limit}`;
            }
            const result = await session.run(cypher);
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error fetching killers: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async getById(id) {
        const session = neo4jSession.start();
        try {
            const cypher = `MATCH (k:Killer {id: $id}) RETURN k`;
            const result = await session.run(cypher, { id });
            if (result.records.length === 0) {
                throw new Error('Killer not found');
            }
            return result.records[0].get('k').properties;
        } catch (error) {
            throw new Error(`Error fetching killer: ${error.message}`);
        } finally {
            await session.close();
        }
    } 

    async update2(id, updates) {
        const session = neo4jSession.start();
        try {
            const setClauses = Object.keys(updates).map(prop => `k.${prop} = $${prop}`).join(', ');
            const cypher = `
                MATCH (k:Killer {id: $id})
                SET ${setClauses}
                RETURN k
            `;
            const result = await session.run(cypher, { id, ...updates });
            if (result.records.length === 0) {
                throw new Error('Killer not found');
            }
            return result.records[0].get('k').properties;
        } catch (error) {
            throw new Error(`Error updating killer: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async delete(id) {
        const session = neo4jSession.start();
        try {
            const cypher = `MATCH (k:Killer {id: $id}) DETACH DELETE k`;
            await session.run(cypher, { id });
            return { message: 'Killer deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting killer: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async getKillersByCountry(countryId) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Killer)-[:HAS_NATIONALITY]->(c:Country {id: $countryId})
                RETURN k
            `;
            const result = await session.run(cypher, { countryId });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error fetching killers by country: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async getKillersByContinent(continentId) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Killer)-[:HAS_NATIONALITY]->(:Country)<-[:HAS_COUNTRY]-(:Continent {id: $continentId})
                RETURN k
            `;
            const result = await session.run(cypher, { continentId });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error fetching killers by continent: ${error.message}`);
        } finally {
            await session.close();
        }
    }
    
    async getKillersByConviction(convictionId) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Killer)-[:CONVICTED_OF]->(c:Conviction {id: $convictionId})
                RETURN k
            `;
            const result = await session.run(cypher, { convictionId });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error fetching killers by conviction: ${error.message}`);
        } finally {
            await session.close();
        }
    }

    async searchByNameOrLabel(nameQuery) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Killer)
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

    async searchByContinent(continentName) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Killer)-[:HAS_NATIONALITY]->(c:Country)<-[:HAS_COUNTRY]-(co:Continent)
                WHERE toLower(co.label) CONTAINS toLower($continentName)
                RETURN k
            `;
            const result = await session.run(cypher, { continentName });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error searching for killers by continent: ${error.message}`);
        } finally {
            await session.close();
        }
    }
    
    async searchByCountry(countryName) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (k:Killer)-[:HAS_NATIONALITY]->(c:Country)
                WHERE toLower(c.label) CONTAINS toLower($countryName)
                OR toLower(c.capital) CONTAINS toLower($countryName)
                RETURN k
            `;
            const result = await session.run(cypher, { countryName });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error searching for killers by country: ${error.message}`);
        } finally {
            await session.close();
        }
    }
    
    async searchByConviction(convictionName) {
        const session = neo4jSession.start();
        try {
            // MATCH (k:Killer)-[:CONVICTED_OF]->(c:Conviction)
            const cypher = `
                MATCH (c:Conviction)<-[:CONVICTED_OF]-(k:Killer)
                WHERE toLower(c.label) CONTAINS toLower($convictionName)
                RETURN k
            `;
            const result = await session.run(cypher, { convictionName });
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error searching for killers by conviction: ${error.message}`);
        } finally {
            await session.close();
        }
    }
    
    async getVictimsByKillerId(killerId) {
        const session = neo4jSession.start();
        try {
            const cypher = `
                MATCH (v:Victim)-[r:KILLED_BY]->(k:Killer {id: $killerId})
                RETURN v, r
            `;
            const result = await session.run(cypher, { killerId });
            return result.records.map(record => (
                record.get('v').properties
                // relationship: record.get('r').properties
            ));
        } catch (error) {
            throw new Error(`Error fetching victims for killer ${killerId}: ${error.message}`);
        } finally {
            await session.close();
        }
    }



    // ############################################
    async update(id, node) {
        const session = neo4jSession.start();
        try {
            node.id = id
            if(node.country){
                node.nationality = await this.fetchCountryLabel(node.country).then((c) => c.label);
            }
            // Construire l'objet des propriétés en n'incluant que les propriétés définies
            const properties = node
            // Construire dynamiquement les parties de la requête Cypher
            const setClauses = Object.keys(properties).map(prop => `k.${prop} = $${prop}`).join(', ');
            const cypher = `
                MATCH (k:Killer {id: $id})
                SET ${setClauses}
                RETURN k
            `;
            const result = await session.run(cypher, properties);
            // Mise à jour des relations avec le pays
            if (properties.country) {
                await this.updateKillerCountryRelationship(properties.id, properties.country);
            }
            // Mise à jour des relations avec les condamnations
            // if (properties.convicted) {
            //     await this.updateKillerConvictionRelationships(properties.id, properties.convicted);
            // }
            // if (properties.convicted) {
            //     const listConvicted = properties.convicted // .split(',');
            //     // Utilisation de Promise.all avec map pour gérer chaque condamnation de manière asynchrone
            //     await Promise.all(listConvicted.map(async (convicted) => {
            //         // Création de la relation entre le tueur et la condamnation
            //         await this.updateKillerConvictionRelationships(properties.id, convicted);
            //     }));
            // }
            return result.records.map(record => record.get('k').properties);
        } catch (error) {
            throw new Error(`Error updating killer: ${error.message}`);
        } finally {
            await session.close();
        }
    }
    
    async updateKillerCountryRelationship(killerId, countryId) {
        const session = neo4jSession.start();
        try {
            // Supprimer les relations existantes avec le pays
            const deleteCypher = `
                MATCH (k:Killer {id: $killerId})-[r:FROM_COUNTRY]->()
                DELETE r
            `;
            await session.run(deleteCypher, { killerId });
    
            // Créer la nouvelle relation avec le pays
            const createCypher = `
                MATCH (k:Killer {id: $killerId}), (c:Country {id: $countryId})
                MERGE (k)-[:FROM_COUNTRY]->(c)
            `;
            await session.run(createCypher, { killerId, countryId });
        } catch (error) {
            throw new Error(`Error updating killer-country relationship: ${error.message}`);
        } finally {
            await session.close();
        }
    }
    
    async updateKillerConvictionRelationships(killerId, newConvictedIds) {
        const session = neo4jSession.start();
        try {
            
            // Supprimer les relations existantes avec les condamnations
            const deleteCypher = `
                MATCH (k:Killer {id: $killerId})-[r:CONVICTED_OF]->()
                DELETE r
            `;
            await session.run(deleteCypher, { killerId });
    
            // Créer les nouvelles relations avec les condamnations
            await Promise.all(newConvictedIds.map(async (convictedId) => {
                
                const createCypher = `
                    MATCH (k:Killer {id: $killerId}), (c:Conviction {id: $convictedId})
                    MERGE (k)-[:CONVICTED_OF]->(c)
                `;
                await session.run(createCypher, { killerId, convictedId });
            }));
            // let savedNodes = await Promise.all(promises);

        } catch (error) {
            throw new Error(`Error updating killer-conviction relationships: ${error.message}`);
        } finally {
            await session.close();
        }
    }
    
    async fetchCountryLabel(countryId) {
        try{
            const Country = require('./Country');
            const countryInstance = new Country();
            return countryInstance.getById(countryId);
        }catch(err){
            return null;
        }
    }
    

}
