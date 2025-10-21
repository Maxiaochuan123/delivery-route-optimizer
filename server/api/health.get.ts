import { successResponse } from '../utils/response';

export default defineEventHandler(() => {
  return successResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
