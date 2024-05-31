const axios = require('axios');


// Liste des tueurs en serie (serial Killer)
const sparqlQuery_KILLERS = `
SELECT ?tueurEnSerie ?tueurEnSerieLabel ?nomTueurLabel ?prenomTueurLabel ?dateNaissanceTueur ?lieuNaissanceTueurLabel ?nationaliteTueurLabel ?condamnationLabel
WHERE {
    ?tueurEnSerie wdt:P31 wd:Q5;  # Instance de: humain
                wdt:P106 wd:Q484188;  # Profession: tueur en série
                wdt:P734 ?nomTueur;
                wdt:P735 ?prenomTueur;
                wdt:P569 ?dateNaissanceTueur;
                wdt:P19 ?lieuNaissanceTueur.
            
    OPTIONAL {
    ?tueurEnSerie wdt:P27 ?nationaliteTueur;
                wdt:P1399 ?condamnation.
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
}
LIMIT 10
`;

// Liste des personnes tuees par des serial killer
const sparqlQuery_VICTIMES = `
SELECT DISTINCT ?victime ?victimeLabel ?nomVictimeLabel ?prenomVictimeLabel ?dateNaissanceVictime ?lieuNaissanceVictimeLabel ?nationaliteVictimeLabel ?killer
WHERE {
    ?victime wdt:P31 wd:Q5;    # Instance of human
            wdt:P157 ?keller;         # wd:Q1956761;
            wdt:P734 ?nomVictime;
            wdt:P735 ?prenomVictime;
            wdt:P569 ?dateNaissanceVictime;
            wdt:P19 ?lieuNaissanceVictime;
            wdt:P27 ?nationaliteVictime.
    ?killer wdt:P106 wd:Q484188.
    
    OPTIONAL {
        
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
}
LIMIT 100
`;

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

// Liste des continents du monde
const sparqlQuery_CONTINENTS = `
SELECT DISTINCT ?continent ?continentLabel ?superficie
WHERE {
    ?continent wdt:P31 wd:Q5107;    # Instance of continent
            wdt:P2046 ?superficie.
    SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
}
ORDER BY ?continentLabel
`;


// Define the URL for the WikiData SPARQL endpoint
const url = 'https://query.wikidata.org/sparql';


// Function to execute the SPARQL query
async function fetchWikiData() {
    try {
        const response = await axios.get(url, {
            params: {
            query: sparqlQuery_CONTINENTS,
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
                "continent": result.continent.value,
                "nom": result.continentLabel.value,
                "superficie": result.superficie.value
            };
            const CONTINENT = require('./classes/Continent')
            let continent = new CONTINENT();
            continent.save(node).then(savedNode => {
                console.log(savedNode);
            }).catch(error => {
                console.error(error);
            });

            console.table(result)
        });
    } catch (error) {
        console.error('Error fetching data from WikiData:', error);
    }
}

// Execute the function
fetchWikiData();
