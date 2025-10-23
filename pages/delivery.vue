<template>
  <div>
    <!-- 顶部应用栏 -->
    <v-app-bar color="primary" density="compact">
      <v-btn icon="mdi-arrow-left" @click="goBack" />
      <v-app-bar-title>配送进行中</v-app-bar-title>
    </v-app-bar>

    <v-container class="mt-4">
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
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref<'success' | 'error'>('success');

// 配送项列表（包含完成状态）
const deliveryItems = ref<DeliveryItem[]>([]);

// 初始化配送项
onMounted(() => {
  if (routeData.value?.optimizedRoute) {
    deliveryItems.value = routeData.value.optimizedRoute.map((item) => ({
      ...item,
      completed: false,
    }));
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

// 标记订单完成
const handleComplete = (index: number) => {
  const item = deliveryItems.value[index];
  if (item && item.orderId !== null) {
    item.completed = true;
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
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // 尝试打开高德地图
  window.location.href = amapUrl;

  // 如果高德地图没有安装，延迟后打开 Google Maps
  setTimeout(() => {
    window.open(googleUrl, '_blank');
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
