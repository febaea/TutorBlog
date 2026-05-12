const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const emailController = require('./email');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());


// Account lockout system
const loginAttempts = new Map();

function checkLockout(email) {
    const record = loginAttempts.get(email);
    if (record && record.lockUntil > Date.now()) {
        return { locked: true, minutesLeft: Math.ceil((record.lockUntil - Date.now()) / 60000) };
    }
    return { locked: false };
}

function recordFailedAttempt(email) {
    const record = loginAttempts.get(email) || { count: 0, lockUntil: 0 };
    record.count++;
    if (record.count >= 5) {
        record.lockUntil = Date.now() + 30 * 60 * 1000;
        emailController.sendLockoutEmail(email);
    }
    loginAttempts.set(email, record);
    return record;
}

function resetAttempts(email) {
    loginAttempts.delete(email);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/html/login.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/html/register.html');
});

app.get('/dashboard', (req, res) => {
    const token = req.cookies.jwt;
    if (!token) return res.redirect('/');
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.redirect('/');
        res.sendFile(__dirname + '/public/html/index.html');
    });
});

// Registration
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.send('<h2>Email already registered</h2><a href="/register">Try again</a>');
        }
        
        req.body.userName = email.split('@')[0];
        emailController.sendController(req, res);
        
    } catch (error) {
        console.error(error);
        res.send('Registration error');
    }
});

app.post('/verify-registration', emailController.verifyController, async (req, res) => {
    const { userName, email, password } = req.userData;
    const normalizedEmail = email.trim().toLowerCase();
    try {
        await db.query(
            'INSERT INTO users (email, username, password_hash, created_at) VALUES ($1, $2, $3, NOW())',
            [email, userName, password]
        );
        
        res.send(`
            <h2>Registration Successful!</h2>
            <p>Welcome to TutorHub!.</p>
            <a href="/">Click here to login</a>
        `);
    } catch (error) {
        console.error(error);
        res.send('Registration failed');
    }
});

// Login - Same generic error for all failures
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const genericError = `
        <h2>Login Failed</h2>
        <a href="/">Try again</a>
    `;
    
    const { locked, minutesLeft } = checkLockout(email);
    if (locked) {
        return res.send(`<h2>Account Locked</h2><p>Try again in ${minutesLeft} minutes</p><a href="/">Back</a>`);
    }
    
    try {
        const result = await db.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            await bcrypt.compare('fake', '$2b$10$fakehash');
            recordFailedAttempt(email);
            return res.send(genericError);
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            recordFailedAttempt(email);
            return res.send(genericError);
        }
        
        resetAttempts(email);
        
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        req.body.token = token;
        emailController.sendLoginController(req, res);
        
    } catch (error) {
        console.error(error);
        res.send(genericError);
    }
});

app.post('/verify-login', emailController.verifyLoginController);
app.post('/resend-otp', emailController.resendController);
app.post('/resend-login-otp', emailController.resendLoginController);
app.get('/logout', (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
    });
    res.redirect('/');
});


https.createServer(
{
    key: fs.readFileSync(path.join(__dirname, 'cert/localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert/localhost.pem'))
},
app
).listen(port, () => {

    console.log(`HTTPS Server running on https://localhost:${port}`);
    console.log(`Account lockout: 5 attempts = 30 minute lock`);

});