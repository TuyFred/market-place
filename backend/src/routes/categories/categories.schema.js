import { errorResponseSchema } from '../../schemas/error.schema.js';

const categoryItem = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    slug: { type: 'string' },
    parent_id: { type: ['string', 'null'] },
    created_at: { type: 'string' }
  }
};

export const listCategoriesSchema = {
  tags: ['Categories'],
  response: {
    200: { type: 'array', items: categoryItem },
    500: errorResponseSchema
  }
};

export const createCategorySchema = {
  tags: ['Categories'],
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      parent_id: { type: ['string', 'null'] }
    }
  },
  response: {
    201: categoryItem,
    400: errorResponseSchema
  }
};

export const updateCategorySchema = {
  tags: ['Categories'],
  params: {
    type: 'object',
    properties: { id: { type: 'string' } }
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      parent_id: { type: ['string', 'null'] }
    }
  },
  response: {
    200: categoryItem,
    400: errorResponseSchema
  }
};

export const deleteCategorySchema = {
  tags: ['Categories'],
  params: {
    type: 'object',
    properties: { id: { type: 'string' } }
  },
  response: {
    204: { type: 'null' },
    400: errorResponseSchema
  }
};
