import { env } from './env.js';

export const swaggerConfig = {
  openapi: {
    info: {
      title: env.APP_NAME,
      description: 'API for AFROLUXO — African-inspired fashion e-commerce',
      version: env.APP_VERSION
    },
    servers: [
      {
        url: '/api',
        description: 'Main API'
      }
    ]
  }
};

