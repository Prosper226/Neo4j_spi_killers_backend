const KillerService = require('../services/Killer');
const VictimService = require('../services/Victim');
const ConvictionService = require('../services/Conviction');
const CountryService = require('../services/Country');
const ContinentService = require('../services/Continent');
const GraphUtil = require('../classes/GraphUtil');

const killerService = new KillerService();
const victimService = new VictimService();
const convictionService = new ConvictionService();
const countryService = new CountryService();
const continentService = new ContinentService();

module.exports = class GraphController {
    async killersVictims(req, res) {
        try {
            const killers = await killerService.getAll();
            const victims = await victimService.getAll();

            const nodes = [];
            const edges = [];

            killers.forEach(killer => {
                nodes.push(GraphUtil.createKillerNode(killer));
            });

            victims.forEach(victim => {
                nodes.push(GraphUtil.createVictimNode(victim));
                const killer = killers.find(k => k.id === victim.killer);
                if (killer) {
                    edges.push(GraphUtil.createEdge(victim.killer, victim.id, "KILLED_BY", killer, victim));
                }
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } 

    async killersConvictions(req, res) {
        try {
            const convictions = await convictionService.getAll();
            const killers = await killerService.getAll();

            const nodes = [];
            const edges = [];

            convictions.forEach(conviction => {
                nodes.push(GraphUtil.createConvictionNode(conviction));
            });

            killers.forEach(killer => {
                nodes.push(GraphUtil.createKillerNode(killer));
                killer.convicted.forEach(convictionId => {
                    const conviction = convictions.find(c => c.id === convictionId);
                    if (conviction) {
                        edges.push(GraphUtil.createEdge(killer.id, conviction.id, "CONVICTED_OF", killer, conviction));
                    }
                });
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async killersCountries(req, res) {
        try {
            const countries = await countryService.getAll();
            const killers = await killerService.getAll();

            const nodes = [];
            const edges = [];

            countries.forEach(country => {
                nodes.push(GraphUtil.createCountryNode(country));
            });

            killers.forEach(killer => {
                nodes.push(GraphUtil.createKillerNode(killer));
                const country = countries.find(c => c.id === killer.country);
                if (country) {
                    edges.push(GraphUtil.createEdge(killer.id, country.id, "HAS_NATIONALITY", killer, country));
                }
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async killersContinents(req, res) {
        try {
            const continents = await continentService.getAll();
            const countries = await countryService.getAll();
            const killers = await killerService.getAll();

            const nodes = [];
            const edges = [];

            continents.forEach(continent => {
                nodes.push(GraphUtil.createContinentNode(continent));
            });

            countries.forEach(country => {
                const continent = continents.find(c => c.id === country.continent);
                if (continent) {
                    nodes.push(GraphUtil.createCountryNode(country));
                    edges.push(GraphUtil.createEdge(country.id, continent.id, "HAS_COUNTRY", continent, country));
                }
            });

            killers.forEach(killer => {
                nodes.push(GraphUtil.createKillerNode(killer));
                const country = countries.find(c => c.id === killer.country);
                if (country) {
                    edges.push(GraphUtil.createEdge(killer.id, country.id, "HAS_NATIONALITY", killer, country));
                }
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getNodeAndConnections(req, res) {
        try {
            const nodeId = req.params.id;
            const killers = await killerService.getAll();
            const victims = await victimService.getAll();
            const convictions = await convictionService.getAll();
            const countries = await countryService.getAll();
            const continents = await continentService.getAll();
    
            const nodes = [];
            const edges = [];
    
            const addNode = (node) => {
                if (!nodes.find(n => n.id === node.id)) {
                    nodes.push(node);
                }
            };
    
            const addEdge = (edge) => {
                if (!edges.find(e => e.from === edge.from && e.to === edge.to)) {
                    edges.push(edge);
                }
            };
    
            const killer = killers.find(k => k.id === nodeId);
            const victim = victims.find(v => v.id === nodeId);
            const conviction = convictions.find(c => c.id === nodeId);
            const country = countries.find(c => c.id === nodeId);
            const continent = continents.find(c => c.id === nodeId);
    
            if (killer) {
                addNode(GraphUtil.createKillerNode(killer));
    
                victims.forEach(victim => {
                    if (victim.killer === killer.id) {
                        addNode(GraphUtil.createVictimNode(victim));
                        addEdge(GraphUtil.createEdge(killer.id, victim.id, "KILLED_BY", killer, victim));
                    }
                });
    
                killer.convicted.forEach(convictionId => {
                    const conviction = convictions.find(c => c.id === convictionId);
                    if (conviction) {
                        addNode(GraphUtil.createConvictionNode(conviction));
                        addEdge(GraphUtil.createEdge(killer.id, conviction.id, "CONVICTED_OF", killer, conviction));
                    }
                });
    
                if (killer.country) {
                    const country = countries.find(c => c.id === killer.country);
                    if (country) {
                        addNode(GraphUtil.createCountryNode(country));
                        addEdge(GraphUtil.createEdge(killer.id, country.id, "HAS_NATIONALITY", killer, country));
                    }
                }
    
                if (killer.continent) {
                    const continent = continents.find(c => c.id === killer.continent);
                    if (continent) {
                        addNode(GraphUtil.createContinentNode(continent));
                        addEdge(GraphUtil.createEdge(killer.id, continent.id, "HAS_CONTINENT", killer, continent));
                    }
                }
            } else if (victim) {
                // Gérer les connexions pour les victimes
                addNode(GraphUtil.createVictimNode(victim));
    
                const killer = killers.find(k => k.id === victim.killer);
                if (killer) {
                    addNode(GraphUtil.createKillerNode(killer));
                    addEdge(GraphUtil.createEdge(killer.id, victim.id, "KILLED_BY", killer, victim));
                }
    
                const country = countries.find(c => c.id === victim.country);
                if (country) {
                    addNode(GraphUtil.createCountryNode(country));
                    addEdge(GraphUtil.createEdge(victim.id, country.id, "DIED_IN", victim, country));
                }
            } else if (conviction) {
                // Gérer les connexions pour les condamnations
                addNode(GraphUtil.createConvictionNode(conviction));
    
                const relatedKillers = killers.filter(k => k.convicted.includes(conviction.id));
                relatedKillers.forEach(killer => {
                    addNode(GraphUtil.createKillerNode(killer));
                    addEdge(GraphUtil.createEdge(killer.id, conviction.id, "CONVICTED_OF", killer, conviction));
                });
            } else if (country) {
                // Gérer les connexions pour les pays
                addNode(GraphUtil.createCountryNode(country));
    
                const relatedKillers = killers.filter(k => k.country === country.id);
                relatedKillers.forEach(killer => {
                    addNode(GraphUtil.createKillerNode(killer));
                    addEdge(GraphUtil.createEdge(killer.id, country.id, "HAS_NATIONALITY", killer, country));
                });
    
                const relatedVictims = victims.filter(v => v.country === country.id);
                relatedVictims.forEach(victim => {
                    addNode(GraphUtil.createVictimNode(victim));
                    const killer = killers.find(k => k.id === victim.killer);
                    if (killer) {
                        addNode(GraphUtil.createKillerNode(killer));
                        addEdge(GraphUtil.createEdge(killer.id, victim.id, "KILLED_BY", killer, victim));
                    }
                    addEdge(GraphUtil.createEdge(victim.id, country.id, "DIED_IN", victim, country));
                });
            } else if (continent) {
                // Gérer les connexions pour les continents
                addNode(GraphUtil.createContinentNode(continent));
    
                const relatedCountries = countries.filter(c => c.continent === continent.id);
                relatedCountries.forEach(country => {
                    addNode(GraphUtil.createCountryNode(country));
                    addEdge(GraphUtil.createEdge(country.id, continent.id, "HAS_COUNTRY", country, continent));
    
                    const relatedKillers = killers.filter(k => k.country === country.id);
                    relatedKillers.forEach(killer => {
                        addNode(GraphUtil.createKillerNode(killer));
                        addEdge(GraphUtil.createEdge(killer.id, country.id, "HAS_NATIONALITY", killer, country));
                    });
    
                    const relatedVictims = victims.filter(v => v.country === country.id);
                    relatedVictims.forEach(victim => {
                        addNode(GraphUtil.createVictimNode(victim));
                        const killer = killers.find(k => k.id === victim.killer);
                        if (killer) {
                            addNode(GraphUtil.createKillerNode(killer));
                            addEdge(GraphUtil.createEdge(killer.id, victim.id, "KILLED_BY", killer, victim));
                        }
                        addEdge(GraphUtil.createEdge(victim.id, country.id, "DIED_IN", victim, country));
                    });
                });
            }
    
            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    
    async killers(req, res) {
        try {
            const killers = await killerService.getAll();

            const nodes = [];
            const edges = [];

            killers.forEach(killer => {
                nodes.push(GraphUtil.createKillerNode(killer));
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async victims(req, res) {
        try {
            const victims = await victimService.getAll();

            const nodes = [];
            const edges = [];

            victims.forEach(victim => {
                nodes.push(GraphUtil.createVictimNode(victim));
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async convictions(req, res) {
        try {
            const convictions = await convictionService.getAll();

            const nodes = [];
            const edges = [];

            convictions.forEach(conviction => {
                nodes.push(GraphUtil.createConvictionNode(conviction));
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async continents(req, res) {
        try {
            const continents = await continentService.getAll();

            const nodes = [];
            const edges = [];

            continents.forEach(continent => {
                nodes.push(GraphUtil.createContinentNode(continent));
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async countries(req, res) {
        try {
            const countries = await countryService.getAll();

            const nodes = [];
            const edges = [];

            countries.forEach(country => {
                nodes.push(GraphUtil.createCountryNode(country));
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getCompleteGraph(req, res) {
        try {
            const killers = await killerService.getAll();
            const victims = await victimService.getAll();
            const countries = await countryService.getAll();
            const continents = await continentService.getAll();
            const convictions = await convictionService.getAll();

            const nodes = [];
            const edges = [];

            // Ajouter les tueurs et leurs relations
            killers.forEach(killer => {
                nodes.push(GraphUtil.createKillerNode(killer));
                if (killer.country) {
                    edges.push(GraphUtil.createEdge(killer.id, killer.country, "FROM_COUNTRY", killer, { id: killer.country }));
                }
                if (killer.convictions) {
                    killer.convictions.forEach(convictionId => {
                        edges.push(GraphUtil.createEdge(killer.id, convictionId, "CONVICTED_OF", killer, { id: convictionId }));
                    });
                }
            });

            // Ajouter les victimes et leurs relations
            victims.forEach(victim => {
                nodes.push(GraphUtil.createVictimNode(victim));
                const killer = killers.find(k => k.id === victim.killer);
                if (killer) {
                    edges.push(GraphUtil.createEdge(victim.killer, victim.id, "KILLED_BY", killer, victim));
                }
                if (victim.country) {
                    edges.push(GraphUtil.createEdge(victim.id, victim.country, "FROM_COUNTRY", victim, { id: victim.country }));
                }
            });

            // Ajouter les pays et leurs relations
            countries.forEach(country => {
                nodes.push(GraphUtil.createCountryNode(country));
                if (country.continent) {
                    edges.push(GraphUtil.createEdge(country.id, country.continent, "LOCATED_IN", country, { id: country.continent }));
                }
            });

            // Ajouter les continents
            continents.forEach(continent => {
                nodes.push(GraphUtil.createContinentNode(continent));
            });

            // Ajouter les condamnations
            convictions.forEach(conviction => {
                nodes.push(GraphUtil.createConvictionNode(conviction));
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async continentsCountries(req, res) {
        try {
            const continents = await continentService.getAll();
            const countries = await countryService.getAll();

            const nodes = [];
            const edges = [];

            // Add continent nodes
            continents.forEach(continent => {
                nodes.push(GraphUtil.createContinentNode(continent));
            });

            // Add country nodes and edges linking them to their respective continents
            countries.forEach(country => {
                const continent = continents.find(c => c.id === country.continent);
                if (continent) {
                    nodes.push(GraphUtil.createCountryNode(country));
                    edges.push(GraphUtil.createEdge(country.id, continent.id, "LOCATED_IN", country, continent));
                }
            });

            res.status(200).json({ nodes, edges });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

}