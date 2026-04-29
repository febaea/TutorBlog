const pool = require('./db'); 
const express = require('express')
const app = express();
const port = 3000;
// TO DO : Make sure db doesn't store passwords as plain text - include hashing 
// TO DO : Make sure it is -  currentUser.user_id


// check that db is connected 



app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            time: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// check 



var bodyParser = require('body-parser');
const fs = require('fs');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Landing page
app.get('/', (req, res) => {
    /// send the static file
    res.sendFile(__dirname + '/public/html/login.html', (err) => {
        if (err){
            console.log(err);
        }
    })
});

// Reset login_attempt.json when server restarts
let login_attempt = {"username" : "null", "password" : "null"};
let data = JSON.stringify(login_attempt);
fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

// Store who is currently logged in
let currentUser = null;


app.post('/', async (req, res) => {
    const username = req.body.username_input;
    const password = req.body.password_input;

    try{
        const result = await pool.query(
            'SELECT * FROM users where username = $1 AND password = $2'
            [username, password]
        );
        if (result.rows.length === 1) {
            currentUser = result.rows[0];

            res.sendFile(__dirname + '/public/html/index.html');
        } else {
            res.sendFile(__dirname + '/public/html/login.html');
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }




}); 
/*
// Login POST request
app.post('/',function(req, res){

    // Get username and password entered from user
    var username = req.body.username_input;
    var password = req.body.password_input;

    // Currently only "username" is a valid username
    if(username !== "username") {

        // Update login_attempt with credentials used to log in
        let login_attempt = {"username" : username, "password" : password};
        let data = JSON.stringify(login_attempt);
        fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

        // Redirect back to login page
        res.sendFile(__dirname + '/public/html/login.html', (err) => {
            if (err){
                console.log(err);
            }
        });
    }

    // Currently only "password" is a valid password
    if(password !== "password") {

        // Update login_attempt with credentials used to log in
        let login_attempt = {"username" : username, "password" : password};
        let data = JSON.stringify(login_attempt);
        fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

        // Redirect back to login page
        res.sendFile(__dirname + '/public/html/login.html', (err) => {
            if (err){
                console.log(err);
            }
        });
    }

    // Valid username and password both entered together
    if(username === "username" && password === "password") {
        // Update login_attempt with credentials
        let login_attempt = {"username" : username, "password" : password};
        let data = JSON.stringify(login_attempt);
        fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

        // Update current user upon successful login
        currentUser = req.body.username_input;

        // Redirect to home page
        res.sendFile(__dirname + '/public/html/index.html', (err) => {
            if (err){
                console.log(err);
            }
        })
    }
});

*/

// Make a post POST request
/*
app.post('/makepost', function(req, res) {

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    // Get the current date
    let curDate = new Date();
    curDate = curDate.toLocaleString("en-GB");

    // Find post with the highest ID
    let maxId = 0;
    for (let i = 0; i < posts.length; i++) {
        if (posts[i].postId > maxId) {
            maxId = posts[i].postId;
        }
    }

    // Initialise ID for a new post
    let newId = 0;

    // If postId is empty, user is making a new post
    if(req.body.postId == "") {
        newId = maxId + 1;
    } else { // If postID != empty, user is editing a post
        newId = req.body.postId;

        // Find post with the matching ID, delete it from posts so user can submit their new version
        let index = posts.findIndex(item => item.postId == newId);
        posts.splice(index, 1);
    }

    // Add post to posts.json
    posts.push({"username": currentUser , "timestamp": curDate, "postId": newId, "title": req.body.title_field, "content": req.body.content_field});

    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    // Redirect back to my_posts.html
    res.sendFile(__dirname + "/public/html/my_posts.html");
 });
 */
 app.post('/makepost', async (req, res) => {
    let curDate = new Date();

    try {
        if (!req.body.postId) {
            await pool.query(
                `INSERT INTO posts (user_id, title, content)
                 VALUES ($1, $2, $3)`,
                [currentUser.user_id, req.body.title_field, req.body.content_field]
            );
        } else {
            await pool.query(
                `UPDATE posts
                 SET title = $1, content = $2
                 WHERE post_id = $3 AND user_id = $4`,
                [req.body.title_field, req.body.content_field, req.body.postId, currentUser.user_id]
            );
        }

        res.sendFile(__dirname + "/public/html/my_posts.html");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving post");
    }
});





 // Delete a post POST request
 app.post('/deletepost', async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM posts WHERE post_id = $1 AND user_id = $2`,
            [req.body.postId, currentUser.user_id]
        );

        res.sendFile(__dirname + "/public/html/my_posts.html");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting post");
    }
});

 /*
 app.post('/deletepost', (req, res) => {

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    // Find post with matching ID and delete it
    let index = posts.findIndex(item => item.postId == req.body.postId);
    posts.splice(index, 1);

    // Update posts.json
    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    res.sendFile(__dirname + "/public/html/my_posts.html");
 });

 */


//  ------- TESTS --------  :
app.get('/test-insert-user', async (req, res) => {
    try {
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, username, email, password, role)
             VALUES ('Test', 'User', 'testuser123', 'test@test.com', '1234', 'student')
             RETURNING *`
        );

        res.json(result.rows[0]);

    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.get('/test-post', async (req, res) => {
    try {
        const result = await pool.query(
            `INSERT INTO posts (user_id, title, content)
             VALUES (1, 'Hello Post', 'This is a test post')
             RETURNING *`
        );

        res.json(result.rows[0]);

    } catch (err) {
        res.status(500).send(err.message);
    }
});



app.listen(port, () => {
    console.log(`My app listening on port ${port}!`)
});