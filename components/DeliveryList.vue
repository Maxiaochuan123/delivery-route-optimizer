<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>配送清单</span>
      <v-chip :color="completedCount === totalCount ? 'success' : 'primary'" size="small">
        {{ completedCount }} / {{ totalCount }} 已完成
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- 进度条 -->
      <v-progress-linear
        :model-value="progressPercentage"
        color="success"
        height="8"
        rounded
        class="mb-4"
      />

      <!-- 配送项列表 -->
      <div v-if="deliveryItems.length > 0">
        <DeliveryItem
          v-for="(item, index) in deliveryItems"
          :key="index"
          :item="item"
          @complete="handleComplete(index)"
          @navigate="handleNavigate(item)"
          @cancel="handleCancel(index)"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-clipboard-list-outline</v-icon>
        <p class="text-body-1 text-medium-emphasis mt-4">暂无配送任务</p>
        <p class="text-body-2 text-medium-emphasis">请先优化路线</p>
      </div>

      <!-- 完成总结 -->
      <v-alert
        v-if="allCompleted && deliveryItems.length > 0"
        type="success"
        variant="tonal"
        class="mt-4"
      >
        <div class="text-h6 mb-2">🎉 配送完成！</div>
        <div class="text-body-2">
          <div>总配送点: {{ totalCount }}</div>
          <div>总距离: {{ totalDistance }} km</div>
          <div>总时间: {{ totalDuration }} 分钟</div>
        </div>
      </v-alert>
    </v-card-text>
  </v-card>
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

interface Props {
  items: DeliveryItem[];
  totalDistance?: number;
  totalDuration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  totalDistance: 0,
  totalDuration: 0,
});

const emit = defineEmits<{
  complete: [index: number];
  navigate: [item: DeliveryItem];
  cancel: [index: number];
}>();

// 添加 completed 属性到每个项
const deliveryItems = computed(() => {
  return props.items.map((item) => ({
    ...item,
    completed: item.completed || false,
  }));
});

// 计算完成数量（不包括起始位置）
const completedCount = computed(() => {
  return deliveryItems.value.filter((item) => item.orderId !== null && item.completed).length;
});

// 总配送点数量（不包括起始位置）
const totalCount = computed(() => {
  return deliveryItems.value.filter((item) => item.orderId !== null).length;
});

// 进度百分比
const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0;
  return (completedCount.value / totalCount.value) * 100;
});

// 是否全部完成
const allCompleted = computed(() => {
  return totalCount.value > 0 && completedCount.value === totalCount.value;
});

const handleComplete = (index: number) => {
  emit('complete', index);
};

const handleNavigate = (item: DeliveryItem) => {
  emit('navigate', item);
};

const handleCancel = (index: number) => {
  emit('cancel', index);
};
</script>
