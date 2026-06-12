import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../config/logger.js';
import crypto from 'crypto';
import path from 'path';

/**
 * S3 Service for cloud storage
 * Supports AWS S3, DigitalOcean Spaces, MinIO, and S3-compatible services
 */
class S3Service {
  constructor() {
    this.enabled = process.env.USE_S3_STORAGE === 'true';
    this.maxRetries = 3;
    
    if (this.enabled) {
      this.client = new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT, // For S3-compatible services
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        },
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' // Required for MinIO
      });

      this.bucket = process.env.S3_BUCKET_NAME;
      this.cdnUrl = process.env.S3_CDN_URL; // Optional CDN URL
      
      logger.info('S3 storage service initialized');
    } else {
      logger.info('S3 storage disabled - using local filesystem');
    }
  }

  /**
   * Retry wrapper with exponential backoff
   * @param {Function} operation - Async operation to retry
   * @param {string} operationName - Name for logging
   * @param {Object} context - Context data for logging
   */
  async retryWithBackoff(operation, operationName, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug(`S3 ${operationName} attempt ${attempt}/${this.maxRetries}`, context);
        
        const result = await operation();
        
        if (attempt > 1) {
          logger.info(`S3 ${operationName} succeeded after ${attempt} attempts`, context);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          
          logger.warn(`S3 ${operationName} failed (attempt ${attempt}/${this.maxRetries}), retrying in ${delayMs}ms`, {
            ...context,
            error: error.message,
            attempt
          });
          
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          logger.error(`S3 ${operationName} failed after ${this.maxRetries} attempts`, {
            ...context,
            error: error.message,
            stack: error.stack
          });
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Upload file to S3 with retry logic
   */
  async upload(file, folder = 'uploads') {
    if (!this.enabled) {
      throw new Error('S3 storage is not enabled');
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const key = `${folder}/${filename}`;

    const context = { key, filename, size: file.size, mimetype: file.mimetype };

    return this.retryWithBackoff(
      async () => {
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
          CacheControl: 'max-age=31536000',
          Metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString()
          }
        });

        await this.client.send(command);

        const url = this.getPublicUrl(key);
        logger.info('File uploaded to S3', { key, url });

        return {
          key,
          url,
          filename,
          size: file.size,
          mimetype: file.mimetype
        };
      },
      'upload',
      context
    ).catch(error => {
      // Fail-safe: ensure error is properly wrapped
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    });
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(files, folder = 'uploads') {
    return Promise.all(files.map(file => this.upload(file, folder)));
  }

  /**
   * Delete file from S3 with retry logic
   */
  async delete(key) {
    if (!this.enabled) {
      return;
    }

    const context = { key };

    return this.retryWithBackoff(
      async () => {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key
        });

        await this.client.send(command);
        logger.info('File deleted from S3', { key });
      },
      'delete',
      context
    ).catch(error => {
      // Fail-safe: log but don't throw for delete operations
      logger.error(`Failed to delete file from S3(non-blocking): ${error.message}`, context);
    });
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(keys) {
    return Promise.all(keys.map(key => this.delete(key)));
  }

  /**
   * Generate presigned URL for temporary access with retry logic
   */
  async getPresignedUrl(key, expiresIn = 3600) {
    if (!this.enabled) {
      throw new Error('S3 storage is not enabled');
    }

    const context = { key, expiresIn };

    return this.retryWithBackoff(
      async () => {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key
        });

        const url = await getSignedUrl(this.client, command, { expiresIn });
        return url;
      },
      'getPresignedUrl',
      context
    ).catch(error => {
      // Fail-safe: ensure error is properly wrapped
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    });
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(key) {
    // Use CDN URL if configured
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }

    // Use S3 endpoint URL
    if (process.env.S3_ENDPOINT) {
      return `${process.env.S3_ENDPOINT}/${this.bucket}/${key}`;
    }

    // Default AWS S3 URL
    return `https://${this.bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Check if S3 is enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const s3Service = new S3Service();
