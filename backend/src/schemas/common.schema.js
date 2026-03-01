export const idParamSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' }
  }
};

export const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100 }
  }
};

