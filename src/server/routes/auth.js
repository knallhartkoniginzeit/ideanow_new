const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../../db');
const { generateToken, generateRefreshToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

// POST /api/auth/register
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name, role = 'both', skills = [] } = req.body;

        // Check if user exists
        const existingUser = await query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const result = await query(
            `INSERT INTO users (email, password_hash, name, role, skills) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, email, name, role, skills, rating, created_at`,
            [email, passwordHash, name, role, skills]
        );

        const user = result.rows[0];
        const token = generateToken(user.user_id, user.email);
        const refreshToken = generateRefreshToken(user.user_id);

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.user_id,
                email: user.email,
                name: user.name,
                role: user.role,
                skills: user.skills,
                rating: user.rating,
            },
            token,
            refreshToken,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const result = await query(
            `SELECT user_id, email, password_hash, name, role, avatar_url, skills, rating, completed_projects 
       FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

        const token = generateToken(user.user_id, user.email);
        const refreshToken = generateRefreshToken(user.user_id);

        res.json({
            message: 'Login successful',
            user: {
                id: user.user_id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatar_url,
                skills: user.skills,
                rating: user.rating,
                completedProjects: user.completed_projects,
            },
            token,
            refreshToken,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT user_id, email, name, role, avatar_url, skills, bio, rating, 
              total_ratings, completed_projects, created_at, is_verified
       FROM users WHERE user_id = $1`,
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.user_id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatar_url,
            skills: user.skills,
            bio: user.bio,
            rating: parseFloat(user.rating),
            totalRatings: user.total_ratings,
            completedProjects: user.completed_projects,
            createdAt: user.created_at,
            isVerified: user.is_verified,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const result = await query('SELECT user_id, email FROM users WHERE user_id = $1', [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        const newToken = generateToken(user.user_id, user.email);
        const newRefreshToken = generateRefreshToken(user.user_id);

        res.json({ token: newToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// PUT /api/auth/password - Change password
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both passwords required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        const result = await query('SELECT password_hash FROM users WHERE user_id = $1', [req.user.user_id]);
        const user = result.rows[0];

        const isValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(12);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [newPasswordHash, req.user.user_id]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// POST /api/auth/google - Google OAuth callback
router.post('/google', async (req, res) => {
    try {
        const { credential, googleId, email, name, picture } = req.body;

        if (!email || !googleId) {
            return res.status(400).json({ error: 'Missing required Google data' });
        }

        // Check if user exists with this Google ID
        let result = await query(
            'SELECT user_id FROM users WHERE google_id = $1',
            [googleId]
        );

        let userId;

        if (result.rows.length > 0) {
            // User exists with Google ID - login
            userId = result.rows[0].user_id;

            // Update last login
            await query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [userId]);
        } else {
            // Check if user exists with this email
            result = await query('SELECT user_id, google_id FROM users WHERE email = $1', [email]);

            if (result.rows.length > 0) {
                // User exists with email - link Google account
                userId = result.rows[0].user_id;

                if (!result.rows[0].google_id) {
                    await query(
                        'UPDATE users SET google_id = $1, avatar_url = $2, last_login = NOW() WHERE user_id = $3',
                        [googleId, picture, userId]
                    );
                }
            } else {
                // New user - create account
                const newUser = await query(
                    `INSERT INTO users (email, name, google_id, avatar_url, password_hash, is_verified) 
                     VALUES ($1, $2, $3, $4, $5, TRUE) 
                     RETURNING user_id`,
                    [email, name, googleId, picture, ''] // Empty password for OAuth users
                );
                userId = newUser.rows[0].user_id;
            }
        }

        // Get full user data
        const userData = await query(
            `SELECT user_id, email, name, role, avatar_url, skills, rating, completed_projects, is_verified
             FROM users WHERE user_id = $1`,
            [userId]
        );

        const user = userData.rows[0];
        const token = generateToken(user.user_id, user.email);
        const refreshToken = generateRefreshToken(user.user_id);

        res.json({
            message: 'Google authentication successful',
            user: {
                id: user.user_id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatar_url,
                skills: user.skills,
                rating: user.rating,
                completedProjects: user.completed_projects,
                isVerified: user.is_verified,
            },
            token,
            refreshToken,
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

module.exports = router;
