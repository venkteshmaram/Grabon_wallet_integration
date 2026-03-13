
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Venkatesh%402284@localhost:5432/postgres" // Connect to default 'postgres' db
  });

  try {
    await client.connect();
    console.log('Connected to postgres default DB.');
    
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'grabcash'");
    if (res.rowCount === 0) {
      console.log('Database "grabcash" does not exist. Creating...');
      await client.query('CREATE DATABASE grabcash');
      console.log('Database "grabcash" created successfully.');
    } else {
      console.log('Database "grabcash" already exists.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
