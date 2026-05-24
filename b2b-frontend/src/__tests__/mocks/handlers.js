import { http, HttpResponse } from 'msw';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();
    
    if (body.identifier === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'B2B_CUSTOMER',
          },
          token: 'mock-jwt-token-12345',
        },
      });
    }
    
    return HttpResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/register`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'user-new',
          name: 'New User',
          email: 'newuser@example.com',
          role: 'B2B_CUSTOMER',
        },
        token: 'mock-jwt-token-new',
      },
    });
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  // Product endpoints
  http.get(`${API_URL}/products`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'prod-123',
          name: 'Test Product',
          price: 1000,
          moq: 10,
          category: 'Electronics',
        },
      ],
    });
  }),

  http.get(`${API_URL}/products/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        name: 'Test Product',
        price: 1000,
        moq: 10,
        category: 'Electronics',
      },
    });
  }),

  // Order endpoints
  http.get(`${API_URL}/orders`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'order-123',
          orderNumber: 'ORD-2024-001',
          totalAmount: 20000,
          status: 'PENDING',
        },
      ],
    });
  }),

  http.post(`${API_URL}/orders`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'order-new',
        orderNumber: 'ORD-2024-NEW',
        totalAmount: 10000,
        status: 'PENDING',
      },
    });
  }),

  // Cart endpoints
  http.get(`${API_URL}/cart`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: [],
        total: 0,
      },
    });
  }),

  http.post(`${API_URL}/cart/add`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Item added to cart',
      },
    });
  }),

  // Admin endpoints
  http.get(`${API_URL}/admin/users`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'B2B_CUSTOMER',
        },
      ],
    });
  }),

  http.get(`${API_URL}/admin/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalUsers: 100,
        totalOrders: 50,
        totalRevenue: 500000,
      },
    });
  }),

  // Payment endpoints
  http.post(`${API_URL}/payment/create-order`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        orderId: 'razorpay-order-123',
        amount: 10000,
        currency: 'INR',
      },
    });
  }),

  http.post(`${API_URL}/payment/verify`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        verified: true,
      },
    });
  }),
];
