interface DeliverySessionData {
  sessionId: number | null;
  startLocation: string;
  startLat: number;
  startLng: number;
  totalDistance: number;
  totalDuration: number;
  orderCount: number;
  createdAt: string;
  completedAt: string | null;
  completedOrders: number[];
}

// 使用 localStorage 持久化配送会话数据
const sessionData = useLocalStorage<DeliverySessionData | null>(
  'delivery_session_data',
  null,
  {
    serializer: {
      read: (v: string) => {
        try {
          return v ? JSON.parse(v) : null;
        } catch {
          return null;
        }
      },
      write: (v: DeliverySessionData | null) => JSON.stringify(v),
    },
  }
);

export const useDeliverySession = () => {
  const isSessionActive = computed(() => {
    return sessionData.value !== null && sessionData.value.completedAt === null;
  });

  const completionProgress = computed(() => {
    if (!sessionData.value) return 0;
    const total = sessionData.value.orderCount;
    const completed = sessionData.value.completedOrders.length;
    return total > 0 ? (completed / total) * 100 : 0;
  });

  /**
   * 创建新的配送会话
   */
  const createSession = async (data: {
    startLocation: string;
    startLat: number;
    startLng: number;
    orderIds: number[];
    routeData: Array<{
      orderId: number;
      sequence: number;
      distanceToNext: number;
      durationToNext: number;
    }>;
    totalDistance: number;
    totalDuration: number;
  }) => {
    try {
      const response = await $fetch('/api/delivery-sessions', {
        method: 'POST',
        body: data,
      });

      // 保存会话数据到本地
      sessionData.value = {
        sessionId: response.sessionId,
        startLocation: data.startLocation,
        startLat: data.startLat,
        startLng: data.startLng,
        totalDistance: data.totalDistance,
        totalDuration: data.totalDuration,
        orderCount: data.orderIds.length,
        createdAt: new Date().toISOString(),
        completedAt: null,
        completedOrders: [],
      };

      return response;
    } catch (error) {
      console.error('Failed to create delivery session:', error);
      throw error;
    }
  };

  /**
   * 标记订单完成
   */
  const markOrderComplete = (orderId: number) => {
    if (!sessionData.value) return;

    if (!sessionData.value.completedOrders.includes(orderId)) {
      sessionData.value.completedOrders.push(orderId);
    }
  };

  /**
   * 完成配送会话
   */
  const completeSession = async () => {
    if (!sessionData.value || !sessionData.value.sessionId) {
      console.warn('No active session to complete');
      return null;
    }

    // 如果已经完成，直接返回
    if (sessionData.value.completedAt) {
      console.warn('Session already completed');
      return null;
    }

    try {
      const response = await $fetch(
        `/api/delivery-sessions/${sessionData.value.sessionId}`,
        {
          method: 'PATCH',
          body: {
            completedAt: new Date().toISOString(),
          },
        }
      );

      // 更新本地数据
      if (sessionData.value) {
        sessionData.value.completedAt = new Date().toISOString();
      }

      return response;
    } catch (error) {
      console.error('Failed to complete delivery session:', error);
      throw error;
    }
  };

  /**
   * 获取会话详情
   */
  const getSessionDetails = async (sessionId: number) => {
    try {
      const response = await $fetch(`/api/delivery-sessions/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Failed to get session details:', error);
      throw error;
    }
  };

  /**
   * 清除会话数据
   */
  const clearSession = () => {
    sessionData.value = null;
  };

  /**
   * 获取会话摘要
   */
  const getSessionSummary = computed(() => {
    if (!sessionData.value) return null;

    return {
      totalOrders: sessionData.value.orderCount,
      completedOrders: sessionData.value.completedOrders.length,
      totalDistanceKm: (sessionData.value.totalDistance / 1000).toFixed(2),
      totalDurationMin: Math.round(sessionData.value.totalDuration / 60),
      completionRate: completionProgress.value.toFixed(0),
      isCompleted: sessionData.value.completedAt !== null,
    };
  });

  return {
    sessionData: computed(() => sessionData.value),
    isSessionActive,
    completionProgress,
    getSessionSummary,
    createSession,
    markOrderComplete,
    completeSession,
    getSessionDetails,
    clearSession,
  };
};
