require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const path = require('path');
const fs = require('fs');

// Store OTPs temporarily
const otpStore = {};

// Transporter module
let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'Gmail',
    auth: {
        user: 'healthe165@gmail.com',
        pass: 'pnkl zjvg fjsq qori',
    }
});

function generateOTP(email) {
    email = email.trim().toLowerCase();

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = {
        code: otp.toString(),
        expiresAt: Date.now() + 15 * 60 * 1000
    };

    console.log("Generated OTP:", otpStore[email]);

    return otp;
}

function verifyOTP(email, enteredCode) {

    email = email.trim().toLowerCase();

    const stored = otpStore[email];

    console.log("VERIFYING OTP");
    console.log("Email:", email);
    console.log("Entered:", enteredCode);
    console.log("Stored:", stored);

    if (!stored) {
        console.log("No OTP found");
        return false;
    }

    if (stored.expiresAt < Date.now()) {
        console.log("OTP expired");
        delete otpStore[email];
        return false;
    }

    if (stored.code === enteredCode.toString()) {
        console.log("OTP correct");
        delete otpStore[email];
        return true;
    }

    console.log("OTP incorrect");
    return false;
}


// Send registration OTP - returns HTML page
async function sendController(req, res) {
    let { email, userName, password } = req.body;
    email = email.trim().toLowerCase();
    const otp = generateOTP(email);
    
    var mailOptions = {
        to: email,
        subject: "Verify Your TutorHub Account",
        html: `<h3>Welcome to TutorHub!</h3>
               <p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p>
               <p>This code expires in 15 minutes.</p>`
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        
        // Read and send the OTP HTML page
        const otpPage = fs.readFileSync(path.join(__dirname, 'public/html/otp.html'), 'utf8');
        const filledPage = otpPage
            .replace(/{{email}}/g, email)
            .replace(/{{userName}}/g, userName)
            .replace(/{{password}}/g, password);
        
        res.send(filledPage);
    });
}

// Verify registration OTP
async function verifyController(req, res, next) {
    
    console.log(req.body);

    const { email, userName, password, otp } = req.body;

    console.log("Email:", email);
    console.log("OTP:", otp);
    console.log("Stored OTP:", otpStore[email]);
    
    if (verifyOTP(email, otp)) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            req.userData = { userName, email, password: hashedPassword };
            next();
        } catch (error) {
            res.status(500).send("Internal server error");
        }
    } else {
        res.send(`
            <h2>Invalid or Expired Code</h2>
            <p>The verification code is incorrect or has expired.</p>
        `);
    }
}

// Send login OTP
// async function sendLoginController(req, res) {
//     let { email, password, token } = req.body;
//     email = email.trim().toLowerCase();
//     const otp = generateOTP(email);
    
//     var mailOptions = {
//         to: email,
//         subject: "Your Login Verification Code",
//         html: `<h3>Login Verification</h3>
//                <p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p>
//                <p>This code expires in 15 minutes.</p>`
//     };
    
//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) return console.log(error);
        
//         // Read and send the OTP2 HTML page
//         const otpPage = fs.readFileSync(path.join(__dirname, 'public/html/otp2.html'), 'utf8');
//         const filledPage = otpPage
//             .replace(/{{email}}/g, email)
//             .replace(/{{password}}/g, password)
//             .replace(/{{token}}/g, token);
        
//         res.send(filledPage);
//     });
// }

// Verify login OTP
// async function verifyLoginController(req, res) {
//     const { email, password, token, otp2 } = req.body;
    
//     if (verifyOTP(email, otp2)) {
//         res.cookie("jwt", token, {
//             httpOnly: false,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: "strict",
//              maxAge: 24 * 60 * 60 * 1000
//         });
//         res.redirect("/dashboard");
//     } else {
//         res.send(`
//             <h2>Invalid or Expired Code</h2>
//             <p>The verification code is incorrect or has expired.</p>
//             <p>Try logging in again.</p>
//         `);
//     }
// }

// Resend registration OTP
async function resendController(req, res) {
    const { email, userName, password } = req.body;
    const otp = generateOTP(email);
    
    var mailOptions = {
        to: email,
        subject: "Your New Verification Code",
        html: `<p>Your new verification code is: <strong>${otp}</strong></p>`
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        
        const otpPage = fs.readFileSync(path.join(__dirname, 'public/html/otp.html'), 'utf8');
        const filledPage = otpPage
            .replace(/{{email}}/g, email)
            .replace(/{{userName}}/g, userName)
            .replace(/{{password}}/g, password)
            .replace(/{{msg}}/g, 'New code sent!');
        
        res.send(filledPage);
    });
}

// Resend login OTP
async function resendLoginController(req, res) {
    const { email, password, token } = req.body;
    const otp = generateOTP(email);
    
    var mailOptions = {
        to: email,
        subject: "Your New Login Code",
        html: `<p>Your new verification code is: <strong>${otp}</strong></p>`
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        
        const otpPage = fs.readFileSync(path.join(__dirname, 'public/html/otp2.html'), 'utf8');
        const filledPage = otpPage
            .replace(/{{email}}/g, email)
            .replace(/{{password}}/g, password)
            .replace(/{{token}}/g, token)
            .replace(/{{msg}}/g, 'New code sent!');
        
        res.send(filledPage);
    });
}

// Send lockout email
async function sendLockoutEmail(email) {
    const mailOptions = {
        to: email,
        subject: "Account Security Alert - TutorHub",
        html: `
            <h1>Account Security Alert</h1>
            <p>Your account has been locked due to 5 failed login attempts.</p>
            <p>The lock will expire in 30 minutes.</p>
        `
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log(error);
        else console.log(`Lockout email sent to ${email}`);
    });
}

module.exports = {
    sendController,
    verifyController,
    resendController,
    resendLoginController,
    sendLoginController,
    verifyLoginController,
    sendLockoutEmail
};
