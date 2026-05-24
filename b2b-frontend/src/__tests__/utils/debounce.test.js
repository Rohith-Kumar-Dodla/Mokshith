import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, sanitizeInput } from '../../utils/debounce.js';

describe('debounce utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debounce', () => {
    it('should execute function after wait time', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test');

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous call if called again before wait time', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('first');
      vi.advanceTimersByTime(100);
      debouncedFn('second');
      vi.advanceTimersByTime(100);
      debouncedFn('third');

      vi.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should handle multiple arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 200);

      debouncedFn('arg1', 'arg2', 'arg3');

      vi.advanceTimersByTime(200);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should work with zero wait time', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn('test');

      vi.advanceTimersByTime(0);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      for (let i = 0; i < 10; i++) {
        debouncedFn(i);
        vi.advanceTimersByTime(50);
      }

      vi.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(9);
    });

    it('should execute multiple times if wait time passes between calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 200);

      debouncedFn('first');
      vi.advanceTimersByTime(200);

      debouncedFn('second');
      vi.advanceTimersByTime(200);

      debouncedFn('third');
      vi.advanceTimersByTime(200);

      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
      expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
      expect(mockFn).toHaveBeenNthCalledWith(3, 'third');
    });

    it('should handle function with no arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should preserve this context', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      const obj = { method: debouncedFn };
      obj.method('test');

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('test');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove angle brackets', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);

      expect(result).toBe('scriptalert("xss")/script');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeInput(input);

      expect(result).toBe('hello world');
    });

    it('should remove both < and >', () => {
      const input = '<div>content</div>';
      const result = sanitizeInput(input);

      expect(result).toBe('divcontent/div');
    });

    it('should return non-string inputs unchanged', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
      expect(sanitizeInput(true)).toBe(true);
    });

    it('should handle empty string', () => {
      const result = sanitizeInput('');

      expect(result).toBe('');
    });

    it('should handle string with only whitespace', () => {
      const result = sanitizeInput('   ');

      expect(result).toBe('');
    });

    it('should preserve other special characters', () => {
      const input = 'hello @ world & test!';
      const result = sanitizeInput(input);

      expect(result).toBe('hello @ world & test!');
    });

    it('should handle multiple angle brackets', () => {
      const input = '<<<test>>>';
      const result = sanitizeInput(input);

      expect(result).toBe('test');
    });

    it('should handle mixed content', () => {
      const input = '  <p>Hello</p> World  ';
      const result = sanitizeInput(input);

      expect(result).toBe('pHello/p World');
    });
  });

  describe('edge cases', () => {
    it('should handle objects', () => {
      const obj = { key: 'value' };
      expect(sanitizeInput(obj)).toBe(obj);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3];
      expect(sanitizeInput(arr)).toBe(arr);
    });

    it('should handle very long wait times', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 10000);

      debouncedFn('test');

      vi.advanceTimersByTime(9999);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
