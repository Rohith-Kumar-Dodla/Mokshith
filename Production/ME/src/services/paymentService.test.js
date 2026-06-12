import { describe, it, expect, beforeEach, vi } from 'vitest';
import paymentService from './paymentService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates razorpay order', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { id: 'rzp_order_1' } } });

    await paymentService.createRazorpayOrder(1500);

    expect(api.post).toHaveBeenCalledWith('/payments/create-order', { amount: 1500 });
  });

  it('initiates payment for order', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: {} } });

    await paymentService.initiatePayment('order-1');

    expect(api.post).toHaveBeenCalledWith('/payments/initiate/order-1');
  });

  it('verifies payment payload', async () => {
    const payload = { orderId: 'order-1', paymentId: 'pay-1', signature: 'sig' };
    api.post.mockResolvedValue({ data: { success: true, data: { verified: true } } });

    await paymentService.verifyPayment(payload);

    expect(api.post).toHaveBeenCalledWith('/payments/verify', payload);
  });

  it('fetches bank transfer details', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { accountNumber: '123' } } });

    await paymentService.getBankTransferDetails();

    expect(api.get).toHaveBeenCalledWith('/payments/bank-transfer/bank-details');
  });

  it('approves bank transfer proof', async () => {
    api.patch.mockResolvedValue({ data: { success: true, data: { status: 'APPROVED' } } });

    await paymentService.approveBankTransfer('proof-1');

    expect(api.patch).toHaveBeenCalledWith('/payments/bank-transfer/proof-1/approve');
  });
});
