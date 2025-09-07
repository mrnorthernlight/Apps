/**
 * Rupture Chat App - Backend Server
 * Express.js server with Supabase integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configurations and routes
const { testConnection } = require('./config/supabase');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
    origin: [
        process.env.WEB_URL || 'http://localhost:3000',
        process.env.MOBILE_URL || 'http://localhost:19006',
        'http://localhost:3000',
        'http://localhost:19006',
        'http://localhost:8081' // Expo dev server
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Rupture Chat API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Welcome endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Rupture Chat API! 💬',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
            auth: '/api/auth',
            chats: '/api/chats',
            messages: '/api/messages'
        }
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        success: true,
        message: 'Rupture Chat API Documentation',
        version: '1.0.0',
        endpoints: {
            authentication: {
                'POST /api/auth/register': 'Register a new user',
                'POST /api/auth/login': 'Login user',
                'POST /api/auth/logout': 'Logout user',
                'GET /api/auth/me': 'Get current user profile',
                'PUT /api/auth/profile': 'Update user profile',
                'GET /api/auth/users/search': 'Search users'
            },
            chats: {
                'GET /api/chats': 'Get user chats',
                'POST /api/chats': 'Create new chat',
                'GET /api/chats/:chatId': 'Get chat details',
                'PUT /api/chats/:chatId': 'Update chat (group only)',
                'DELETE /api/chats/:chatId': 'Delete chat',
                'POST /api/chats/:chatId/participants': 'Add participants',
                'DELETE /api/chats/:chatId/participants/:userId': 'Remove participant'
            },
            messages: {
                'GET /api/messages/:chatId': 'Get chat messages',
                'POST /api/messages/:chatId': 'Send message',
                'POST /api/messages/:chatId/upload': 'Upload file and send',
                'PUT /api/messages/:messageId': 'Edit message',
                'DELETE /api/messages/:messageId': 'Delete message',
                'POST /api/messages/:messageId/read': 'Mark message as read',
                'POST /api/messages/:chatId/read-all': 'Mark all messages as read'
            }
        },
        authentication: {
            type: 'Bearer Token',
            header: 'Authorization: Bearer <token>',
            note: 'Include JWT token in Authorization header for protected routes'
        }
    });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        suggestion: 'Check the API documentation at /api/docs'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.'
        });
    }

    if (error.message === 'File type not allowed') {
        return res.status(400).json({
            success: false,
            message: 'File type not allowed. Only images are supported.'
        });
    }

    // Handle JSON parsing errors
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON in request body'
        });
    }

    // Default error response
    res.status(error.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message || 'Something went wrong',
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
        console.log('✅ HTTP server closed.');
        console.log('👋 Rupture Chat API shutdown complete.');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        console.log('🔍 Testing database connection...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Database connection failed. Please check your Supabase configuration.');
            process.exit(1);
        }

        // Start HTTP server
        const server = app.listen(PORT, () => {
            console.log('\n🚀 Rupture Chat API Server Started!');
            console.log(`📍 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log('\n📡 Available Endpoints:');
            console.log(`   Authentication: http://localhost:${PORT}/api/auth`);
            console.log(`   Chats: http://localhost:${PORT}/api/chats`);
            console.log(`   Messages: http://localhost:${PORT}/api/messages`);
            console.log('\n💡 Ready to handle requests! 🎉\n');
        });

        // Store server reference for graceful shutdown
        global.server = server;

        return server;
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;
