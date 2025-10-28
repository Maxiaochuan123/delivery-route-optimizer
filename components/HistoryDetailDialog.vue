<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card v-if="session" elevation="8">
      <v-card-title class="d-flex justify-space-between align-center pa-4 bg-primary">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="white">mdi-information</v-icon>
          <span class="text-white">配送详情</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- 会话状态提示 -->
        <v-alert
          v-if="session.status === 'cancelled'"
          type="error"
          variant="tonal"
          class="mb-4"
          prominent
        >
          <template #prepend>
            <v-icon size="large">mdi-cancel</v-icon>
          </template>
          <div class="text-subtitle-1 font-weight-bold">配送已取消</div>
          <div v-if="session.cancelReason" class="text-body-2 mt-2">
            <strong>取消原因：</strong>{{ session.cancelReason }}
          </div>
        </v-alert>

        <!-- 基本信息 -->
        <div class="mb-4">
          <div class="d-flex align-center mb-3">
            <v-icon class="mr-2" color="primary">mdi-information-outline</v-icon>
            <span class="text-subtitle-1 font-weight-medium">基本信息</span>
          </div>
          <v-list density="compact" class="bg-grey-lighten-5 rounded">
            <v-list-item>
              <template #prepend>
                <v-icon :color="getStatusColor(session.status)">
                  {{ getStatusIcon(session.status) }}
                </v-icon>
              </template>
              <v-list-item-title>会话状态</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="getStatusColor(session.status)" size="small" variant="flat">
                  {{ getStatusText(session.status) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-calendar</v-icon>
              </template>
              <v-list-item-title>配送日期</v-list-item-title>
              <v-list-item-subtitle>{{ formatDateTime(session.createdAt) }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-if="session.completedAt">
              <template #prepend>
                <v-icon :color="session.status === 'cancelled' ? 'error' : 'success'">
                  {{ session.status === 'cancelled' ? 'mdi-clock-alert' : 'mdi-check-circle' }}
                </v-icon>
              </template>
              <v-list-item-title>{{
                session.status === 'cancelled' ? '取消时间' : '完成时间'
              }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatDateTime(session.completedAt) }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon color="info">mdi-map-marker</v-icon>
              </template>
              <v-list-item-title>起始位置</v-list-item-title>
              <v-list-item-subtitle>{{ session.startLocation }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <!-- 统计信息 -->
        <div class="mb-4">
          <div class="d-flex align-center mb-3">
            <v-icon class="mr-2" color="primary">mdi-chart-box</v-icon>
            <span class="text-subtitle-1 font-weight-medium">统计信息</span>
          </div>
          <v-row dense>
            <v-col cols="6">
              <v-card variant="tonal" class="cursor-pointer" @click="orderDetailsDialog = true">
                <v-card-text class="text-center">
                  <div class="text-h5 text-primary font-weight-bold">
                    {{ getTotalOrderCount() }}
                  </div>
                  <div class="text-caption d-flex align-center justify-center">
                    订单数量
                    <v-icon size="small" class="ml-1">mdi-eye</v-icon>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card variant="tonal">
                <v-card-text class="text-center">
                  <div class="text-h5 text-primary font-weight-bold">
                    {{ ((session.totalDistance || 0) / 1000).toFixed(2) }}
                  </div>
                  <div class="text-caption">总距离 (km)</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card variant="tonal">
                <v-card-text class="text-center">
                  <div class="text-h5 text-primary font-weight-bold">
                    {{ Math.round((session.totalDuration || 0) / 60) }}
                  </div>
                  <div class="text-caption">总时间 (分钟)</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card variant="tonal">
                <v-card-text class="text-center">
                  <div class="text-h5 text-primary font-weight-bold">
                    {{ calculateAvgDistance() }}
                  </div>
                  <div class="text-caption">平均距离 (km)</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 配送路线 -->
        <div v-if="routes && routes.length > 0">
          <div class="d-flex align-center mb-3">
            <v-icon class="mr-2" color="primary">mdi-routes</v-icon>
            <span class="text-subtitle-1 font-weight-medium">配送路线</span>
          </div>
          <v-list density="compact" class="bg-grey-lighten-5 rounded">
            <v-list-item v-for="(route, index) in routes" :key="route.id" class="mb-1">
              <template #prepend>
                <v-avatar :color="index === 0 ? 'success' : 'primary'" size="32">
                  <span class="text-caption">{{ route.sequence }}</span>
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ route.order?.customerName || '未知客户' }}
                <v-chip
                  v-if="route.order?.status === 'cancelled'"
                  size="x-small"
                  color="error"
                  class="ml-2"
                >
                  已取消
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ route.order?.address }}
              </v-list-item-subtitle>
              <template v-if="route.distanceToNext" #append>
                <div class="text-caption text-medium-emphasis">
                  {{ (route.distanceToNext / 1000).toFixed(2) }} km
                </div>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" color="primary" @click="$emit('update:modelValue', false)"
          >关闭</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 订单详情Dialog -->
  <v-dialog v-model="orderDetailsDialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center pa-4 bg-primary">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="white">mdi-package-variant</v-icon>
          <span class="text-white">订单详情</span>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="orderDetailsDialog = false" />
      </v-card-title>

      <v-card-text class="pa-4">
        <div v-if="routes && routes.length > 0" class="order-details-list">
          <v-card
            v-for="(route, index) in routes"
            :key="route.id"
            class="order-card mb-4"
            :class="{ 'cancelled-order': route.order?.status === 'cancelled' }"
            elevation="2"
          >
            <!-- 订单头部 -->
            <div class="order-header">
              <div class="d-flex align-center">
                <v-avatar
                  :color="getOrderStatusColor(route.order?.status)"
                  size="56"
                  class="order-number"
                >
                  <span class="text-h5 font-weight-bold">{{ index + 1 }}</span>
                </v-avatar>
                <div class="ml-4 flex-grow-1">
                  <div class="d-flex align-center mb-1">
                    <span class="text-h6 font-weight-bold">
                      {{ route.order?.customerName || '未知客户' }}
                    </span>
                    <v-chip
                      v-if="route.order?.status === 'cancelled'"
                      size="small"
                      color="error"
                      variant="flat"
                      class="ml-2"
                    >
                      <v-icon start size="x-small">mdi-close-circle</v-icon>
                      已取消
                    </v-chip>
                  </div>
                </div>
              </div>
            </div>

            <!-- 订单详情 -->
            <div class="order-details">
              <!-- 地址 -->
              <div class="detail-row">
                <div class="detail-icon">
                  <v-icon color="primary">mdi-map-marker</v-icon>
                </div>
                <div class="detail-content">
                  <div class="detail-label">配送地址</div>
                  <div class="detail-value">{{ route.order?.address }}</div>
                </div>
              </div>

              <!-- 商品 -->
              <div v-if="route.order?.items" class="detail-row">
                <div class="detail-icon">
                  <v-icon color="success">mdi-package-variant</v-icon>
                </div>
                <div class="detail-content">
                  <div class="detail-label">商品信息</div>
                  <div class="detail-value">{{ route.order.items }}</div>
                </div>
              </div>

              <!-- 备注 -->
              <div v-if="route.order?.notes" class="detail-row">
                <div class="detail-icon">
                  <v-icon color="info">mdi-note-text</v-icon>
                </div>
                <div class="detail-content">
                  <div class="detail-label">备注信息</div>
                  <div class="detail-value text-medium-emphasis">{{ route.order.notes }}</div>
                </div>
              </div>
            </div>
          </v-card>
        </div>
        <v-alert v-else type="info" variant="tonal" class="ma-4">
          <div class="text-center py-4">
            <v-icon size="64" class="mb-3">mdi-information-outline</v-icon>
            <div class="text-h6 mb-2">暂无订单信息</div>
            <div class="text-body-2">订单已全部取消，无法查看详情</div>
          </div>
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" color="primary" @click="orderDetailsDialog = false">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
    cancelReason?: string | null;
  } | null;
}

interface Props {
  modelValue: boolean;
  session: DeliverySession | null;
  routes?: RouteInfo[];
}

const props = defineProps<Props>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// 控制订单详情dialog
const orderDetailsDialog = ref(false);

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 计算订单总数（包括已取消的订单）
const getTotalOrderCount = () => {
  if (props.routes && props.routes.length > 0) {
    // 如果有 routes 数据，返回所有订单的数量（包括已取消的）
    return props.routes.filter((r) => r.order).length;
  }
  // 否则使用 session 中的 orderCount
  return props.session?.orderCount || 0;
};

const calculateAvgDistance = () => {
  const orderCount = getTotalOrderCount();
  if (!props.session || !orderCount || orderCount === 0) {
    return '0.00';
  }
  const avgDistance = (props.session.totalDistance || 0) / orderCount / 1000;
  return avgDistance.toFixed(2);
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'in_progress':
      return 'warning';
    case 'pending':
      return 'info';
    default:
      return 'grey';
  }
};

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return 'mdi-check-circle';
    case 'cancelled':
      return 'mdi-close-circle';
    case 'in_progress':
      return 'mdi-truck-delivery';
    case 'pending':
      return 'mdi-clock-outline';
    default:
      return 'mdi-help-circle';
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'cancelled':
      return '已取消';
    case 'in_progress':
      return '进行中';
    case 'pending':
      return '待开始';
    default:
      return '未知';
  }
};

// 获取订单状态颜色
const getOrderStatusColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'in_progress':
      return 'warning';
    case 'pending':
      return 'info';
    default:
      return 'primary';
  }
};
</script>

<style scoped>
.bg-primary {
  background-color: rgb(var(--v-theme-primary)) !important;
}

.cursor-pointer {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
}

/* 订单详情列表 */
.order-details-list {
  max-height: 65vh;
  overflow-y: auto;
  padding: 4px;
}

/* 订单卡片 */
.order-card {
  border-radius: 12px !important;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.cancelled-order {
  background: #fff5f5 !important;
  border-color: #ffcdd2 !important;
}

.cancelled-order:hover {
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.2) !important;
}

/* 订单头部 */
.order-header {
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 240, 240, 0.5) 100%);
  border-bottom: 2px solid #f5f5f5;
}

.order-number {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 订单详情 */
.order-details {
  padding: 0 24px 20px 24px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px dashed #e0e0e0;
}

.detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  flex-shrink: 0;
}

.detail-content {
  flex: 1;
  margin-left: 16px;
}

.detail-label {
  font-size: 12px;
  color: #757575;
  margin-bottom: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 15px;
  color: #212121;
  line-height: 1.5;
}

/* 取消原因特殊样式 */
.cancel-reason {
  background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%);
  margin: 12px -24px -20px;
  padding: 16px 24px;
  border-bottom: none;
  border-top: 2px solid #ef5350;
  border-radius: 0 0 12px 12px;
}

.cancel-reason .detail-icon {
  background: #ffebee;
  border: 1px solid #ffcdd2;
}

/* 滚动条样式 */
.order-details-list::-webkit-scrollbar {
  width: 8px;
}

.order-details-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.order-details-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.order-details-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
