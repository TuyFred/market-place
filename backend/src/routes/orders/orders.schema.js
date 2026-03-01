import { errorResponseSchema } from '../../schemas/error.schema.js';

export const createOrderSchema = {
  tags: ['Orders'],
  body: {
    type: 'object',
    required: ['name', 'phone', 'address', 'productId'],
    properties: {
      name: { type: 'string' },
      phone: { type: 'string' },
      address: { type: 'string' },
      productId: { type: 'string' },
      notes: { type: 'string' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    400: errorResponseSchema
  }
};

export const listOrdersSchema = {
  tags: ['Orders'],
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          customer_name: { type: 'string' },
          customer_phone: { type: 'string' },
          customer_address: { type: 'string' },
          created_at: { type: 'string' }
        }
      }
    },
    500: errorResponseSchema
  }
};

