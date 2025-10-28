interface DeliverySessionData {
  sessionId: number | null;
  startLocation: string;
  startLat: number;
  startLng: number;
  totalDistance: number;
  totalDuration: number;
  orderCount: number;
  status: 'pending' | 'in_progress' | 'completed';
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
        sessionId: response.data.sessionId,
        startLocation: data.startLocation,
        startLat: data.startLat,
        startLng: data.startLng,
        totalDistance: data.totalDistance,
        totalDuration: data.totalDuration,
        orderCount: data.orderIds.length,
        status: 'pending',
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
    const currentSession = sessionData.value;
    if (!currentSession) return;

    if (!currentSession.completedOrders.includes(orderId)) {
      sessionData.value = {
        ...currentSession,
        completedOrders: [...currentSession.completedOrders, orderId],
      };
    }
  };

  /**
   * 完成配送会话
   */
  const completeSession = async () => {
    const currentSession = sessionData.value;
    
    if (!currentSession || !currentSession.sessionId) {
      console.warn('No active session to complete');
      return null;
    }

    // 如果已经完成，直接返回
    if (currentSession.completedAt) {
      console.warn('Session already completed');
      return null;
    }

    try {
      const completedAtTime = new Date().toISOString();
      
      // 完成会话并更新订单状态
      const response = await $fetch(
        `/api/delivery-sessions/${currentSession.sessionId}/complete`,
        {
          method: 'POST',
          body: {
            completedAt: completedAtTime,
          },
        }
      );
      // 更新本地数据 - 创建新对象而不是修改只读的computed值
      sessionData.value = {
        ...currentSession,
        status: 'completed',
        completedAt: completedAtTime,
      };

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
   * 更新会话数据
   */
  const updateSession = (updates: Partial<DeliverySessionData>) => {
    if (sessionData.value) {
      // 创建新对象以确保触发响应式更新
      const newData = {
        ...sessionData.value,
        ...updates,
      };
      sessionData.value = newData;
      
      // 强制触发 localStorage 写入
      console.log('✅ Session updated:', {
        orderCount: newData.orderCount,
        completedOrders: newData.completedOrders.length,
      });
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
    sessionData,
    isSessionActive,
    completionProgress,
    getSessionSummary,
    createSession,
    markOrderComplete,
    completeSession,
    getSessionDetails,
    updateSession,
    clearSession,
  };
};
