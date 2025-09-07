/**
 * Chat routes for Rupture Chat App
 * Handles chat creation, management, and participant operations
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireChatParticipant, requireChatAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/chats
 * @desc    Get all chats for the current user
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Use the custom function to get user chats with last message
        const { data: chats, error } = await supabaseAdmin
            .rpc('get_user_chats', { user_uuid: req.user.id });

        if (error) {
            console.error('Get chats error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch chats'
            });
        }

        res.json({
            success: true,
            data: {
                chats: chats.map(chat => ({
                    id: chat.chat_id,
                    name: chat.chat_name,
                    isGroup: chat.is_group,
                    lastMessage: chat.last_message,
                    lastMessageTime: chat.last_message_time,
                    lastSenderUsername: chat.last_sender_username,
                    unreadCount: parseInt(chat.unread_count)
                }))
            }
        });

    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/chats
 * @desc    Create a new chat (1:1 or group)
 * @access  Private
 */
router.post('/', authenticateToken, [
    body('participantIds')
        .isArray({ min: 1 })
        .withMessage('At least one participant is required'),
    body('name')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Chat name must be between 1 and 255 characters'),
    body('isGroup')
        .optional()
        .isBoolean()
        .withMessage('isGroup must be a boolean')
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

        const { participantIds, name, isGroup = false } = req.body;
        const currentUserId = req.user.id;

        // Validate participant IDs
        if (!participantIds.includes(currentUserId)) {
            participantIds.push(currentUserId);
        }

        // For 1:1 chats, check if chat already exists
        if (!isGroup && participantIds.length === 2) {
            const { data: existingChat, error: checkError } = await supabaseAdmin
                .from('chat_participants')
                .select(`
                    chat_id,
                    chats!inner(is_group)
                `)
                .in('user_id', participantIds)
                .eq('chats.is_group', false);

            if (!checkError && existingChat.length > 0) {
                // Check if both users are in the same chat
                const chatCounts = {};
                existingChat.forEach(cp => {
                    chatCounts[cp.chat_id] = (chatCounts[cp.chat_id] || 0) + 1;
                });

                const existingChatId = Object.keys(chatCounts).find(chatId => chatCounts[chatId] === 2);
                if (existingChatId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Chat already exists between these users',
                        data: { chatId: existingChatId }
                    });
                }
            }
        }

        // Verify all participants exist
        const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id')
            .in('id', participantIds);

        if (usersError || users.length !== participantIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more participants not found'
            });
        }

        // Create the chat
        const { data: newChat, error: chatError } = await supabaseAdmin
            .from('chats')
            .insert([{
                name: isGroup ? name : null,
                is_group: isGroup,
                created_by: currentUserId
            }])
            .select('id, name, is_group, created_at')
            .single();

        if (chatError) {
            console.error('Chat creation error:', chatError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create chat'
            });
        }

        // Add participants to the chat
        const participantData = participantIds.map(userId => ({
            chat_id: newChat.id,
            user_id: userId,
            is_admin: userId === currentUserId && isGroup // Creator is admin for group chats
        }));

        const { error: participantsError } = await supabaseAdmin
            .from('chat_participants')
            .insert(participantData);

        if (participantsError) {
            console.error('Participants creation error:', participantsError);
            // Clean up the chat if participants couldn't be added
            await supabaseAdmin.from('chats').delete().eq('id', newChat.id);
            return res.status(500).json({
                success: false,
                message: 'Failed to add participants to chat'
            });
        }

        // Get chat participants for response
        const { data: participants, error: getParticipantsError } = await supabaseAdmin
            .from('chat_participants')
            .select(`
                user_id,
                is_admin,
                users!inner(username, profile_pic_url)
            `)
            .eq('chat_id', newChat.id);

        res.status(201).json({
            success: true,
            message: 'Chat created successfully',
            data: {
                chat: {
                    id: newChat.id,
                    name: newChat.name,
                    isGroup: newChat.is_group,
                    createdAt: newChat.created_at,
                    participants: participants?.map(p => ({
                        userId: p.user_id,
                        username: p.users.username,
                        profilePicUrl: p.users.profile_pic_url,
                        isAdmin: p.is_admin
                    })) || []
                }
            }
        });

    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   GET /api/chats/:chatId
 * @desc    Get chat details with participants
 * @access  Private
 */
router.get('/:chatId', authenticateToken, requireChatParticipant, async (req, res) => {
    try {
        const { chatId } = req.params;

        // Get chat details
        const { data: chat, error: chatError } = await supabaseAdmin
            .from('chats')
            .select('id, name, is_group, created_by, created_at')
            .eq('id', chatId)
            .single();

        if (chatError || !chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Get chat participants
        const { data: participants, error: participantsError } = await supabaseAdmin
            .from('chat_participants')
            .select(`
                user_id,
                is_admin,
                joined_at,
                users!inner(username, profile_pic_url, is_online, last_seen)
            `)
            .eq('chat_id', chatId);

        if (participantsError) {
            console.error('Get participants error:', participantsError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch chat participants'
            });
        }

        res.json({
            success: true,
            data: {
                chat: {
                    id: chat.id,
                    name: chat.name,
                    isGroup: chat.is_group,
                    createdBy: chat.created_by,
                    createdAt: chat.created_at,
                    participants: participants.map(p => ({
                        userId: p.user_id,
                        username: p.users.username,
                        profilePicUrl: p.users.profile_pic_url,
                        isOnline: p.users.is_online,
                        lastSeen: p.users.last_seen,
                        isAdmin: p.is_admin,
                        joinedAt: p.joined_at
                    }))
                }
            }
        });

    } catch (error) {
        console.error('Get chat details error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/chats/:chatId
 * @desc    Update chat details (group chats only)
 * @access  Private (Admin only)
 */
router.put('/:chatId', authenticateToken, requireChatAdmin, [
    body('name')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Chat name must be between 1 and 255 characters')
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
        const { name } = req.body;

        // Update chat
        const { data: updatedChat, error } = await supabaseAdmin
            .from('chats')
            .update({ name })
            .eq('id', chatId)
            .eq('is_group', true) // Only allow updates for group chats
            .select('id, name, is_group, created_at')
            .single();

        if (error) {
            console.error('Update chat error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update chat'
            });
        }

        res.json({
            success: true,
            message: 'Chat updated successfully',
            data: {
                chat: {
                    id: updatedChat.id,
                    name: updatedChat.name,
                    isGroup: updatedChat.is_group,
                    createdAt: updatedChat.created_at
                }
            }
        });

    } catch (error) {
        console.error('Update chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/chats/:chatId/participants
 * @desc    Add participants to a group chat
 * @access  Private (Admin only)
 */
router.post('/:chatId/participants', authenticateToken, requireChatAdmin, [
    body('userIds')
        .isArray({ min: 1 })
        .withMessage('At least one user ID is required')
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
        const { userIds } = req.body;

        // Verify it's a group chat
        const { data: chat, error: chatError } = await supabaseAdmin
            .from('chats')
            .select('is_group')
            .eq('id', chatId)
            .single();

        if (chatError || !chat || !chat.is_group) {
            return res.status(400).json({
                success: false,
                message: 'Can only add participants to group chats'
            });
        }

        // Check which users are not already participants
        const { data: existingParticipants, error: existingError } = await supabaseAdmin
            .from('chat_participants')
            .select('user_id')
            .eq('chat_id', chatId)
            .in('user_id', userIds);

        if (existingError) {
            console.error('Check existing participants error:', existingError);
            return res.status(500).json({
                success: false,
                message: 'Failed to check existing participants'
            });
        }

        const existingUserIds = existingParticipants.map(p => p.user_id);
        const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

        if (newUserIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'All specified users are already participants'
            });
        }

        // Verify new users exist
        const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id')
            .in('id', newUserIds);

        if (usersError || users.length !== newUserIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more users not found'
            });
        }

        // Add new participants
        const participantData = newUserIds.map(userId => ({
            chat_id: chatId,
            user_id: userId,
            is_admin: false
        }));

        const { error: insertError } = await supabaseAdmin
            .from('chat_participants')
            .insert(participantData);

        if (insertError) {
            console.error('Add participants error:', insertError);
            return res.status(500).json({
                success: false,
                message: 'Failed to add participants'
            });
        }

        res.json({
            success: true,
            message: `${newUserIds.length} participant(s) added successfully`,
            data: {
                addedUserIds: newUserIds
            }
        });

    } catch (error) {
        console.error('Add participants error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   DELETE /api/chats/:chatId/participants/:userId
 * @desc    Remove a participant from a group chat
 * @access  Private (Admin only or self)
 */
router.delete('/:chatId/participants/:userId', authenticateToken, requireChatParticipant, async (req, res) => {
    try {
        const { chatId, userId } = req.params;
        const currentUserId = req.user.id;

        // Check if current user is admin or removing themselves
        const { data: currentParticipant, error: participantError } = await supabaseAdmin
            .from('chat_participants')
            .select('is_admin')
            .eq('chat_id', chatId)
            .eq('user_id', currentUserId)
            .single();

        if (participantError || !currentParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const canRemove = currentParticipant.is_admin || userId === currentUserId;
        if (!canRemove) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can remove other participants'
            });
        }

        // Remove participant
        const { error: removeError } = await supabaseAdmin
            .from('chat_participants')
            .delete()
            .eq('chat_id', chatId)
            .eq('user_id', userId);

        if (removeError) {
            console.error('Remove participant error:', removeError);
            return res.status(500).json({
                success: false,
                message: 'Failed to remove participant'
            });
        }

        res.json({
            success: true,
            message: 'Participant removed successfully'
        });

    } catch (error) {
        console.error('Remove participant error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   DELETE /api/chats/:chatId
 * @desc    Delete a chat (admin only for group chats, any participant for 1:1)
 * @access  Private
 */
router.delete('/:chatId', authenticateToken, requireChatParticipant, async (req, res) => {
    try {
        const { chatId } = req.params;
        const currentUserId = req.user.id;

        // Get chat details
        const { data: chat, error: chatError } = await supabaseAdmin
            .from('chats')
            .select('is_group, created_by')
            .eq('id', chatId)
            .single();

        if (chatError || !chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check permissions
        if (chat.is_group) {
            // For group chats, only creator can delete
            if (chat.created_by !== currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the chat creator can delete group chats'
                });
            }
        }

        // Delete chat (cascade will handle participants and messages)
        const { error: deleteError } = await supabaseAdmin
            .from('chats')
            .delete()
            .eq('id', chatId);

        if (deleteError) {
            console.error('Delete chat error:', deleteError);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete chat'
            });
        }

        res.json({
            success: true,
            message: 'Chat deleted successfully'
        });

    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
