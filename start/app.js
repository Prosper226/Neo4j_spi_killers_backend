const express = require('express');
const neo4j = require('neo4j-driver');
const bodyPaser = require('body-parser');
// Create an Express application
const app = express();
const port = 3000;

// Neo4j connection details
const uri = 'neo4j://localhost:7687';  // Replace with your Neo4j URI
// const user = 'neo4j';  // Replace with your Neo4j username
// const password = 'CRIMINALS';  // Replace with your Neo4j password
// const password = 'neo4j/neo4j';  // Replace with your Neo4j password

// Create a Neo4j driver instance

const user = 'haemasu'
const password = 'haemasu1234'
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// Middleware to handle JSON requests
app.use(express.json());
app.use(bodyPaser.json());

app.get('/test', (req, res) => {
  res.send('test')
})

// Example route to test the connection
app.get('/criminals', async (req, res) => {

  // console.log(driver)

  // const session = driver.session({ database: 'criminals' })
  const session = driver.session({ database: 'neo4j' })
  
  try {
    const result = await session.run('MATCH (n:Movie) RETURN n LIMIT 15');
    const criminals = result.records.map(record => record.get('n').properties);
    res.json(criminals);
  } catch (error) {
    console.error('Error fetching criminals:', error);
    res.status(500).send('Error fetching criminals');
  } finally {
    await session.close();
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Close the Neo4j driver when the application exits
process.on('exit', () => {
  driver.close();
});