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
            birthday: this.formatDate(this.object.birthday),
            placeOfBirthday: this.object.placeOfBirthday,
            // country: this.object.country,
            nationality: this.object.nationality,
            victimsOfKiller : this.object.victimsOfKiller,
            workPeriodStart : this.formatDate(this.object.workPeriodStart),
            workPeriodEnd : this.formatDate(this.object.workPeriodEnd),
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
            summary += `, a été condamné pour ${await this.#checkConvictionsExistence(convicted)} crimes`;
        }
        if (workPeriodStart && workPeriodEnd) {
            summary += `, et a opéré de ${this.formatDate(workPeriodStart)} à ${this.formatDate(workPeriodEnd)}`;
        }
        if (victimsOfKiller) {
            summary += `. Pendant sa carrière criminelle, il a fait ${victimsOfKiller} victimes`;
        }
        if (birthday) {
            summary += `. Né le ${this.formatDate(birthday)}`;
        }
        summary += `.`;
    
        return summary;
    }

    // formatDate = (date) => {
    //     // return date
    //     if(!date){
    //         return '--'
    //     }
    //     const options = {
    //         year: 'numeric',
    //         month: '2-digit',
    //         day: '2-digit',
    //         // hour: '2-digit',
    //         // minute: '2-digit'
    //     };
    //     return new Date(date).toLocaleString('fr-FR', options);
    // };

    formatDate = (date) => {
        if (!date) {
            return '--';
        }
    
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (`0${d.getMonth() + 1}`).slice(-2); // Ajout de 1 car les mois sont indexés de 0 à 11
        const day = (`0${d.getDate()}`).slice(-2);
    
        return `${year}-${month}-${day}`;
    };


}
