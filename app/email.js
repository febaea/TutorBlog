// app/email.js
require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const path = require('path');
const fs = require('fs');

// Store OTPs temporarily
const otpStore = {};

// Configure email transporter (you'll need to add these to .env)
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
    
    if (!stored) return false;
    if (stored.expiresAt < Date.now()) {
        delete otpStore[email];
        return false;
    }
    if (stored.code === enteredCode.toString()) {
        delete otpStore[email];
        return true;
    }
    return false;
}

// Send registration OTP
async function sendRegistrationOTP(req, res) {
    let { email, username, password, first_name, last_name } = req.body;
    if (!username && req.body.userName) {
        username = req.body.userName;
    }
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
        
        // Read the OTP page
        const otpPage = fs.readFileSync(path.join(__dirname, 'public/html/otp.html'), 'utf8');
        const filledPage = otpPage
            .replace(/{{email}}/g, email)
            .replace(/{{username}}/g, username)
            .replace(/{{password}}/g, password)
            .replace(/{{first_name}}/g, first_name)
            .replace(/{{last_name}}/g, last_name);
        
        res.send(filledPage);
    });
}

// Resend registration OTP
async function resendRegistrationOTP(req, res) {
    const { email, username, password, first_name, last_name } = req.body;
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
            .replace(/{{username}}/g, username)
            .replace(/{{password}}/g, password)
            .replace(/{{first_name}}/g, first_name)
            .replace(/{{last_name}}/g, last_name)
            .replace(/{{msg}}/g, 'New code sent!');
        
        res.send(filledPage);
    });
}

module.exports = {
    sendRegistrationOTP,
    resendRegistrationOTP,
    verifyOTP
};