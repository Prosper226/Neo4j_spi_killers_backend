"use strict";

const Conviction = require('../services/Conviction')
const ConvictionInstance = new Conviction();

module.exports = class ConvictionController {

    async getAll(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : false;
            const result = await ConvictionInstance.getAll(limit);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const id = req.params.id;
            const result = await ConvictionInstance.getById(id);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    async searchByName(req, res) {
        try {
            const nameQuery = req.params.nameQuery;
            const result = await ConvictionInstance.searchByLabel(nameQuery);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

}

