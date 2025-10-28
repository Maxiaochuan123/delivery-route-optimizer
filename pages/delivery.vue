<template>
  <div>
    <!-- 顶部应用栏 -->
    <v-app-bar color="primary" density="compact">
      <v-btn icon="mdi-arrow-left" @click="goBack" />
      <v-app-bar-title>配送进行中</v-app-bar-title>
    </v-app-bar>

    <v-container class="mt-4">
      <!-- 会话信息卡片 -->
      <v-row v-if="sessionSummary" class="mb-4">
        <v-col cols="12">
          <v-card>
            <v-card-text>
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-subtitle-2 text-medium-emphasis">配送进度</span>
                <v-chip :color="sessionSummary?.isCompleted ? 'success' : 'primary'" size="small">
                  {{ sessionSummary?.completedOrders || 0 }} /
                  {{ sessionSummary?.totalOrders || 0 }}
                </v-chip>
              </div>
              <v-progress-linear
                :model-value="completionProgress"
                color="success"
                height="8"
                rounded
                class="mb-3"
              />
              <div class="d-flex justify-space-around text-center">
                <div>
                  <div class="text-h6">
                    {{ ((sessionData?.totalDistance || 0) / 1000).toFixed(2) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">总距离(km)</div>
                </div>
                <v-divider vertical />
                <div>
                  <div class="text-h6">
                    {{ Math.round((sessionData?.totalDuration || 0) / 60) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">预计时间(分钟)</div>
                </div>
                <v-divider vertical />
                <div>
                  <div class="text-h6">{{ completionProgress.toFixed(0) }}%</div>
                  <div class="text-caption text-medium-emphasis">完成率</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mb-2">
        <v-col cols="12">
          <p class="text-body-2 text-medium-emphasis text-center">按顺序完成配送任务</p>
        </v-col>
      </v-row>

      <!-- 配送清单 -->
      <v-row>
        <v-col cols="12">
          <DeliveryList
            :items="deliveryItems"
            :total-distance="routeData?.summary ? parseFloat(routeData.summary.totalDistanceKm) : 0"
            :total-duration="routeData?.summary.totalDurationMin"
            @complete="handleComplete"
            @navigate="handleNavigate"
            @cancel="handleCancelOrder"
          />
        </v-col>
      </v-row>

      <!-- 操作按钮 -->
      <v-row v-if="!allCompleted">
        <v-col cols="12">
          <v-btn block color="primary" prepend-icon="mdi-map" @click="viewOnMap">
            在地图上查看
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-btn
            block
            color="error"
            variant="outlined"
            prepend-icon="mdi-close-circle"
            @click="handleAbandonSession"
          >
            放弃配送
          </v-btn>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col cols="12" md="6">
          <v-btn block variant="outlined" prepend-icon="mdi-home" @click="goHome"> 返回首页 </v-btn>
        </v-col>
        <v-col cols="12" md="6">
          <v-btn block color="primary" prepend-icon="mdi-history" @click="viewHistory">
            查看历史
          </v-btn>
        </v-col>
      </v-row>

      <!-- 提示信息 -->
      <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
        {{ snackbarText }}
      </v-snackbar>

      <!-- 完成确认对话框 -->
      <v-dialog v-model="completionDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h5">🎉 配送完成！</v-card-title>
          <v-card-text>
            <div class="py-4">
              <v-list>
                <v-list-item>
                  <template #prepend>
                    <v-icon color="success">mdi-check-circle</v-icon>
                  </template>
                  <v-list-item-title>完成订单数</v-list-item-title>
                  <v-list-item-subtitle>{{ sessionSummary?.totalOrders }} 个</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon color="primary">mdi-map-marker-distance</v-icon>
                  </template>
                  <v-list-item-title>总配送距离</v-list-item-title>
                  <v-list-item-subtitle
                    >{{ sessionSummary?.totalDistanceKm }} km</v-list-item-subtitle
                  >
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon color="info">mdi-clock-outline</v-icon>
                  </template>
                  <v-list-item-title>总配送时间</v-list-item-title>
                  <v-list-item-subtitle
                    >{{ sessionSummary?.totalDurationMin }} 分钟</v-list-item-subtitle
                  >
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="completionDialog = false">关闭</v-btn>
            <v-btn color="primary" variant="flat" @click="finishAndGoOrders">完成并返回</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 取消订单确认对话框（非最后订单） -->
      <v-dialog v-model="cancelDialog" max-width="500">
        <v-card>
          <v-card-title class="text-error">
            <v-icon class="mr-2">mdi-alert</v-icon>
            取消订单
          </v-card-title>
          <v-card-text>
            <p class="mb-3">确定要取消这个订单吗？</p>
            <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
              取消后，该订单将从配送列表中移除并恢复为待开始状态
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closeCancelDialog">取消</v-btn>
            <v-btn color="error" variant="flat" :loading="canceling" @click="confirmCancelOrder">
              确认取消
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 取消最后订单对话框（需要输入原因） -->
      <CancelReasonDialog
        v-model="cancelLastOrderDialog"
        title="取消最后订单"
        message="这是配送清单中的最后一个订单，取消后将结束整个配送会话。请输入取消原因："
        @confirm="confirmCancelLastOrder"
      />

      <!-- 放弃配送对话框（需要输入原因） -->
      <CancelReasonDialog
        v-model="abandonDialog"
        title="放弃配送"
        message="确定要放弃当前配送会话吗？所有订单将恢复为待开始状态。请输入放弃原因："
        @confirm="confirmAbandonSession"
      />
    </v-container>
  </div>
</template>

<script setup lang="ts">
interface DeliveryItem {
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
  completed?: boolean;
}

definePageMeta({
  name: 'delivery',
});

useHead({
  title: '配送进行中 - 配送路径优化系统',
});

const { routeData } = useRouteStore();
const {
  sessionData,
  isSessionActive,
  completionProgress,
  getSessionSummary,
  createSession,
  markOrderComplete,
  completeSession,
  updateSession,
  clearSession,
} = useDeliverySession();

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref<'success' | 'error'>('success');
const completionDialog = ref(false);
const cancelDialog = ref(false);
const cancelLastOrderDialog = ref(false);
const abandonDialog = ref(false);
const canceling = ref(false);
const cancelOrderIndex = ref<number | null>(null);

// 配送项列表（包含完成状态）
const deliveryItems = ref<DeliveryItem[]>([]);

// 会话摘要
const sessionSummary = getSessionSummary;

// 初始化配送项和会话
const initializeDelivery = async () => {
  if (routeData.value?.optimizedRoute) {
    if (sessionData.value?.completedAt) {
      clearSession();
    }

    // 从已完成的订单列表中恢复状态
    const completedOrderIds = sessionData.value?.completedOrders || [];

    deliveryItems.value = routeData.value.optimizedRoute.map((item) => ({
      ...item,
      completed: item.orderId !== null && completedOrderIds.includes(item.orderId),
    }));

    // 计算实际的订单数量
    const actualOrderCount = routeData.value.optimizedRoute.filter(
      (item) => item.orderId !== null
    ).length;

    // 检查是否需要创建新会话
    const needsNewSession =
      !sessionData.value ||
      sessionData.value.completedAt !== null ||
      sessionData.value.orderCount === 0 ||
      sessionData.value.orderCount !== actualOrderCount;

    // 如果没有活动会话，创建新会话
    if (needsNewSession && routeData.value.optimizedRoute.length > 0) {
      try {
        const orderIds = routeData.value.optimizedRoute
          .filter((item) => item.orderId !== null)
          .map((item) => item.orderId as number);

        const routeDataForSession = routeData.value.optimizedRoute
          .filter((item) => item.orderId !== null)
          .map((item) => ({
            orderId: item.orderId as number,
            sequence: item.sequence,
            distanceToNext: item.distanceToNext,
            durationToNext: item.durationToNext,
          }));

        // 获取起始位置（第一个点）
        const startPoint = routeData.value.optimizedRoute[0];

        if (startPoint) {
          const result = await createSession({
            startLocation: startPoint.address,
            startLat: startPoint.lat,
            startLng: startPoint.lng,
            orderIds,
            routeData: routeDataForSession,
            totalDistance: routeData.value.totalDistance,
            totalDuration: routeData.value.totalDuration,
          });

          // 立即将会话状态更新为 in_progress
          if (result && sessionData.value?.sessionId) {
            try {
              await $fetch(`/api/delivery-sessions/${sessionData.value.sessionId}`, {
                method: 'PATCH',
                body: { status: 'in_progress' },
              });
              showSnackbar('配送已开始');
            } catch (error) {
              console.error('Failed to start session:', error);
              showSnackbar('开始配送失败', 'error');
            }
          }
        }
      } catch (error) {
        console.error('Failed to create session:', error);
        showSnackbar('创建配送会话失败', 'error');
      }
    } else {
      console.log('✅ Using existing session:', {
        sessionId: sessionData.value?.sessionId,
        orderCount: sessionData.value?.orderCount,
        actualOrderCount,
      });
    }
  } else {
    // 如果没有路线数据，跳转到订单页面
    showSnackbar('请先优化路线', 'error');
    setTimeout(() => {
      navigateTo('/orders');
    }, 2000);
  }
};

onMounted(() => {
  initializeDelivery();
});

// 是否全部完成
const allCompleted = computed(() => {
  const orderItems = deliveryItems.value.filter((item) => item.orderId !== null);
  return orderItems.length > 0 && orderItems.every((item) => item.completed);
});

// 监听全部完成状态
watch(
  allCompleted,
  async (completed, wasCompleted) => {
    // 只在状态从未完成变为完成时触发
    if (completed && !wasCompleted && isSessionActive.value && sessionData.value) {
      try {
        const result = await completeSession();
        if (result) {
          completionDialog.value = true;
        } else {
          console.warn('⚠️ completeSession returned null or undefined');
        }
      } catch (error) {
        console.error('❌ Failed to complete session:', error);
        showSnackbar('完成配送会话失败', 'error');
      }
    }
  },
  { immediate: false }
);

// 标记订单完成
const handleComplete = (index: number) => {
  const item = deliveryItems.value[index];
  if (item && item.orderId !== null) {
    item.completed = true;
    markOrderComplete(item.orderId);
    showSnackbar(`订单 ${item.customerName} 已完成`);

    // 自动滚动到下一个未完成的订单
    nextTick(() => {
      const nextIncompleteIndex = deliveryItems.value.findIndex(
        (item) => item.orderId !== null && !item.completed
      );
      if (nextIncompleteIndex !== -1) {
        const nextItem = deliveryItems.value[nextIncompleteIndex];
        if (nextItem) {
          showSnackbar(`下一站: ${nextItem.customerName || '未知'}`);
        }
      }
    });
  }
};

// 开始导航
const handleNavigate = (item: DeliveryItem) => {
  // 使用高德地图或其他地图应用进行导航
  const lat = item.lat;
  const lng = item.lng;
  const address = encodeURIComponent(item.address);

  // 尝试使用高德地图 URI Scheme
  const amapUrl = `amapuri://route/plan/?dlat=${lat}&dlon=${lng}&dname=${address}&dev=0&t=0`;

  // 尝试使用百度地图 URI Scheme
  const baiduUrl = `baidumap://map/direction?destination=latlng:${lat},${lng}|name:${address}&mode=driving`;

  // 尝试使用 Google Maps（Web）
  // const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // 尝试打开高德地图
  window.location.href = amapUrl;

  // 如果高德地图没有安装，延迟后打开 Google Maps
  setTimeout(() => {
    window.open(baiduUrl, '_blank');
  }, 1000);

  showSnackbar(`正在启动导航到 ${item.address}`);
};

// 处理取消订单
const handleCancelOrder = (index: number) => {
  cancelOrderIndex.value = index;

  // 检查是否为最后一个订单
  const remainingOrders = deliveryItems.value.filter(
    (item) => item.orderId !== null && !item.completed
  );
  const isLastOrder = remainingOrders.length === 1;

  if (isLastOrder) {
    // 显示带原因输入的对话框
    cancelLastOrderDialog.value = true;
  } else {
    // 显示普通确认对话框
    cancelDialog.value = true;
  }
};

// 关闭取消对话框
const closeCancelDialog = () => {
  cancelDialog.value = false;
  cancelOrderIndex.value = null;
};

// 确认取消订单（非最后订单）
const confirmCancelOrder = async () => {
  await cancelOrderInternal(null, false);
};

// 确认取消最后订单（需要原因）
const confirmCancelLastOrder = async (reason: string) => {
  cancelLastOrderDialog.value = false;
  await cancelOrderInternal(reason, true);
};

// 内部取消订单逻辑
const cancelOrderInternal = async (cancelReason: string | null, isLastOrder: boolean) => {
  if (cancelOrderIndex.value === null) return;

  const item = deliveryItems.value[cancelOrderIndex.value];
  if (!item || item.orderId === null) {
    showSnackbar('无效的订单', 'error');
    cancelDialog.value = false;
    return;
  }

  if (!sessionData.value?.sessionId) {
    showSnackbar('没有活动的配送会话', 'error');
    cancelDialog.value = false;
    return;
  }

  canceling.value = true;

  try {
    // 调用取消订单 API
    const response = await $fetch(
      `/api/delivery-sessions/${sessionData.value.sessionId}/cancel-order`,
      {
        method: 'POST',
        body: {
          orderId: item.orderId,
          cancelReason: cancelReason,
          isLastOrder: isLastOrder,
        },
      }
    );

    // 从配送列表中移除该订单
    deliveryItems.value.splice(cancelOrderIndex.value, 1);

    // 从 completedOrders 中移除该订单（如果已完成）
    const completedOrders = sessionData.value.completedOrders.filter((id) => id !== item.orderId);

    // 计算实际剩余的订单数量（不包括起点）
    const remainingOrders = deliveryItems.value.filter((i) => i.orderId !== null);
    const remainingOrderCount = remainingOrders.length;

    cancelDialog.value = false;
    cancelOrderIndex.value = null;

    // 如果是最后一个订单或会话已被取消，返回订单页面
    if (response.data.sessionCancelled || isLastOrder) {
      showSnackbar('配送会话已取消，返回订单页面');
      setTimeout(() => {
        clearSession();
        navigateTo('/orders');
      }, 1500);
      return;
    }

    showSnackbar(`订单 ${item.customerName} 已取消并恢复为待开始状态`);

    // 如果剩余订单 >= 1，需要重新优化路线
    if (remainingOrderCount >= 1) {
      showSnackbar('正在重新优化路线...', 'success');

      try {
        // 获取起始位置（第一个点，通常是起点）
        const startPoint = deliveryItems.value[0];
        if (!startPoint) {
          throw new Error('无法获取起始位置');
        }

        // 获取剩余订单的 ID
        const remainingOrderIds = remainingOrders.map((o) => o.orderId as number);

        // 调用路线重新优化 API（不检查活动会话）
        const optimizeResponse = await $fetch('/api/routes/reoptimize', {
          method: 'POST',
          body: {
            startLocation: {
              lat: startPoint.lat,
              lng: startPoint.lng,
              address: startPoint.address,
            },
            orderIds: remainingOrderIds,
          },
        });

        console.log('Reoptimize response:', optimizeResponse);

        // API handler 自动包装了 { success: true, data: {...} }
        if (optimizeResponse && optimizeResponse.success && optimizeResponse.data) {
          const routeData = optimizeResponse.data;

          if (!routeData.optimizedRoute || !Array.isArray(routeData.optimizedRoute)) {
            console.error('Invalid route data:', routeData);
            throw new Error('Invalid route data received from API');
          }

          if (routeData.optimizedRoute.length === 0) {
            console.error('Empty optimized route');
            throw new Error('Optimized route is empty');
          }

          console.log('Route data is valid, updating delivery items...');

          // 更新配送列表
          deliveryItems.value = routeData.optimizedRoute.map((item: DeliveryItem) => ({
            ...item,
            completed: item.orderId !== null && completedOrders.includes(item.orderId),
          }));

          // 更新 routeData
          const { setRouteData } = useRouteStore();
          setRouteData(routeData);

          // 更新 sessionData（仅更新本地数据，不更新数据库）
          updateSession({
            orderCount: remainingOrderCount,
            completedOrders,
            totalDistance: routeData.totalDistance,
            totalDuration: routeData.totalDuration,
          });

          // 注意：不更新数据库中的统计信息，保留初始值用于历史记录

          showSnackbar('路线已重新优化', 'success');
        } else {
          throw new Error('Invalid response from reoptimize API');
        }
      } catch (error) {
        console.error('Failed to re-optimize route:', error);
        showSnackbar('路线重新优化失败，继续使用原路线', 'error');

        // 如果优化失败，使用简单的距离计算
        let totalDistance = 0;
        let totalDuration = 0;
        deliveryItems.value.forEach((item) => {
          totalDistance += item.distanceToNext;
          totalDuration += item.durationToNext;
        });

        updateSession({
          orderCount: remainingOrderCount,
          completedOrders,
          totalDistance,
          totalDuration,
        });

        // 注意：不更新数据库中的统计信息，保留初始值用于历史记录

        if (routeData.value) {
          const { setRouteData } = useRouteStore();
          const updatedRoute = {
            ...routeData.value,
            optimizedRoute: deliveryItems.value,
            totalDistance,
            totalDuration,
            summary: {
              totalDistanceKm: (totalDistance / 1000).toFixed(2),
              totalDurationMin: Math.round(totalDuration / 60),
              totalDurationHours: (totalDuration / 3600).toFixed(1),
              orderCount: remainingOrderCount,
              stopCount: deliveryItems.value.length,
            },
          };
          setRouteData(updatedRoute);
        }
      }
    }
  } catch (error) {
    console.error('Failed to cancel order:', error);
    const errorMessage =
      (error as { data?: { error?: { message?: string } } })?.data?.error?.message ||
      '取消订单失败';
    showSnackbar(errorMessage, 'error');
  } finally {
    canceling.value = false;
  }
};

// 在地图上查看
const viewOnMap = () => {
  navigateTo('/map');
};

// 返回上一页
const goBack = () => {
  navigateTo('/orders');
};

// 返回首页
const goHome = () => {
  navigateTo('/');
};

// 完成并返回首页
const finishAndGoOrders = () => {
  completionDialog.value = false;
  clearSession();
  navigateTo('/orders');
};

// 查看历史
const viewHistory = () => {
  navigateTo('/history');
};

// 处理放弃配送
const handleAbandonSession = () => {
  abandonDialog.value = true;
};

// 确认放弃配送
const confirmAbandonSession = async (reason: string) => {
  if (!sessionData.value?.sessionId) {
    showSnackbar('没有活动的配送会话', 'error');
    abandonDialog.value = false;
    return;
  }

  canceling.value = true;

  try {
    // 调用放弃配送 API
    await $fetch(`/api/delivery-sessions/${sessionData.value.sessionId}/abandon`, {
      method: 'POST',
      body: {
        cancelReason: reason,
      },
    });

    abandonDialog.value = false;
    showSnackbar('配送已放弃，所有订单已恢复为待开始状态');

    // 清理会话状态并导航到订单页面
    setTimeout(() => {
      clearSession();
      navigateTo('/orders');
    }, 1500);
  } catch (error) {
    console.error('Failed to abandon session:', error);
    const errorMessage =
      (error as { data?: { error?: { message?: string } } })?.data?.error?.message ||
      '放弃配送失败';
    showSnackbar(errorMessage, 'error');
  } finally {
    canceling.value = false;
  }
};

// 显示提示信息
const showSnackbar = (text: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};
</script>
