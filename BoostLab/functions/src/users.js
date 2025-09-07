const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Handle new user creation
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user document in Firestore
    await db.collection('users').doc(user.uid).set({
      name: user.displayName || 'New User',
      email: user.email,
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      garage: [],
      wishlist: [],
      purchaseHistory: [],
      preferences: {
        currency: 'USD',
        notifications: {
          orderUpdates: true,
          promotions: true,
          newProducts: false
        },
        showCompatibleOnly: true
      },
      profile: {
        avatar: user.photoURL || null,
        bio: '',
        location: '',
        joinedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      totalSpent: 0,
      spendingTier: 'bronze'
    });

    console.log(`Created user document for ${user.uid}`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

/**
 * Handle user deletion
 */
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete user document
    await db.collection('users').doc(user.uid).delete();

    // Delete user's cart
    const cartSnapshot = await db.collection('users').doc(user.uid)
      .collection('cart').get();
    
    const batch = db.batch();
    cartSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user's wishlist
    const wishlistSnapshot = await db.collection('users').doc(user.uid)
      .collection('wishlist').get();
    
    wishlistSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user's notifications
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', user.uid).get();
    
    notificationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`Cleaned up data for deleted user ${user.uid}`);
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
});
