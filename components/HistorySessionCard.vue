<template>
  <v-card class="mb-3 session-card" elevation="2" @click="$emit('view-details', session)">
    <v-card-text class="pa-4">
      <!-- 日期和状态 -->
      <div class="d-flex justify-space-between align-center mb-3">
        <div>
          <div class="text-h6 font-weight-medium">
            {{ formatDate(session.createdAt) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatTime(session.createdAt) }}
          </div>
        </div>
        <v-chip :color="statusColor" size="small" variant="flat">
          <v-icon start size="small">
            {{ statusIcon }}
          </v-icon>
          {{ statusText }}
        </v-chip>
      </div>

      <!-- 起始位置 -->
      <div class="mb-3">
        <div class="d-flex align-start">
          <v-icon size="small" class="mr-2 mt-1" color="success">mdi-map-marker</v-icon>
          <div class="flex-grow-1">
            <div class="text-caption text-medium-emphasis">起点</div>
            <div class="text-body-2">{{ session.startLocation }}</div>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <v-divider class="my-3" />
      <v-row dense>
        <v-col cols="4">
          <div class="text-center">
            <div class="text-h5 text-primary font-weight-bold">{{ session.orderCount }}</div>
            <div class="text-caption text-medium-emphasis">订单数</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="text-center">
            <div class="text-h5 text-primary font-weight-bold">
              {{ ((session.totalDistance || 0) / 1000).toFixed(2) }}
            </div>
            <div class="text-caption text-medium-emphasis">距离(km)</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="text-center">
            <div class="text-h5 text-primary font-weight-bold">
              {{ Math.round((session.totalDuration || 0) / 60) }}
            </div>
            <div class="text-caption text-medium-emphasis">时间(分钟)</div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
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

interface Props {
  session: DeliverySession;
}

const props = defineProps<Props>();

defineEmits<{
  'view-details': [session: DeliverySession];
}>();

// 状态相关的计算属性
const statusColor = computed(() => {
  switch (props.session.status) {
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'in_progress':
      return 'warning';
    default:
      return 'grey';
  }
});

const statusIcon = computed(() => {
  switch (props.session.status) {
    case 'completed':
      return 'mdi-check-circle';
    case 'cancelled':
      return 'mdi-close-circle';
    case 'in_progress':
      return 'mdi-clock-outline';
    default:
      return 'mdi-help-circle';
  }
});

const statusText = computed(() => {
  switch (props.session.status) {
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
});

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.session-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
</style>
