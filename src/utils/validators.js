// src/utils/validators.js
const Joi = require('joi');

// Base validation schemas
const baseSchemas = {
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  name: Joi.string().min(2).max(50).required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  url: Joi.string().uri().optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  date: Joi.date().iso().optional(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }
};

// User validation schemas
const userValidation = {
  register: Joi.object({
    name: baseSchemas.name,
    email: baseSchemas.email,
    password: baseSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  }),
  
  login: Joi.object({
    email: baseSchemas.email,
    password: Joi.string().required(),
  }),
  
  updateProfile: Joi.object({
    name: baseSchemas.name.optional(),
    email: baseSchemas.email.optional(),
    phone: baseSchemas.phone,
    bio: Joi.string().max(500).optional(),
    avatar: Joi.string().uri().optional(),
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: baseSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
  }),
};

// Workspace validation schemas
const workspaceValidation = {
  create: Joi.object({
    name: baseSchemas.title,
    description: baseSchemas.description,
    isPublic: Joi.boolean().default(false),
    settings: Joi.object({
      allowComments: Joi.boolean().default(true),
      allowSharing: Joi.boolean().default(true),
      defaultPermission: Joi.string().valid('view', 'comment', 'edit').default('view')
    }).optional()
  }),
  
  update: Joi.object({
    name: baseSchemas.title.optional(),
    description: baseSchemas.description,
    isPublic: Joi.boolean().optional(),
    settings: Joi.object().optional()
  }),
  
  invite: Joi.object({
    email: baseSchemas.email,
    permission: Joi.string().valid('view', 'comment', 'edit', 'admin').required(),
    message: Joi.string().max(500).optional()
  })
};

// Page validation schemas
const pageValidation = {
  create: Joi.object({
    title: baseSchemas.title,
    workspaceId: baseSchemas.id,
    parentId: baseSchemas.id.optional(),
    template: Joi.string().optional(),
    properties: Joi.object().optional()
  }),
  
  update: Joi.object({
    title: baseSchemas.title.optional(),
    content: Joi.array().items(Joi.object()).optional(),
    properties: Joi.object().optional(),
    isPublished: Joi.boolean().optional()
  }),
  
  move: Joi.object({
    parentId: baseSchemas.id.optional(),
    position: Joi.number().integer().min(0).optional()
  })
};

// Block validation schemas
const blockValidation = {
  create: Joi.object({
    type: Joi.string().valid(
      'text', 'heading', 'list', 'image', 'video', 'file', 
      'code', 'quote', 'divider', 'table', 'database'
    ).required(),
    content: Joi.alternatives().try(
      Joi.string(),
      Joi.object(),
      Joi.array()
    ).required(),
    pageId: baseSchemas.id,
    position: Joi.number().integer().min(0).default(0)
  }),
  
  update: Joi.object({
    content: Joi.alternatives().try(
      Joi.string(),
      Joi.object(),
      Joi.array()
    ).optional(),
    properties: Joi.object().optional()
  }),
  
  reorder: Joi.object({
    blocks: Joi.array().items(
      Joi.object({
        id: baseSchemas.id,
        position: Joi.number().integer().min(0)
      })
    ).required()
  })
};

// File validation schemas
const fileValidation = {
  upload: Joi.object({
    originalName: Joi.string().required(),
    mimeType: Joi.string().required(),
    size: Joi.number().integer().max(50 * 1024 * 1024), // 50MB limit
    workspaceId: baseSchemas.id.optional()
  })
};

// Comment validation schemas
const commentValidation = {
  create: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    pageId: baseSchemas.id.optional(),
    blockId: baseSchemas.id.optional(),
    parentId: baseSchemas.id.optional()
  }).or('pageId', 'blockId'),
  
  update: Joi.object({
    content: Joi.string().min(1).max(1000).required()
  })
};

// Search validation schemas
const searchValidation = {
  query: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    type: Joi.string().valid('all', 'pages', 'blocks', 'files', 'comments').default('all'),
    workspaceId: baseSchemas.id.optional(),
    ...baseSchemas.pagination
  })
};

// Generic validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    req[property] = value;
    next();
  };
};

// Validation helpers
const validationHelpers = {
  isValidObjectId: (id) => {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  },
  
  isValidEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  sanitizeHtml: (html) => {
    // Basic HTML sanitization - use a library like DOMPurify in production
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  },
  
  validateFileType: (mimetype, allowedTypes) => {
    return allowedTypes.includes(mimetype);
  },
  
  validateFileSize: (size, maxSize = 50 * 1024 * 1024) => {
    return size <= maxSize;
  }
};

module.exports = {
  baseSchemas,
  userValidation,
  workspaceValidation,
  pageValidation,
  blockValidation,
  fileValidation,
  commentValidation,
  searchValidation,
  validate,
  validationHelpers
};