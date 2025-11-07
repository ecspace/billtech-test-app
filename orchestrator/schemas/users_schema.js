export const getUsersSchema = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        country: { type: 'string' },
        city: { type: 'string' }
      },
      additionalProperties: false
    }
  }
};

export const getUserByIdSchema = {
  schema: {
    params: {
      type: 'object',
      properties: { id: { type: 'string', minLength: 24, maxLength: 24 } },
      required: ['id']
    }
  }
};
