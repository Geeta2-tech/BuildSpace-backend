# Project Setup Guide

## Required Dependencies

Install the following npm packages for the project:

```bash
npm install crypto bcrypt jsonwebtoken joi winston dotenv multer
```

### Package Overview

- **crypto**: Built-in Node.js cryptographic functionality
- **bcrypt**: Password hashing library
- **jsonwebtoken**: JWT token generation and verification
- **joi**: Data validation library
- **winston**: Logging library
- **dotenv**: Environment variable management
- **multer**: File upload middleware

## Logger Configuration

### Setup

The logger is configured using Winston and can be imported from the utils directory:

```javascript
const logger = require('./utils/loggers');
```



### Log Levels

- **info**: General information messages
- **warn**: Warning messages for potential issues
- **error**: Error messages for failures
- **debug**: Detailed debug information

## File Upload Configuration

### Installation

Multer is used for handling file uploads:

```bash
npm install multer
```

### Middleware Setup

File upload middleware is located at:
```
/middlewares/upload.js
```

### Upload Path

Pictures are uploaded and saved to the backend folder structure. The exact path configuration should be defined in the upload middleware.

## Utility Functions

### Available Utils

The project includes several utility modules in the `utils/` directory:

```javascript
// Logger utility
const logger = require('./utils/loggers');

// Encryption utility
const encryption = require('./utils/encryption');

// Validation utility
const validators = require('./utils/validators');
```

### Usage Examples

#### Logger
```javascript
logger.info('User logged in successfully');
logger.warn('API rate limit approaching');
logger.error('Database connection failed');
logger.debug('Debug information');
```

#### Encryption
```javascript
// Example usage (implement according to your needs)
// Password hashing with bcrypt
const hashedPassword = await encryption.hashPassword(plainPassword);
const isValid = await encryption.comparePassword(plainPassword, hashedPassword);

// JWT token operations
const token = encryption.generateToken(payload, expiresIn);
const decoded = encryption.verifyToken(token);
const refreshToken = encryption.generateRefreshToken(payload);

// Crypto utilities
const encrypted = encryption.encrypt(data, secretKey);
const decrypted = encryption.decrypt(encryptedData, secretKey);
const hash = encryption.createHash(data);
```

#### Validators
```javascript
// Example usage with Joi validation schemas
const { error, value } = validators.userSchema.validate(userData);
if (error) {
    logger.error('Validation failed:', error.details);
}
```

## Project Structure

```
project/
├── middlewares/
│   └── upload.js          # File upload middleware
├── utils/
│   ├── loggers.js         # Logger configuration
│   ├── encryption.js      # Encryption utilities
│   └── validators.js      # Joi validation schemas
├── uploads/               # File storage directory (suggested)
└── README.md             # This file
```


