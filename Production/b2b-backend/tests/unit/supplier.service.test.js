import { describe, it, expect } from '@jest/globals';
import {
  assertSupplierStatusTransition,
} from '../../src/modules/supplier/supplier.service.js';
import { SUPPLIER_STATUS } from '../../src/constants/supplierStatus.js';
import { ROLES } from '../../src/constants/roles.js';
import AppError from '../../src/errors/AppError.js';

describe('Supplier status transitions', () => {
  it('allows the Phase 1.1 lifecycle', () => {
    expect(() => assertSupplierStatusTransition(SUPPLIER_STATUS.PENDING, SUPPLIER_STATUS.APPROVED)).not.toThrow();
    expect(() => assertSupplierStatusTransition(SUPPLIER_STATUS.APPROVED, SUPPLIER_STATUS.ACTIVE)).not.toThrow();
    expect(() => assertSupplierStatusTransition(SUPPLIER_STATUS.ACTIVE, SUPPLIER_STATUS.INACTIVE)).not.toThrow();
    expect(() => assertSupplierStatusTransition(SUPPLIER_STATUS.INACTIVE, SUPPLIER_STATUS.ACTIVE)).not.toThrow();
  });

  it('rejects skipped or reverse transitions', () => {
    expect(() => assertSupplierStatusTransition(SUPPLIER_STATUS.PENDING, SUPPLIER_STATUS.ACTIVE)).toThrow(AppError);
    expect(() => assertSupplierStatusTransition(SUPPLIER_STATUS.APPROVED, SUPPLIER_STATUS.INACTIVE)).toThrow(AppError);
    expect(() => assertSupplierStatusTransition(SUPPLIER_STATUS.ACTIVE, SUPPLIER_STATUS.APPROVED)).toThrow(AppError);
    expect(() => assertSupplierStatusTransition(SUPPLIER_STATUS.PENDING, SUPPLIER_STATUS.INACTIVE)).toThrow(AppError);
  });

  it('keeps Supplier as a centralized role without login mapping requirements', () => {
    expect(ROLES.SUPPLIER).toBe('SUPPLIER');
  });
});
