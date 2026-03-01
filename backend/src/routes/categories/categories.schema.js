import { errorResponseSchema } from '../../schemas/error.schema.js';

export const listCategoriesSchema = {
  tags: ['Categories'],
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' }
        }
      }
    },
    500: errorResponseSchema
  }
};

export const createCategorySchema = {
  tags: ['Categories'],
  body: {
    type: 'object',
    required: ['name', 'slug'],
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' }
      }
    },
    400: errorResponseSchema
  }
};

export const updateCategorySchema = {
  tags: ['Categories'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' }
      }
    },
    400: errorResponseSchema
  }
};

export const deleteCategorySchema = {
  tags: ['Categories'],
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
