module.exports = class SerialKillerAPIModel {

    

    constructor(object) {
        this.object  = object
    }

    fromObject(killer) {
        this.object = killer
        return new SerialKillerAPIModel(this.object);
    }

    async toJSON() {
        return {
            id: this.object.id ? this.object.id : null,
            firstname: this.object.firstname,
            lastname: this.object.lastname,
            label : `${this.object.firstname} ${this.object.lastname}`,
            image : this.object.image,
            birthday: this.object.birthday,
            placeOfBirthday: this.object.placeOfBirthday,
            // country: this.object.country,
            nationality: this.object.nationality,
            victimsOfKiller : this.object.victimsOfKiller,
            workPeriodStart : this.object.workPeriodStart,
            workPeriodEnd : this.object.workPeriodEnd,
            convicted: await this.#checkConvictionsExistence(this.object.convicted),
            // victims : await this.#killerVictimes(this.object.id),
            summary: await this.#createSummary(this.object)
        };
    }

    async  #checkConvictionsExistence(convictionIds) {
        try {
            const Conviction = require('../services/Conviction');
            const convictionInstance = new Conviction();
            const convicted = await convictionInstance.checkConvictionsExistence(convictionIds);
            return convicted.existingLabels
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async  #killerVictimes(killerId) {
        try {
            const Killer = require('../services/Killer');
            const killerInstance = new Killer();
            const victims = await killerInstance.getVictimsByKillerId(killerId);
            return victims
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async #createSummary(killer) {
        const { firstname, lastname, nationality, convicted, victimsOfKiller, birthday, workPeriodStart, workPeriodEnd } = killer;
        let summary = `${firstname ? firstname : 'Ce tueur'} ${lastname ? lastname : ''}`;
    
        if (nationality) {
            summary += `, originaire de ${nationality}`;
        }
        if (convicted) {
            summary += `, a été condamné pour ${convicted} crimes`;
        }
        if (workPeriodStart && workPeriodEnd) {
            summary += `, et a opéré de ${workPeriodStart} à ${workPeriodEnd}`;
        }
        if (victimsOfKiller) {
            summary += `. Pendant sa carrière criminelle, il a fait ${victimsOfKiller} victimes`;
        }
        if (birthday) {
            summary += `. Né le ${birthday}`;
        }
        summary += `.`;
    
        return summary;
    }
}
