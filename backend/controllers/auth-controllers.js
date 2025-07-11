const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Admin = require('../model/admin');


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingAdmin = await Admin.findOne({ email });

        if (!existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin does not exist'
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, existingAdmin.password);

        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: 'This password is incorrect please try again'
            });
        }
        
        const token = jwt.sign(
            { 
                adminId: existingAdmin._id,
                email: existingAdmin.email,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '30d'
            }
        );

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token: token,
            admin: {
                email: existingAdmin.email
            }
        });
    } catch (e) {
        console.log('Error from login\n', e);
        res.status(500).json({
            success: false,
            message: 'Something went wrong with login'
        });
    }
};

const sendResetEmail = async (email, code) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #008080;">Password Reset Request</h2>
                <p>We received a request to reset your password. Here's your verification code:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 2px;">
                    ${code}
                </div>
                <p>This code will expire in 15 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">For security reasons, please don't share this code with anyone.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};


const requestResetCode = async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.json({ 
                success: true,
                message: "If this account exists, a reset code has been sent"
            });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        admin.resetPassword = {
            code,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            attempts: 0
        };
        await admin.save();

        await sendResetEmail(admin.email, code);

        res.json({ 
            success: true,
            message: "If this account exists, a reset code has been sent"
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing password reset'
        });
    }
};


const verifyResetCode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin || !admin.resetPassword) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request'
            });
        }

        if (admin.resetPassword.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Too many attempts. Please request a new code.'
            });
        }

        if (new Date() > admin.resetPassword.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Code has expired'
            });
        }

        if (admin.resetPassword.code !== code) {
            admin.resetPassword.attempts += 1;
            await admin.save();
            
            return res.status(400).json({
                success: false,
                message: 'Invalid code',
                attemptsRemaining: 5 - admin.resetPassword.attempts
            });
        }

        const tempToken = jwt.sign(
            { 
                adminId: admin._id,
                purpose: 'password_reset' 
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );


        admin.resetPassword = undefined;
        await admin.save();

        res.json({
            success: true,
            token: tempToken
        });

    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying code'
        });
    }
};


const resetPassword = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.purpose !== 'password_reset') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token purpose'
            });
        }

        const admin = await Admin.findById(decoded.adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
        admin.password = hashedPassword;
        await admin.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
};

module.exports = {
    login,
    requestResetCode,
    verifyResetCode,
    resetPassword
};