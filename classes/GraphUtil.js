class GraphUtil {
    static formatDate = (date) => {
        if(!date){
            return '--'
        }
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            // hour: '2-digit',
            // minute: '2-digit'
        };
        return new Date(date).toLocaleString('fr-FR', options);
    };

    static createKillerNode(killer) {
        var node = {
            id: killer.id,
            label: `${killer.firstname} ${killer.lastname}`,
            type: "killer",
            title: `${killer.firstname} ${killer.lastname}\n est un tueur en série`,
            color: { background: 'blue' }
        };
    
        if (killer.image) {
            node.shape = 'circularImage';
            node.image = killer.image;
        }
        if(killer.birthday){
            node.title += `\nNé le ${this.formatDate(killer.birthday)}`
        }

        if(killer.workPeriodStart && killer.workPeriodEnd){
            node.title += `\nIl a sévit au ${killer.nationality} \nentre ${this.formatDate(killer.workPeriodStart)} et ${this.formatDate(killer.workPeriodEnd)} ` 
        }

    
        return node;
    }

    static createVictimNode(victim) {
        const node = {
            id: victim.id,
            label: `${victim.firstname} ${victim.lastname}`,
            type: "victim",
            title: `${victim.firstname} ${victim.lastname} est une victime de tueur en serie.`,
            color: { background: 'red' }
        };

        if (victim.image) {
            node.shape = 'circularImage';
            node.image = victim.image;
        }
        if(victim.birthday){
            node.title += `\nNé le ${this.formatDate(victim.birthday)}`
        }

        if(victim.dateOfDeath && victim.countryOfDeathLabel){
            node.title += `\nTué le ${this.formatDate(victim.dateOfDeath)} au ${victim.countryOfDeathLabel}`
        }
        if(victim.killerName){
            node.title += `\npar ${victim.killerName}`
        }

        return node
    }

    static createConvictionNode(conviction) {
        return {
            id: conviction.id,
            label: conviction.label,
            type: "conviction",
            title: `Condamnation: ${conviction.label}`,
            color: { background: 'yellow' }
        };
    }

    static createCountryNode(country) {
        const node = {
            id: country.id,
            label: country.label,
            type: "country",
            title: `Pays: ${country.label}`,
            color: { background: 'pink' }
        };
        if (country.image) {
            node.shape = 'circularImage';
            node.image = country.image;
        }
        return node
    }

    static createContinentNode(continent) {
        return {
            id: continent.id,
            label: continent.label,
            type: "continent",
            title: `Continent: ${continent.label}`,
            color: { background: 'green' }
        };
    }

    static createEdge(from, to, type, fromData, toData) {
        let color;
        let title;
        
        switch (type) {
            case "KILLED_BY":
                color = { color: 'red' };
                title = `${fromData.firstname} ${fromData.lastname} a tué ${toData.firstname} ${toData.lastname}.`;
                break;
            case "CONVICTED_OF":
                color = { color: 'purple' };
                title = `${fromData.firstname} ${fromData.lastname} a été condamné pour ${toData.label}`;
                break;
            case "HAS_NATIONALITY":
                color = { color: 'green' };
                title = `${fromData.firstname} ${fromData.lastname} a pour nationalité ${toData.label}`;
                break;
            case "DIED_IN":
                color = { color: 'yellow' };
                title = `${fromData.firstname} ${fromData.lastname} est mort au ${toData.label}`;
                break;
            case "HAS_COUNTRY":
                color = { color: 'brown' };
                title = `${toData.label} contient ${fromData.label}`;
                break;
            case "HAS_CONTINENT":
                color = { color: 'blue' };
                title = `${toData.label} est du continent ${fromData.label}`;
                break;
            default:
                color = { color: 'grey' };
                title = '';
        }

        return { from, to, color, title };
    }
}

module.exports = GraphUtil;
