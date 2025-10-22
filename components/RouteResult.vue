<template>
  <v-card v-if="result">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>路线优化结果</span>
      <v-chip color="success" size="small">
        <v-icon start>mdi-check-circle</v-icon>
        已优化
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- 统计信息 -->
      <v-row class="mb-4">
        <v-col cols="6" md="3">
          <div class="text-center">
            <v-icon size="32" color="primary">mdi-map-marker-distance</v-icon>
            <div class="text-h6 mt-2">{{ result.summary.totalDistanceKm }} km</div>
            <div class="text-caption text-medium-emphasis">总距离</div>
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-center">
            <v-icon size="32" color="primary">mdi-clock-outline</v-icon>
            <div class="text-h6 mt-2">{{ result.summary.totalDurationMin }} 分钟</div>
            <div class="text-caption text-medium-emphasis">预计时间</div>
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-center">
            <v-icon size="32" color="primary">mdi-package-variant</v-icon>
            <div class="text-h6 mt-2">{{ result.summary.orderCount }}</div>
            <div class="text-caption text-medium-emphasis">订单数量</div>
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-center">
            <v-icon size="32" color="primary">mdi-map-marker-multiple</v-icon>
            <div class="text-h6 mt-2">{{ result.summary.stopCount }}</div>
            <div class="text-caption text-medium-emphasis">配送点</div>
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- 配送顺序列表 -->
      <div class="text-subtitle-2 mb-3">配送顺序</div>
      <v-list>
        <v-list-item
          v-for="(point, index) in result.optimizedRoute"
          :key="index"
          class="border-b"
        >
          <template #prepend>
            <v-avatar
              :color="point.orderId === null ? 'success' : 'primary'"
              size="40"
            >
              <span class="text-h6" v-if="point.orderId === null">起</span>
              <span class="text-h6" v-else>{{ index }}</span>
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-medium">
            {{ point.orderId === null ? '起始位置' : point.customerName }}
          </v-list-item-title>

          <v-list-item-subtitle class="mt-1">
            <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
            {{ point.address }}
          </v-list-item-subtitle>

          <v-list-item-subtitle v-if="point.items" class="mt-1">
            <v-icon size="small" class="mr-1">mdi-package-variant</v-icon>
            {{ point.items }}
          </v-list-item-subtitle>

          <v-list-item-subtitle v-if="point.distanceToNext > 0" class="mt-1 text-primary">
            <v-icon size="small" class="mr-1">mdi-arrow-down</v-icon>
            {{ (point.distanceToNext / 1000).toFixed(2) }} km · 
            {{ Math.round(point.durationToNext / 60) }} 分钟
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <!-- 操作按钮 -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-btn
            block
            color="primary"
            prepend-icon="mdi-map"
            @click="$emit('view-on-map')"
          >
            在地图上查看
          </v-btn>
        </v-col>
        <v-col cols="12" md="6">
          <v-btn
            block
            variant="outlined"
            prepend-icon="mdi-navigation"
            @click="$emit('start-delivery')"
          >
            开始配送
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <v-card v-else>
    <v-card-text class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-map-search-outline</v-icon>
      <p class="text-body-1 text-medium-emphasis mt-4">暂无优化结果</p>
      <p class="text-body-2 text-medium-emphasis">请先添加订单并优化路线</p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
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

interface RouteResult {
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

defineProps<{
  result: RouteResult | null;
}>();

defineEmits<{
  'view-on-map': [];
  'start-delivery': [];
}>();
</script>
