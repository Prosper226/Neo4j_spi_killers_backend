'use strict';

const Killer = require('../services/Killer');
const SerialKillerAPIModel = require('../classes/SerialKillerAPIModel')
const killerInstance = new Killer();
const serialKillerAPIModel = new SerialKillerAPIModel()

module.exports = class KillerController {

    async create(req, res) {
        try {
            const { firstname, lastname, birthday, placeOfBirthday, country, convicted, victimsOfKiller, workPeriodStart, workPeriodEnd  } = req.body;
            // Fetch additional data from external sources if necessary
            const label = `${firstname} ${lastname}`;
            const nationality = await fetchCountryLabel(country).then((c) => c.label);
            const convicteds  = await checkConvictionsExistence(convicted)
            const killerData = {
                label,
                firstname,
                lastname,
                birthday: reformatDate(birthday),
                placeOfBirthday,
                country,
                nationality,
                victimsOfKiller, 
                workPeriodStart: reformatDate(workPeriodStart), 
                workPeriodEnd: reformatDate(workPeriodEnd),
                convicted : convicteds.existingIds
            };
            var killer = await killerInstance.addKiller(killerData);
            let result = await serialKillerAPIModel.fromObject(killer[0]).toJSON()
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : false;
            const killers = await killerInstance.getAll(limit);
            const result = await Promise.all(killers.map(async killer => {
                return await serialKillerAPIModel.fromObject(killer).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getAllWithPhotos(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : false;
            const killers = await killerInstance.getAll(limit);
            const killersWithPhotos = killers.filter(killer => killer.image);
            const result = await Promise.all(killersWithPhotos.map(async killer => {
                return await serialKillerAPIModel.fromObject(killer).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const id = req.params.id;
            const killer = await killerInstance.getById(id);
            const result =  await serialKillerAPIModel.fromObject(killer).toJSON();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const updates = req.body;
            const killer = await killerInstance.update(id, updates);
            // let result = await serialKillerAPIModel.fromObject(killer).toJSON()
            res.status(200).json(killer);
        } catch (error) {
            throw Error(error)
            res.status(500).json({ message: error.message });
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            const result = await killerInstance.delete(id);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getByCountry(req, res) {
        try {
            const countryId = req.params.countryId;
            const killers = await killerInstance.getKillersByCountry(countryId);
            const result = await Promise.all(killers.map(async killer => {
                return await serialKillerAPIModel.fromObject(killer).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getByContinent(req, res) {
        try {
            const continentId = req.params.continentId;
            const killers = await killerInstance.getKillersByContinent(continentId);
            const result = await Promise.all(killers.map(async killer => {
                return await serialKillerAPIModel.fromObject(killer).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getByConviction(req, res) {
        try {
            const convictionId = req.params.convictionId;
            const killers = await killerInstance.getKillersByConviction(convictionId);
            const result = await Promise.all(killers.map(async killer => {
                return await serialKillerAPIModel.fromObject(killer).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async searchByName(req, res) {
        try {
            const nameQuery = req.params.nameQuery; // Les lettres du nom à rechercher
            const killers = await killerInstance.searchByNameOrLabel(nameQuery);
            const result = await Promise.all(killers.map(async killer => {
                return await serialKillerAPIModel.fromObject(killer).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    async searchByCountry(req, res) {
        try {
            const countryName = req.params.countryName;
            const killers = await killerInstance.searchByCountry(countryName);
            const result = await Promise.all(killers.map(async killer => {
                return await serialKillerAPIModel.fromObject(killer).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }
    
    async searchByContinent(req, res) {
        try {
            const continentName = req.params.continentName;
            const killers = await killerInstance.searchByContinent(continentName);
            const result = await Promise.all(killers.map(async killer => {
                return await serialKillerAPIModel.fromObject(killer).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    async searchByConviction(req, res) {
        try {
            const convictionName = req.params.convictionName;
            const killers = await killerInstance.searchByConviction(convictionName);
            const result = await Promise.all(killers.map(async killer => {
                return await serialKillerAPIModel.fromObject(killer).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }
    
    
};

function reformatDate(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    if (isNaN(date)) return null;
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchCountryLabel(countryId) {
    try{
        const Country = require('../services/Country');
        const countryInstance = new Country();
        return countryInstance.getById(countryId);
    }catch(err){
        return null;
    }
}

async function checkConvictionsExistence(convictionIds) {
    try {
        const Conviction = require('../services/Conviction');
        const convictionInstance = new Conviction();
        return await convictionInstance.checkConvictionsExistence(convictionIds);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}



