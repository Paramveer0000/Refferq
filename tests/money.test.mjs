import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMinorCurrency, fromMinorUnits, toMinorUnits } from '../src/lib/money.ts';

test('minor-unit conversions preserve paise exactly', () => {
  assert.equal(toMinorUnits('1000'), 100000);
  assert.equal(toMinorUnits('12.34'), 1234);
  assert.equal(toMinorUnits('12.345'), 1235);
  assert.equal(fromMinorUnits(1234), 12.34);
});

test('currency formatting uses the configured currency and not a hard-coded rupee symbol', () => {
  assert.match(formatMinorCurrency(123456, 'INR'), /₹1,234\.56/);
  assert.match(formatMinorCurrency(123456, 'USD'), /\$1,234\.56/);
  assert.match(formatMinorCurrency(123456, 'EUR'), /€/);
  assert.match(formatMinorCurrency(123456, 'EUR'), /1[.,]234[.,]56/);
});
