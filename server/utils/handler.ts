import type { H3Event, EventHandler } from 'h3';
import { handleError, successResponse } from './response';

/**
 * API 处理器包装函数
 * 自动处理错误和响应格式化
 */
export const defineApiHandler = <T = any>(
  handler: (event: H3Event) => Promise<T> | T
): EventHandler => {
  return defineEventHandler(async (event) => {
    try {
      const result = await handler(event);
      return successResponse(result);
    } catch (error) {
      return handleError(event, error);
    }
  });
};

/**
 * 获取请求体并验证
 */
export const getValidatedBody = async <T = any>(
  event: H3Event,
  validator?: (data: any) => T
): Promise<T> => {
  const body = await readBody(event);

  if (validator) {
    return validator(body);
  }

  return body as T;
};

/**
 * 获取查询参数
 */
export const getValidatedQuery = <T = any>(
  event: H3Event,
  validator?: (data: any) => T
): T => {
  const query = getQuery(event);

  if (validator) {
    return validator(query);
  }

  return query as T;
};

/**
 * 获取路由参数
 */
export const getValidatedParams = <T = any>(
  event: H3Event,
  validator?: (data: any) => T
): T => {
  const params = event.context.params || {};

  if (validator) {
    return validator(params);
  }

  return params as T;
};
