/**
 * Authentication middleware for Rupture Chat App
 * Handles JWT token verification and user context
 */

const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware to verify JWT token and set user context
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database to ensure they still exist
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, username, email, profile_pic_url, is_online')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Add user to request object
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, username, email, profile_pic_url, is_online')
            .eq('id', decoded.userId)
            .single();

        req.user = error ? null : user;
        req.token = token;
        
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id,
            username: user.username,
            email: user.email
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: '7d' // Token expires in 7 days
        }
    );
};

/**
 * Middleware to check if user is admin of a chat
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireChatAdmin = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        // Check if user is admin of the chat
        const { data: participant, error } = await supabaseAdmin
            .from('chat_participants')
            .select('is_admin')
            .eq('chat_id', chatId)
            .eq('user_id', userId)
            .single();

        if (error || !participant || !participant.is_admin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required for this chat'
            });
        }

        next();
    } catch (error) {
        console.error('Chat admin check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify admin status'
        });
    }
};

/**
 * Middleware to check if user is participant of a chat
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireChatParticipant = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        // Check if user is participant of the chat
        const { data: participant, error } = await supabaseAdmin
            .from('chat_participants')
            .select('id')
            .eq('chat_id', chatId)
            .eq('user_id', userId)
            .single();

        if (error || !participant) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant of this chat'
            });
        }

        next();
    } catch (error) {
        console.error('Chat participant check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify participant status'
        });
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateToken,
    requireChatAdmin,
    requireChatParticipant
};
