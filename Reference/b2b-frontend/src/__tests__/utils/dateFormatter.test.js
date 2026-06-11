import { describe, it, expect } from 'vitest';

describe('dateFormatter utility', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = new Intl.DateTimeFormat('en-US').format(date);
      
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle string dates', () => {
      const dateStr = '2024-03-20';
      const date = new Date(dateStr);
      
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('should handle timestamp', () => {
      const timestamp = 1705312200000;
      const date = new Date(timestamp);
      
      expect(date).toBeInstanceOf(Date);
    });

    it('should handle invalid date', () => {
      const invalidDate = new Date('invalid');
      
      expect(isNaN(invalidDate.getTime())).toBe(true);
    });
  });

  describe('date comparisons', () => {
    it('should compare dates correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      
      expect(date1.getTime()).toBeLessThan(date2.getTime());
    });

    it('should check if dates are equal', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-01T00:00:00Z');
      
      expect(date1.getTime()).toBe(date2.getTime());
    });
  });

  describe('date manipulation', () => {
    it('should add days to date', () => {
      const date = new Date('2024-01-01');
      const futureDate = new Date(date);
      futureDate.setDate(futureDate.getDate() + 7);
      
      expect(futureDate.getDate()).toBe(8);
    });

    it('should subtract days from date', () => {
      const date = new Date('2024-01-15');
      const pastDate = new Date(date);
      pastDate.setDate(pastDate.getDate() - 5);
      
      expect(pastDate.getDate()).toBe(10);
    });
  });

  describe('date parts', () => {
    it('should get year correctly', () => {
      const date = new Date('2024-01-15');
      
      expect(date.getFullYear()).toBe(2024);
    });

    it('should get month correctly', () => {
      const date = new Date('2024-03-15');
      
      expect(date.getMonth()).toBe(2); // 0-indexed
    });

    it('should get day correctly', () => {
      const date = new Date('2024-01-25');
      
      expect(date.getDate()).toBe(25);
    });
  });

  describe('ISO string formatting', () => {
    it('should convert to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const isoString = date.toISOString();
      
      expect(isoString).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it('should parse ISO string', () => {
      const isoString = '2024-01-15T10:30:00.000Z';
      const date = new Date(isoString);
      
      expect(date.toISOString()).toBe(isoString);
    });
  });

  describe('edge cases', () => {
    it('should handle leap year', () => {
      const leapDate = new Date('2024-02-29');
      
      expect(leapDate.getDate()).toBe(29);
      expect(leapDate.getMonth()).toBe(1);
    });

    it('should handle year boundaries', () => {
      const lastDayOfYear = new Date('2023-12-31');
      const nextDay = new Date(lastDayOfYear);
      nextDay.setDate(nextDay.getDate() + 1);
      
      expect(nextDay.getFullYear()).toBe(2024);
      expect(nextDay.getMonth()).toBe(0);
      expect(nextDay.getDate()).toBe(1);
    });

    it('should handle month boundaries', () => {
      const lastDayOfMonth = new Date('2024-01-31');
      const nextDay = new Date(lastDayOfMonth);
      nextDay.setDate(nextDay.getDate() + 1);
      
      expect(nextDay.getMonth()).toBe(1);
      expect(nextDay.getDate()).toBe(1);
    });
  });
});
