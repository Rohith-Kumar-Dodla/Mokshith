export const vendorOrders = [
  {
    id: 'ORD001',
    items: [
      {
        productId: 'PRD001',
        productName: 'Basmati Rice Premium',
        quantity: 50,
        unitPrice: 80.00,
        subtotal: 4000.00
      },
      {
        productId: 'PRD002',
        productName: 'Toor Dal (Pigeon Pea)',
        quantity: 40,
        unitPrice: 112.00,
        subtotal: 4480.00
      }
    ],
    amount: 8480.00,
    status: 'delivered',
    deliveryDate: '2024-06-01',
    estimatedDelivery: '2024-06-01',
    orderDate: '2024-05-28',
    deliveryPartner: 'Ravi Teja',
    deliveryPartnerPhone: '+91 98765 43210',
    address: 'Shop No. 12, Main Market, Hyderabad East',
    paymentMethod: 'UPI',
    paymentStatus: 'paid',
    invoiceId: 'INV001',
    timeline: [
      { status: 'Order Placed', date: '2024-05-28 10:30 AM', completed: true },
      { status: 'Order Confirmed', date: '2024-05-28 11:00 AM', completed: true },
      { status: 'Packed', date: '2024-05-28 02:00 PM', completed: true },
      { status: 'Dispatched', date: '2024-05-29 09:00 AM', completed: true },
      { status: 'Out for Delivery', date: '2024-06-01 08:00 AM', completed: true },
      { status: 'Delivered', date: '2024-06-01 11:30 AM', completed: true }
    ]
  },
  {
    id: 'ORD002',
    items: [
      {
        productId: 'PRD003',
        productName: 'Sunflower Oil 5L',
        quantity: 30,
        unitPrice: 425.00,
        subtotal: 12750.00
      },
      {
        productId: 'PRD004',
        productName: 'Wheat Flour (Atta) 25kg',
        quantity: 10,
        unitPrice: 615.00,
        subtotal: 6150.00
      }
    ],
    amount: 18900.00,
    status: 'processing',
    deliveryDate: null,
    estimatedDelivery: '2024-06-08',
    orderDate: '2024-06-05',
    deliveryPartner: null,
    deliveryPartnerPhone: null,
    address: 'Shop No. 45, Commercial Complex, Hyderabad East',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'paid',
    invoiceId: 'INV002',
    timeline: [
      { status: 'Order Placed', date: '2024-06-05 09:15 AM', completed: true },
      { status: 'Order Confirmed', date: '2024-06-05 10:00 AM', completed: true },
      { status: 'Packed', date: '2024-06-05 03:00 PM', completed: true },
      { status: 'Dispatched', date: null, completed: false },
      { status: 'Out for Delivery', date: null, completed: false },
      { status: 'Delivered', date: null, completed: false }
    ]
  },
  {
    id: 'ORD003',
    items: [
      {
        productId: 'PRD006',
        productName: 'Red Chilli Powder 1kg',
        quantity: 50,
        unitPrice: 265.00,
        subtotal: 13250.00
      }
    ],
    amount: 13250.00,
    status: 'pending',
    deliveryDate: null,
    estimatedDelivery: '2024-06-10',
    orderDate: '2024-06-05',
    deliveryPartner: null,
    deliveryPartnerPhone: null,
    address: 'Shop No. 23, Market Area, Hyderabad East',
    paymentMethod: 'Cash On Delivery',
    paymentStatus: 'pending',
    invoiceId: 'INV003',
    timeline: [
      { status: 'Order Placed', date: '2024-06-05 02:30 PM', completed: true },
      { status: 'Order Confirmed', date: null, completed: false },
      { status: 'Packed', date: null, completed: false },
      { status: 'Dispatched', date: null, completed: false },
      { status: 'Out for Delivery', date: null, completed: false },
      { status: 'Delivered', date: null, completed: false }
    ]
  },
  {
    id: 'ORD004',
    items: [
      {
        productId: 'PRD009',
        productName: 'Urad Dal (Black Gram)',
        quantity: 60,
        unitPrice: 127.00,
        subtotal: 7620.00
      },
      {
        productId: 'PRD011',
        productName: 'Moong Dal (Green Gram)',
        quantity: 75,
        unitPrice: 107.00,
        subtotal: 8025.00
      },
      {
        productId: 'PRD016',
        productName: 'Chana Dal (Bengal Gram)',
        quantity: 50,
        unitPrice: 90.00,
        subtotal: 4500.00
      }
    ],
    amount: 20145.00,
    status: 'dispatched',
    deliveryDate: null,
    estimatedDelivery: '2024-06-07',
    orderDate: '2024-06-04',
    deliveryPartner: 'Srinivas Rao',
    deliveryPartnerPhone: '+91 98765 43211',
    address: 'Shop No. 8, Central Market, Hyderabad East',
    paymentMethod: 'Credit Line',
    paymentStatus: 'paid',
    invoiceId: 'INV004',
    timeline: [
      { status: 'Order Placed', date: '2024-06-04 11:00 AM', completed: true },
      { status: 'Order Confirmed', date: '2024-06-04 11:30 AM', completed: true },
      { status: 'Packed', date: '2024-06-04 04:00 PM', completed: true },
      { status: 'Dispatched', date: '2024-06-05 08:00 AM', completed: true },
      { status: 'Out for Delivery', date: null, completed: false },
      { status: 'Delivered', date: null, completed: false }
    ]
  },
  {
    id: 'ORD005',
    items: [
      {
        productId: 'PRD012',
        productName: 'Besan (Gram Flour) 10kg',
        quantity: 20,
        unitPrice: 360.00,
        subtotal: 7200.00
      }
    ],
    amount: 7200.00,
    status: 'cancelled',
    deliveryDate: null,
    estimatedDelivery: null,
    orderDate: '2024-06-03',
    deliveryPartner: null,
    deliveryPartnerPhone: null,
    address: 'Shop No. 15, Local Market, Hyderabad East',
    paymentMethod: 'UPI',
    paymentStatus: 'refunded',
    invoiceId: 'INV005',
    timeline: [
      { status: 'Order Placed', date: '2024-06-03 03:00 PM', completed: true },
      { status: 'Order Confirmed', date: null, completed: false },
      { status: 'Packed', date: null, completed: false },
      { status: 'Dispatched', date: null, completed: false },
      { status: 'Out for Delivery', date: null, completed: false },
      { status: 'Delivered', date: null, completed: false }
    ]
  },
  {
    id: 'ORD006',
    items: [
      {
        productId: 'PRD018',
        productName: 'Garam Masala 200g',
        quantity: 100,
        unitPrice: 137.00,
        subtotal: 13700.00
      },
      {
        productId: 'PRD013',
        productName: 'Cumin Seeds (Jeera) 500g',
        quantity: 40,
        unitPrice: 300.00,
        subtotal: 12000.00
      }
    ],
    amount: 25700.00,
    status: 'delivered',
    deliveryDate: '2024-05-30',
    estimatedDelivery: '2024-05-30',
    orderDate: '2024-05-27',
    deliveryPartner: 'Venkatesh Iyer',
    deliveryPartnerPhone: '+91 98765 43212',
    address: 'Shop No. 33, Spice Market, Hyderabad East',
    paymentMethod: 'Wallet',
    paymentStatus: 'paid',
    invoiceId: 'INV006',
    timeline: [
      { status: 'Order Placed', date: '2024-05-27 10:00 AM', completed: true },
      { status: 'Order Confirmed', date: '2024-05-27 10:30 AM', completed: true },
      { status: 'Packed', date: '2024-05-27 02:00 PM', completed: true },
      { status: 'Dispatched', date: '2024-05-28 09:00 AM', completed: true },
      { status: 'Out for Delivery', date: '2024-05-30 07:30 AM', completed: true },
      { status: 'Delivered', date: '2024-05-30 10:00 AM', completed: true }
    ]
  }
];
