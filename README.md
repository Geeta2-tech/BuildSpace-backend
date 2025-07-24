npm i crypto bcrypt jsonwebtoken joi winston dotenv
const logger = require('./utils/loggers');

// Basic logging
logger.info('User logged in successfully');
logger.warn('API rate limit approaching');
logger.error('Database connection failed');
logger.debug('Debug information');