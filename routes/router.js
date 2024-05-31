"use strict";  

const express = require('express');
const router = express.Router();
const KillerController = require('../controllers/killerController');
const CountryController = require('../controllers/CountryController');
const ContinentController = require('../controllers/ContinentController');
const ConvictionController = require('../controllers/ConvictionController')
const VictimController = require('../controllers/VictimController')
const GraphController = require('../controllers/GraphController')
const killerController = new KillerController();
const countryController = new CountryController();
const continentController = new ContinentController();
const convictionController = new ConvictionController()
const victimController = new VictimController()
const graphController = new GraphController()

// KILLERS
router.post('/killers',                                 killerController.create);
router.put('/killers/:id', (req, res) => killerController.update(req, res));
router.delete('/killers/:id', (req, res) => killerController.delete(req, res));
router.get('/killers',                                  killerController.getAll);
router.get('/killers/:id',                              killerController.getById);
router.get('/killers/country/:countryId',               killerController.getByCountry);
router.get('/killers/continent/:continentId',           killerController.getByContinent);
router.get('/killers/conviction/:convictionId',         killerController.getByConviction);
router.get('/killers/search/:nameQuery',                killerController.searchByName);
router.get('/killers/search/country/:countryName',      killerController.searchByCountry);
router.get('/killers/search/continent/:continentName',  killerController.searchByContinent);
router.get('/killers/search/conviction/:convictionName',killerController.searchByConviction);

// COUNTRIES
router.get('/countries',                                countryController.getAll)
router.get('/countries/:id',                            countryController.getById)
router.get('/countries/search/:nameQuery',              countryController.searchByName)

// CONTINENTS
router.get('/continents',                               continentController.getAll)
router.get('/continents/:id',                           continentController.getById)
router.get('/continents/search/:nameQuery',             continentController.searchByName)

// CONVICTIONS
router.get('/convictions',                              convictionController.getAll)
router.get('/convictions/:id',                          convictionController.getById)
router.get('/convictions/search/:nameQuery',            convictionController.searchByName)


// VICTIMS
// router.post('/victims', victimController.create);
// router.put('/victims/:id', victimController.update);
// router.delete('/victims/:id', victimController.delete);
router.get('/victims',                                  victimController.getAll);
router.get('/victims/:id',                              victimController.getById);
router.get('/victims/search/:nameQuery',                victimController.searchByName);



// GRAPH-NETWORK
router.get('/graph/killers-victims',                   graphController.killersVictims);
router.get('/graph/killers-convictions',               graphController.killersConvictions);
router.get('/graph/killers-countries',                 graphController.killersCountries);
router.get('/graph/killers-continents',                graphController.killersContinents);
router.get('/graph/node/:id',                          graphController.getNodeAndConnections);



module.exports = router;
