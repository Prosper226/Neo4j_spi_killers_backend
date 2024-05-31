"use strict";


const Killer = require('../services/Killer');
const Victim = require('../services/Victim');
const Conviction = require('../services/Conviction');
const Continent = require('../services/Continent')
const Country = require('../services/Country')

const convictionInstance = new Conviction(); 
const killerInstance = new Killer();
const victimInstance = new Victim();
const continentInstance = new Continent();
const countryInstance = new Country();


module.exports = class GraphController {

    // Graphe liens entres tueurs et victimes
    async killersVictims(req, res) {
        try {

            const killers = await killerInstance.getAll();
            const victims = await victimInstance.getAll();
            
            const nodes = [];
            const edges = [];

            killers.forEach(killer => {
                nodes.push({
                    id: killer.id,
                    label: `${killer.firstname} ${killer.lastname}`,
                    type: "killer",
                    title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                    color: { background: 'red' }
                });
            });

            victims.forEach(victim => {
                nodes.push({
                    id: victim.id,
                    label: `${victim.firstname} ${victim.lastname}`,
                    type: "victim",
                    title: `${victim.firstname} ${victim.lastname}\nType: Victim`,
                    color: { background: 'green' }
                });
                const killer = killers.find(k => k.id === victim.killer);
                edges.push({
                    from: victim.killer,
                    to: victim.id,
                    color: { color: 'blue' },
                    title: `${killer ? `${killer.firstname} ${killer.lastname}` : 'Unknown'} killed ${victim.firstname} ${victim.lastname}.`
                });
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Graphe liens entres tueurs et condamnation
    async killersConvictions(req, res) {
        try {
            
            const convictions = await convictionInstance.getAll();
            const killers = await killerInstance.getAll();
    
            const nodes = [];
            const edges = [];

            convictions.forEach(conviction => {
                nodes.push({
                    id: conviction.id,
                    label: conviction.label,
                    type: "conviction",
                    title: `Conviction: ${conviction.label}`,
                    color: { background: 'yellow' }
                });
            });

        

            killers.forEach(killer => {
                nodes.push({
                    id: killer.id,
                    label: `${killer.firstname} ${killer.lastname}`,
                    type: "killer",
                    title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                    color: { background: 'red' }
                });
                killer.convicted.forEach(convictionId => {
                    const conviction = convictions.find(c => c.id === convictionId);
                    if (conviction) {
                        edges.push({
                            from: killer.id,
                            to: conviction.id,
                            color: { color: 'purple' },
                            title: `${killer.firstname} ${killer.lastname} convicted for ${conviction.name}`
                        });
                    }
                });
            });
    
            // res.status(200).json(nodes);
    
            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Graphe liens entre tueurs et pays
    async killersCountries(req, res) {
        try {
            const killers = await killerInstance.getAll();
            const countries = await countryInstance.getAll();

            const nodes = [];
            const edges = [];

            countries.forEach(country => {
                nodes.push({
                    id: country.id,
                    label: country.name,
                    type: "country",
                    title: `Country: ${country.name}`,
                    color: { background: 'blue' }
                });
            });

            killers.forEach(killer => {
                nodes.push({
                    id: killer.id,
                    label: `${killer.firstname} ${killer.lastname}`,
                    type: "killer",
                    title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                    color: { background: 'red' }
                });
                if (killer.country) {
                    const country = countries.find(c => c.id === killer.country);
                    if (country) {
                        edges.push({
                            from: killer.id,
                            to: country.id,
                            color: { color: 'green' },
                            title: `${killer.firstname} ${killer.lastname} is associated with ${country.name}`
                        });
                    }
                }
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Graphe liens entre tueurs et continents
    async killersContinents(req, res) {
        try {
            const killers = await killerInstance.getAll();
            const continents = await continentInstance.getAll();

            const nodes = [];
            const edges = [];

            continents.forEach(continent => {
                nodes.push({
                    id: continent.id,
                    label: continent.name,
                    type: "continent",
                    title: `Continent: ${continent.name}`,
                    color: { background: 'orange' }
                });
            });

            killers.forEach(killer => {
                nodes.push({
                    id: killer.id,
                    label: `${killer.firstname} ${killer.lastname}`,
                    type: "killer",
                    title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                    color: { background: 'red' }
                });
                if (killer.continent) {
                    const continent = continents.find(c => c.id === killer.continent);
                    if (continent) {
                        edges.push({
                            from: killer.id,
                            to: continent.id,
                            color: { color: 'brown' },
                            title: `${killer.firstname} ${killer.lastname} is associated with ${continent.name}`
                        });
                    }
                }
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Graphe liens entre tueurs et lieux de naissance
    async killersBirthplaces(req, res) {
        try {
            const killers = await killerInstance.getAll();

            const nodes = [];
            const edges = [];

            killers.forEach(killer => {
                nodes.push({
                    id: killer.id,
                    label: `${killer.firstname} ${killer.lastname}`,
                    type: "killer",
                    title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                    color: { background: 'red' }
                });
                if (killer.placeOfBirthday) {
                    nodes.push({
                        id: killer.placeOfBirthday,
                        label: killer.placeOfBirthday,
                        type: "birthplace",
                        title: `Place of Birth: ${killer.placeOfBirthday}`,
                        color: { background: 'blue' }
                    });
                    edges.push({
                        from: killer.id,
                        to: killer.placeOfBirthday,
                        color: { color: 'grey' },
                        title: `${killer.firstname} ${killer.lastname} was born in ${killer.placeOfBirthday}`
                    });
                }
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    
    // Méthode pour récupérer un nœud et ses connexions
    async getNodeAndConnections(req, res) {
        try {
            const nodeId = req.params.id;
            const killers = await killerInstance.getAll();
            const victims = await victimInstance.getAll();
            const convictions = await convictionInstance.getAll();
            const countries = await countryInstance.getAll();
            const continents = await continentInstance.getAll();

            const nodes = [];
            const edges = [];

            // Fonction pour ajouter un nœud s'il n'existe pas déjà
            const addNode = (node) => {
                if (!nodes.find(n => n.id === node.id)) {
                    nodes.push(node);
                }
            };

            // Fonction pour ajouter une connexion s'il n'existe pas déjà
            const addEdge = (edge) => {
                if (!edges.find(e => e.from === edge.from && e.to === edge.to)) {
                    edges.push(edge);
                }
            };

            // Rechercher le nœud demandé et ses connexions
            const killer = killers.find(k => k.id === nodeId);
            const victim = victims.find(v => v.id === nodeId);
            const conviction = convictions.find(c => c.id === nodeId);
            const country = countries.find(c => c.id === nodeId);
            const continent = continents.find(c => c.id === nodeId);

            if (killer) {
                addNode({
                    id: killer.id,
                    label: `${killer.firstname} ${killer.lastname}`,
                    type: "killer",
                    title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                    color: { background: 'red' }
                });

                // Ajouter les victimes de ce tueur
                victims.forEach(victim => {
                    if (victim.killer === killer.id) {
                        addNode({
                            id: victim.id,
                            label: `${victim.firstname} ${victim.lastname}`,
                            type: "victim",
                            title: `${victim.firstname} ${victim.lastname}\nType: Victim`,
                            color: { background: 'green' }
                        });
                        addEdge({
                            from: killer.id,
                            to: victim.id,
                            color: { color: 'blue' },
                            title: `${killer.firstname} ${killer.lastname} killed ${victim.firstname} ${victim.lastname}.`
                        });
                    }
                });

                // Ajouter les condamnations de ce tueur
                killer.convicted.forEach(convictionId => {
                    const conviction = convictions.find(c => c.id === convictionId);
                    if (conviction) {
                        addNode({
                            id: conviction.id,
                            label: conviction.label,
                            type: "conviction",
                            title: `Conviction: ${conviction.label}`,
                            color: { background: 'yellow' }
                        });
                        addEdge({
                            from: killer.id,
                            to: conviction.id,
                            color: { color: 'purple' },
                            title: `${killer.firstname} ${killer.lastname} convicted for ${conviction.label}`
                        });
                    }
                });

                // Ajouter le pays de ce tueur
                if (killer.country) {
                    const country = countries.find(c => c.id === killer.country);
                    if (country) {
                        addNode({
                            id: country.id,
                            label: country.name,
                            type: "country",
                            title: `Country: ${country.name}`,
                            color: { background: 'blue' }
                        });
                        addEdge({
                            from: killer.id,
                            to: country.id,
                            color: { color: 'green' },
                            title: `${killer.firstname} ${killer.lastname} is associated with ${country.name}`
                        });
                    }
                }

                // Ajouter le continent de ce tueur
                if (killer.continent) {
                    const continent = continents.find(c => c.id === killer.continent);
                    if (continent) {
                        addNode({
                            id: continent.id,
                            label: continent.name,
                            type: "continent",
                            title: `Continent: ${continent.name}`,
                            color: { background: 'orange' }
                        });
                        addEdge({
                            from: killer.id,
                            to: continent.id,
                            color: { color: 'brown' },
                            title: `${killer.firstname} ${killer.lastname} is associated with ${continent.name}`
                        });
                    }
                }
            } else if (victim) {
                addNode({
                    id: victim.id,
                    label: `${victim.firstname} ${victim.lastname}`,
                    type: "victim",
                    title: `${victim.firstname} ${victim.lastname}\nType: Victim`,
                    color: { background: 'green' }
                });

                // Ajouter le tueur de cette victime
                const killer = killers.find(k => k.id === victim.killer);
                if (killer) {
                    addNode({
                        id: killer.id,
                        label: `${killer.firstname} ${killer.lastname}`,
                        type: "killer",
                        title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                        color: { background: 'red' }
                    });
                    addEdge({
                        from: killer.id,
                        to: victim.id,
                        color: { color: 'blue' },
                        title: `${killer.firstname} ${killer.lastname} killed ${victim.firstname} ${victim.lastname}.`
                    });
                }

                // Ajouter le pays de naissance de cette victime
                if (victim.country) {
                    const country = countries.find(c => c.id === victim.country);
                    if (country) {
                        addNode({
                            id: country.id,
                            label: country.name,
                            type: "country",
                            title: `Country: ${country.name}`,
                            color: { background: 'blue' }
                        });
                        addEdge({
                            from: victim.id,
                            to: country.id,
                            color: { color: 'green' },
                            title: `${victim.firstname} ${victim.lastname} is from ${country.name}`
                        });
                    }
                }

                // Ajouter le pays de décès de cette victime
                if (victim.countryOfDeath) {
                    const countryOfDeath = countries.find(c => c.id === victim.countryOfDeath);
                    if (countryOfDeath) {
                        addNode({
                            id: countryOfDeath.id,
                            label: countryOfDeath.name,
                            type: "country",
                            title: `Country of Death: ${countryOfDeath.name}`,
                            color: { background: 'blue' }
                        });
                        addEdge({
                            from: victim.id,
                            to: countryOfDeath.id,
                            color: { color: 'black' },
                            title: `${victim.firstname} ${victim.lastname} died in ${countryOfDeath.name}`
                        });
                    }
                }
            } else if (conviction) {
                addNode({
                    id: conviction.id,
                    label: conviction.label,
                    type: "conviction",
                    title: `Conviction: ${conviction.label}`,
                    color: { background: 'yellow' }
                });

                // Ajouter les tueurs ayant cette condamnation
                killers.forEach(killer => {
                    if (killer.convicted.includes(conviction.id)) {
                        addNode({
                            id: killer.id,
                            label: `${killer.firstname} ${killer.lastname}`,
                            type: "killer",
                            title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                            color: { background: 'red' }
                        });
                        addEdge({
                            from: killer.id,
                            to: conviction.id,
                            color: { color: 'purple' },
                            title: `${killer.firstname} ${killer.lastname} convicted for ${conviction.label}`
                        });
                    }
                });
            } else if (country) {
                addNode({
                    id: country.id,
                    label: country.name,
                    type: "country",
                    title: `Country: ${country.name}`,
                    color: { background: 'blue' }
                });

                // Ajouter les tueurs de ce pays
                killers.forEach(killer => {
                    if (killer.country === country.id) {
                        addNode({
                            id: killer.id,
                            label: `${killer.firstname} ${killer.lastname}`,
                            type: "killer",
                            title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                            color: { background: 'red' }
                        });
                        addEdge({
                            from: killer.id,
                            to: country.id,
                            color: { color: 'green' },
                            title: `${killer.firstname} ${killer.lastname} is associated with ${country.name}`
                        });
                    }
                });

                // Ajouter les victimes de ce pays
                victims.forEach(victim => {
                    if (victim.country === country.id) {
                        addNode({
                            id: victim.id,
                            label: `${victim.firstname} ${victim.lastname}`,
                            type: "victim",
                            title: `${victim.firstname} ${victim.lastname}\nType: Victim`,
                            color: { background: 'green' }
                        });
                        addEdge({
                            from: victim.id,
                            to: country.id,
                            color: { color: 'green' },
                            title: `${victim.firstname} ${victim.lastname} is from ${country.name}`
                        });
                    }
                });
            } else if (continent) {
                addNode({
                    id: continent.id,
                    label: continent.name,
                    type: "continent",
                    title: `Continent: ${continent.name}`,
                    color: { background: 'orange' }
                });

                // Ajouter les pays de ce continent
                countries.forEach(country => {
                    if (country.continent === continent.id) {
                        addNode({
                            id: country.id,
                            label: country.name,
                            type: "country",
                            title: `Country: ${country.name}`,
                            color: { background: 'blue' }
                        });
                        addEdge({
                            from: continent.id,
                            to: country.id,
                            color: { color: 'brown' },
                            title: `${country.name} is part of ${continent.name}`
                        });

                        // Ajouter les tueurs de ce pays
                        killers.forEach(killer => {
                            if (killer.country === country.id) {
                                addNode({
                                    id: killer.id,
                                    label: `${killer.firstname} ${killer.lastname}`,
                                    type: "killer",
                                    title: `${killer.firstname} ${killer.lastname}\nType: Killer`,
                                    color: { background: 'red' }
                                });
                                addEdge({
                                    from: killer.id,
                                    to: country.id,
                                    color: { color: 'green' },
                                    title: `${killer.firstname} ${killer.lastname} is associated with ${country.name}`
                                });
                            }
                        });

                        // Ajouter les victimes de ce pays
                        victims.forEach(victim => {
                            if (victim.country === country.id) {
                                addNode({
                                    id: victim.id,
                                    label: `${victim.firstname} ${victim.lastname}`,
                                    type: "victim",
                                    title: `${victim.firstname} ${victim.lastname}\nType: Victim`,
                                    color: { background: 'green' }
                                });
                                addEdge({
                                    from: victim.id,
                                    to: country.id,
                                    color: { color: 'green' },
                                    title: `${victim.firstname} ${victim.lastname} is from ${country.name}`
                                });
                            }
                        });
                    }
                });
            } else {
                return res.status(404).json({ message: "Node not found" });
            }

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }


}
