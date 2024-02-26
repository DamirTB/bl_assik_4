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

const loginRequired = (req, res, next) => {
    if (!req.session.user || !req.session.user.username) {
      return res.status(401).redirect('/sign-in')
    }
    next();
};

const templates = path.join(__dirname, 'templates');

app.get('/users', loginRequired, async (req, res) => {
  try {
      const query = `
          SELECT u.id, u.username
          FROM "users" u
          LEFT JOIN friendship f ON u.username = f.user_2
          WHERE f.user_1 IS NULL OR f.user_1 != $1;
      `;
      const values = [req.session.user.username]; // Assuming user information is stored in session
      const { rows } = await pool.query(query, values);
      const reversedRows = rows.reverse(); // Reverse the order of retrieved users
      res.render('users', { users: reversedRows, cur : req.session.user.username});
  }catch(error){
      console.error('Error fetching users:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/request', loginRequired, async (req, res) => {
  try {
      const query = `SELECT * FROM requests WHERE user_receiver = $1;`;
      const values = [req.session.user.username]; 
      const { rows } = await pool.query(query, values);
      res.render('request', { requests: rows });
  } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).send('Internal Server Error');
  }
});


app.get('/users/:id', loginRequired, async (req, res) => {
  try {
      const userId = req.params.id;
      const query = `SELECT username FROM users WHERE id = $1;`;
      const values = [userId];
      const { rows } = await pool.query(query, values);
      if (rows.length === 0) {
          return res.status(404).send('User not found');
      }
      const username_receiver = rows[0].username;
      const username_sender = req.session.user.username
      const new_query = `INSERT INTO requests (user_receiver, user_sender) VALUES ($1, $2);`;
      const new_values = [username_receiver, username_sender];
      await pool.query(new_query, new_values);
      res.send('Request sent successfully!');
  } catch (error) {
      console.error('Error fetching user:', error);
      res.redirect('/users')
      //res.status(500).send('Internal Server Error');
  }
});

app.get('/request/:id', loginRequired, async(req, res) => {
  try{
    const requestId = req.params.id
    const query = `SELECT user_sender FROM requests WHERE id = $1;`;
    const values = [requestId];
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return res.status(404).send('User not found');
    }
    const user_sender = rows[0].user_sender;
    const user_receiver = req.session.user.username;
    const new_query = `
            INSERT INTO Friendship (user_1, user_2)
            VALUES ($1, $2);
        `;
    const new_values_1 = [user_sender, user_receiver];
    const new_values_2 = [user_receiver, user_sender];
    await pool.query(new_query, new_values_1);
    await pool.query(new_query, new_values_2);
    const delete_query = `DELETE FROM requests WHERE id = $1;`;
    await pool.query(delete_query, [requestId]);
    res.send('Friendship added');
  }catch (error){
    console.error('Error with request:', error);
    //res.redirect('/users')
    res.status(500).send('Internal Server Error');
  }
})

app.post('/test', loginRequired, async(req, res) => {
  const wallet = req.body.wallet;
  const username = req.session.user.username;
  if(req.session.user.wallet_address == null){
    const updateQuery = 'UPDATE users SET wallet_address = $1 WHERE username = $2';
    const updateValues = [wallet, username];
    try{
      const updateResult = await pool.query(updateQuery, updateValues);
      if (updateResult.rowCount === 1) {
        // Wallet address updated successfully
        console.log('Wallet address updated successfully');
        res.send('Wallet address updated successfully');
    } else {
        res.status(404).send('User not found');
      }
    }catch (error) {
      console.error('Error updating wallet address:', error);
      res.status(500).send('Error updating wallet address');
    }
  }
})

app.get('/', async(req, res)=>{
    res.sendFile(path.join(templates + '/index.html'));
})

app.get('/dashboard', loginRequired, async (req, res) => {
    try {
      const username = req.session.user.username;
      const wallet = req.session.user.wallet_address;
      const password = req.session.user.password
      res.render('dashboard', { username: username, wallet : wallet});
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving books');
    }
});

app.get('/sign-in', async(req, res) =>{
    if(req.session.user){
        //res.json("already authorized");
        res.redirect('/dashboard');
        return;
    }
    res.sendFile(path.join(templates + '/login.html'));
});

app.post('/sign-in', async (req, res) => {
    if(req.session.user){
      res.redirect('/dashboard');
      return;
    }
    const { username, password } = req.body;
    // if (!username || !password) {
    //   return res.status(400).json({
    //     message: "You have to fill in both fields"
    //   });
    // }
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length > 0) {
        const storedHashedPassword = result.rows[0].password;
        const check = await bcrypt.compare(password, storedHashedPassword);
        if (check) {
          req.session.user=result.rows[0];
          res.redirect('/dashboard');
          //res.status(200).json({message:"correct"});
          //res.json(result.rows[0]);
        } else {
          //res.status(401).send("Incorrect password");
          res.status(401).json({message:"Incorrect"});
        }
      } else {
        res.status(401).send("No user found with the provided username");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error occurred while processing the request");
    }
});

app.get('/registration', (req, res) => {
    if(req.session.user){
        //res.json("already authorized");
        res.redirect('/dashboard');
        return;
    }
    res.sendFile(path.join(templates + '/registration.html'));
});

app.post('/registration', async (req, res) => {
    if(req.session.user){
      res.redirect('/dashboard');
      return;
    }
    const { username, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *';
    const values = [username, hashedPassword];
    
    const userExistsQuery = 'SELECT * FROM users WHERE username = $1';
    const userExistsValues = [username];
    try {
      const userExistsResult = await pool.query(userExistsQuery, userExistsValues);
      if (userExistsResult.rows.length > 0) {
        // User already exists
        return res.status(400).send('User with that username or email already exists');
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send('Error checking user existence');
    }
  
    try{
      const result = await pool.query(query, values);
      req.session.user = result.rows[0];
      // req.session.user = {
      //   id: result.rows[0].id,
      //   username: result.rows[0].username,
      //   email: result.rows[0].email
      // }
      res.redirect('/dashboard/')
    }catch (error) {
      console.error(error);
      res.status(500).send('Error registering user');
    }
});

app.get('/forum', loginRequired, async (req, res) => {
  const username = req.session.user.username
  //console.log(username)
  const query = 'SELECT * FROM posts';
  const { rows } = await pool.query(query);
  const reversedRows = rows.reverse(); 
  res.render('forum', { posts: reversedRows});
});

app.get('/post/:id', loginRequired, async (req, res) => {
  try {
    const id = req.params.id;
    const query = 'SELECT * FROM posts WHERE id = $1'; 
    const query_comment = "SELECT * FROM comment WHERE id_post = $1";
    const { rows, rowCount } = await pool.query(query, [id]);
    const { rows : comment} = await pool.query(query_comment, [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    //res.json(comment);
    //console.log(rows_comm);
    res.render('single_post', {post : rows[0], comment : comment});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving post' });
  }
});

app.post('/post/:id', loginRequired, async(req, res) => {
  try {
    const text = req.body.text;
    const author = req.session.user.username;
    const id_post = req.params.id; 
    if (!text || !id_post) {
      return res.status(400).json({ error: 'Text and post ID are required' });
    }
    const query = 'INSERT INTO comment (text, author, id_post) VALUES ($1, $2, $3) RETURNING *';
    const values = [text, author, id_post];
    const { rows } = await pool.query(query, values);
    res.redirect(`/post/${id_post}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error inserting comment' });
  }
});

app.post('/post', loginRequired, async (req, res) => {
  try {
    const name = req.body.name;
    const text = req.body.text;
    const author = req.session.user.username;
    const query = 'INSERT INTO posts (title, text, author) VALUES ($1, $2, $3) RETURNING *';
    const values = [name, text, author];
    const result = await pool.query(query, values);
    res.redirect('/forum');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error inserting posts');
  }
});

app.get('/sign-out', loginRequired, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      res.status(500).send('Error');
    } else {
      res.redirect('/sign-in');
    }
  });
});

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