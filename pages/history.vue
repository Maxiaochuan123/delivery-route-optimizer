<template>
  <div>
    <!-- 顶部应用栏 -->
    <!-- <v-app-bar color="primary" density="compact">
      <v-btn icon="mdi-arrow-left" @click="goBack" />
      <v-app-bar-title>配送历史记录</v-app-bar-title>
      <template #append>
        <v-btn icon="mdi-refresh" @click="loadHistory" :loading="loading" />
      </template>
    </v-app-bar> -->

    <v-container>
      <!-- 页面标题 -->
      <v-row class="text-center mb-4">
        <v-col cols="12">
          <h2 class="text-h5 font-weight-bold">配送历史记录</h2>
          <p class="text-body-2 text-medium-emphasis">查看过往配送记录和统计信息</p>
        </v-col>
      </v-row>

      <!-- 统计卡片 -->
      <v-row class="mb-2">
        <v-col cols="4">
          <v-card elevation="2" class="stat-card">
            <v-card-text class="text-center pa-3">
              <v-icon size="32" color="primary" class="mb-2">mdi-truck-delivery</v-icon>
              <div class="text-h5 text-primary font-weight-bold">
                {{ stats.totalSessions }}
              </div>
              <div class="text-caption text-medium-emphasis">总配送次数</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="4">
          <v-card elevation="2" class="stat-card">
            <v-card-text class="text-center pa-3">
              <v-icon size="32" color="success" class="mb-2">mdi-map-marker-distance</v-icon>
              <div class="text-h5 text-success font-weight-bold">
                {{ stats.totalDistanceKm }}
              </div>
              <div class="text-caption text-medium-emphasis">总距离(km)</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="4">
          <v-card elevation="2" class="stat-card">
            <v-card-text class="text-center pa-3">
              <v-icon size="32" color="info" class="mb-2">mdi-package-variant</v-icon>
              <div class="text-h5 text-info font-weight-bold">
                {{ stats.totalOrders }}
              </div>
              <div class="text-caption text-medium-emphasis">总订单数</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 配送记录 -->
      <v-row>
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="d-flex justify-space-between align-center pa-4">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-history</v-icon>
                <span class="text-h6">配送记录</span>
              </div>
              <v-select
                v-model="filter"
                :items="filterOptions"
                density="compact"
                variant="outlined"
                hide-details
                style="max-width: 150px"
              />
            </v-card-title>

            <!-- 状态 Tabs -->
            <v-tabs v-model="statusTab" bg-color="transparent" color="primary" grow>
              <v-tab value="in_progress">
                <v-icon start>mdi-truck-delivery</v-icon>
                进行中
              </v-tab>
              <v-tab value="completed">
                <v-icon start>mdi-check-circle</v-icon>
                已完成
              </v-tab>
              <v-tab value="cancelled">
                <v-icon start>mdi-close-circle</v-icon>
                已取消
              </v-tab>
            </v-tabs>

            <v-divider />
            <v-card-text class="pa-4">
              <!-- 加载状态 -->
              <div v-if="loading" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" />
                <p class="text-body-2 text-medium-emphasis mt-4">加载中...</p>
              </div>

              <!-- 记录列表 -->
              <div v-else-if="filteredSessions.length > 0">
                <HistorySessionCard
                  v-for="session in filteredSessions"
                  :key="session.id"
                  :session="session"
                  @view-details="viewDetails"
                />
              </div>

              <!-- 空状态 -->
              <v-empty-state
                v-else
                icon="mdi-clipboard-text-outline"
                title="暂无配送记录"
                text="完成配送后，记录将显示在这里"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- 详情对话框 -->
    <HistoryDetailDialog
      v-model="detailDialog"
      :session="selectedSession"
      :routes="selectedRoutes"
    />

    <!-- 提示信息 -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
interface DeliverySession {
  id: number;
  startLocation: string;
  startLat: number | null;
  startLng: number | null;
  totalDistance: number | null;
  totalDuration: number | null;
  orderCount: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  cancelReason?: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface RouteInfo {
  id: number;
  orderId: number;
  sequence: number;
  distanceToNext: number | null;
  durationToNext: number | null;
  order: {
    id: number;
    address: string;
    customerName: string | null;
    items: string | null;
    notes: string | null;
    status: string;
  } | null;
}

definePageMeta({
  name: 'history',
});

useHead({
  title: '历史记录 - 配送路径优化系统',
});

const statusTab = ref('in_progress');
const filter = ref('all');
const filterOptions = [
  { title: '全部记录', value: 'all' },
  { title: '今天', value: 'today' },
  { title: '本周', value: 'week' },
  { title: '本月', value: 'month' },
];

const loading = ref(false);
const sessions = ref<DeliverySession[]>([]);
const filteredSessions = computed(() => {
  return sessions.value.filter((session) => {
    // 根据 statusTab 过滤
    if (statusTab.value === 'in_progress') {
      return session.status === 'in_progress' || session.status === 'pending';
    } else if (statusTab.value === 'completed') {
      return session.status === 'completed';
    } else if (statusTab.value === 'cancelled') {
      return session.status === 'cancelled';
    }
    return true;
  });
});
const stats = ref({
  totalSessions: 0,
  totalDistanceKm: '0.00',
  totalOrders: 0,
  totalDurationMin: 0,
});

const detailDialog = ref(false);
const selectedSession = ref<DeliverySession | null>(null);
const selectedRoutes = ref<RouteInfo[]>([]);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref<'success' | 'error'>('success');

// 加载历史记录
const loadHistory = async () => {
  loading.value = true;
  try {
    const response = await $fetch<{
      success: boolean;
      data: {
        sessions: DeliverySession[];
        stats: {
          totalSessions: number;
          totalDistanceKm: string;
          totalOrders: number;
          totalDurationMin: number;
        };
      };
    }>('/api/delivery-sessions', {
      query: { filter: filter.value },
    });

    sessions.value = response.data.sessions;
    stats.value = response.data.stats;
  } catch (error) {
    console.error('Failed to load history:', error);
    showSnackbar('加载历史记录失败', 'error');
  } finally {
    loading.value = false;
  }
};

// 查看详情
const viewDetails = async (session: DeliverySession) => {
  try {
    const response = await $fetch<{
      success: boolean;
      data: {
        session: DeliverySession;
        routes: RouteInfo[];
      };
    }>(`/api/delivery-sessions/${session.id}`);
    selectedSession.value = session;
    selectedRoutes.value = response.data.routes || [];
    detailDialog.value = true;
  } catch (error) {
    console.error('Failed to load session details:', error);
    showSnackbar('加载详情失败', 'error');
  }
};

// 监听筛选条件变化
watch(filter, () => {
  loadHistory();
});

// 初始化加载
onMounted(() => {
  loadHistory();
});

// 返回首页
// const goBack = () => {
//   navigateTo('/');
// };

// 显示提示信息
const showSnackbar = (text: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};
</script>

<style scoped>
.stat-card {
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
</style>
