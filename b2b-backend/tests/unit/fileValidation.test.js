import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fileValidation from '../../src/services/fileValidation.service.js';
import fs from 'fs';
import path from 'path';

describe('File Validation Service - Unit Tests', () => {
  describe('validateFileUpload()', () => {
    it('should accept valid image file', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024 * 500, // 500 KB
        originalname: 'test-image.jpg',
        buffer: Buffer.from('fake image data'),
      };

      const result = await fileValidation.validateFileUpload(file, {
        allowedTypes: ['image/jpeg', 'image/png'],
        maxSize: 5 * 1024 * 1024, // 5 MB
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject file exceeding size limit', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10 MB
        originalname: 'large-image.jpg',
      };

      const result = await fileValidation.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5 MB limit
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('size'))).toBe(true);
    });

    it('should reject disallowed file type', async () => {
      const file = {
        mimetype: 'application/x-executable',
        size: 1024,
        originalname: 'malware.exe',
      };

      const result = await fileValidation.validateFileUpload(file, {
        allowedTypes: ['image/jpeg', 'image/png'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('type'))).toBe(true);
    });

    it('should reject blocked file extensions', async () => {
      const blockedExtensions = ['.exe', '.bat', '.sh', '.cmd'];

      for (const ext of blockedExtensions) {
        const file = {
          mimetype: 'application/octet-stream',
          size: 1024,
          originalname: `file${ext}`,
        };

        const result = await fileValidation.validateFileUpload(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('extension'))).toBe(true);
      }
    });

    it('should validate magic numbers for images', async () => {
      // JPEG magic number: FF D8 FF
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

      const file = {
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'image.jpg',
        buffer: jpegBuffer,
      };

      const result = await fileValidation.validateFileUpload(file, {
        checkMagicNumbers: true,
      });

      expect(result.isValid).toBe(true);
    });

    it('should detect MIME type mismatch', async () => {
      // PNG magic number but claiming to be JPEG
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);

      const file = {
        mimetype: 'image/jpeg', // Wrong mimetype
        size: 1024,
        originalname: 'fake.jpg',
        buffer: pngBuffer,
      };

      const result = await fileValidation.validateFileUpload(file, {
        checkMagicNumbers: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('mismatch'))).toBe(true);
    });

    it('should reject empty file', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 0,
        originalname: 'empty.jpg',
      };

      const result = await fileValidation.validateFileUpload(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('empty'))).toBe(true);
    });

    it('should reject file with no extension', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'noextension',
      };

      const result = await fileValidation.validateFileUpload(file, {
        requireExtension: true,
      });

      expect(result.isValid).toBe(false);
    });

    it('should sanitize dangerous filenames', async () => {
      const dangerousNames = [
        '../../../etc/passwd',
        'file;rm -rf /',
        'test<script>.jpg',
        'null\x00byte.jpg',
      ];

      for (const name of dangerousNames) {
        const file = {
          mimetype: 'image/jpeg',
          size: 1024,
          originalname: name,
        };

        const result = await fileValidation.validateFileUpload(file);
        expect(result.sanitizedFilename).not.toContain('..');
        expect(result.sanitizedFilename).not.toContain('<');
        expect(result.sanitizedFilename).not.toContain('\x00');
      }
    });
  });

  describe('sanitizeFilename()', () => {
    it('should remove path traversal attempts', () => {
      const dangerous = '../../../etc/passwd';
      const safe = fileValidation.sanitizeFilename(dangerous);

      expect(safe).not.toContain('..');
      expect(safe).not.toContain('/');
    });

    it('should remove special characters', () => {
      const dangerous = 'file:name<script>test.jpg';
      const safe = fileValidation.sanitizeFilename(dangerous);

      expect(safe).not.toContain('<');
      expect(safe).not.toContain('>');
      expect(safe).not.toContain(':');
    });

    it('should handle Unicode characters', () => {
      const unicode = 'файл名前.jpg';
      const safe = fileValidation.sanitizeFilename(unicode);

      expect(safe).toBeDefined();
      expect(safe.length).toBeGreaterThan(0);
    });

    it('should preserve valid filename', () => {
      const valid = 'my-document_2024.pdf';
      const safe = fileValidation.sanitizeFilename(valid);

      expect(safe).toBe(valid);
    });

    it('should handle very long filenames', () => {
      const longName = 'a'.repeat(300) + '.jpg';
      const safe = fileValidation.sanitizeFilename(longName);

      expect(safe.length).toBeLessThanOrEqual(255); // Max filename length
    });

    it('should generate unique name if original is too dangerous', () => {
      const dangerous = '../../../../';
      const safe = fileValidation.sanitizeFilename(dangerous);

      expect(safe).toBeDefined();
      expect(safe).toMatch(/^file-[a-z0-9]+$/);
    });
  });

  describe('basicMalwareCheck()', () => {
    it('should detect suspicious file signatures', () => {
      // Windows executable magic number
      const exeBuffer = Buffer.from([0x4d, 0x5a]); // MZ header

      const result = fileValidation.basicMalwareCheck(exeBuffer);

      expect(result.suspicious).toBe(true);
      expect(result.reason).toContain('executable');
    });

    it('should detect script injection attempts', () => {
      const scriptBuffer = Buffer.from('<script>alert("XSS")</script>');

      const result = fileValidation.basicMalwareCheck(scriptBuffer);

      expect(result.suspicious).toBe(true);
      expect(result.reason).toContain('script');
    });

    it('should accept normal image file', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      const result = fileValidation.basicMalwareCheck(jpegBuffer);

      expect(result.suspicious).toBe(false);
    });

    it('should detect embedded executables in images', () => {
      // Image with embedded EXE
      const poisonedImage = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]), // JPEG header
        Buffer.from([0x4d, 0x5a]), // EXE header embedded
      ]);

      const result = fileValidation.basicMalwareCheck(poisonedImage);

      expect(result.suspicious).toBe(true);
    });

    it('should detect macro-enabled Office files', () => {
      // Office Open XML with macros
      const macroBuffer = Buffer.from('vbaProject.bin');

      const result = fileValidation.basicMalwareCheck(macroBuffer);

      expect(result.suspicious).toBe(true);
      expect(result.reason).toContain('macro');
    });
  });

  describe('File Type Detection', () => {
    it('should detect JPEG by magic number', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff]);
      const type = fileValidation.detectFileType(jpegBuffer);

      expect(type).toBe('image/jpeg');
    });

    it('should detect PNG by magic number', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const type = fileValidation.detectFileType(pngBuffer);

      expect(type).toBe('image/png');
    });

    it('should detect PDF by magic number', () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
      const type = fileValidation.detectFileType(pdfBuffer);

      expect(type).toBe('application/pdf');
    });

    it('should detect ZIP archive', () => {
      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const type = fileValidation.detectFileType(zipBuffer);

      expect(type).toBe('application/zip');
    });

    it('should return unknown for unrecognized type', () => {
      const unknownBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const type = fileValidation.detectFileType(unknownBuffer);

      expect(type).toBe('application/octet-stream');
    });
  });

  describe('Image Validation', () => {
    it('should validate image dimensions', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'test.jpg',
        width: 1920,
        height: 1080,
      };

      const result = await fileValidation.validateImageDimensions(file, {
        maxWidth: 2000,
        maxHeight: 2000,
      });

      expect(result.isValid).toBe(true);
    });

    it('should reject oversized images', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'large.jpg',
        width: 5000,
        height: 5000,
      };

      const result = await fileValidation.validateImageDimensions(file, {
        maxWidth: 2000,
        maxHeight: 2000,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('dimensions'))).toBe(true);
    });

    it('should enforce aspect ratio', async () => {
      const file = {
        width: 1920,
        height: 1080,
      };

      const result = await fileValidation.validateImageDimensions(file, {
        aspectRatio: 16 / 9,
        aspectRatioTolerance: 0.1,
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe('Security & Edge Cases', () => {
    it('should handle null file', async () => {
      const result = await fileValidation.validateFileUpload(null);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('No file'))).toBe(true);
    });

    it('should handle missing buffer', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'test.jpg',
        // No buffer
      };

      const result = await fileValidation.validateFileUpload(file, {
        checkMagicNumbers: true,
      });

      // Should skip magic number check if no buffer
      expect(result).toBeDefined();
    });

    it('should handle concurrent uploads', async () => {
      const files = Array(10)
        .fill()
        .map((_, i) => ({
          mimetype: 'image/jpeg',
          size: 1024,
          originalname: `file${i}.jpg`,
        }));

      const promises = files.map((file) =>
        fileValidation.validateFileUpload(file)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toHaveProperty('isValid');
      });
    });

    it('should detect polyglot files', async () => {
      // File that's valid as both JPEG and ZIP
      const polyglot = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]), // JPEG header
        Buffer.from('some data'),
        Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP header
      ]);

      const file = {
        mimetype: 'image/jpeg',
        size: polyglot.length,
        originalname: 'polyglot.jpg',
        buffer: polyglot,
      };

      const result = await fileValidation.validateFileUpload(file, {
        checkPolyglot: true,
      });

      expect(result.suspicious).toBe(true);
    });

    it('should handle corrupted files gracefully', async () => {
      const corruptedBuffer = Buffer.from([0xff, 0xff, 0xff]);

      const file = {
        mimetype: 'image/jpeg',
        size: corruptedBuffer.length,
        originalname: 'corrupted.jpg',
        buffer: corruptedBuffer,
      };

      const result = await fileValidation.validateFileUpload(file);
      expect(result).toBeDefined();
    });
  });
});
