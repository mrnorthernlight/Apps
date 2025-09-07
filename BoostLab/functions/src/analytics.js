const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Track user activity
 */
exports.trackUserActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { event, properties } = data;
  const userId = context.auth.uid;

  try {
    await db.collection('analytics').add({
      userId,
      event,
      properties: properties || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking user activity:', error);
    throw new functions.https.HttpsError('internal', 'Failed to track activity');
  }
});

/**
 * Generate analytics report
 */
exports.generateAnalyticsReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check admin permissions
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;
  
  if (userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { startDate, endDate, reportType } = data;

  try {
    let report = {};

    switch (reportType) {
      case 'sales':
        report = await generateSalesReport(startDate, endDate);
        break;
      case 'users':
        report = await generateUsersReport(startDate, endDate);
        break;
      case 'products':
        report = await generateProductsReport(startDate, endDate);
        break;
      default:
        report = await generateOverviewReport(startDate, endDate);
    }

    return { report };
  } catch (error) {
    console.error('Error generating analytics report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate report');
  }
});

async function generateSalesReport(startDate, endDate) {
  const ordersSnapshot = await db.collection('orders')
    .where('timestamp', '>=', new Date(startDate))
    .where('timestamp', '<=', new Date(endDate))
    .where('status', '!=', 'cancelled')
    .get();

  let totalRevenue = 0;
  let totalOrders = ordersSnapshot.size;
  const categoryBreakdown = {};

  ordersSnapshot.docs.forEach(doc => {
    const order = doc.data();
    totalRevenue += order.totalAmount;

    order.products.forEach(product => {
      if (!categoryBreakdown[product.category]) {
        categoryBreakdown[product.category] = { revenue: 0, quantity: 0 };
      }
      categoryBreakdown[product.category].revenue += product.price * product.quantity;
      categoryBreakdown[product.category].quantity += product.quantity;
    });
  });

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    categoryBreakdown
  };
}

async function generateUsersReport(startDate, endDate) {
  const usersSnapshot = await db.collection('users')
    .where('createdAt', '>=', new Date(startDate))
    .where('createdAt', '<=', new Date(endDate))
    .get();

  const roleBreakdown = {};
  usersSnapshot.docs.forEach(doc => {
    const user = doc.data();
    const role = user.role || 'user';
    roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
  });

  return {
    newUsers: usersSnapshot.size,
    roleBreakdown
  };
}

async function generateProductsReport(startDate, endDate) {
  // Get top-selling products
  const ordersSnapshot = await db.collection('orders')
    .where('timestamp', '>=', new Date(startDate))
    .where('timestamp', '<=', new Date(endDate))
    .where('status', '!=', 'cancelled')
    .get();

  const productSales = {};
  ordersSnapshot.docs.forEach(doc => {
    const order = doc.data();
    order.products.forEach(product => {
      if (!productSales[product.productId]) {
        productSales[product.productId] = {
          name: product.name,
          quantity: 0,
          revenue: 0
        };
      }
      productSales[product.productId].quantity += product.quantity;
      productSales[product.productId].revenue += product.price * product.quantity;
    });
  });

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.quantity - a.quantity)
    .slice(0, 10);

  return { topProducts };
}

async function generateOverviewReport(startDate, endDate) {
  const [salesReport, usersReport, productsReport] = await Promise.all([
    generateSalesReport(startDate, endDate),
    generateUsersReport(startDate, endDate),
    generateProductsReport(startDate, endDate)
  ]);

  return {
    sales: salesReport,
    users: usersReport,
    products: productsReport
  };
}
