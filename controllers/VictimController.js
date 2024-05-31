const Victim = require('../services/Victim');
const VictimAPIModel = require('../classes/VictimAPIModel')
const victimInstance = new Victim();
const victimAPIModel = new VictimAPIModel()

module.exports = class VictimController{
    async getAll(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : false;
            const victims = await victimInstance.getAll(limit);
            const result = await Promise.all(victims.map(async victim => {
                return await victimAPIModel.fromObject(victim).toJSON();
            }));
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const id = req.params.id;
            const result = await victimInstance.getById(id);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    async searchByName(req, res) {
        try {
            const nameQuery = req.params.nameQuery;
            const result = await victimInstance.searchByLabel(nameQuery);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }
};
