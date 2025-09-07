/**
 * Messages routes for Rupture Chat App
 * Handles message CRUD operations and file uploads
 */

const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireChatParticipant } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

/**
 * @route   GET /api/messages/:chatId
 * @desc    Get messages for a chat with pagination
 * @access  Private
 */
router.get('/:chatId', authenticateToken, requireChatParticipant, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 50, before } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin
            .from('messages')
            .select(`
                id,
                content,
                media_url,
                media_type,
                message_type,
                reply_to,
                is_edited,
                created_at,
                updated_at,
                sender:users!sender_id(id, username, profile_pic_url)
            `)
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        // If 'before' timestamp is provided, get messages before that time
        if (before) {
            query = query.lt('created_at', before);
        }

        const { data: messages, error } = await query;

        if (error) {
            console.error('Get messages error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch messages'
            });
        }

        // Reverse to show oldest first
        const reversedMessages = messages.reverse();

        res.json({
            success: true,
            data: {
                messages: reversedMessages.map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    mediaUrl: msg.media_url,
                    mediaType: msg.media_type,
                    messageType: msg.message_type,
                    replyTo: msg.reply_to,
                    isEdited: msg.is_edited,
                    createdAt: msg.created_at,
                    updatedAt: msg.updated_at,
                    sender: {
                        id: msg.sender.id,
                        username: msg.sender.username,
                        profilePicUrl: msg.sender.profile_pic_url
                    }
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: messages.length === parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/messages/:chatId
 * @desc    Send a new message to a chat
 * @access  Private
 */
router.post('/:chatId', authenticateToken, requireChatParticipant, [
    body('content')
        .optional()
        .isLength({ min: 1, max: 4000 })
        .withMessage('Message content must be between 1 and 4000 characters'),
    body('messageType')
        .optional()
        .isIn(['text', 'image', 'file', 'system'])
        .withMessage('Invalid message type'),
    body('replyTo')
        .optional()
        .isUUID()
        .withMessage('Reply to must be a valid UUID')
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

        const { chatId } = req.params;
        const { content, messageType = 'text', replyTo } = req.body;
        const senderId = req.user.id;

        // Validate that either content or media is provided
        if (!content && messageType === 'text') {
            return res.status(400).json({
                success: false,
                message: 'Message content is required for text messages'
            });
        }

        // If replying to a message, verify it exists in the same chat
        if (replyTo) {
            const { data: replyMessage, error: replyError } = await supabaseAdmin
                .from('messages')
                .select('id')
                .eq('id', replyTo)
                .eq('chat_id', chatId)
                .single();

            if (replyError || !replyMessage) {
                return res.status(400).json({
                    success: false,
                    message: 'Reply message not found in this chat'
                });
            }
        }

        // Create message
        const { data: newMessage, error: messageError } = await supabaseAdmin
            .from('messages')
            .insert([{
                chat_id: chatId,
                sender_id: senderId,
                content: content || null,
                message_type: messageType,
                reply_to: replyTo || null
            }])
            .select(`
                id,
                content,
                media_url,
                media_type,
                message_type,
                reply_to,
                is_edited,
                created_at,
                updated_at,
                sender:users!sender_id(id, username, profile_pic_url)
            `)
            .single();

        if (messageError) {
            console.error('Message creation error:', messageError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send message'
            });
        }

        // Mark message as read by sender
        await supabaseAdmin
            .from('message_reads')
            .insert([{
                message_id: newMessage.id,
                user_id: senderId
            }]);

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: {
                message: {
                    id: newMessage.id,
                    content: newMessage.content,
                    mediaUrl: newMessage.media_url,
                    mediaType: newMessage.media_type,
                    messageType: newMessage.message_type,
                    replyTo: newMessage.reply_to,
                    isEdited: newMessage.is_edited,
                    createdAt: newMessage.created_at,
                    updatedAt: newMessage.updated_at,
                    sender: {
                        id: newMessage.sender.id,
                        username: newMessage.sender.username,
                        profilePicUrl: newMessage.sender.profile_pic_url
                    }
                }
            }
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/messages/:chatId/upload
 * @desc    Upload a file and send as message
 * @access  Private
 */
router.post('/:chatId/upload', authenticateToken, requireChatParticipant, upload.single('file'), async (req, res) => {
    try {
        const { chatId } = req.params;
        const { caption } = req.body;
        const senderId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Generate unique filename
        const fileExtension = req.file.originalname.split('.').pop();
        const fileName = `${senderId}/${uuidv4()}.${fileExtension}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('chat-media')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('File upload error:', uploadError);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload file'
            });
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabaseAdmin.storage
            .from('chat-media')
            .getPublicUrl(fileName);

        const mediaUrl = urlData.publicUrl;

        // Determine message type based on file type
        let messageType = 'file';
        if (req.file.mimetype.startsWith('image/')) {
            messageType = 'image';
        }

        // Create message with media
        const { data: newMessage, error: messageError } = await supabaseAdmin
            .from('messages')
            .insert([{
                chat_id: chatId,
                sender_id: senderId,
                content: caption || null,
                media_url: mediaUrl,
                media_type: req.file.mimetype,
                message_type: messageType
            }])
            .select(`
                id,
                content,
                media_url,
                media_type,
                message_type,
                reply_to,
                is_edited,
                created_at,
                updated_at,
                sender:users!sender_id(id, username, profile_pic_url)
            `)
            .single();

        if (messageError) {
            console.error('Message creation error:', messageError);
            // Clean up uploaded file if message creation fails
            await supabaseAdmin.storage.from('chat-media').remove([fileName]);
            return res.status(500).json({
                success: false,
                message: 'Failed to send message with media'
            });
        }

        // Mark message as read by sender
        await supabaseAdmin
            .from('message_reads')
            .insert([{
                message_id: newMessage.id,
                user_id: senderId
            }]);

        res.status(201).json({
            success: true,
            message: 'File uploaded and message sent successfully',
            data: {
                message: {
                    id: newMessage.id,
                    content: newMessage.content,
                    mediaUrl: newMessage.media_url,
                    mediaType: newMessage.media_type,
                    messageType: newMessage.message_type,
                    replyTo: newMessage.reply_to,
                    isEdited: newMessage.is_edited,
                    createdAt: newMessage.created_at,
                    updatedAt: newMessage.updated_at,
                    sender: {
                        id: newMessage.sender.id,
                        username: newMessage.sender.username,
                        profilePicUrl: newMessage.sender.profile_pic_url
                    }
                }
            }
        });

    } catch (error) {
        console.error('Upload message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/messages/:messageId
 * @desc    Edit a message (text only)
 * @access  Private
 */
router.put('/:messageId', authenticateToken, [
    body('content')
        .isLength({ min: 1, max: 4000 })
        .withMessage('Message content must be between 1 and 4000 characters')
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

        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Verify message exists and user is the sender
        const { data: message, error: messageError } = await supabaseAdmin
            .from('messages')
            .select('id, sender_id, message_type, chat_id')
            .eq('id', messageId)
            .eq('sender_id', userId)
            .single();

        if (messageError || !message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or you are not the sender'
            });
        }

        // Only allow editing text messages
        if (message.message_type !== 'text') {
            return res.status(400).json({
                success: false,
                message: 'Only text messages can be edited'
            });
        }

        // Verify user is participant of the chat
        const { data: participant, error: participantError } = await supabaseAdmin
            .from('chat_participants')
            .select('id')
            .eq('chat_id', message.chat_id)
            .eq('user_id', userId)
            .single();

        if (participantError || !participant) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant of this chat'
            });
        }

        // Update message
        const { data: updatedMessage, error: updateError } = await supabaseAdmin
            .from('messages')
            .update({
                content,
                is_edited: true
            })
            .eq('id', messageId)
            .select(`
                id,
                content,
                media_url,
                media_type,
                message_type,
                reply_to,
                is_edited,
                created_at,
                updated_at,
                sender:users!sender_id(id, username, profile_pic_url)
            `)
            .single();

        if (updateError) {
            console.error('Message update error:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to update message'
            });
        }

        res.json({
            success: true,
            message: 'Message updated successfully',
            data: {
                message: {
                    id: updatedMessage.id,
                    content: updatedMessage.content,
                    mediaUrl: updatedMessage.media_url,
                    mediaType: updatedMessage.media_type,
                    messageType: updatedMessage.message_type,
                    replyTo: updatedMessage.reply_to,
                    isEdited: updatedMessage.is_edited,
                    createdAt: updatedMessage.created_at,
                    updatedAt: updatedMessage.updated_at,
                    sender: {
                        id: updatedMessage.sender.id,
                        username: updatedMessage.sender.username,
                        profilePicUrl: updatedMessage.sender.profile_pic_url
                    }
                }
            }
        });

    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Verify message exists and user is the sender
        const { data: message, error: messageError } = await supabaseAdmin
            .from('messages')
            .select('id, sender_id, media_url, chat_id')
            .eq('id', messageId)
            .eq('sender_id', userId)
            .single();

        if (messageError || !message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or you are not the sender'
            });
        }

        // Verify user is participant of the chat
        const { data: participant, error: participantError } = await supabaseAdmin
            .from('chat_participants')
            .select('id')
            .eq('chat_id', message.chat_id)
            .eq('user_id', userId)
            .single();

        if (participantError || !participant) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant of this chat'
            });
        }

        // Delete associated media file if exists
        if (message.media_url) {
            try {
                const fileName = message.media_url.split('/').pop();
                await supabaseAdmin.storage.from('chat-media').remove([`${userId}/${fileName}`]);
            } catch (storageError) {
                console.error('Failed to delete media file:', storageError);
                // Continue with message deletion even if file deletion fails
            }
        }

        // Delete message
        const { error: deleteError } = await supabaseAdmin
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (deleteError) {
            console.error('Message deletion error:', deleteError);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete message'
            });
        }

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/messages/:messageId/read
 * @desc    Mark a message as read
 * @access  Private
 */
router.post('/:messageId/read', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Verify message exists and user is participant of the chat
        const { data: message, error: messageError } = await supabaseAdmin
            .from('messages')
            .select('chat_id')
            .eq('id', messageId)
            .single();

        if (messageError || !message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Verify user is participant of the chat
        const { data: participant, error: participantError } = await supabaseAdmin
            .from('chat_participants')
            .select('id')
            .eq('chat_id', message.chat_id)
            .eq('user_id', userId)
            .single();

        if (participantError || !participant) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant of this chat'
            });
        }

        // Mark message as read (upsert to avoid duplicates)
        const { error: readError } = await supabaseAdmin
            .from('message_reads')
            .upsert([{
                message_id: messageId,
                user_id: userId
            }], {
                onConflict: 'message_id,user_id'
            });

        if (readError) {
            console.error('Mark read error:', readError);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark message as read'
            });
        }

        res.json({
            success: true,
            message: 'Message marked as read'
        });

    } catch (error) {
        console.error('Mark message read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/messages/:chatId/read-all
 * @desc    Mark all messages in a chat as read
 * @access  Private
 */
router.post('/:chatId/read-all', authenticateToken, requireChatParticipant, async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        // Get all unread messages in the chat for this user
        const { data: unreadMessages, error: unreadError } = await supabaseAdmin
            .from('messages')
            .select('id')
            .eq('chat_id', chatId)
            .not('sender_id', 'eq', userId) // Don't mark own messages
            .not('id', 'in', `(
                SELECT message_id 
                FROM message_reads 
                WHERE user_id = '${userId}'
            )`);

        if (unreadError) {
            console.error('Get unread messages error:', unreadError);
            return res.status(500).json({
                success: false,
                message: 'Failed to get unread messages'
            });
        }

        if (unreadMessages.length === 0) {
            return res.json({
                success: true,
                message: 'No unread messages to mark'
            });
        }

        // Mark all unread messages as read
        const readData = unreadMessages.map(msg => ({
            message_id: msg.id,
            user_id: userId
        }));

        const { error: readError } = await supabaseAdmin
            .from('message_reads')
            .insert(readData);

        if (readError) {
            console.error('Mark all read error:', readError);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark messages as read'
            });
        }

        res.json({
            success: true,
            message: `${unreadMessages.length} messages marked as read`
        });

    } catch (error) {
        console.error('Mark all messages read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
