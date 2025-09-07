const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

const db = admin.firestore();

/**
 * Process a new order - validate, calculate totals, and create order document
 */
exports.processOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { products, shippingAddress, billingAddress, paymentMethod, promoCode } = data;
  const userId = context.auth.uid;

  try {
    // Validate products and calculate totals
    let subtotal = 0;
    const orderProducts = [];

    for (const item of products) {
      const partDoc = await db.collection('parts').doc(item.productId).get();
      
      if (!partDoc.exists) {
        throw new functions.https.HttpsError('not-found', `Product ${item.productId} not found`);
      }

      const part = partDoc.data();
      
      // Check stock availability
      if (part.stock < item.quantity) {
        throw new functions.https.HttpsError('failed-precondition', 
          `Insufficient stock for ${part.name}. Available: ${part.stock}, Requested: ${item.quantity}`);
      }

      const itemTotal = part.price * item.quantity;
      subtotal += itemTotal;

      orderProducts.push({
        productId: item.productId,
        name: part.name,
        price: part.price,
        quantity: item.quantity,
        vendorId: part.vendorId
      });
    }

    // Calculate shipping
    const shipping = await calculateShippingCost(orderProducts, shippingAddress);
    
    // Apply promotion if provided
    let discount = 0;
    let appliedPromo = null;
    if (promoCode) {
      const promoResult = await applyPromotionCode(promoCode, orderProducts, subtotal, userId);
      discount = promoResult.discount;
      appliedPromo = promoResult.promotion;
    }

    // Calculate tax (simplified - 8% for demo)
    const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100;
    
    // Calculate total
    const totalAmount = subtotal + shipping + tax - discount;

    // Create order document
    const orderId = uuidv4();
    const orderData = {
      userId,
      products: orderProducts,
      subtotal,
      tax,
      shipping,
      discount,
      totalAmount,
      currency: 'USD',
      status: 'pending',
      paymentMethod,
      shippingAddress,
      billingAddress,
      promoCode: appliedPromo?.code || null,
      timeline: [{
        status: 'pending',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        note: 'Order placed'
      }],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('orders').doc(orderId).set(orderData);

    // Update stock levels
    const batch = db.batch();
    for (const item of orderProducts) {
      const partRef = db.collection('parts').doc(item.productId);
      batch.update(partRef, {
        stock: admin.firestore.FieldValue.increment(-item.quantity)
      });
    }

    // Update promotion usage if applied
    if (appliedPromo) {
      const promoRef = db.collection('promotions').doc(appliedPromo.id);
      batch.update(promoRef, {
        usageCount: admin.firestore.FieldValue.increment(1)
      });
    }

    await batch.commit();

    // Send order confirmation notification
    await sendOrderNotification(userId, orderId, 'created');

    return {
      orderId,
      totalAmount,
      status: 'pending',
      message: 'Order processed successfully'
    };

  } catch (error) {
    console.error('Error processing order:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process order');
  }
});

/**
 * Update order status
 */
exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { orderId, status, trackingInfo, note } = data;
  const userId = context.auth.uid;

  try {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    const order = orderDoc.data();
    
    // Check permissions
    const userDoc = await db.collection('users').doc(userId).get();
    const userRole = userDoc.data()?.role;
    
    if (userRole !== 'admin' && order.userId !== userId) {
      // Check if user is a vendor for this order
      const isVendor = userRole === 'vendor' && 
        order.products.some(product => product.vendorId === userId);
      
      if (!isVendor) {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
      }
    }

    // Update order
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      timeline: admin.firestore.FieldValue.arrayUnion({
        status,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        note: note || `Order status updated to ${status}`,
        updatedBy: userId
      })
    };

    if (trackingInfo) {
      updateData.tracking = trackingInfo;
    }

    await db.collection('orders').doc(orderId).update(updateData);

    // Send status update notification
    await sendOrderNotification(order.userId, orderId, status);

    return { success: true, message: 'Order status updated successfully' };

  } catch (error) {
    console.error('Error updating order status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update order status');
  }
});

/**
 * Calculate shipping cost
 */
async function calculateShippingCost(products, shippingAddress) {
  // Simplified shipping calculation
  // In a real app, this would integrate with shipping APIs
  
  let totalWeight = 0;
  let hasOversizedItems = false;
  
  for (const product of products) {
    // Estimate weight based on category (simplified)
    const partDoc = await db.collection('parts').doc(product.productId).get();
    const part = partDoc.data();
    
    switch (part.category) {
      case 'engine':
        totalWeight += 50 * product.quantity; // 50 lbs average
        if (part.subcategory === 'turbo') hasOversizedItems = true;
        break;
      case 'suspension':
        totalWeight += 30 * product.quantity; // 30 lbs average
        hasOversizedItems = true;
        break;
      case 'brakes':
        totalWeight += 25 * product.quantity; // 25 lbs average
        break;
      case 'body':
        totalWeight += 15 * product.quantity; // 15 lbs average
        hasOversizedItems = true;
        break;
      default:
        totalWeight += 5 * product.quantity; // 5 lbs average
    }
  }
  
  // Base shipping cost
  let shippingCost = 19.99;
  
  // Weight-based pricing
  if (totalWeight > 50) {
    shippingCost += Math.ceil((totalWeight - 50) / 10) * 5;
  }
  
  // Oversized item surcharge
  if (hasOversizedItems) {
    shippingCost += 25;
  }
  
  // Free shipping for orders over $200
  const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  if (subtotal >= 200) {
    shippingCost = 0;
  }
  
  return Math.round(shippingCost * 100) / 100;
}

/**
 * Apply promotion code
 */
async function applyPromotionCode(promoCode, products, subtotal, userId) {
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

  // Check expiration
  const now = new Date();
  if (promotion.expirationDate.toDate() < now) {
    throw new functions.https.HttpsError('failed-precondition', 'Promotion code has expired');
  }

  // Check usage limits
  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
    throw new functions.https.HttpsError('failed-precondition', 'Promotion code usage limit reached');
  }

  // Check minimum order amount
  if (promotion.minOrderAmount && subtotal < promotion.minOrderAmount) {
    throw new functions.https.HttpsError('failed-precondition', 
      `Minimum order amount of $${promotion.minOrderAmount} required`);
  }

  // Check user restrictions
  if (promotion.userRestrictions?.newUsersOnly) {
    const userOrdersSnapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (!userOrdersSnapshot.empty) {
      throw new functions.https.HttpsError('failed-precondition', 
        'This promotion is only available for new users');
    }
  }

  // Calculate discount
  let discount = 0;
  if (promotion.discountType === 'percentage') {
    discount = subtotal * (promotion.discountValue / 100);
  } else if (promotion.discountType === 'fixed') {
    discount = promotion.discountValue;
  }

  // Apply maximum discount limit
  if (promotion.maxDiscountAmount && discount > promotion.maxDiscountAmount) {
    discount = promotion.maxDiscountAmount;
  }

  return { discount: Math.round(discount * 100) / 100, promotion };
}

/**
 * Send order notification
 */
async function sendOrderNotification(userId, orderId, status) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();
    
    if (!user?.preferences?.notifications?.orderUpdates) {
      return; // User has disabled order notifications
    }

    // Create notification document
    await db.collection('notifications').add({
      userId,
      type: 'order_update',
      title: getOrderNotificationTitle(status),
      message: getOrderNotificationMessage(status, orderId),
      data: { orderId, status },
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send FCM notification if user has a device token
    if (user.fcmToken) {
      const message = {
        token: user.fcmToken,
        notification: {
          title: getOrderNotificationTitle(status),
          body: getOrderNotificationMessage(status, orderId)
        },
        data: {
          type: 'order_update',
          orderId,
          status
        }
      };

      await admin.messaging().send(message);
    }

  } catch (error) {
    console.error('Error sending order notification:', error);
  }
}

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
  const messages = {
    created: `Your order #${orderId.slice(-8)} has been confirmed and is being processed.`,
    processing: `Your order #${orderId.slice(-8)} is being prepared for shipment.`,
    shipped: `Your order #${orderId.slice(-8)} has been shipped and is on its way!`,
    delivered: `Your order #${orderId.slice(-8)} has been delivered. Enjoy your new parts!`,
    cancelled: `Your order #${orderId.slice(-8)} has been cancelled.`
  };
  return messages[status] || `Your order #${orderId.slice(-8)} status has been updated.`;
}

exports.calculateShipping = functions.https.onCall(async (data, context) => {
  const { products, shippingAddress } = data;
  
  try {
    const shippingCost = await calculateShippingCost(products, shippingAddress);
    return { shippingCost };
  } catch (error) {
    console.error('Error calculating shipping:', error);
    throw new functions.https.HttpsError('internal', 'Failed to calculate shipping');
  }
});
