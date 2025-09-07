const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Generate personalized recommendations for a user
 */
exports.generateRecommendations = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { carId, category, limit = 10 } = data;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    if (!user) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    let recommendations = [];

    // Get car-specific recommendations if carId provided
    if (carId) {
      const car = user.garage?.find(c => c.carId === carId);
      if (car) {
        recommendations = await getCarCompatibleParts(car, category, limit);
      }
    } else {
      // Get general recommendations based on user's garage and purchase history
      recommendations = await getPersonalizedRecommendations(user, category, limit);
    }

    // Add recommendation scores and reasons
    const scoredRecommendations = await addRecommendationScores(recommendations, user);

    return {
      recommendations: scoredRecommendations.slice(0, limit),
      totalCount: scoredRecommendations.length
    };

  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate recommendations');
  }
});

/**
 * Get parts compatible with a specific car
 */
async function getCarCompatibleParts(car, category, limit) {
  let query = db.collection('parts');

  // Filter by category if specified
  if (category) {
    query = query.where('category', '==', category);
  }

  // Get parts that might be compatible
  const partsSnapshot = await query.limit(limit * 3).get(); // Get more to filter
  const compatibleParts = [];

  partsSnapshot.docs.forEach(doc => {
    const part = { id: doc.id, ...doc.data() };
    
    // Check compatibility
    const isCompatible = part.compatibleCars?.some(compatibleCar => 
      compatibleCar.brand === car.brand &&
      compatibleCar.model === car.model &&
      car.year >= compatibleCar.yearRange.start &&
      car.year <= compatibleCar.yearRange.end &&
      (!compatibleCar.engineType || compatibleCar.engineType === car.engineType)
    );

    if (isCompatible) {
      compatibleParts.push(part);
    }
  });

  return compatibleParts;
}

/**
 * Get personalized recommendations based on user profile
 */
async function getPersonalizedRecommendations(user, category, limit) {
  const recommendations = [];

  // Get popular parts for user's cars
  if (user.garage && user.garage.length > 0) {
    for (const car of user.garage) {
      const carParts = await getCarCompatibleParts(car, category, Math.ceil(limit / user.garage.length));
      recommendations.push(...carParts);
    }
  }

  // Get trending parts in the same categories as previous purchases
  if (user.purchaseHistory && user.purchaseHistory.length > 0) {
    const trendingParts = await getTrendingParts(category, limit);
    recommendations.push(...trendingParts);
  }

  // Get highly rated parts
  const topRatedParts = await getTopRatedParts(category, limit);
  recommendations.push(...topRatedParts);

  // Remove duplicates
  const uniqueRecommendations = recommendations.filter((part, index, self) =>
    index === self.findIndex(p => p.id === part.id)
  );

  return uniqueRecommendations;
}

/**
 * Get trending parts based on recent sales
 */
async function getTrendingParts(category, limit) {
  let query = db.collection('parts')
    .orderBy('ratings.count', 'desc')
    .limit(limit);

  if (category) {
    query = query.where('category', '==', category);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get top-rated parts
 */
async function getTopRatedParts(category, limit) {
  let query = db.collection('parts')
    .where('ratings.average', '>=', 4.0)
    .orderBy('ratings.average', 'desc')
    .limit(limit);

  if (category) {
    query = query.where('category', '==', category);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Add recommendation scores and reasons
 */
async function addRecommendationScores(recommendations, user) {
  const scoredRecommendations = [];

  for (const part of recommendations) {
    let score = 0;
    const reasons = [];

    // Base score from rating
    score += (part.ratings?.average || 0) * 10;

    // Boost score for parts compatible with user's cars
    if (user.garage) {
      const compatibleCars = user.garage.filter(car =>
        part.compatibleCars?.some(compatibleCar =>
          compatibleCar.brand === car.brand &&
          compatibleCar.model === car.model &&
          car.year >= compatibleCar.yearRange.start &&
          car.year <= compatibleCar.yearRange.end
        )
      );

      if (compatibleCars.length > 0) {
        score += compatibleCars.length * 20;
        reasons.push(`Compatible with your ${compatibleCars[0].brand} ${compatibleCars[0].model}`);
      }
    }

    // Boost score for parts in user's wishlist categories
    if (user.wishlist && user.wishlist.length > 0) {
      // This would require getting wishlist items and checking categories
      // Simplified for demo
      score += 5;
    }

    // Boost score for popular parts
    if (part.ratings?.count > 50) {
      score += 15;
      reasons.push('Popular choice with many reviews');
    }

    // Boost score for highly rated parts
    if (part.ratings?.average >= 4.5) {
      score += 10;
      reasons.push('Highly rated by customers');
    }

    // Boost score for parts with performance tags
    if (part.tags?.includes('performance')) {
      score += 8;
      reasons.push('Performance upgrade');
    }

    scoredRecommendations.push({
      ...part,
      recommendationScore: Math.round(score),
      recommendationReasons: reasons
    });
  }

  // Sort by score
  return scoredRecommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
}

/**
 * Update user preferences based on activity
 */
exports.updateUserPreferences = functions.firestore.document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const userId = order.userId;

    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const user = userDoc.data();

      if (!user) return;

      // Extract preferences from order
      const categories = [...new Set(order.products.map(p => p.category))];
      const brands = [...new Set(order.products.map(p => p.brand))];
      const totalSpent = order.totalAmount;

      // Update user preferences
      const preferences = user.preferences || {};
      
      // Update favorite categories
      preferences.favoriteCategories = preferences.favoriteCategories || {};
      categories.forEach(category => {
        preferences.favoriteCategories[category] = 
          (preferences.favoriteCategories[category] || 0) + 1;
      });

      // Update favorite brands
      preferences.favoriteBrands = preferences.favoriteBrands || {};
      brands.forEach(brand => {
        preferences.favoriteBrands[brand] = 
          (preferences.favoriteBrands[brand] || 0) + 1;
      });

      // Update spending tier
      const currentSpent = user.totalSpent || 0;
      const newTotalSpent = currentSpent + totalSpent;
      
      let spendingTier = 'bronze';
      if (newTotalSpent >= 5000) spendingTier = 'platinum';
      else if (newTotalSpent >= 2000) spendingTier = 'gold';
      else if (newTotalSpent >= 500) spendingTier = 'silver';

      await userRef.update({
        preferences,
        totalSpent: newTotalSpent,
        spendingTier,
        lastOrderDate: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Updated preferences for user ${userId}`);

    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  });

/**
 * Generate AI-powered recommendations (placeholder for OpenAI integration)
 */
exports.generateAIRecommendations = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // This would integrate with OpenAI API for more sophisticated recommendations
  // For now, return rule-based recommendations
  return exports.generateRecommendations(data, context);
});
