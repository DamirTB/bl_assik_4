const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const ejs = require('ejs');
const axios = require('axios');
const fs = require('fs');
const dotenv = require("dotenv");

const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'dbpg',
    password: '12345',
    port: 5432,
});

app.use(session({
    secret: "Secret_key",
    resave: false, 
    saveUninitialized: false
}));

const templates = path.join(__dirname, 'templates');

// app.get('/', async (req, res) => {
//     try {
//         const client = await pool.connect();
//         const result = await client.query('SELECT 1');
//         res.send('Connected to the database!');
//         client.release();
//     } catch (err) {
//         console.error('Error connecting to the database', err);
//         res.status(500).send('Error connecting to the database');
//     }
// });

app.get('/', async(req, res)=>{
    res.sendFile(path.join(templates + '/index.html'));
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// const envConfig = dotenv.parse(fs.readFileSync('.env'));
// envConfig.token_id = parseInt(envConfig.token_id) + 1;
// const envConfigString = Object.entries(envConfig)
//   .map(([key, value]) => `${key}=${value}`)
//   .join('\n');
// fs.writeFileSync('.env', envConfigString);
// console.log('.env file updated successfully.');