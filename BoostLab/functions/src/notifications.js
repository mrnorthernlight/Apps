const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Send order notification
 */
exports.sendOrderNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, orderId, status } = data;

  try {
    await sendOrderNotification(userId, orderId, status);
    return { success: true, message: 'Notification sent successfully' };
  } catch (error) {
    console.error('Error sending order notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

/**
 * Send promotion notification
 */
exports.sendPromotionNotification = functions.https.onCall(async (data, context) => {
  const { userIds, promotion } = data;

  try {
    const notifications = [];
    
    for (const userId of userIds) {
      notifications.push(sendPromotionNotification(userId, promotion));
    }

    await Promise.all(notifications);
    return { success: true, message: `Sent ${userIds.length} promotion notifications` };
  } catch (error) {
    console.error('Error sending promotion notifications:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notifications');
  }
});

/**
 * Send welcome notification to new users
 */
exports.sendWelcomeNotification = functions.auth.user().onCreate(async (user) => {
  try {
    await sendWelcomeNotification(user.uid);
    console.log(`Welcome notification sent to user ${user.uid}`);
  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
});

/**
 * Send order notification implementation
 */
async function sendOrderNotification(userId, orderId, status) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    
    if (!user?.preferences?.notifications?.orderUpdates) {
      return; // User has disabled order notifications
    }

    const title = getOrderNotificationTitle(status);
    const message = getOrderNotificationMessage(status, orderId);

    // Create notification document
    await db.collection('notifications').add({
      userId,
      type: 'order_update',
      title,
      message,
      data: { orderId, status },
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send FCM notification if user has a device token
    if (user.fcmToken) {
      const fcmMessage = {
        token: user.fcmToken,
        notification: { title, body: message },
        data: {
          type: 'order_update',
          orderId,
          status
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#39FF14',
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      await admin.messaging().send(fcmMessage);
    }

  } catch (error) {
    console.error('Error sending order notification:', error);
    throw error;
  }
}

/**
 * Send promotion notification implementation
 */
async function sendPromotionNotification(userId, promotion) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    
    if (!user?.preferences?.notifications?.promotions) {
      return; // User has disabled promotion notifications
    }

    const title = `🎉 New Promotion: ${promotion.name}`;
    const message = `${promotion.description} - Use code: ${promotion.code}`;

    // Create notification document
    await db.collection('notifications').add({
      userId,
      type: 'promotion',
      title,
      message,
      data: { 
        promotionId: promotion.id,
        promoCode: promotion.code 
      },
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send FCM notification if user has a device token
    if (user.fcmToken) {
      const fcmMessage = {
        token: user.fcmToken,
        notification: { title, body: message },
        data: {
          type: 'promotion',
          promotionId: promotion.id,
          promoCode: promotion.code
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#FF6F00',
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      await admin.messaging().send(fcmMessage);
    }

  } catch (error) {
    console.error('Error sending promotion notification:', error);
    throw error;
  }
}

/**
 * Send welcome notification implementation
 */
async function sendWelcomeNotification(userId) {
  try {
    const title = '🚗 Welcome to BoostLab!';
    const message = 'Get ready to boost your ride! Explore our premium car tuning parts and start building your dream setup.';

    // Create notification document
    await db.collection('notifications').add({
      userId,
      type: 'welcome',
      title,
      message,
      data: { 
        action: 'browse_parts',
        newUserPromo: 'NEWUSER10'
      },
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Note: FCM token might not be available immediately after user creation
    // This would be handled by the client app after login

  } catch (error) {
    console.error('Error sending welcome notification:', error);
    throw error;
  }
}

/**
 * Send bulk notifications for promotions
 */
exports.sendBulkPromotionNotifications = functions.https.onCall(async (data, context) => {
  // Check admin permissions
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;
  
  if (userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { promotionId, targetAudience } = data;

  try {
    // Get promotion details
    const promotionDoc = await db.collection('promotions').doc(promotionId).get();
    if (!promotionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Promotion not found');
    }

    const promotion = { id: promotionDoc.id, ...promotionDoc.data() };

    // Get target users based on audience criteria
    let usersQuery = db.collection('users');
    
    if (targetAudience.newUsersOnly) {
      // Users with no orders
      const usersWithOrders = await db.collection('orders')
        .select('userId')
        .get();
      
      const userIdsWithOrders = new Set(usersWithOrders.docs.map(doc => doc.data().userId));
      
      // This is simplified - in production, you'd use a more efficient query
      usersQuery = usersQuery.where('role', '==', 'user');
    }

    if (targetAudience.spendingTier) {
      usersQuery = usersQuery.where('spendingTier', '==', targetAudience.spendingTier);
    }

    if (targetAudience.hasGarageCars) {
      usersQuery = usersQuery.where('garage', '!=', []);
    }

    const usersSnapshot = await usersQuery.get();
    const batchSize = 500; // FCM batch limit
    const batches = [];

    for (let i = 0; i < usersSnapshot.docs.length; i += batchSize) {
      const batch = usersSnapshot.docs.slice(i, i + batchSize);
      batches.push(batch);
    }

    let totalSent = 0;

    for (const batch of batches) {
      const notifications = batch.map(userDoc => {
        const user = userDoc.data();
        if (user.preferences?.notifications?.promotions !== false) {
          return sendPromotionNotification(userDoc.id, promotion);
        }
        return Promise.resolve();
      });

      await Promise.all(notifications);
      totalSent += batch.length;
    }

    return { 
      success: true, 
      message: `Sent promotion notifications to ${totalSent} users` 
    };

  } catch (error) {
    console.error('Error sending bulk promotion notifications:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send bulk notifications');
  }
});

/**
 * Handle FCM token updates
 */
exports.updateFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { fcmToken } = data;
  const userId = context.auth.uid;

  try {
    await db.collection('users').doc(userId).update({
      fcmToken,
      fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'FCM token updated successfully' };
  } catch (error) {
    console.error('Error updating FCM token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update FCM token');
  }
});

/**
 * Mark notification as read
 */
exports.markNotificationRead = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { notificationId } = data;
  const userId = context.auth.uid;

  try {
    const notificationDoc = await db.collection('notifications').doc(notificationId).get();
    
    if (!notificationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Notification not found');
    }

    const notification = notificationDoc.data();
    
    if (notification.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }

    await db.collection('notifications').doc(notificationId).update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Notification marked as read' };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update notification');
  }
});

// Helper functions
function getOrderNotificationTitle(status) {
  const titles = {
    created: '🎉 Order Confirmed!',
    processing: '⚙️ Order Processing',
    shipped: '🚚 Order Shipped',
    delivered: '✅ Order Delivered',
    cancelled: '❌ Order Cancelled'
  };
  return titles[status] || 'Order Update';
}

function getOrderNotificationMessage(status, orderId) {
  const shortOrderId = orderId.slice(-8);
  const messages = {
    created: `Your order #${shortOrderId} has been confirmed and is being processed.`,
    processing: `Your order #${shortOrderId} is being prepared for shipment.`,
    shipped: `Your order #${shortOrderId} has been shipped and is on its way!`,
    delivered: `Your order #${shortOrderId} has been delivered. Enjoy your new parts!`,
    cancelled: `Your order #${shortOrderId} has been cancelled.`
  };
  return messages[status] || `Your order #${shortOrderId} status has been updated.`;
}
