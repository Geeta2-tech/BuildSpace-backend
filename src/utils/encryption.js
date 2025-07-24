// src/utils/encryption.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Encryption Configuration
 */
const config = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltRounds: 12,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  encryptionKey: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
};

/**
 * Password Hashing Functions
 */
const passwordUtils = {
  /**
   * Hash a password using bcrypt
   */
  hash: async (password) => {
    try {
      const salt = await bcrypt.genSalt(config.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  },

  /**
   * Verify a password against its hash
   */
  verify: async (password, hash) => {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Password verification failed');
    }
  },

  /**
   * Generate a secure random password
   */
  generate: (length = 12) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each category
    const categories = [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      '!@#$%^&*'
    ];
    
    categories.forEach(category => {
      password += category.charAt(crypto.randomInt(0, category.length));
    });
    
    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(crypto.randomInt(0, charset.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
};

/**
 * Data Encryption/Decryption Functions
 */
const dataEncryption = {
  /**
   * Encrypt sensitive data
   */
  encrypt: (text) => {
    try {
      const key = Buffer.from(config.encryptionKey, 'hex');
      const iv = crypto.randomBytes(config.ivLength);
      const cipher = crypto.createCipher(config.algorithm, key);
      cipher.setAAD(Buffer.from('additional-data'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      throw new Error('Encryption failed');
    }
  },

  /**
   * Decrypt sensitive data
   */
  decrypt: (encryptedData) => {
    try {
      const key = Buffer.from(config.encryptionKey, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      const decipher = crypto.createDecipher(config.algorithm, key);
      decipher.setAAD(Buffer.from('additional-data'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  },

  /**
   * Simple encrypt for less sensitive data
   */
  simpleEncrypt: (text) => {
    const key = crypto.scryptSync(config.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  },

  /**
   * Simple decrypt for less sensitive data
   */
  simpleDecrypt: (encryptedText) => {
    const [ivHex, encrypted] = encryptedText.split(':');
    const key = crypto.scryptSync(config.encryptionKey, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
};

/**
 * JWT Token Functions
 */
const tokenUtils = {
  /**
   * Generate access token
   */
  generateAccessToken: (payload, expiresIn = '15m') => {
    try {
      return jwt.sign(payload, config.jwtSecret, { 
        expiresIn,
        issuer: 'your-app-name',
        audience: 'your-app-users'
      });
    } catch (error) {
      throw new Error('Access token generation failed');
    }
  },

  /**
   * Generate refresh token
   */
  generateRefreshToken: (payload, expiresIn = '7d') => {
    try {
      return jwt.sign(payload, config.jwtRefreshSecret, { 
        expiresIn,
        issuer: 'your-app-name',
        audience: 'your-app-users'
      });
    } catch (error) {
      throw new Error('Refresh token generation failed');
    }
  },

  /**
   * Verify access token
   */
  verifyAccessToken: (token) => {
    try {
      return jwt.verify(token, config.jwtSecret, {
        issuer: 'your-app-name',
        audience: 'your-app-users'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  },

  /**
   * Verify refresh token
   */
  verifyRefreshToken: (token) => {
    try {
      return jwt.verify(token, config.jwtRefreshSecret, {
        issuer: 'your-app-name',
        audience: 'your-app-users'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Refresh token verification failed');
    }
  },

  /**
   * Generate token pair (access + refresh)
   */
  generateTokenPair: (payload) => {
    const accessToken = tokenUtils.generateAccessToken(payload);
    const refreshToken = tokenUtils.generateRefreshToken({ 
      userId: payload.userId,
      tokenVersion: payload.tokenVersion || 0
    });
    
    return { accessToken, refreshToken };
  },

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken: (token) => {
    return jwt.decode(token, { complete: true });
  }
};

/**
 * Secure Random Generation
 */
const randomUtils = {
  /**
   * Generate secure random string
   */
  generateSecureRandom: (length = 32, encoding = 'hex') => {
    return crypto.randomBytes(length).toString(encoding);
  },

  /**
   * Generate random UUID
   */
  generateUUID: () => {
    return crypto.randomUUID();
  },

  /**
   * Generate random integer in range
   */
  randomInt: (min, max) => {
    return crypto.randomInt(min, max + 1);
  },

  /**
   * Generate secure API key
   */
  generateApiKey: (prefix = 'ak') => {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('hex');
    return `${prefix}_${timestamp}_${random}`;
  },

  /**
   * Generate OTP (One Time Password)
   */
  generateOTP: (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[crypto.randomInt(0, digits.length)];
    }
    return otp;
  }
};

/**
 * Hash Functions for Non-Password Data
 */
const hashUtils = {
  /**
   * Generate SHA-256 hash
   */
  sha256: (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  /**
   * Generate MD5 hash (for non-security purposes)
   */
  md5: (data) => {
    return crypto.createHash('md5').update(data).digest('hex');
  },

  /**
   * Generate HMAC
   */
  hmac: (data, secret = config.jwtSecret) => {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  },

  /**
   * Verify HMAC
   */
  verifyHmac: (data, hash, secret = config.jwtSecret) => {
    const expectedHash = hashUtils.hmac(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  },

  /**
   * Generate file hash for integrity checking
   */
  fileHash: (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
};

/**
 * Session Security
 */
const sessionUtils = {
  /**
   * Generate session ID
   */
  generateSessionId: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Generate CSRF token
   */
  generateCSRFToken: () => {
    return crypto.randomBytes(32).toString('base64');
  },

  /**
   * Verify CSRF token
   */
  verifyCSRFToken: (token, sessionToken) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(token, 'base64'),
        Buffer.from(sessionToken, 'base64')
      );
    } catch (error) {
      return false;
    }
  }
};

/**
 * Email Security
 */
const emailUtils = {
  /**
   * Generate email verification token
   */
  generateEmailToken: (email) => {
    const payload = {
      email: email.toLowerCase(),
      timestamp: Date.now(),
      random: crypto.randomBytes(16).toString('hex')
    };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });
  },

  /**
   * Verify email token
   */
  verifyEmailToken: (token) => {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      return {
        valid: true,
        email: payload.email,
        timestamp: payload.timestamp
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },

  /**
   * Generate password reset token
   */
  generatePasswordResetToken: (userId, email) => {
    const payload = {
      userId,
      email: email.toLowerCase(),
      purpose: 'password_reset',
      timestamp: Date.now()
    };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '2h' });
  }
};

module.exports = {
  passwordUtils,
  dataEncryption,
  tokenUtils,
  randomUtils,
  hashUtils,
  sessionUtils,
  emailUtils,
  config
};