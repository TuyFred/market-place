import { env } from './env.js';

export const swaggerConfig = {
  openapi: {
    info: {
      title: env.APP_NAME,
      description: 'API for shoes, bags, and electronics e-commerce app',
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

