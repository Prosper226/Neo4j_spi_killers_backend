module.exports = class VictimAPIModel {

    

    constructor(object) {
        this.object  = object
    }

    fromObject(victim) {
        this.object = victim
        return new VictimAPIModel(this.object);
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
            country: this.object.country,
            nationality: this.object.nationality,
            dateOfDeath : this.object.dateOfDeath,
            countryOfDeath : this.object.countryOfDeath,
            placeOfDeath : this.object.placeOfDeath,
            placeOfDeathLabel : this.object.placeOfDeathLabel,
            countryOfDeathLabel : this.object.countryOfDeathLabel,
            killer : this.object.killer,
            killerName : this.object.killerName
        };
    }

    // async  #checkConvictionsExistence(convictionIds) {
    //     try {
    //         const Conviction = require('../services/Conviction');
    //         const convictionInstance = new Conviction();
    //         const convicted = await convictionInstance.checkConvictionsExistence(convictionIds);
    //         return convicted.existingLabels
    //     } catch (error) {
    //         res.status(400).json({ message: error.message });
    //     }
    // }

    // async  #victimVictimes(victimId) {
    //     try {
    //         const victim = require('../services/victim');
    //         const victimInstance = new victim();
    //         const victims = await victimInstance.getVictimsByvictimId(victimId);
    //         return victims
    //     } catch (error) {
    //         res.status(400).json({ message: error.message });
    //     }
    // }
}
