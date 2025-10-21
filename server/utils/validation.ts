import { createAppError } from './errors';

// 验证必填字段
export const validateRequired = (data: any, fields: string[]) => {
  const missing: string[] = [];

  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw createAppError.validation(`Missing required fields: ${missing.join(', ')}`, { missing });
  }
};

// 验证地址格式
export const validateAddress = (address: string) => {
  if (!address || address.trim().length < 3) {
    throw createAppError.validation('Address must be at least 3 characters long');
  }
  return address.trim();
};

// 验证坐标
export const validateCoordinates = (lat?: number, lng?: number) => {
  if (lat !== undefined && (lat < -90 || lat > 90)) {
    throw createAppError.validation('Latitude must be between -90 and 90');
  }
  if (lng !== undefined && (lng < -180 || lng > 180)) {
    throw createAppError.validation('Longitude must be between -180 and 180');
  }
};

// 验证订单数据
export interface OrderInput {
  address: string;
  lat?: number;
  lng?: number;
  customerName: string;
  items: string;
  notes?: string;
}

export const validateOrderInput = (data: any): OrderInput => {
  validateRequired(data, ['address', 'customerName', 'items']);
  validateAddress(data.address);
  validateCoordinates(data.lat, data.lng);

  return {
    address: data.address.trim(),
    lat: data.lat,
    lng: data.lng,
    customerName: data.customerName.trim(),
    items: data.items.trim(),
    notes: data.notes?.trim(),
  };
};

// 验证 ID 参数
export const validateId = (id: any): number => {
  const numId = Number(id);
  if (isNaN(numId) || numId <= 0) {
    throw createAppError.validation('Invalid ID parameter');
  }
  return numId;
};
