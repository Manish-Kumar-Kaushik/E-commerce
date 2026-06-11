import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import { readLocalStore, shouldUseLocalStore } from './localStoreService.js';

export const getDashboardAnalytics = async () => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const recentOrders = [...store.orders]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 5)
      .map((order) => {
        const user = store.users.find((entry) => entry._id === order.user);

        return {
          ...order,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
              }
            : null,
        };
      });
    const paidOrders = store.orders.filter((order) => order.paymentStatus === 'paid');
    const pendingOrders = store.orders.filter((order) => order.orderStatus === 'pending');

    return {
      totals: {
        users: store.users.length,
        admins: store.admins.length,
        products: store.products.length,
        orders: store.orders.length,
        paidOrders: paidOrders.length,
        pendingOrders: pendingOrders.length,
        revenue: paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      },
      recentOrders,
    };
  }

  const [totalUsers, totalAdmins, totalProducts, totalOrders, revenueData, recentOrders] = await Promise.all([
    User.countDocuments(),
    Admin.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: '$totalAmount',
          },
        },
      },
    ]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .select('totalAmount paymentStatus orderStatus createdAt paymentMethod'),
  ]);

  const paidOrders = await Order.countDocuments({ paymentStatus: 'paid' });
  const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });

  return {
    totals: {
      users: totalUsers,
      admins: totalAdmins,
      products: totalProducts,
      orders: totalOrders,
      paidOrders,
      pendingOrders,
      revenue: revenueData[0]?.totalRevenue || 0,
    },
    recentOrders,
  };
};
