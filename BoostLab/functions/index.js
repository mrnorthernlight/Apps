const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
const orderFunctions = require('./src/orders');
const recommendationFunctions = require('./src/recommendations');
const promotionFunctions = require('./src/promotions');
const notificationFunctions = require('./src/notifications');
const analyticsFunctions = require('./src/analytics');
const userFunctions = require('./src/users');

// Export all functions
module.exports = {
  // Order processing functions
  processOrder: orderFunctions.processOrder,
  updateOrderStatus: orderFunctions.updateOrderStatus,
  calculateShipping: orderFunctions.calculateShipping,
  
  // Recommendation engine functions
  generateRecommendations: recommendationFunctions.generateRecommendations,
  updateUserPreferences: recommendationFunctions.updateUserPreferences,
  
  // Promotion functions
  validatePromotion: promotionFunctions.validatePromotion,
  applyPromotion: promotionFunctions.applyPromotion,
  
  // Notification functions
  sendOrderNotification: notificationFunctions.sendOrderNotification,
  sendPromotionNotification: notificationFunctions.sendPromotionNotification,
  sendWelcomeNotification: notificationFunctions.sendWelcomeNotification,
  
  // Analytics functions
  trackUserActivity: analyticsFunctions.trackUserActivity,
  generateAnalyticsReport: analyticsFunctions.generateAnalyticsReport,
  
  // User management functions
  onUserCreate: userFunctions.onUserCreate,
  onUserDelete: userFunctions.onUserDelete,
  
  // Scheduled functions
  cleanupExpiredPromotions: functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    
    const expiredPromotions = await db.collection('promotions')
      .where('expirationDate', '<', now)
      .where('isActive', '==', true)
      .get();
    
    const batch = db.batch();
    expiredPromotions.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });
    
    await batch.commit();
    console.log(`Deactivated ${expiredPromotions.size} expired promotions`);
  }),
  
  // Cleanup temporary files
  cleanupTempFiles: functions.pubsub.schedule('0 2 * * *').onRun(async (context) => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'temp/' });
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const file of files) {
      const [metadata] = await file.getMetadata();
      const created = new Date(metadata.timeCreated);
      
      if (created < oneDayAgo) {
        await file.delete();
        console.log(`Deleted temp file: ${file.name}`);
      }
    }
  }),
  
  // Update part ratings when reviews are added/updated
  updatePartRating: functions.firestore.document('reviews/{reviewId}')
    .onWrite(async (change, context) => {
      const db = admin.firestore();
      const reviewData = change.after.exists ? change.after.data() : null;
      const oldReviewData = change.before.exists ? change.before.data() : null;
      
      if (!reviewData && !oldReviewData) return;
      
      const productId = reviewData?.productId || oldReviewData?.productId;
      
      // Get all reviews for this product
      const reviewsSnapshot = await db.collection('reviews')
        .where('productId', '==', productId)
        .get();
      
      if (reviewsSnapshot.empty) {
        // No reviews left, reset rating
        await db.collection('parts').doc(productId).update({
          'ratings.average': 0,
          'ratings.count': 0
        });
        return;
      }
      
      // Calculate new average
      let totalRating = 0;
      let count = 0;
      
      reviewsSnapshot.docs.forEach(doc => {
        const review = doc.data();
        totalRating += review.rating;
        count++;
      });
      
      const average = totalRating / count;
      
      // Update part rating
      await db.collection('parts').doc(productId).update({
        'ratings.average': Math.round(average * 10) / 10, // Round to 1 decimal
        'ratings.count': count
      });
      
      console.log(`Updated rating for part ${productId}: ${average} (${count} reviews)`);
    }),
  
  // Generate compatibility suggestions
  generateCompatibilitySuggestions: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const { carBrand, carModel, carYear, engineType } = data;
    const db = admin.firestore();
    
    try {
      const partsSnapshot = await db.collection('parts')
        .where('compatibleCars', 'array-contains-any', [
          { brand: carBrand, model: carModel }
        ])
        .limit(20)
        .get();
      
      const compatibleParts = [];
      
      partsSnapshot.docs.forEach(doc => {
        const part = { id: doc.id, ...doc.data() };
        
        // Check detailed compatibility
        const isCompatible = part.compatibleCars.some(car => 
          car.brand === carBrand &&
          car.model === carModel &&
          carYear >= car.yearRange.start &&
          carYear <= car.yearRange.end &&
          (!car.engineType || car.engineType === engineType)
        );
        
        if (isCompatible) {
          compatibleParts.push(part);
        }
      });
      
      return { compatibleParts };
    } catch (error) {
      console.error('Error generating compatibility suggestions:', error);
      throw new functions.https.HttpsError('internal', 'Failed to generate suggestions');
    }
  })
};
