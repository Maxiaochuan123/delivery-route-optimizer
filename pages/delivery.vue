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
                <v-chip :color="sessionSummary.isCompleted ? 'success' : 'primary'" size="small">
                  {{ sessionSummary.completedOrders }} / {{ sessionSummary.totalOrders }}
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
                  <div class="text-h6">{{ sessionSummary.totalDistanceKm }}</div>
                  <div class="text-caption text-medium-emphasis">总距离(km)</div>
                </div>
                <v-divider vertical />
                <div>
                  <div class="text-h6">{{ sessionSummary.totalDurationMin }}</div>
                  <div class="text-caption text-medium-emphasis">预计时间(分钟)</div>
                </div>
                <v-divider vertical />
                <div>
                  <div class="text-h6">{{ sessionSummary.completionRate }}%</div>
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
                  <v-list-item-subtitle>{{ sessionSummary?.totalDistanceKm }} km</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon color="info">mdi-clock-outline</v-icon>
                  </template>
                  <v-list-item-title>总配送时间</v-list-item-title>
                  <v-list-item-subtitle>{{ sessionSummary?.totalDurationMin }} 分钟</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="completionDialog = false">关闭</v-btn>
            <v-btn color="primary" variant="flat" @click="finishAndGoHome">完成并返回</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
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
  keepalive: true,
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
  clearSession,
} = useDeliverySession();

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref<'success' | 'error'>('success');
const completionDialog = ref(false);

// 配送项列表（包含完成状态）
const deliveryItems = ref<DeliveryItem[]>([]);

// 会话摘要
const sessionSummary = getSessionSummary;

// 初始化配送项和会话
onMounted(async () => {
  if (routeData.value?.optimizedRoute) {
    // 从已完成的订单列表中恢复状态
    const completedOrderIds = sessionData.value?.completedOrders || [];

    deliveryItems.value = routeData.value.optimizedRoute.map((item) => ({
      ...item,
      completed: item.orderId !== null && completedOrderIds.includes(item.orderId),
    }));

    // 如果没有活动会话，创建新会话
    if (!isSessionActive.value && routeData.value.optimizedRoute.length > 0) {
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
          await createSession({
            startLocation: startPoint.address,
            startLat: startPoint.lat,
            startLng: startPoint.lng,
            orderIds,
            routeData: routeDataForSession,
            totalDistance: routeData.value.totalDistance,
            totalDuration: routeData.value.totalDuration,
          });

          showSnackbar('配送会话已创建');
        }
      } catch (error) {
        console.error('Failed to create session:', error);
        showSnackbar('创建配送会话失败', 'error');
      }
    }
  } else {
    // 如果没有路线数据，跳转到订单页面
    showSnackbar('请先优化路线', 'error');
    setTimeout(() => {
      navigateTo('/orders');
    }, 2000);
  }
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
        }
      } catch (error) {
        console.error('Failed to complete session:', error);
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
const finishAndGoHome = () => {
  completionDialog.value = false;
  clearSession();
  navigateTo('/');
};

// 查看历史
const viewHistory = () => {
  navigateTo('/history');
};

// 显示提示信息
const showSnackbar = (text: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};
</script>
