import { SUPPLIER_ORDER_STATUS, SUPPLIER_ORDER_TRANSITIONS } from '../../src/constants/supplierOrderStatus.js';

describe('supplier order lifecycle', () => {
  it('allows the required procurement path', () => {
    expect(SUPPLIER_ORDER_TRANSITIONS[SUPPLIER_ORDER_STATUS.ASSIGNED]).toContain(SUPPLIER_ORDER_STATUS.SENT);
    expect(SUPPLIER_ORDER_TRANSITIONS[SUPPLIER_ORDER_STATUS.SENT]).toContain(SUPPLIER_ORDER_STATUS.ACKNOWLEDGED);
    expect(SUPPLIER_ORDER_TRANSITIONS[SUPPLIER_ORDER_STATUS.COLLECTED]).toContain(SUPPLIER_ORDER_STATUS.RECEIVED_AT_WAREHOUSE);
  });

  it('does not allow terminal supplier orders to be reopened', () => {
    expect(SUPPLIER_ORDER_TRANSITIONS[SUPPLIER_ORDER_STATUS.RECEIVED_AT_WAREHOUSE]).toEqual([]);
    expect(SUPPLIER_ORDER_TRANSITIONS[SUPPLIER_ORDER_STATUS.CANCELLED]).toEqual([]);
    expect(SUPPLIER_ORDER_TRANSITIONS[SUPPLIER_ORDER_STATUS.REJECTED]).toEqual([]);
  });
});
