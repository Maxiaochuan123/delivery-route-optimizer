interface RoutePoint {
  orderId: number | null;
  sequence: number;
  lat: number;
  lng: number;
  address: string;
  customerName?: string;
  items?: string;
  notes?: string;
  distanceToNext: number;
  durationToNext: number;
}

interface RouteData {
  optimizedRoute: RoutePoint[];
  totalDistance: number;
  totalDuration: number;
  summary: {
    totalDistanceKm: string;
    totalDurationMin: number;
    totalDurationHours: string;
    stopCount: number;
    orderCount: number;
  };
}

// 使用 VueUse 的 useLocalStorage 自动处理持久化
const routeData = useLocalStorage<RouteData | null>('delivery_route_data', null, {
  serializer: {
    read: (v: string) => {
      try {
        return v ? JSON.parse(v) : null;
      } catch {
        return null;
      }
    },
    write: (v: RouteData | null) => JSON.stringify(v),
  },
});

export const useRouteStore = () => {
  const setRouteData = (data: RouteData | null) => {
    routeData.value = data;
  };

  const clearRouteData = () => {
    routeData.value = null;
  };

  const getRouteData = () => {
    return routeData.value;
  };

  return {
    routeData: computed(() => routeData.value),
    setRouteData,
    clearRouteData,
    getRouteData,
  };
};
