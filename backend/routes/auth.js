/**
 * Authentication routes for Rupture Chat App
 * Handles user registration, login, and profile management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
    // Validation middleware
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, email, password, profilePicUrl } = req.body;

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('users')
            .select('id')
            .or(`username.eq.${username},email.eq.${email}`)
            .single();

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user in database
        const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert([{
                username,
                email,
                password_hash: passwordHash,
                profile_pic_url: profilePicUrl || null,
                is_online: true
            }])
            .select('id, username, email, profile_pic_url, created_at')
            .single();

        if (createError) {
            console.error('User creation error:', createError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create user account'
            });
        }

        // Generate JWT token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    profilePicUrl: newUser.profile_pic_url,
                    createdAt: newUser.created_at
                },
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const { data: user, error: findError } = await supabaseAdmin
            .from('users')
            .select('id, username, email, password_hash, profile_pic_url')
            .eq('email', email)
            .single();

        if (findError || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update user online status
        await supabaseAdmin
            .from('users')
            .update({ is_online: true, last_seen: new Date().toISOString() })
            .eq('id', user.id);

        // Generate JWT token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    profilePicUrl: user.profile_pic_url
                },
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (update online status)
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Update user offline status
        await supabaseAdmin
            .from('users')
            .update({ 
                is_online: false, 
                last_seen: new Date().toISOString() 
            })
            .eq('id', req.user.id);

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // Get updated user data
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, username, email, profile_pic_url, is_online, last_seen, created_at')
            .eq('id', req.user.id)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    profilePicUrl: user.profile_pic_url,
                    isOnline: user.is_online,
                    lastSeen: user.last_seen,
                    createdAt: user.created_at
                }
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, [
    body('username')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('profilePicUrl')
        .optional()
        .isURL()
        .withMessage('Profile picture must be a valid URL')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, profilePicUrl } = req.body;
        const updateData = {};

        if (username) {
            // Check if username is already taken by another user
            const { data: existingUser } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('username', username)
                .neq('id', req.user.id)
                .single();

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }

            updateData.username = username;
        }

        if (profilePicUrl !== undefined) {
            updateData.profile_pic_url = profilePicUrl;
        }

        // Update user profile
        const { data: updatedUser, error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select('id, username, email, profile_pic_url, is_online, last_seen')
            .single();

        if (error) {
            console.error('Profile update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    profilePicUrl: updatedUser.profile_pic_url,
                    isOnline: updatedUser.is_online,
                    lastSeen: updatedUser.last_seen
                }
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/auth/users/search
 * @desc    Search users by username or email
 * @access  Private
 */
router.get('/users/search', authenticateToken, async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        // Search users by username or email (excluding current user)
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, username, email, profile_pic_url, is_online, last_seen')
            .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
            .neq('id', req.user.id)
            .limit(parseInt(limit));

        if (error) {
            console.error('User search error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to search users'
            });
        }

        res.json({
            success: true,
            data: {
                users: users.map(user => ({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    profilePicUrl: user.profile_pic_url,
                    isOnline: user.is_online,
                    lastSeen: user.last_seen
                }))
            }
        });

    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
