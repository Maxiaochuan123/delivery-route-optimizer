import type { H3Event } from 'h3';
import { AppError } from './errors';

// 成功响应格式
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// 错误响应格式
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// 创建成功响应
export const successResponse = <T>(data: T, message?: string): SuccessResponse<T> => ({
  success: true,
  data,
  message,
});

// 创建错误响应
export const errorResponse = (
  code: string,
  message: string,
  details?: any
): ErrorResponse => ({
  success: false,
  error: {
    code,
    message,
    details,
  },
});

// 处理错误并返回响应
export const handleError = (event: H3Event, error: unknown) => {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    setResponseStatus(event, error.statusCode);
    return errorResponse(error.code, error.message, error.details);
  }

  // 未知错误
  setResponseStatus(event, 500);
  return errorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? String(error) : undefined
  );
};
