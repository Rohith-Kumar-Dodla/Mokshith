export const deliveryAnalytics = {
  today: {
    assignedOrders: 8,
    pendingDeliveries: 5,
    completedDeliveries: 3,
    todaysEarnings: 1051.00,
    monthlyEarnings: 21300.00,
    averageRating: 4.7,
    successRate: 94.5
  },
  weekly: {
    totalDeliveries: 85,
    successfulDeliveries: 80,
    failedDeliveries: 5,
    totalEarnings: 8500.00,
    averageRating: 4.6,
    successRate: 94.1
  },
  monthly: {
    totalDeliveries: 255,
    successfulDeliveries: 241,
    failedDeliveries: 14,
    totalEarnings: 21300.00,
    averageRating: 4.7,
    successRate: 94.5
  }
};

export const activityTimeline = [
  {
    id: 1,
    type: 'order_assigned',
    title: 'Order Assigned',
    description: 'Order ORD001 assigned from Fresh Mart Grocery',
    time: '08:30 AM',
    date: '2024-06-06',
    orderId: 'ORD001'
  },
  {
    id: 2,
    type: 'order_accepted',
    title: 'Order Accepted',
    description: 'Order ORD002 accepted',
    time: '09:00 AM',
    date: '2024-06-06',
    orderId: 'ORD002'
  },
  {
    id: 3,
    type: 'order_picked_up',
    title: 'Order Picked Up',
    description: 'Order ORD003 picked up from Warehouse C',
    time: '07:45 AM',
    date: '2024-06-06',
    orderId: 'ORD003'
  },
  {
    id: 4,
    type: 'out_for_delivery',
    title: 'Out For Delivery',
    description: 'Order ORD004 is out for delivery',
    time: '07:30 AM',
    date: '2024-06-06',
    orderId: 'ORD004'
  },
  {
    id: 5,
    type: 'order_delivered',
    title: 'Order Delivered',
    description: 'Order ORD100 delivered successfully',
    time: '10:15 AM',
    date: '2024-06-05',
    orderId: 'ORD100'
  },
  {
    id: 6,
    type: 'payment_completed',
    title: 'Payment Completed',
    description: 'Earnings of ₹245 credited for ORD100',
    time: '10:30 AM',
    date: '2024-06-05',
    orderId: 'ORD100'
  },
  {
    id: 7,
    type: 'order_delivered',
    title: 'Order Delivered',
    description: 'Order ORD101 delivered successfully',
    time: '02:45 PM',
    date: '2024-06-05',
    orderId: 'ORD101'
  },
  {
    id: 8,
    type: 'payment_completed',
    title: 'Payment Completed',
    description: 'Earnings of ₹189 credited for ORD101',
    time: '03:00 PM',
    date: '2024-06-05',
    orderId: 'ORD101'
  }
];
