import { errorResponseSchema } from '../../schemas/error.schema.js';

export const listProductsSchema = {
  tags: ['Products'],
  querystring: {
    type: 'object',
    properties: {
      category: { type: 'string' },
      search: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string' },
          size: { type: 'string' },
          imageUrl: { type: 'string' },
          imageUrls: { type: 'array', items: { type: 'string' } },
          stock: { type: 'integer' }
        }
      }
    },
    500: errorResponseSchema
  }
};

export const createProductSchema = {
  tags: ['Products'],
  body: {
    type: 'object',
    required: ['name', 'price', 'category'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      category: { type: 'string' },
      size: { type: 'string' },
      imageUrl: { type: 'string' },
      imageUrls: { type: 'array', items: { type: 'string' } },
      stock: { type: 'integer' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        category: { type: 'string' },
        size: { type: 'string' },
        imageUrl: { type: 'string' },
        imageUrls: { type: 'array', items: { type: 'string' } },
        stock: { type: 'integer' }
      }
    },
    400: errorResponseSchema
  }
};

export const updateProductSchema = {
  tags: ['Products'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        category: { type: 'string' },
        size: { type: 'string' },
        imageUrl: { type: 'string' },
        imageUrls: { type: 'array', items: { type: 'string' } },
        stock: { type: 'integer' }
      }
    },
    400: errorResponseSchema
  }
};

export const deleteProductSchema = {
  tags: ['Products'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    }
  },
  response: {
    204: { type: 'null' },
    400: errorResponseSchema
  }
};

export const uploadProductImageSchema = {
  tags: ['Products'],
  consumes: ['multipart/form-data'],
  querystring: {
    type: 'object',
    properties: {
      productId: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string' },
        updatedProductId: { type: 'string' }
      }
    },
    400: errorResponseSchema
  }
};

