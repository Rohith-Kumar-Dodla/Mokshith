/**
 * Central bank transfer configuration.
 * TODO: Later these values should be manageable by Admin via settings.
 */
export const BANK_TRANSFER_DETAILS = {
  accountName: 'Mokshith Enterprises',
  bankName: 'Test Bank',
  accountNumber: '123456789012',
  ifsc: 'TEST0001234',
};

/** Bank transfer accepts any positive amount — no min/max or order-total matching. */
export const BANK_TRANSFER_AMOUNT_POLICY = {
  enforceExactAmount: false,
  enforceMinAmount: false,
  enforceMaxAmount: false,
};

export function getBankTransferDetails() {
  return {
    ...BANK_TRANSFER_DETAILS,
    amountPolicy: { ...BANK_TRANSFER_AMOUNT_POLICY },
  };
}
