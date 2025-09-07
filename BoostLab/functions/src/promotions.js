const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Validate a promotion code
 */
exports.validatePromotion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { promoCode, cartItems, subtotal } = data;
  const userId = context.auth.uid;

  try {
    const promoSnapshot = await db.collection('promotions')
      .where('code', '==', promoCode)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (promoSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired promotion code');
    }

    const promoDoc = promoSnapshot.docs[0];
    const promotion = { id: promoDoc.id, ...promoDoc.data() };

    // Validate promotion
    const validation = await validatePromotionRules(promotion, cartItems, subtotal, userId);

    if (!validation.isValid) {
      throw new functions.https.HttpsError('failed-precondition', validation.reason);
    }

    return {
      isValid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        name: promotion.name,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscountAmount: promotion.maxDiscountAmount
      },
      discount: validation.discount
    };

  } catch (error) {
    console.error('Error validating promotion:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to validate promotion');
  }
});

/**
 * Apply promotion to order
 */
exports.applyPromotion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { promoCode, orderId } = data;
  const userId = context.auth.uid;

  try {
    // Get order
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    const order = orderDoc.data();
    
    // Check if user owns the order
    if (order.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }

    // Get promotion
    const promoSnapshot = await db.collection('promotions')
      .where('code', '==', promoCode)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (promoSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Invalid or expired promotion code');
    }

    const promoDoc = promoSnapshot.docs[0];
    const promotion = { id: promoDoc.id, ...promoDoc.data() };

    // Validate promotion
    const validation = await validatePromotionRules(promotion, order.products, order.subtotal, userId);

    if (!validation.isValid) {
      throw new functions.https.HttpsError('failed-precondition', validation.reason);
    }

    // Apply promotion to order
    const discount = validation.discount;
    const newTotal = order.subtotal + order.tax + order.shipping - discount;

    await db.collection('orders').doc(orderId).update({
      promoCode: promotion.code,
      discount,
      totalAmount: newTotal,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update promotion usage
    await db.collection('promotions').doc(promotion.id).update({
      usageCount: admin.firestore.FieldValue.increment(1)
    });

    return {
      success: true,
      discount,
      newTotal,
      message: 'Promotion applied successfully'
    };

  } catch (error) {
    console.error('Error applying promotion:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to apply promotion');
  }
});

/**
 * Validate promotion rules
 */
async function validatePromotionRules(promotion, cartItems, subtotal, userId) {
  const now = new Date();

  // Check expiration
  if (promotion.expirationDate.toDate() < now) {
    return { isValid: false, reason: 'Promotion code has expired' };
  }

  // Check start date
  if (promotion.startDate.toDate() > now) {
    return { isValid: false, reason: 'Promotion is not yet active' };
  }

  // Check usage limits
  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
    return { isValid: false, reason: 'Promotion code usage limit reached' };
  }

  // Check minimum order amount
  if (promotion.minOrderAmount && subtotal < promotion.minOrderAmount) {
    return { 
      isValid: false, 
      reason: `Minimum order amount of $${promotion.minOrderAmount} required` 
    };
  }

  // Check user restrictions
  if (promotion.userRestrictions?.newUsersOnly) {
    const userOrdersSnapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .where('status', '!=', 'cancelled')
      .limit(1)
      .get();
    
    if (!userOrdersSnapshot.empty) {
      return { isValid: false, reason: 'This promotion is only available for new users' };
    }
  }

  // Check per-user usage limit
  if (promotion.userRestrictions?.maxUsesPerUser) {
    const userUsageSnapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .where('promoCode', '==', promotion.code)
      .where('status', '!=', 'cancelled')
      .get();
    
    if (userUsageSnapshot.size >= promotion.userRestrictions.maxUsesPerUser) {
      return { 
        isValid: false, 
        reason: `You have already used this promotion code the maximum number of times` 
      };
    }
  }

  // Check applicable categories
  if (promotion.applicableCategories && promotion.applicableCategories.length > 0) {
    const hasApplicableItems = cartItems.some(item => {
      // Get part category (would need to fetch from parts collection in real implementation)
      return promotion.applicableCategories.includes(item.category);
    });

    if (!hasApplicableItems) {
      return { 
        isValid: false, 
        reason: 'No items in your cart are eligible for this promotion' 
      };
    }
  }

  // Check vendor restrictions
  if (promotion.vendorRestriction) {
    const hasVendorItems = cartItems.some(item => item.vendorId === promotion.vendorRestriction);
    
    if (!hasVendorItems) {
      return { 
        isValid: false, 
        reason: 'No items from the required vendor are in your cart' 
      };
    }
  }

  // Check compatible brands
  if (promotion.compatibleBrands && promotion.compatibleBrands.length > 0) {
    const hasCompatibleItems = cartItems.some(item => {
      // This would check if the part is compatible with the specified brands
      return promotion.compatibleBrands.includes(item.brand);
    });

    if (!hasCompatibleItems) {
      return { 
        isValid: false, 
        reason: 'No compatible items for this brand-specific promotion' 
      };
    }
  }

  // Calculate discount
  let discount = 0;
  if (promotion.discountType === 'percentage') {
    discount = subtotal * (promotion.discountValue / 100);
  } else if (promotion.discountType === 'fixed') {
    discount = promotion.discountValue;
  } else if (promotion.discountType === 'shipping') {
    discount = Math.min(promotion.discountValue, subtotal * 0.1); // Max 10% of subtotal for shipping
  }

  // Apply maximum discount limit
  if (promotion.maxDiscountAmount && discount > promotion.maxDiscountAmount) {
    discount = promotion.maxDiscountAmount;
  }

  return { 
    isValid: true, 
    discount: Math.round(discount * 100) / 100 
  };
}

/**
 * Create affiliate commission tracking
 */
exports.trackAffiliateCommission = functions.firestore.document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    // Check if order has affiliate tracking
    if (!order.affiliateCode) return;

    try {
      // Calculate commission (simplified - 5% of order total)
      const commissionRate = 0.05;
      const commissionAmount = order.totalAmount * commissionRate;

      // Create commission record
      await db.collection('affiliate_commissions').add({
        orderId: context.params.orderId,
        affiliateCode: order.affiliateCode,
        orderAmount: order.totalAmount,
        commissionRate,
        commissionAmount,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Created affiliate commission for order ${context.params.orderId}`);

    } catch (error) {
      console.error('Error tracking affiliate commission:', error);
    }
  });

/**
 * Auto-apply best available promotion
 */
exports.findBestPromotion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { cartItems, subtotal } = data;
  const userId = context.auth.uid;

  try {
    // Get all active promotions
    const promotionsSnapshot = await db.collection('promotions')
      .where('isActive', '==', true)
      .where('expirationDate', '>', new Date())
      .get();

    let bestPromotion = null;
    let bestDiscount = 0;

    // Test each promotion
    for (const promoDoc of promotionsSnapshot.docs) {
      const promotion = { id: promoDoc.id, ...promoDoc.data() };
      
      try {
        const validation = await validatePromotionRules(promotion, cartItems, subtotal, userId);
        
        if (validation.isValid && validation.discount > bestDiscount) {
          bestDiscount = validation.discount;
          bestPromotion = promotion;
        }
      } catch (error) {
        // Skip invalid promotions
        continue;
      }
    }

    if (bestPromotion) {
      return {
        hasPromotion: true,
        promotion: {
          code: bestPromotion.code,
          name: bestPromotion.name,
          description: bestPromotion.description,
          discount: bestDiscount
        }
      };
    }

    return { hasPromotion: false };

  } catch (error) {
    console.error('Error finding best promotion:', error);
    throw new functions.https.HttpsError('internal', 'Failed to find promotions');
  }
});
