class GraphUtil {
    static createKillerNode(killer) {
        const node = {
            id: killer.id,
            label: `${killer.firstname} ${killer.lastname}`,
            type: "killer",
            title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
            color: { background: 'blue' }
        };
    
        if (killer.image) {
            node.shape = 'circularImage';
            node.image = killer.image;
        }
    
        return node;
    }

    static createVictimNode(victim) {
        return {
            id: victim.id,
            label: `${victim.firstname} ${victim.lastname}`,
            type: "victim",
            title: `${victim.firstname} ${victim.lastname}\nType: Victim`,
            color: { background: 'red' }
        };
    }

    static createConvictionNode(conviction) {
        return {
            id: conviction.id,
            label: conviction.label,
            type: "conviction",
            title: `Conviction: ${conviction.label}`,
            color: { background: 'yellow' }
        };
    }

    static createCountryNode(country) {
        const node = {
            id: country.id,
            label: country.label,
            type: "country",
            title: `Country: ${country.label}`,
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
                color = { color: 'blue' };
                title = `${fromData.firstname} ${fromData.lastname} killed ${toData.firstname} ${toData.lastname}.`;
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
                color = { color: 'black' };
                title = `${fromData.firstname} ${fromData.lastname} died in ${toData.label}`;
                break;
            case "HAS_COUNTRY":
                color = { color: 'brown' };
                title = `${toData.label} is part of ${fromData.label}`;
                break;
            case "HAS_CONTINENT":
                color = { color: 'red' };
                title = `${toData.label} is part of ${fromData.label}`;
                break;
            default:
                color = { color: 'grey' };
                title = '';
        }

        return { from, to, color, title };
    }
}

module.exports = GraphUtil;
