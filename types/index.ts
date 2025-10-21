export interface Order {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  customerName: string;
  items: string;
  notes?: string;
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface RoutePoint extends Location {
  orderId: string;
  sequence: number;
  distanceToNext?: number;
  durationToNext?: number;
}

export interface OptimizedRoute {
  points: RoutePoint[];
  totalDistance: number;
  totalDuration: number;
}

export interface DeliverySession {
  id: string;
  startLocation: Location;
  orders: Order[];
  route?: OptimizedRoute;
  createdAt: Date;
  completedAt?: Date;
}

export interface FrequentAddress {
  id: string;
  address: string;
  alias?: string;
  lat?: number;
  lng?: number;
  usageCount: number;
  lastUsed: Date;
}
