import { defineApiHandler, getValidatedBody } from '../utils/handler';
import { validateRequired } from '../utils/validation';

export default defineApiHandler(async (event) => {
  const body = await getValidatedBody(event, (data) => {
    validateRequired(data, ['message']);
    return data;
  });

  return {
    echo: body.message,
    timestamp: new Date().toISOString(),
  };
});
