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
      notes: { type: 'string' },
      paymentMethod: {
        type: 'string',
        enum: ['bank', 'mobile', 'paypal']
      },
      paymentReference: { type: 'string' },
      paymentStatus: {
        type: 'string',
        enum: ['awaiting_payment', 'payment_review', 'paid', 'rejected']
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      additionalProperties: true
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
        additionalProperties: true,
        properties: {
          id: { type: 'string' },
          customer_name: { type: 'string' },
          customer_phone: { type: 'string' },
          customer_address: { type: 'string' },
          created_at: { type: 'string' },
          status: { type: 'string' },
          payment_status: { type: 'string' },
          payment_method: { type: 'string' },
          payment_reference: { type: 'string' },
          proof_url: { type: 'string' }
        }
      }
    },
    500: errorResponseSchema
  }
};
