#!/usr/bin/env node
import { updateStockSchema, updateStatusSchema } from '../src/modules/product/product.validation.js';

function run(schema, input) {
  const { error, value } = schema.validate(input, { abortEarly: false });
  return { valid: !error, error };
}

async function main() {
  console.log('Verifying updateStockSchema ...');
  const cases = [
    { name: 'valid', input: { params: { id: '507f1f77bcf86cd799439011' }, body: { stock: 10 } } },
    { name: 'negative', input: { params: { id: '507f1f77bcf86cd799439011' }, body: { stock: -1 } } },
    { name: 'string', input: { params: { id: '507f1f77bcf86cd799439011' }, body: { stock: 'ten' } } },
    { name: 'missing body', input: { params: { id: '507f1f77bcf86cd799439011' } } },
  ];

  for (const c of cases) {
    const res = run(updateStockSchema, c.input);
    console.log(`${c.name}: valid=${res.valid}${res.error ? ' error=' + res.error.message : ''}`);
  }

  console.log('\\nVerifying updateStatusSchema ...');
  const statusCases = [
    { name: 'valid true', input: { params: { id: '507f1f77bcf86cd799439011' }, body: { isActive: true } } },
    { name: 'valid false', input: { params: { id: '507f1f77bcf86cd799439011' }, body: { isActive: false } } },
    { name: 'string status', input: { params: { id: '507f1f77bcf86cd799439011' }, body: { isActive: 'active' } } },
    { name: 'missing body', input: { params: { id: '507f1f77bcf86cd799439011' } } },
  ];

  for (const c of statusCases) {
    const res = run(updateStatusSchema, c.input);
    console.log(`${c.name}: valid=${res.valid}${res.error ? ' error=' + res.error.message : ''}`);
  }
}

main().catch((e) => {
  console.error('Verification script failed', e);
  process.exit(1);
});

