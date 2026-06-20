import { jest } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearDatabase } from '../helpers/testUtils.js';
import { validateFile } from '../../src/services/fileValidation.service.js';

describe('File upload validation', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDB();
  });
  afterAll(async () => {
    await clearDatabase();
    await teardownTestDB();
  });

  it('rejects files with spoofed mime types', async () => {
    const fakeFile = { originalname: 'hack.png', mimetype: 'image/png', buffer: Buffer.from('%PDF-1.4') };
    await expect(validateFile(fakeFile)).rejects.toThrow();
  });

  it('accepts small valid images', async () => {
    const smallImage = { originalname: 'img.jpg', mimetype: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) };
    await expect(validateFile(smallImage)).resolves.toBeTruthy();
  });
});

