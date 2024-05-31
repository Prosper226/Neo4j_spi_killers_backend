const axios = require('axios');
const neo4j = require('neo4j-driver');
const uri = 'neo4j://localhost:7687'; 
const user = 'haemasu'
const password = 'haemasu1234'
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const sparqlQuery = `
    SELECT ?item ?itemLabel ?authorLabel ?pays ?paysLabel ?DatePublication ?numeroISBN
    WHERE
    {
        ?item wdt:P31 wd:Q7725634;
                wdt:P50 ?author;
                wdt:P495 ?pays;
                wdt:P577 ?DatePublication;
                wdt:P957 ?numeroISBN.
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". } # le label viendra de préférence dans votre langue, et autrement en anglais
    }
    LIMIT 2000
`;

async function fetchWikiData() {
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
        const results = response.data.results.bindings;
        results.forEach(result => {
            // Example usage
            let node = {
                "titre": result.itemLabel.value,
                "ean": result.numeroISBN.value,
                "edition": result.superficie.value,
                "annee": result.DatePublication.value,
                "auteur": result.authorLabel.value,
                "pays": result.paysLabel.value
            };
            saveNode(node, 'Livre').then(newNode => {
                console.log(newNode);
            }).catch(error => {
                console.error(error);
            });
            console.table(result)
        });
    } catch (error) {
        console.error('Error fetching data from WikiData:', error);
    }
}

async function saveNode(node, classe) {
    const session = driver.session({ database: database });
    try {
        const { id, titre, ean, edition, annee, auteur, pays, photo } = node;
        const properties = {
            id, titre, ean, edition, annee, auteur, pays,
            ...(photo && { photo })
        };
        const setClauses = Object.keys(properties).map(prop => `k.${prop} = $${prop}`).join(', ');
        const cypher = `
            MERGE (k:${classe} {id: $id})
            ON CREATE SET ${setClauses}
            ON MATCH SET ${setClauses}
            RETURN k
        `;
        const result = await session.run(cypher, properties);
        return result.records.map(record => record.get('c').properties);
    } catch (error) {
        throw new Error('Error saving continent:', error.message);
    } finally {
        await session.close();
    }
}

fetchWikiData();
