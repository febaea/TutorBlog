const {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  generateOtpAuthUrl,
} = require("./public/js/totp");
require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const emailController = require("./email");
const pool = require("./db");
const postsRouter = require("./posts");
const app = express();
const port = 3000;
// TO DO : Make sure db doesn't store passwords as plain text - include hashing
// TO DO : Make sure it is -  currentUser.user_id???
// TO DO: Work on sessions
// TO DO - change code to generate number code instead of using library
// TO DO: Add option of third party app to scan qr code omn login page
// work on authentication flow
// add sign up page and make sql database function

// check that db is connected
// const speakeasy = require("speakeasy");
const QRcode = require("qrcode");
const session = require("express-session");
var bodyParser = require("body-parser");
const fs = require("fs");

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// check

//Middleware
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(
  session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  }),
);

// JWT helpers
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "jwt_secret_key",
    { expiresIn: "2h" }, //change to 2 hours?
  );
}

function setTokenCookie(res, token) {
  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 2 * 60 * 60 * 1000,
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) return res.redirect("/");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "jwt_secret_key",
    (err, decoded) => {
      if (err) return res.redirect("/");
      req.user = decoded; // { id, username, email }
      next();
    },
  );
}

// Reset login_attempt.json when server restarts
let login_attempt = { username: "null", password: "null" };
fs.writeFileSync(
  __dirname + "/public/json/login_attempt.json",
  JSON.stringify(login_attempt),
);

// let data = JSON.stringify(login_attempt);
// fs.writeFileSync(__dirname + "/public/json/login_attempt.json", data);

// Store who is currently logged in
//let currentUser = null;

// Landing page
app.get("/", (req, res) => {
  /// send the static file
  res.sendFile(__dirname + "/public/html/login.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.post("/", async (req, res) => {
  const username = req.body.username_input;
  const password = req.body.password_input;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1", // Only get user by username
      [username],
    );
    const user = result.rows[0];

    if (!user) {
      return res.json({ success: false });
    }

    //Compare hashed password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.json({ success: false });
    }

    const roleResult = await pool.query(
      `SELECT r.name FROM roles r 
      JOIN user_roles ur ON ur.role_id = r.id 
      WHERE ur.user_id = $1`,
      [user.id],
    );
    const role = roleResult.rows[0]?.name || "student";
    user.role = role; // attach to user before storing in session/JWT

    //If 2FA not yet set up (false) - send to setup page
    if (!user.twofa_enabled && !user.twofa_secret) {
      req.session.tempUser = user;
      return res.json({ setup2fa: true });
    }
    // if (user.twofa_enabled ) {
    //   req.session.tempUser = user;
    //   console.log("TEMP USER SET:", req.session.tempUser);
    //   return res.json({ twofa: true });
    // }
    // If 2FA enabled and secret exists. -send to verify page
    if (user.twofa_enabled && user.twofa_secret) {
      req.session.tempUser = user;
      return res.json({ twofa: true });
    }

    // 2FA not enabled, no secret code - normal login
    // req.session.user = user;
    const token = signToken(user);
    setTokenCookie(res, token);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

//LOGOUT
app.get("/logout", (req, res) => {
  // Clear the JWT cookie
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Also destroy the express session (used during 2FA flow)
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ─── DASHBOARD (protected home page) ─────────────────────────────────────────

app.get("/dashboard", requireAuth, (req, res) => {
  res.sendFile(__dirname + "/public/html/index.html");
});

// returns session user:
// app.get("/me", (req, res) => {
//   console.log("Session at /me:", req.session);
//   if (!req.session.tempUser) {
//     return res.status(401).json({ message: "Not logged in" });
//   }
//   res.json({ userId: req.session.tempUser.id });
// });

// ─── Who am I? ────────────────────────────────────────────────────────────────

app.get("/me", (req, res) => {
  // res.json({ userId: req.user.id, username: req.user.username });
  // Check JWT first (fully logged in)
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(
      token,
      process.env.JWT_SECRET || "jwt_secret_key",
      (err, decoded) => {
        if (!err) {
          return res.json({ userId: decoded.id, username: decoded.username });
        }
        // Token invalid/expired — fall through to tempUser check
        if (req.session.tempUser) {
          return res.json({
            userId: req.session.tempUser.id,
            username: req.session.tempUser.username,
          });
        }
        return res.status(401).json({ message: "Not logged in" });
      },
    );
    return; // ← critical: stop execution here while callback runs
  }
  // Fall back to tempUser (mid 2FA setup flow)
  if (req.session.tempUser) {
    return res.json({
      userId: req.session.tempUser.id,
      username: req.session.tempUser.username,
    });
  }

  return res.status(401).json({ message: "Not logged in" });
});

// setup 2fa route (qr code generation)
app.get("/setup-2fa/:userId", async (req, res) => {
  const user = req.session.tempUser;
  // const secret = speakeasy.generateSecret({
  //   name: "TutorBlog",
  // });
  // change code here - done
  const secret = generateSecret();

  await pool.query("UPDATE users SET twofa_secret=$1 WHERE id=$2", [
    secret,
    parseInt(req.params.userId),
  ]);
  // Update session with the new secret so confirm route can read it
  if (req.session.tempUser) {
    // req.session.tempUser.twofa_secret = secret.base32;
    req.session.tempUser.twofa_secret = secret;
  }

  const otpAuthUrl = generateOtpAuthUrl(secret, user.username);

  QRcode.toDataURL(otpAuthUrl, (err, url) => {
    res.json({ qrCode: url });
  });

  // QRcode.toDataURL(secret.otpauth_url, (err, url) => {
  //   res.json({qrCode: url});
  // });
});

app.post("/verify-2fa", async (req, res) => {
  console.log("TOKEN RECEIVED:", req.body.token);
  const user = req.session.tempUser;

  // const verified = speakeasy.totp.verify({
  //   secret: user.twofa_secret,
  //   encoding: "base32",
  //   token: token,
  // });
  const verified = verifyTOTP(user.twofa_secret, req.body.token);
  console.log("VERIFIED RESULT:", verified);

  console.log("SESSION:", req.session);
  console.log("TEMP USER:", req.session.tempUser);

  if (verified) {
    // Issue JWT, clear temp session
    const token = signToken(user);
    setTokenCookie(res, token);
    // req.session.user = user;
    req.session.tempUser = null;
    // res.send("2FA success - logged in");
    return res.json({ success: true });
  } else {
    return res.status(401).send("Invalid 2FA code");
  }
});
app.post("/confirm-2fa-setup", async (req, res) => {
  const user = req.session.tempUser;
  if (!user) return res.status(401).json({ message: "Session expired" });

  const token = req.body.token;

  // const verified = speakeasy.totp.verify({
  //   secret: user.twofa_secret,
  //   encoding: "base32",
  //   token: token,
  //   window: 1
  // });
  const verified = verifyTOTP(user.twofa_secret, req.body.token);

  if (verified) {
    await pool.query("UPDATE users SET twofa_enabled = TRUE WHERE id = $1", [
      parseInt(user.id),
    ]);
    // req.session.user = { ...user, twofa_enabled: true };
    // req.session.tempUser = null;
    // return res.json({ success: true });
    // Issue JWT, clear temp session
    const token = signToken({ ...user, twofa_enabled: true });
    setTokenCookie(res, token);
    req.session.tempUser = null;
    return res.json({ success: true });
  } else {
    return res
      .status(401)
      .json({ message: "Code incorrect — try scanning again" });
  }
});

// Add these requires at the top with the others
// const bcrypt = require('bcrypt');
// const emailController = require('./email');

// Add this route for registration page
app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/public/html/register.html");
});

// Registration with OTP
app.post("/register", async (req, res) => {
  const { email, username, password, first_name, last_name, role } = req.body;

  try {
    // Check if email exists
    const existingEmail = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    if (existingEmail.rows.length > 0) {
      // return res.send('<h2>Email already registered</h2><a href="/register">Try again</a>');
      // Delete existing user before re-registering
      await pool.query("DELETE FROM users WHERE email = $1", [
        email.toLowerCase(),
      ]);
    }

    // Check if username exists
    const existingUsername = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    if (existingUsername.rows.length > 0) {
      return res.send(
        '<h2>Username already taken</h2><a href="/register">Try again</a>',
      );
    }

    // Send OTP email
    emailController.sendRegistrationOTP(req, res);
  } catch (error) {
    console.error(error);
    res.send("Registration error");
  }
});

// Verify OTP and complete registration
app.post("/verify-registration", async (req, res) => {
  const { email, username, password, first_name, last_name, otp, role } =
    req.body;

  if (emailController.verifyOTP(email, otp)) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Get next user ID
      const idResult = await pool.query(
        "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM users",
      );
      const userId = idResult.rows[0].next_id;

      // Insert user
      await pool.query(
        `INSERT INTO users (id, username, first_name, last_name, email, password, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          userId,
          username,
          first_name,
          last_name,
          email.toLowerCase(),
          hashedPassword,
        ],
      );

      // Assign role
      const roleResult = await pool.query(
        "SELECT id FROM roles WHERE LOWER(name) = LOWER($1)",
        [role || "student"],
      );
      if (roleResult.rows.length > 0) {
        await pool.query(
          "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
          [userId, roleResult.rows[0].id],
        );
      }

      // If tutor, create tutor profile
      if (role === "tutor") {
        await pool.query(
          "INSERT INTO tutor_profiles (user_id, subject, rating) VALUES ($1, $2, $3)",
          [userId, "Not specified", 0.0],
        );
      }

      // Success page
      res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Registration Successful</title>
                    <style>
                        body { font-family: Arial; text-align: center; padding: 50px; }
                        .success { color: green; font-size: 24px; }
                        .btn { background: #f56d36; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1 class="success">✓ Registration Successful!</h1>
                    <p>Welcome to TutorHub, ${username}!</p>
                    <p>Your account has been created. You can now log in.</p>
                    <a href="/" class="btn">Go to Login</a>
                </body>
                </html>
            `);
    } catch (error) {
      console.error(error);
      res.send("Registration failed. Please try again.");
    }
  } else {
    res.send(`
            <h2>Invalid or Expired Code</h2>
            <p>The verification code is incorrect or has expired.</p>
            <a href="/register">Try registering again</a>
        `);
  }
});

// Resend OTP
app.post("/resend-otp", emailController.resendRegistrationOTP);
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
app.post("/makepost", requireAuth, async (req, res) => {
  let curDate = new Date();

  if (!req.session.user) {
    return res.status(401).send("Not logged in");
  }

  const userId = req.session.user.user_id;

  try {
    if (!req.body.postId) {
      await pool.query(
        `INSERT INTO posts (user_id, title, content)
                 VALUES ($1, $2, $3)`,
        [
          req.session.user.user_id,
          req.body.title_field,
          req.body.content_field,
        ],
      );
    } else {
      await pool.query(
        `UPDATE posts
                 SET title = $1, content = $2
                 WHERE post_id = $3 AND user_id = $4`,
        [
          req.body.title_field,
          req.body.content_field,
          req.body.postId,
          req.session.user.user_id,
        ],
      );
    }

    res.sendFile(__dirname + "/public/html/my_posts.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving post");
  }
});

// Delete a post POST request
app.post("/deletepost", requireAuth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM posts WHERE post_id = $1 AND user_id = $2`, [
      req.body.postId,
      req.session.user.user_id,
    ]);

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
app.get("/tutors", async (req, res) => {
  const search = req.query.q;

  try {
    const result = await pool.query(
      `
      SELECT
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          u.email,
          tp.subject,
          tp.rating,
          ARRAY_AGG(DISTINCT ta.achievement) AS achievements,
          ARRAY_AGG(DISTINCT tq.qualification) AS qualifications
      FROM users u
      JOIN tutor_profiles tp ON tp.user_id = u.id
      LEFT JOIN tutor_achievements ta ON ta.tutor_id = tp.user_id
      LEFT JOIN tutor_qualifications tq ON tq.tutor_id = tp.user_id
      GROUP BY
          u.id,
          tp.subject,
          tp.rating
      `,
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
app.get("/tutors/featured", async (req, res) => {
  try {
    const result = await pool.query(
      ` 
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          tp.subject,
          tp.rating,
          ARRAY_AGG(DISTINCT ta.achievement) AS achievements,
          ARRAY_AGG(DISTINCT tq.qualification) AS qualifications
      FROM users u
      JOIN tutor_profiles tp ON tp.user_id = u.id
      LEFT JOIN tutor_achievements ta ON ta.tutor_id = tp.user_id
      LEFT JOIN tutor_qualifications tq ON tq.tutor_id = tp.user_id
      GROUP BY
          u.id,
          tp.subject,
          tp.rating
      ORDER BY tp.rating DESC
      LIMIT 3
      `,
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
app.get("/tutors/search", async (req, res) => {
  const search = req.query.q;

  try {
    const result = await pool.query(
      `
      SELECT
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          tp.subject,
          tp.rating,
          ARRAY_AGG(DISTINCT ta.achievement) AS achievements,
          ARRAY_AGG(DISTINCT tq.qualification) AS qualifications
      FROM users u
      JOIN tutor_profiles tp ON tp.user_id = u.id
      LEFT JOIN tutor_achievements ta ON ta.tutor_id = tp.user_id
      LEFT JOIN tutor_qualifications tq ON tq.tutor_id = tp.user_id
      WHERE
          u.username ILIKE $1
          OR tp.subject ILIKE $1
          OR ta.achievement ILIKE $1
          OR tq.qualification ILIKE $1
      GROUP BY
          u.id,
          tp.subject,
          tp.rating
      `,
      [`%${search}%`],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT 
            posts.id,
            posts.author_id,
            posts.title,
            posts.content,
            posts.featured_image_url,
            posts.created_at,
            users.username
        FROM posts
        JOIN users ON posts.author_id = users.id
        `,
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

//  ------- TESTS --------  :
app.get("/test-insert-user", async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password)
             VALUES
             (100, 'Alice Smith', 'alice@test.com', 'temp123')
             RETURNING *`,
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/test-post", async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO posts (id, author_id, title, content, created_at)
             VALUES
             (100, 100, 'Test Post', 'This is a Test Post', '3/11/2024, 19:14:16')
             RETURNING *`,
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`My app listening on port ${port}!`);
});
