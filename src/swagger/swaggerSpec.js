const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BuildSpace API Docs',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3333/api',
        description: 'Development server',
      },
    ],
  },
  apis: [path.join(__dirname, '../routes/*.js')], // ✅ relative to this file
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
