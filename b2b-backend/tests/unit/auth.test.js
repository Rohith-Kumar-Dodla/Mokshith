import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as authService from '../../src/modules/auth/auth.service.js';
import * as authRepo from '../../src/modules/auth/auth.repository.js';
import { hashPassword } from '../../src/utils/hashPassword.js';
import { comparePassword } from '../../src/utils/comparePassword.js';
import AppError from '../../src/errors/AppError.js';

// Mock dependencies
jest.mock('../../src/modules/auth/auth.repository.js');
jest.mock('../../src/utils/hashPassword.js');
jest.mock('../../src/utils/comparePassword.js');
jest.mock('../../src/modules/settings/settings.service.js');
jest.mock('../../src/modules/credit/credit.service.js');

describe('Authentication Service - Critical Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('should register a new user with hashed password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        mobile: '1234567890',
        password: 'Test@1234',
        name: 'Test User'
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');
      authRepo.createUser.mockResolvedValue({
        _id: 'user123',
        ...userData,
        password: 'hashedPassword123',
        status: 'PENDING'
      });

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(authRepo.createUser).toHaveBeenCalledWith({
        ...userData,
        password: 'hashedPassword123',
        status: 'PENDING'
      });
      expect(result).toHaveProperty('_id');
      expect(result.status).toBe('PENDING');
    });

    it('should reject duplicate email registration', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        mobile: '1234567890',
        password: 'Test@1234'
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue({ email: 'existing@example.com' });

      // Act & Assert
      await expect(authService.register(userData))
        .rejects
        .toThrow('Email already registered');
    });

    it('should reject duplicate mobile registration', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        mobile: '9876543210',
        password: 'Test@1234'
      };

      authRepo.findUserByEmailOrMobile
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce({ mobile: '9876543210' }); // Mobile check

      // Act & Assert
      await expect(authService.register(userData))
        .rejects
        .toThrow('Mobile number already registered');
    });
  });

  describe('loginWithPassword()', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const credentials = {
        identifier: 'test@example.com',
        password: 'Test@1234'
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'B2B_CUSTOMER',
        status: 'ACTIVE'
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      authRepo.updateUser.mockResolvedValue({});

      // Act
      const result = await authService.loginWithPassword(credentials);

      // Assert
      expect(authRepo.findUserByEmailOrMobile).toHaveBeenCalledWith(credentials.identifier);
      expect(comparePassword).toHaveBeenCalledWith(credentials.password, mockUser.password);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should reject login for non-existent user', async () => {
      // Arrange
      authRepo.findUserByEmailOrMobile.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.loginWithPassword({
        identifier: 'nonexistent@example.com',
        password: 'Test@1234'
      }))
        .rejects
        .toThrow('User not found');
    });

    it('should reject login with incorrect password', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'B2B_CUSTOMER',
        status: 'ACTIVE'
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.loginWithPassword({
        identifier: 'test@example.com',
        password: 'WrongPassword'
      }))
        .rejects
        .toThrow('Invalid credentials');
    });

    it('should reject login for pending user', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'B2B_CUSTOMER',
        status: 'PENDING' // Not ACTIVE
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.loginWithPassword({
        identifier: 'test@example.com',
        password: 'Test@1234'
      }))
        .rejects
        .toThrow('pending admin approval');
    });

    it('should reject login for suspended user', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'B2B_CUSTOMER',
        status: 'SUSPENDED'
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.loginWithPassword({
        identifier: 'test@example.com',
        password: 'Test@1234'
      }))
        .rejects
        .toThrow('inactive or suspended');
    });
  });

  describe('sendOTP()', () => {
    it('should generate and store OTP for existing user', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com'
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue(mockUser);
      authRepo.updateUser.mockResolvedValue({});

      // Act
      const otp = await authService.sendOTP('test@example.com');

      // Assert
      expect(otp).toMatch(/^\d{6}$/); // Should be 6-digit number
      expect(authRepo.updateUser).toHaveBeenCalledWith(
        mockUser._id,
        expect.objectContaining({
          otp: expect.objectContaining({
            code: otp,
            expiresAt: expect.any(Number)
          })
        })
      );
    });

    it('should reject OTP request for non-existent user', async () => {
      // Arrange
      authRepo.findUserByEmailOrMobile.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.sendOTP('nonexistent@example.com'))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('verifyOTP()', () => {
    it('should verify valid OTP and return tokens', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'B2B_CUSTOMER',
        status: 'ACTIVE',
        otp: {
          code: '123456',
          expiresAt: Date.now() + 300000 // Valid for 5 minutes
        }
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue(mockUser);
      authRepo.updateUser.mockResolvedValue({});

      // Act
      const result = await authService.verifyOTP({
        identifier: 'test@example.com',
        otp: '123456'
      });

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(authRepo.updateUser).toHaveBeenCalledWith(
        mockUser._id,
        expect.objectContaining({
          otp: null,
          isVerified: true
        })
      );
    });

    it('should reject invalid OTP', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        otp: {
          code: '123456',
          expiresAt: Date.now() + 300000
        }
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.verifyOTP({
        identifier: 'test@example.com',
        otp: '654321' // Wrong OTP
      }))
        .rejects
        .toThrow('Invalid OTP');
    });

    it('should reject expired OTP', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        otp: {
          code: '123456',
          expiresAt: Date.now() - 1000 // Expired
        }
      };

      authRepo.findUserByEmailOrMobile.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.verifyOTP({
        identifier: 'test@example.com',
        otp: '123456'
      }))
        .rejects
        .toThrow('OTP expired');
    });
  });
});
