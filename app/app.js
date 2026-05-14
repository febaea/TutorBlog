const { generateSecret, generateTOTP, verifyTOTP, generateOtpAuthUrl } = require("./public/js/totp")
require("dotenv").config();

const express = require("express");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const emailController = require('./email');
const pool = require("./db");
const postsRouter = require("./posts");
const bodyParser = require("body-parser");

const path = require("path");
const app = express();
const {encrypt, decrypt } = require("../utils/encryption");
const crypto = require('crypto');
const port = 3000;

const QRcode = require("qrcode");
const session = require("express-session");
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
      
      secure: process.env.NODE_ENV === "production",  
      error: err.message,
    });
  }
});



//Middleware 
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, message: "Too many attempts. Try again later." }
});

app.use(
  session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    }
  }),
);

app.use("/posts", postsRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




// JWT helpers
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    process.env.JWT_SECRET || "jwt_secret_key",
    { expiresIn: "2h" } 
  );
}

function setTokenCookie(res, token) {
  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 2 * 60 * 60 * 1000
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) return res.redirect("/");

  jwt.verify(token, process.env.JWT_SECRET || "jwt_secret_key", (err, decoded) => {
    if (err) return res.redirect("/");
    req.user = decoded; 
    next();
  });
}




let login_attempt = { username: "null", password: "null" };
fs.writeFileSync(__dirname + "/public/json/login_attempt.json", JSON.stringify(login_attempt));

// Landing page
app.get("/", (req, res) => {

  res.sendFile(__dirname + "/public/html/login.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});


app.post("/", loginLimiter,  async (req, res) => {
  const username = req.body.username_input;
  const password = req.body.password_input;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1", 
      [username],
    );
    const user = result.rows[0];

    if (!user) {
      return res.json({ success: false });
    }

    //Compare hashed password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.json({ success: false, message:"The username and/or password are incorrect. Please try again."});
    }

    const roleResult = await pool.query(
      `SELECT r.name FROM roles r 
      JOIN user_roles ur ON ur.role_id = r.id 
      WHERE ur.user_id = $1`,
      [user.id]
    );
    const role = roleResult.rows[0]?.name || 'student';
    user.role = role;



    //If 2FA not yet set up (false) - send to setup page 
    if (!user.twofa_enabled && !user.twofa_secret) {
      req.session.tempUser = user;
      return res.json({ setup2fa: true })
    }
    
    if (user.twofa_enabled && !user.twofa_secret) {
      req.session.tempUser = user;
      return res.json({ setup2fa: true }); // force them to re-complete setup
    }


    if (user.twofa_enabled && user.twofa_secret) {
      req.session.tempUser = user;
      return res.json({ twofa: true })
    }


    // 2FA not enabled, no secret code - normal login 
    
    const token = signToken(user);
    setTokenCookie(res, token);
    return res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});


//logout 
app.get("/logout", (req, res) => {
  // Clear the JWT cookie
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  
  req.session.destroy(() => {
    res.redirect("/");
  });
});



//  DASHBOARD (protected home page) 

app.get("/dashboard", requireAuth, (req, res) => {
  res.sendFile(__dirname + "/public/html/index.html");
});


app.get("/me", (req, res) => {
  
  // Check JWT first (fully logged in)
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || "jwt_secret_key", (err, decoded) => {
      if (!err) {
        return res.json({ userId: decoded.id, username: decoded.username, role: decoded.role });
      }
      // Token invalid/expired — fall through to tempUser check
      if (req.session.tempUser) {
        return res.json({ userId: req.session.tempUser.id, username: req.session.tempUser.username, role: req.session.tempUser.role });
      }
      return res.status(401).json({ message: "Not logged in" });
    });
    return;
  }
  // Fall back to tempUser (mid 2FA setup flow)
  if (req.session.tempUser) {
    return res.json({ userId: req.session.tempUser.id, username: req.session.tempUser.username, role: req.session.tempUser.role });
  }

  return res.status(401).json({ message: "Not logged in" });



});



// setup 2fa route (qr code generation)
app.get("/setup-2fa/:userId", async (req, res) => {
  const user = req.session.tempUser;
  const secret = generateSecret();

  await pool.query("UPDATE users SET twofa_secret=$1 WHERE id=$2", [
    secret,
    parseInt(req.params.userId),
  ]);

  if (req.session.tempUser) {
    
    req.session.tempUser.twofa_secret = secret;
  }

  const otpAuthUrl = generateOtpAuthUrl(secret, user.username);

  QRcode.toDataURL(otpAuthUrl, (err, url) => {
    res.json({ qrCode: url });
  });


  
});

app.post("/verify-2fa", async (req, res) => {
  console.log("TOKEN RECEIVED:", req.body.token);
  const user = req.session.tempUser;

  
  const verified = verifyTOTP(user.twofa_secret, req.body.token);
  console.log("VERIFIED RESULT:", verified)

  console.log("SESSION:", req.session);
  console.log("TEMP USER:", req.session.tempUser);

  if (verified) {
  
    const token = signToken(user);
    setTokenCookie(res, token);
  
    req.session.tempUser = null;
    return res.json({ success: true })
  } else {
    return res.status(401).send("Invalid 2FA code");
  }
});
app.post("/confirm-2fa-setup", async (req, res) => {

  const user = req.session.tempUser;
  if (!user) return res.status(401).json({ message: "Session expired" });

  const token = req.body.token;


  const verified = verifyTOTP(user.twofa_secret, req.body.token);

  if (verified) {
    await pool.query(
      "UPDATE users SET twofa_enabled = TRUE WHERE id = $1",
      [parseInt(user.id)]
    );
    
    const token = signToken({ ...user, twofa_enabled: true });
    setTokenCookie(res, token);
    req.session.tempUser = null;
    return res.json({ success: true });
  } else {
    return res.status(401).json({ message: "Code incorrect — try scanning again" });
  }
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public/html/register.html');
});


app.post('/register', async (req, res) => {
  const { email, username, password, first_name, last_name, role } = req.body;

  const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');

  try {
   
    const existingEmail = await pool.query('SELECT id FROM users WHERE email_hash = $1', [emailHash]);
    if (existingEmail.rows.length > 0) {
        await pool.query('DELETE FROM users WHERE email_hash = $1', [emailHash]);
      }

    
    const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUsername.rows.length > 0) {
      return res.send('<h2>Username already taken</h2><a href="/register">Try again</a>');
    }

    req.session.pendingRegistration = {
      email, username, password, first_name, last_name, role
    };
  
    emailController.sendRegistrationOTP(req, res);

  } catch (error) {
    console.error(error);
    res.send('Registration error');
  }
});


app.post('/verify-registration', async (req, res) => {
  const pending = req.session.pendingRegistration;
  if (!pending) {
    return res.send('Registration session expired. Please <a href="/register">try again</a>');
  }

  const { email, username, password, first_name, last_name, role } = pending;
  const { otp } = req.body;

  if (emailController.verifyOTP(email, otp)) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const encryptedEmail = await encrypt(email.toLowerCase());
      const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');

      // Get next user ID
      const idResult = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM users');
      const userId = idResult.rows[0].next_id;

      
      await pool.query(
        `INSERT INTO users (id, username, first_name, last_name, email, email_hash, password, created_at) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [userId, username, first_name, last_name, encryptedEmail, emailHash, hashedPassword]
      );
      // Assign role
      const roleResult = await pool.query('SELECT id FROM roles WHERE LOWER(name) = LOWER($1)', [role || 'student']);
      if (roleResult.rows.length > 0) {
        await pool.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [userId, roleResult.rows[0].id]
        );
      }

     
      if (role === 'Tutor') {
        await pool.query(
          'INSERT INTO tutor_profiles (user_id, subject, rating) VALUES ($1, $2, $3)',
          [userId, 'Not specified', 0.0]
        );
      }

      
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
      res.send('Registration failed. Please try again.');
    }
  } else {
    res.send(`
            <h2>Invalid or Expired Code</h2>
            <p>The verification code is incorrect or has expired.</p>
            <a href="/register">Try registering again</a>
        `);
  }
});


app.post('/resend-otp', emailController.resendRegistrationOTP);

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


app.get("/tutors/featured", async (req, res) => {
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
      GROUP BY
          u.id,
          tp.subject,
          tp.rating
      ORDER BY tp.rating DESC
      LIMIT 3
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
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
      `
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
          u.email,
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

//  tests
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
app.get("/test-decrypt", async (req, res) => {
  const { rows } = await pool.query('SELECT email FROM users ORDER BY id DESC LIMIT 1');
  const email = await decrypt(rows[0].email);
  res.json({ email });
});

app.listen(port, () => {
  console.log(`My app listening on port ${port}!`);
});
