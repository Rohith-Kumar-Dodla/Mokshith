export const assignedOrders = [
  {
    id: 'ORD001',
    vendor: 'Fresh Mart Grocery',
    vendorId: 'VND001',
    pickupLocation: 'Warehouse A, Hyderabad Central',
    deliveryLocation: '123 Main St, Hyderabad Central',
    orderAmount: 2450.00,
    itemsCount: 12,
    status: 'assigned',
    priority: 'high',
    assignedTime: '2024-06-06T08:30:00',
    estimatedDelivery: '2024-06-06T10:30:00',
    distance: 5.2,
    customerName: 'Rajesh Kumar',
    customerPhone: '+91 98765 43210',
    specialInstructions: 'Handle with care - fragile items',
    products: [
      { id: 'P001', name: 'Basmati Rice', quantity: 5, price: 450.00 },
      { id: 'P002', name: 'Cooking Oil', quantity: 3, price: 350.00 },
      { id: 'P003', name: 'Pulses Pack', quantity: 4, price: 200.00 }
    ]
  },
  {
    id: 'ORD002',
    vendor: 'Daily Needs Store',
    vendorId: 'VND002',
    pickupLocation: 'Warehouse B, Banjara Hills',
    deliveryLocation: '456 Oak Ave, Banjara Hills',
    orderAmount: 1890.00,
    itemsCount: 8,
    status: 'accepted',
    priority: 'medium',
    assignedTime: '2024-06-06T09:00:00',
    estimatedDelivery: '2024-06-06T11:00:00',
    distance: 3.8,
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 43211',
    specialInstructions: 'Call before delivery',
    products: [
      { id: 'P004', name: 'Wheat Flour', quantity: 2, price: 280.00 },
      { id: 'P005', name: 'Sugar', quantity: 3, price: 240.00 },
      { id: 'P006', name: 'Tea Powder', quantity: 3, price: 370.00 }
    ]
  },
  {
    id: 'ORD003',
    vendor: 'Quick Supply Hub',
    vendorId: 'VND003',
    pickupLocation: 'Warehouse C, Secunderabad',
    deliveryLocation: '789 Pine Rd, Secunderabad',
    orderAmount: 3200.00,
    itemsCount: 15,
    status: 'picked_up',
    priority: 'high',
    assignedTime: '2024-06-06T07:30:00',
    estimatedDelivery: '2024-06-06T09:30:00',
    distance: 7.5,
    customerName: 'Amit Patel',
    customerPhone: '+91 98765 43212',
    specialInstructions: 'Leave at reception',
    products: [
      { id: 'P007', name: 'Spices Set', quantity: 5, price: 500.00 },
      { id: 'P008', name: 'Dry Fruits', quantity: 3, price: 800.00 },
      { id: 'P009', name: 'Snacks Pack', quantity: 7, price: 400.00 }
    ]
  },
  {
    id: 'ORD004',
    vendor: 'Metro Wholesale',
    vendorId: 'VND004',
    pickupLocation: 'Warehouse D, Madhapur',
    deliveryLocation: '321 Elm St, Madhapur',
    orderAmount: 5670.00,
    itemsCount: 24,
    status: 'out_for_delivery',
    priority: 'high',
    assignedTime: '2024-06-06T06:00:00',
    estimatedDelivery: '2024-06-06T08:00:00',
    distance: 6.3,
    customerName: 'Sneha Reddy',
    customerPhone: '+91 98765 43213',
    specialInstructions: 'Customer available after 9 AM',
    products: [
      { id: 'P010', name: 'Beverages Pack', quantity: 10, price: 1200.00 },
      { id: 'P011', name: 'Biscuits Box', quantity: 8, price: 800.00 },
      { id: 'P012', name: 'Confectionery', quantity: 6, price: 600.00 }
    ]
  },
  {
    id: 'ORD005',
    vendor: 'City Supermarket',
    vendorId: 'VND005',
    pickupLocation: 'Warehouse E, Gachibowli',
    deliveryLocation: '567 Maple Dr, Gachibowli',
    orderAmount: 1780.00,
    itemsCount: 6,
    status: 'assigned',
    priority: 'low',
    assignedTime: '2024-06-06T10:00:00',
    estimatedDelivery: '2024-06-06T12:00:00',
    distance: 4.1,
    customerName: 'Vikram Singh',
    customerPhone: '+91 98765 43214',
    specialInstructions: '',
    products: [
      { id: 'P013', name: 'Dairy Products', quantity: 3, price: 600.00 },
      { id: 'P014', name: 'Bakery Items', quantity: 3, price: 580.00 }
    ]
  },
  {
    id: 'ORD006',
    vendor: 'Local Kirana Store',
    vendorId: 'VND006',
    pickupLocation: 'Warehouse F, Kukatpally',
    deliveryLocation: '890 Cedar Ln, Kukatpally',
    orderAmount: 980.00,
    itemsCount: 5,
    status: 'assigned',
    priority: 'medium',
    assignedTime: '2024-06-06T10:30:00',
    estimatedDelivery: '2024-06-06T12:30:00',
    distance: 2.9,
    customerName: 'Anjali Desai',
    customerPhone: '+91 98765 43215',
    specialInstructions: 'Ring doorbell twice',
    products: [
      { id: 'P015', name: 'Grocery Essentials', quantity: 5, price: 980.00 }
    ]
  },
  {
    id: 'ORD007',
    vendor: 'Premium Foods',
    vendorId: 'VND007',
    pickupLocation: 'Warehouse G, HITEC City',
    deliveryLocation: '234 Birch Ave, HITEC City',
    orderAmount: 4560.00,
    itemsCount: 18,
    status: 'accepted',
    priority: 'high',
    assignedTime: '2024-06-06T09:30:00',
    estimatedDelivery: '2024-06-06T11:30:00',
    distance: 5.8,
    customerName: 'Rahul Mehta',
    customerPhone: '+91 98765 43216',
    specialInstructions: 'Premium customer - ensure quality',
    products: [
      { id: 'P016', name: 'Organic Products', quantity: 8, price: 1500.00 },
      { id: 'P017', name: 'Health Foods', quantity: 6, price: 1200.00 },
      { id: 'P018', name: 'Gourmet Items', quantity: 4, price: 860.00 }
    ]
  },
  {
    id: 'ORD008',
    vendor: 'Big Basket Plus',
    vendorId: 'VND010',
    pickupLocation: 'Warehouse B, Banjara Hills',
    deliveryLocation: '678 Spruce St, Banjara Hills',
    orderAmount: 6780.00,
    itemsCount: 28,
    status: 'assigned',
    priority: 'medium',
    assignedTime: '2024-06-06T11:00:00',
    estimatedDelivery: '2024-06-06T13:00:00',
    distance: 4.5,
    customerName: 'Kavitha Nair',
    customerPhone: '+91 98765 43217',
    specialInstructions: 'Large order - ensure vehicle capacity',
    products: [
      { id: 'P019', name: 'Bulk Rice', quantity: 10, price: 2000.00 },
      { id: 'P020', name: 'Bulk Grains', quantity: 10, price: 1800.00 },
      { id: 'P021', name: 'Household Items', quantity: 8, price: 980.00 }
    ]
  }
];
