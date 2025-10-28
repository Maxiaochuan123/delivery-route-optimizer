<template>
  <v-card :class="{ 'opacity-60': item.completed }" class="mb-3">
    <v-card-text>
      <v-row align="center">
        <!-- 序号标记 -->
        <v-col cols="auto">
          <v-avatar :color="item.orderId === null ? 'success' : item.completed ? 'grey' : 'primary'" size="48">
            <span class="text-h6">{{ item.orderId === null ? '起' : item.sequence }}</span>
          </v-avatar>
        </v-col>

        <!-- 订单信息 -->
        <v-col>
          <div class="text-subtitle-1 font-weight-medium">
            {{ item.orderId === null ? '起始位置' : item.customerName }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
            {{ item.address }}
          </div>
          <div v-if="item.items" class="text-body-2 text-medium-emphasis mt-1">
            <v-icon size="small" class="mr-1">mdi-package-variant</v-icon>
            {{ item.items }}
          </div>
          <div v-if="item.notes" class="text-body-2 text-medium-emphasis mt-1">
            <v-icon size="small" class="mr-1">mdi-note-text</v-icon>
            {{ item.notes }}
          </div>
          <div v-if="item.distanceToNext > 0" class="text-body-2 text-primary mt-2">
            <v-icon size="small" class="mr-1">mdi-arrow-right</v-icon>
            到下一点: {{ (item.distanceToNext / 1000).toFixed(2) }} km · 
            {{ Math.round(item.durationToNext / 60) }} 分钟
          </div>
        </v-col>

        <!-- 操作按钮 -->
        <v-col cols="auto">
          <div class="d-flex flex-column ga-1">
            <v-btn
              v-if="!item.completed && item.orderId !== null"
              icon="mdi-check"
              color="success"
              variant="text"
              size="small"
              @click="handleComplete"
            />
            <v-btn
              v-if="item.orderId !== null"
              icon="mdi-navigation"
              color="primary"
              variant="text"
              size="small"
              @click="handleNavigate"
            />
            <v-btn
              v-if="!item.completed && item.orderId !== null"
              icon="mdi-close"
              color="error"
              variant="text"
              size="small"
              @click="handleCancel"
            />
          </div>
        </v-col>
      </v-row>
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
  item: DeliveryItem;
}

defineProps<Props>();

const emit = defineEmits<{
  complete: [];
  navigate: [];
  cancel: [];
}>();

const handleComplete = () => {
  emit('complete');
};

const handleNavigate = () => {
  emit('navigate');
};

const handleCancel = () => {
  emit('cancel');
};
</script>
