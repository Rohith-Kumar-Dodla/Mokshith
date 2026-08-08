import api from './api';

let moduleCreateOrderInFlight = null;

function getCreateOrderInFlight() {
  if (typeof window !== 'undefined') {
    return window.__b2bCreateOrderInFlight ?? null;
  }
  return moduleCreateOrderInFlight;
}

function setCreateOrderInFlight(promise) {
  if (typeof window !== 'undefined') {
    window.__b2bCreateOrderInFlight = promise;
  } else {
    moduleCreateOrderInFlight = promise;
  }
}

function clearCreateOrderInFlight() {
  setCreateOrderInFlight(null);
}

const orderService = {
  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  createOrder: async (orderData, options = {}) => {
    const inFlight = getCreateOrderInFlight();
    if (inFlight && !options.skipInFlightGuard) {
      return inFlight;
    }

    const headers = {};
    if (orderData?.idempotencyKey) {
      headers['Idempotency-Key'] = orderData.idempotencyKey;
    }

    // Align with server timeoutMiddleware(30000): order create can exceed the default 10s
    // axios timeout while MongoDB/inventory work completes — causing false UI failures.
    const requestPromise = api
      .post('/orders', orderData, { headers, timeout: 30000 })
      .then((response) => response.data)
      .finally(() => {
        clearCreateOrderInFlight();
      });

    if (!options.skipInFlightGuard) {
      setCreateOrderInFlight(requestPromise);
    }
    return requestPromise;
  },

  updateOrderStatus: async (orderId, statusData) => {
    const response = await api.patch(`/orders/${orderId}/status`, statusData);
    return response.data;
  },

  downloadInvoice: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default orderService;
