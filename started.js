const CONFIG = require('./services/Config')
let config = new CONFIG();

// Initialisation du projet 
async function initialized(){
    try{
        // 1- Nettoyer la base de donnees.
        console.info(`Nettoyage de la base de données.`)
        await config.cleanDB().then(() => console.info(`Nettoyage de la données de données terminé.`) ).catch(error => { console.error(error); process.exit });
        // 2- Mise en place de contrainte d'integrité
        console.info(`Mise en place des contraintes d'integrité`)
        await config.createUniqueConstraint('Continent', 'id').then( () => console.info(`Mise en place de la contrainte d'integrité terminé.`)).catch(error => console.error(error));
        await config.createUniqueConstraint('Country', 'id').then( () => console.info(`Mise en place de la contrainte d'integrité terminé.`)).catch(error => console.error(error));
        await config.createUniqueConstraint('Conviction', 'id').then( () => console.info(`Mise en place de la contrainte d'integrité terminé.`)).catch(error => console.error(error));
        await config.createUniqueConstraint('Killer', 'id').then( () => console.info(`Mise en place de la contrainte d'integrité terminé.`)).catch(error => console.error(error));
        await config.createUniqueConstraint('Victim', 'id').then( () => console.info(`Mise en place de la contrainte d'integrité terminé.`)).catch(error => console.error(error));
        // 3- Charger les continents du monde.
        console.info(`Chargement des continents du monde.`)
        await config.loadContinents().then( () => console.info(`Chargement des donnees de continent terminé.`)).catch(error => console.error(error));
        // 4- Charger les pays du monde.
        console.info(`Chargement des pays du monde.`)
        await config.loadCountries().then( () => console.info(`Chargement des donnees de pays terminé.`)).catch(error => console.error(error));
        // 5- charger les tueurs en serie
        console.info(`Chargement des tueurs en serie.`)
        await config.loadKillers().then( () => console.info(`Chargement des donnees des tueurs en serie terminé.`)).catch(error => console.error(error));
        // 6- charger les victimes de tueur en serie
        console.info(`Chargement des victimes.`)
        await config.loadVictims().then( () => console.info(`Chargement des donnees des victimes terminé.`)).catch(error => console.error(error));


        /**
         *  PROCEDURE DE CONFIGURATION DE DEMARRAGE DU PROJET GESTION DES CRIMINELS
         * 1 - Nettoyer la base de donnees (
         *         Si des donnees existent deja, possibilité de nettoyer 
         *         une classe particulieres et ses liens en passant le nom de la
         *         classe en parametre de la fonction cleanDB.
         *     )
         * 2 - Etablir les contraintes d'integrités (
         *          - continent
         *          - pays
         *          - condamnation
         *          - tueur
         *          - victime
         *      )
         * 3 - Charger les continents
         * 4 - Charger les pays (
         *          - liaison continent vers pays (HAS_COUNTRY)
         *       )
         * 5 - Charger les tueurs (
         *          - creation de condamnation si non existant
         *          - liaison tueur vers condamnation, (IS_CONVICTED)
         *          - liaison tueur vers pays, ( HAS_NATIONALITY)
         *       )
         * 6 - Charger les victimes (
         *          - liaison victime vers tueurs (KILLEY_BY)
         *          - liaison victime vers pays ( HAS_NATIONALITY, DEATH_IN)
         *      )
         */
    }catch(e){
        console.error(e.message)
    }
}


initialized()