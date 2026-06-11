export const deliveryNotifications = [
  {
    id: 1,
    type: 'new_delivery',
    title: 'New Delivery Assigned',
    message: 'Order ORD001 has been assigned to you. Pickup from Warehouse A.',
    time: '2 minutes ago',
    read: false,
    orderId: 'ORD001'
  },
  {
    id: 2,
    type: 'delivery_completed',
    title: 'Delivery Completed',
    message: 'Order ORD100 has been delivered successfully. Customer rated you 5 stars.',
    time: '1 hour ago',
    read: false,
    orderId: 'ORD100'
  },
  {
    id: 3,
    type: 'bonus_earned',
    title: 'Bonus Earned',
    message: 'You have earned a peak hour bonus of ₹50 for today\'s deliveries.',
    time: '3 hours ago',
    read: false,
    orderId: null
  },
  {
    id: 4,
    type: 'performance_milestone',
    title: 'Performance Milestone',
    message: 'Congratulations! You have completed 1000 deliveries.',
    time: '1 day ago',
    read: true,
    orderId: null
  },
  {
    id: 5,
    type: 'area_update',
    title: 'Area Update',
    message: 'Your assigned area has been updated to Hyderabad Central.',
    time: '2 days ago',
    read: true,
    orderId: null
  },
  {
    id: 6,
    type: 'new_delivery',
    title: 'New Delivery Assigned',
    message: 'Order ORD002 has been assigned to you. Pickup from Warehouse B.',
    time: '2 days ago',
    read: true,
    orderId: 'ORD002'
  },
  {
    id: 7,
    type: 'delivery_completed',
    title: 'Delivery Completed',
    message: 'Order ORD101 has been delivered successfully. Customer rated you 4 stars.',
    time: '3 days ago',
    read: true,
    orderId: 'ORD101'
  },
  {
    id: 8,
    type: 'system',
    title: 'System Update',
    message: 'The delivery app has been updated with new features.',
    time: '4 days ago',
    read: true,
    orderId: null
  },
  {
    id: 9,
    type: 'bonus_earned',
    title: 'Bonus Earned',
    message: 'You have earned a performance bonus of ₹200 for completing 10+ deliveries.',
    time: '5 days ago',
    read: true,
    orderId: null
  },
  {
    id: 10,
    type: 'delivery_failed',
    title: 'Delivery Failed',
    message: 'Order ORD104 could not be delivered. Customer was not available.',
    time: '6 days ago',
    read: true,
    orderId: 'ORD104'
  }
];
