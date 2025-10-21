// 错误码定义
export enum ErrorCode {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  GEOCODING_FAILED = 'GEOCODING_FAILED',
  ROUTE_CALCULATION_FAILED = 'ROUTE_CALCULATION_FAILED',
  LOCATION_ACCESS_DENIED = 'LOCATION_ACCESS_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// 自定义错误类
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 错误工厂函数
export const createAppError = {
  validation: (message: string, details?: any) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details),

  notFound: (resource: string) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404),

  database: (message: string) =>
    new AppError(ErrorCode.DATABASE_ERROR, message, 500),

  geocoding: (message: string) =>
    new AppError(ErrorCode.GEOCODING_FAILED, message, 400),

  routeCalculation: (message: string) =>
    new AppError(ErrorCode.ROUTE_CALCULATION_FAILED, message, 500),

  internal: (message: string) =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500),
};
