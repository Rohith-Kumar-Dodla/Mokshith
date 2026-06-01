import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import storage from '../../services/storage.js';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('get', () => {
    it('should retrieve and parse stored value', () => {
      localStorage.setItem('testKey', JSON.stringify({ name: 'John' }));

      const result = storage.get('testKey');

      expect(result).toEqual({ name: 'John' });
    });

    it('should return null for non-existent key', () => {
      const result = storage.get('nonExistentKey');

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('invalidKey', 'invalid-json{');

      const result = storage.get('invalidKey');

      expect(result).toBeNull();
    });

    it('should handle string values', () => {
      localStorage.setItem('stringKey', JSON.stringify('hello'));

      const result = storage.get('stringKey');

      expect(result).toBe('hello');
    });

    it('should handle number values', () => {
      localStorage.setItem('numberKey', JSON.stringify(42));

      const result = storage.get('numberKey');

      expect(result).toBe(42);
    });

    it('should handle boolean values', () => {
      localStorage.setItem('boolKey', JSON.stringify(true));

      const result = storage.get('boolKey');

      expect(result).toBe(true);
    });

    it('should handle array values', () => {
      const array = [1, 2, 3, 4, 5];
      localStorage.setItem('arrayKey', JSON.stringify(array));

      const result = storage.get('arrayKey');

      expect(result).toEqual(array);
    });

    it('should handle nested objects', () => {
      const nestedObj = {
        user: { name: 'John', address: { city: 'NYC', zip: '10001' } },
      };
      localStorage.setItem('nestedKey', JSON.stringify(nestedObj));

      const result = storage.get('nestedKey');

      expect(result).toEqual(nestedObj);
    });

    it('should handle null values stored as JSON', () => {
      localStorage.setItem('nullKey', JSON.stringify(null));

      const result = storage.get('nullKey');

      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      const result = storage.get(undefined);

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value as JSON string', () => {
      const data = { name: 'John', age: 30 };

      storage.set('testKey', data);

      const stored = localStorage.getItem('testKey');
      expect(JSON.parse(stored)).toEqual(data);
    });

    it('should overwrite existing value', () => {
      storage.set('testKey', 'oldValue');
      storage.set('testKey', 'newValue');

      const result = storage.get('testKey');

      expect(result).toBe('newValue');
    });

    it('should store string values', () => {
      storage.set('stringKey', 'hello world');

      const result = storage.get('stringKey');

      expect(result).toBe('hello world');
    });

    it('should store number values', () => {
      storage.set('numberKey', 123);

      const result = storage.get('numberKey');

      expect(result).toBe(123);
    });

    it('should store boolean values', () => {
      storage.set('boolKey', false);

      const result = storage.get('boolKey');

      expect(result).toBe(false);
    });

    it('should store array values', () => {
      const array = ['a', 'b', 'c'];
      storage.set('arrayKey', array);

      const result = storage.get('arrayKey');

      expect(result).toEqual(array);
    });

    it('should store object values', () => {
      const obj = { key1: 'value1', key2: 'value2' };
      storage.set('objKey', obj);

      const result = storage.get('objKey');

      expect(result).toEqual(obj);
    });

    it('should store null values', () => {
      storage.set('nullKey', null);

      const result = storage.get('nullKey');

      expect(result).toBeNull();
    });

    it('should store empty string', () => {
      storage.set('emptyKey', '');

      const result = storage.get('emptyKey');

      expect(result).toBe('');
    });

    it('should store zero', () => {
      storage.set('zeroKey', 0);

      const result = storage.get('zeroKey');

      expect(result).toBe(0);
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key-with_special.chars@123';
      storage.set(specialKey, 'value');

      const result = storage.get(specialKey);

      expect(result).toBe('value');
    });

    it('should handle special characters in values', () => {
      const specialValue = 'value with <special> & "characters"';
      storage.set('specialKey', specialValue);

      const result = storage.get('specialKey');

      expect(result).toBe(specialValue);
    });
  });

  describe('clear', () => {
    it('should clear all localStorage items', () => {
      storage.set('key1', 'value1');
      storage.set('key2', 'value2');
      storage.set('key3', 'value3');

      storage.clear();

      expect(storage.get('key1')).toBeNull();
      expect(storage.get('key2')).toBeNull();
      expect(storage.get('key3')).toBeNull();
      expect(localStorage.length).toBe(0);
    });

    it('should work when storage is already empty', () => {
      storage.clear();

      expect(localStorage.length).toBe(0);
    });

    it('should allow setting values after clear', () => {
      storage.set('key1', 'value1');
      storage.clear();
      storage.set('key2', 'value2');

      expect(storage.get('key2')).toBe('value2');
    });
  });

  describe('integration', () => {
    it('should handle full workflow', () => {
      storage.set('user', { name: 'John', email: 'john@example.com' });
      const user = storage.get('user');

      expect(user).toEqual({ name: 'John', email: 'john@example.com' });

      storage.set('user', { name: 'Jane', email: 'jane@example.com' });
      const updatedUser = storage.get('user');

      expect(updatedUser).toEqual({ name: 'Jane', email: 'jane@example.com' });

      storage.clear();
      const clearedUser = storage.get('user');

      expect(clearedUser).toBeNull();
    });

    it('should handle multiple keys simultaneously', () => {
      storage.set('key1', 'value1');
      storage.set('key2', 'value2');
      storage.set('key3', 'value3');

      expect(storage.get('key1')).toBe('value1');
      expect(storage.get('key2')).toBe('value2');
      expect(storage.get('key3')).toBe('value3');
    });

    it('should handle rapid consecutive operations', () => {
      for (let i = 0; i < 100; i++) {
        storage.set(`key${i}`, `value${i}`);
      }

      for (let i = 0; i < 100; i++) {
        expect(storage.get(`key${i}`)).toBe(`value${i}`);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      storage.set('longKey', longString);

      const result = storage.get('longKey');

      expect(result).toBe(longString);
    });

    it('should handle deeply nested objects', () => {
      const deepObj = { a: { b: { c: { d: { e: { f: 'deep' } } } } } };
      storage.set('deepKey', deepObj);

      const result = storage.get('deepKey');

      expect(result).toEqual(deepObj);
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      storage.set('largeArray', largeArray);

      const result = storage.get('largeArray');

      expect(result).toEqual(largeArray);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🌍 مرحبا بالعالم';
      storage.set('unicodeKey', unicode);

      const result = storage.get('unicodeKey');

      expect(result).toBe(unicode);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      storage.set('dateKey', date);

      const result = storage.get('dateKey');

      expect(result).toBe(date.toJSON());
    });

    it('should handle objects with functions (functions are lost)', () => {
      const objWithFunc = {
        name: 'test',
        method: function () {
          return 'hello';
        },
      };
      storage.set('funcKey', objWithFunc);

      const result = storage.get('funcKey');

      expect(result.name).toBe('test');
      expect(result.method).toBeUndefined();
    });

    it('should handle circular references gracefully', () => {
      const circular = { name: 'test' };
      circular.self = circular;

      expect(() => storage.set('circular', circular)).toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('corrupted', 'not-valid-json');

      const result = storage.get('corrupted');

      expect(result).toBeNull();
    });

    it('should handle empty key', () => {
      storage.set('', 'value');

      const result = storage.get('');

      expect(result).toBe('value');
    });

    it('should handle whitespace-only key', () => {
      storage.set('   ', 'value');

      const result = storage.get('   ');

      expect(result).toBe('value');
    });
  });

  describe('type preservation', () => {
    it('should preserve number type', () => {
      storage.set('numKey', 42);

      const result = storage.get('numKey');

      expect(typeof result).toBe('number');
      expect(result).toBe(42);
    });

    it('should preserve boolean type', () => {
      storage.set('boolKey', true);

      const result = storage.get('boolKey');

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should preserve array type', () => {
      storage.set('arrKey', [1, 2, 3]);

      const result = storage.get('arrKey');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should preserve object type', () => {
      storage.set('objKey', { a: 1 });

      const result = storage.get('objKey');

      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });
  });
});
