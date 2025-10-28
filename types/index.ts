export interface Order {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  customerName: string;
  items: string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  cancelReason?: string | null;
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
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  cancelReason?: string | null;
  createdAt: Date;
  completedAt?: Date;
  totalDistance?: number;
  totalDuration?: number;
  orderCount?: number;
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

// API Request/Response Types

export interface CancelOrderRequest {
  orderId: number;
  cancelReason?: string | null;
  isLastOrder?: boolean;
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
  data: {
    remainingOrders: number;
    sessionCancelled: boolean;
  };
}

export interface AbandonSessionRequest {
  cancelReason?: string | null;
}

export interface AbandonSessionResponse {
  success: boolean;
  message: string;
  data: {
    restoredOrders: number;
    sessionId: number;
    cancelReason: string | null;
  };
}
