'use strict';

const neo4jSession = require('../databases/neo4jConnector')
const axios = require('axios');

const CONTINENT = require('./Continent')
const COUNTRY = require('./Country')
const KILLER = require('./Killer')
const VICTIM = require('./Victim')

module.exports = class Config {

    // Vider la base de donnnees ou une classe particuliere
    async cleanDB(classe = false) {
        const session = neo4jSession.start();
        try {
            let cypher
            if(!classe){
                cypher = `
                    MATCH (n)
                    WITH n, [(n)--() | 1] AS rels
                    DETACH DELETE n
                    RETURN count(n) AS nodesDeleted, size(rels) AS relationshipsDeleted
                `;
            }else{
                cypher = `
                    MATCH (n: ${classe} )
                    WITH n, [(n)--() | 1] AS rels
                    DETACH DELETE n
                    RETURN count(n) AS nodesDeleted, size(rels) AS relationshipsDeleted
                `;
            }
            // console.log(cypher);
            const result = await session.run(cypher);
            const summary = result.records[0];
            const nodesDeleted = summary.get('nodesDeleted').toNumber();
            const relationshipsDeleted = summary.get('relationshipsDeleted').toNumber();
            // Resumé de l'operation
            console.info(`   Deleted ${nodesDeleted} nodes and ${relationshipsDeleted} relationships.`);
            return { nodesDeleted, relationshipsDeleted };
        } catch (e) {
            throw new Error(e.message);
        } finally {
            await session.close();
        }
    }
    

    async createUniqueConstraint(classe, col) {
        const session = neo4jSession.start();
        try {
            const query = `
                CREATE CONSTRAINT unique_${classe}_${col} IF NOT EXISTS
                FOR (k: ${classe})
                REQUIRE k.${col} IS UNIQUE;
            `;
            await session.run(query);
            console.log(`Unique constraint unique_${classe}_${col} created successfully.`);
        } catch (error) {
            console.error('Error creating unique constraint:', error);
        } finally {
            await session.close();
        }
    }

    // Charger les continents par defaut dans la bd
    async loadContinents(){
        try{
            // Requete sparql pour obtenir la liste des continents du monde.
            const sparqlQuery_CONTINENTS = `
                SELECT DISTINCT ?continent ?continentLabel ?superficie
                WHERE {
                    ?continent wdt:P31 wd:Q5107;    # Instance of continent
                            wdt:P2046 ?superficie.
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
                }
                ORDER BY ?continentLabel
            `;
            // Execution de la requete sparql depuis wikidata
            const results = await this.#fetchWikiData(sparqlQuery_CONTINENTS)
            // Sauvegarder les noeuds dans neo4j
            let object = new CONTINENT();
            const promises = results.map(async (result) => {
                // Formalisme du noeud a sauvegarder
                let node = {
                    "id": result.continent.value,
                    "label": result.continentLabel.value,
                    "area": result.superficie.value
                };
                return object.save(node)
            });
            let savedNodes = await Promise.all(promises);

            // Affiche dans la console les noeuds enregistrés dans neo4j
            // savedNodes.forEach(savedNode => console.table(savedNode)); 
            // Affiche dans la console les noeuds recuperés depuis wikidata
            // results.forEach(result => console.table(result))         
            
            // Resumé de l'operation
            console.info(`   Created ${savedNodes.length} Continents nodes.`);
            return savedNodes.length
        }catch(err){
            throw new Error(err)
        }
    }

    // Charger les pays du monde
    async loadCountries(){
        try{
            // Liste des pays du monde
            const sparqlQuery_COUNTRIES = `
                SELECT DISTINCT ?pays ?paysLabel ?continent ?continentLabel ?capitalLabel ?superficie
                WHERE {
                    ?pays wdt:P31 wd:Q6256;    # Instance of country
                        wdt:P30 ?continent;
                        wdt:P36 ?capital;
                        wdt:P2046 ?superficie.
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
                }
                ORDER BY ?paysLabel
            `;
            // Execution de la requete sparql depuis wikidata
            const results = await this.#fetchWikiData(sparqlQuery_COUNTRIES)
            // Sauvegarder les noeuds dans neo4j
            let object = new COUNTRY();
            const promises = results.map(async (result) => {
                // Formalisme du noeud a sauvegarder
                let node = {
                    "id": result.pays.value,
                    "label": result.paysLabel.value,
                    "area": result.superficie.value,
                    "capital" : result.capitalLabel.value,
                    "continent" : result.continent.value
                };
                return object.save(node)
            });
            let savedNodes = await Promise.all(promises);

            // Affiche dans la console les noeuds enregistrés dans neo4j
            // savedNodes.forEach(savedNode => console.table(savedNode)); 
            // Affiche dans la console les noeuds recuperés depuis wikidata
            // results.forEach(result => console.table(result))         
            
            // Resumé de l'operation
            console.info(`   Created ${savedNodes.length} Countries nodes.`);
            return savedNodes.length
        }catch(err){
            throw new Error(err)
        }
    }

    // Charger les tueurs en serie
    async loadKillers(){
        try{
            // Liste des tueurs en serie (serial Killer)
            const sparqlQuery_KILLERS = `
                SELECT ?tueurEnSerie ?tueurEnSerieLabel ?nomTueurLabel ?prenomTueurLabel ?image ?victimsOfKiller ?workPeriodStart ?workPeriodEnd ?dateNaissanceTueur ?lieuNaissanceTueurLabel ?nationaliteTueur ?nationaliteTueurLabel (GROUP_CONCAT(?condamnation; separator=", ") AS ?condamnations)
                WHERE {
                    ?tueurEnSerie wdt:P31 wd:Q5;  # Instance de: humain
                                wdt:P106 wd:Q484188;  # Profession: tueur en série
                                wdt:P734 ?nomTueur;
                                wdt:P735 ?prenomTueur;
                                wdt:P569 ?dateNaissanceTueur;
                                wdt:P19 ?lieuNaissanceTueur;
                                wdt:P27 ?nationaliteTueur;
                                wdt:P1399 ?condamnation.
                    OPTIONAL {
                        ?tueurEnSerie wdt:P1345 ?victimsOfKiller;
                                wdt:P18 ?image;
                                wdt:P2031 ?workPeriodStart;
                                wdt:P2032 ?workPeriodEnd.
                    }
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
                }
                GROUP BY ?tueurEnSerie ?tueurEnSerieLabel ?nomTueurLabel ?prenomTueurLabel ?image ?victimsOfKiller ?workPeriodStart ?workPeriodEnd ?dateNaissanceTueur ?nationaliteTueur ?nationaliteTueurLabel ?lieuNaissanceTueurLabel
                ORDER BY ?tueurEnSerie
            `;
            // Execution de la requete sparql depuis wikidata
            const results = await this.#fetchWikiData(sparqlQuery_KILLERS)
            // Sauvegarder les noeuds dans neo4j
            let object = new KILLER();
            const promises = results.map(async (result) => {
                // Formalisme du noeud a sauvegarder
                let node = {
                    "id": result.tueurEnSerie.value,
                    "label": result.tueurEnSerieLabel.value,
                    "lastname": result.nomTueurLabel.value,
                    "firstname" : result.prenomTueurLabel.value,
                    "birthday" : result.dateNaissanceTueur.value,
                    "placeOfBirthday" : result.lieuNaissanceTueurLabel.value,
                    "country" : result.nationaliteTueur.value,
                    "nationality" : result.nationaliteTueurLabel.value,
                    "convicted" : result.condamnations.value,
                    // OPTIONAL VALUES
                    "image" : (result.image?.value) ? result.image.value : undefined,
                    "victimsOfKiller"  : (result.victimsOfKiller?.value) ? result.victimsOfKiller.value : undefined,
                    "workPeriodStart" : (result.workPeriodStart?.value) ? result.workPeriodStart.value : undefined,
                    "workPeriodEnd" : (result.workPeriodEnd?.value) ? result.workPeriodEnd.value : undefined
                };
                return object.save(node)
            });
            let savedNodes = await Promise.all(promises);

            // Affiche dans la console les noeuds enregistrés dans neo4j
            // savedNodes.forEach(savedNode => console.table(savedNode)); 
            // Affiche dans la console les noeuds recuperés depuis wikidata
            // results.forEach(result => console.table(result))         
            
            // Resumé de l'operation
            console.info(`   Created ${savedNodes.length} killers nodes.`);
            return savedNodes.length
        }catch(err){
            throw new Error(err)
        }
    }

    // Charger les victimes
    async loadVictims(){
        try{
            // Liste des personnes tuees par des serial killer
            const sparqlQuery_VICTIMES = `
                SELECT ?victime ?victimeLabel ?nomVictimeLabel ?prenomVictimeLabel ?dateNaissanceVictime ?image ?lieuNaissanceVictimeLabel ?nationaliteVictime ?nationaliteVictimeLabel ?killer ?killerLabel ?lieuDeces ?lieuDecesLabel ?dateMort ?paysDeces ?paysDecesLabel
                WHERE {
                ?victime wdt:P31 wd:Q5;    # Instance of human
                        wdt:P157 ?killer;         # wd:Q1956761;
                        wdt:P734 ?nomVictime;
                        wdt:P735 ?prenomVictime;
                        wdt:P569 ?dateNaissanceVictime;
                        wdt:P19 ?lieuNaissanceVictime;
                        wdt:P570 ?dateMort;
                        wdt:P27 ?nationaliteVictime.
                ?killer wdt:P106 wd:Q484188.
                
                OPTIONAL {
                    ?victime wdt:P18 ?image;
                            wdt:P20 ?lieuDeces.
                    ?lieuDeces wdt:P17 ?paysDeces.
                }
                SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
                }
                ORDER BY ?victime
            `;
            
            // Execution de la requete sparql depuis wikidata
            const results = await this.#fetchWikiData(sparqlQuery_VICTIMES)
            
        
            // Sauvegarder les noeuds dans neo4j
            let object = new VICTIM();
            const promises = results.map(async (result) => {
                // console.table(result)
                // Formalisme du noeud a sauvegarder
                let node = {
                    "id": result.victime.value,
                    "label": result.victimeLabel.value,
                    "lastname": result.nomVictimeLabel.value,
                    "firstname" : result.prenomVictimeLabel.value,
                    "birthday" : result.dateNaissanceVictime.value,
                    "placeOfBirthday" : result.lieuNaissanceVictimeLabel.value,
                    "country" : result.nationaliteVictime.value,
                    "nationality" : result.nationaliteVictimeLabel.value,
                    "killer" : result.killer.value,
                    "killerName" : result.killerLabel.value,
                    "dateOfDeath" : result.dateMort.value,
                    
                    "placeOfDeath" : result.lieuDeces ? result.lieuDeces.value : 'null',
                    "placeOfDeathLabel" : result.lieuDecesLabel ? result.lieuDecesLabel.value : 'null',
                    "image": result.image ? result.image.value : 'null',
                    "countryOfDeath" : result.paysDeces ? result.paysDeces.value : 'null',
                    "countryOfDeathLabel" : result.paysDecesLabel? result.paysDecesLabel.value : 'null',
                    
                };

                return object.save(node)
            });
            
            let savedNodes = await Promise.all(promises);
            
            // Affiche dans la console les noeuds enregistrés dans neo4j
            // savedNodes.forEach(savedNode => console.table(savedNode)); 
            // Affiche dans la console les noeuds recuperés depuis wikidata
            // results.forEach(result => console.table(result))         
            
            // Resumé de l'operation
            console.info(`   Created ${savedNodes.length} victims nodes.`);
            return savedNodes.length
        }catch(err){
            throw new Error(err)
        }
    }

    async relationshipBetweenCountryAndContinent(){
        try{
            // let continent = new CONTINENT();
            let country = new COUNTRY();
            let results = await country.getAll()
            const promises = results.map(async (co) => {
                // Formalisme du noeud a sauvegarder
                try{
                    return country.createCountryContinentRelationship(co.id, co.continent)
                }catch(e){
                    console.info(` Created continent-[:HAS_COUNTRY]->Country relationships: ${e.message}`);
                }
            });
            let relationships = await Promise.all(promises);
            console.info(`   Created ${relationships.length} Continent-[:HAS_COUNTRY]->Country relationships.`);

        }catch(err){
            throw new Error(err)
        }

    }

    async relationshipBetweenCountryAndKiller(){
        try{
            // let continent = new CONTINENT();
            let killer = new KILLER();
            let results = await killer.getAll()
            const promises = results.map(async (k) => {
                // Formalisme du noeud a sauvegarder
                try{
                    return killer.createKillerCountryRelationship(k.id, k.country)
                }catch(e){
                    console.info(` Created Killer-[:HAS_NATIONALITY]->Country relationships: ${e.message}`);
                }
            });
            let relationships = await Promise.all(promises);
            console.info(`   Created ${relationships.length} Killer-[:HAS_NATIONALITY]->Country relationships.`);

        }catch(err){
            throw new Error(err)
        }

    }


    async findEntityName(entityId){
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

}
