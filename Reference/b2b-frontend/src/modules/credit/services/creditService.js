import { simulateApi } from '../../../mocks/mockApi.js';
import { mockCreditAccount, mockCreditLedger } from '../../../mocks/data/index.js';

let creditAccount = { ...mockCreditAccount };
let creditLedger = [...mockCreditLedger];

export const creditService = {
  async getCreditInfo() {
    return simulateApi(() => ({
      ...creditAccount,
      availableCredit: creditAccount.creditLimit - creditAccount.usedCredit,
      utilizationPercent: Math.round((creditAccount.usedCredit / creditAccount.creditLimit) * 100),
    }));
  },

  async getLedger() {
    return simulateApi(() => [...creditLedger].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  },

  async useCredit(orderId) {
    return simulateApi(() => {
      const amount = 25000;
      creditAccount.usedCredit += amount;
      creditLedger.unshift({
        _id: `cl-${Date.now()}`,
        userId: creditAccount.userId,
        type: 'DEBIT',
        amount,
        description: `Order #${orderId} credit usage`,
        createdAt: new Date().toISOString(),
      });
      return { success: true, amount };
    });
  },

  async getVendorCreditDashboard() {
    return simulateApi(() => ({
      account: {
        ...creditAccount,
        availableCredit: creditAccount.creditLimit - creditAccount.usedCredit,
        utilizationPercent: Math.round((creditAccount.usedCredit / creditAccount.creditLimit) * 100),
      },
      ledger: [...creditLedger],
      summary: {
        totalDebits: creditLedger.filter((l) => l.type === 'DEBIT').reduce((s, l) => s + l.amount, 0),
        totalCredits: creditLedger.filter((l) => l.type === 'CREDIT').reduce((s, l) => s + l.amount, 0),
        transactionCount: creditLedger.length,
      },
    }));
  },
};
