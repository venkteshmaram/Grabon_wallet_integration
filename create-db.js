
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  // Use the DATABASE_URL from .env
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('Error: DATABASE_URL not found in .env');
    return;
  }

  // We need to connect to the 'postgres' default database first to create our new DB
  // So we replace the DB name at the end of the connection string with 'postgres'
  const rootUrl = dbUrl.substring(0, dbUrl.lastIndexOf('/')) + '/postgres';

  const client = new Client({
    connectionString: rootUrl
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
