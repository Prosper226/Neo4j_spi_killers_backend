class GraphUtil {
    static createKillerNode(killer) {
        return {
            id: killer.id,
            label: `${killer.firstname} ${killer.lastname}`,
            type: "killer",
            title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
            color: { background: 'red' }
        };
    }

    static createVictimNode(victim) {
        return {
            id: victim.id,
            label: `${victim.firstname} ${victim.lastname}`,
            type: "victim",
            title: `${victim.firstname} ${victim.lastname}\nType: Victim`,
            color: { background: 'green' }
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
        return {
            id: country.id,
            label: country.label,
            type: "country",
            title: `Country: ${country.label}`,
            color: { background: 'blue' }
        };
    }

    static createContinentNode(continent) {
        return {
            id: continent.id,
            label: continent.name,
            type: "continent",
            title: `Continent: ${continent.name}`,
            color: { background: 'orange' }
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
                title = `${fromData.firstname} ${fromData.lastname} convicted for ${toData.label}`;
                break;
            case "HAS_NATIONALITY":
                color = { color: 'green' };
                title = `${fromData.firstname} ${fromData.lastname} is associated with ${toData.label}`;
                break;
            case "DIED_IN":
                color = { color: 'black' };
                title = `${fromData.firstname} ${fromData.lastname} died in ${toData.label}`;
                break;
            case "HAS_COUNTRY":
                color = { color: 'brown' };
                title = `${toData.name} is part of ${fromData.label}`;
                break;
            case "HAS_CONTINENT":
                color = { color: 'red' };
                title = `${toData.name} is part of ${fromData.label}`;
                break;
            default:
                color = { color: 'grey' };
                title = '';
        }

        return { from, to, color, title };
    }
}

module.exports = GraphUtil;
