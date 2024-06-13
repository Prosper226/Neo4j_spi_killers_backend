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
            dateOfDeath : this.formatDate(this.object.dateOfDeath),
            countryOfDeath : this.object.countryOfDeath,
            placeOfDeath : this.object.placeOfDeath,
            placeOfDeathLabel : this.object.placeOfDeathLabel,
            countryOfDeathLabel : this.object.countryOfDeathLabel,
            killer : this.object.killer,
            killerName : this.object.killerName
        };
    }

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
