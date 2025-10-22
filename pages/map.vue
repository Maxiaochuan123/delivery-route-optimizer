<template>
  <v-container>
    <!-- 页面标题 -->
    <v-row class="text-center mb-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold">地图视图</h2>
        <p class="text-body-2 text-medium-emphasis">查看配送路线和订单位置</p>
      </v-col>
    </v-row>

    <!-- 地图容器 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text class="pa-0">
            <MapContainer
              ref="mapRef"
              :center="mapCenter"
              :zoom="mapZoom"
              height="calc(100vh - 280px)"
              @map-ready="handleMapReady"
              @click="handleMapClick"
            />
            <!-- 路线绘制 -->
            <RoutePolyline
              v-if="mapInstance && routePoints.length > 0"
              :map="mapInstance"
              :route="routePoints"
              @marker-click="handleMarkerClick"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 地图控制面板 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>地图控制</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-btn
                  block
                  color="primary"
                  prepend-icon="mdi-crosshairs-gps"
                  @click="getCurrentLocation"
                  :loading="locating"
                >
                  获取当前位置
                </v-btn>
              </v-col>
              <v-col cols="12" md="6">
                <v-btn
                  block
                  variant="outlined"
                  prepend-icon="mdi-map-marker-plus"
                  @click="addMarkerMode = !addMarkerMode"
                  :color="addMarkerMode ? 'primary' : undefined"
                >
                  {{ addMarkerMode ? '取消添加标记' : '点击地图添加标记' }}
                </v-btn>
              </v-col>
            </v-row>

            <!-- 标记列表 -->
            <v-list v-if="markers.length > 0" class="mt-4">
              <v-list-subheader>地图标记</v-list-subheader>
              <v-list-item v-for="(marker, index) in markers" :key="index">
                <template #prepend>
                  <v-avatar :color="marker.type === 'start' ? 'success' : 'primary'" size="32">
                    <span v-if="marker.type === 'start'">起</span>
                    <span v-else>{{ index }}</span>
                  </v-avatar>
                </template>

                <v-list-item-title>
                  {{ marker.type === 'start' ? '起始位置' : `标记点 ${index}` }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  经度: {{ marker.position[0].toFixed(6) }}, 纬度:
                  {{ marker.position[1].toFixed(6) }}
                </v-list-item-subtitle>

                <template #append>
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="removeMarkerAt(index)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 订单详情对话框 -->
    <v-dialog v-model="detailDialog" max-width="500">
      <v-card v-if="selectedPoint">
        <v-card-title>
          {{ selectedPoint.orderId === null ? '起始位置' : '订单详情' }}
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item v-if="selectedPoint.orderId !== null">
              <template #prepend>
                <v-icon>mdi-account</v-icon>
              </template>
              <v-list-item-title>客户姓名</v-list-item-title>
              <v-list-item-subtitle>{{ selectedPoint.customerName }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-map-marker</v-icon>
              </template>
              <v-list-item-title>地址</v-list-item-title>
              <v-list-item-subtitle>{{ selectedPoint.address }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedPoint.items">
              <template #prepend>
                <v-icon>mdi-package-variant</v-icon>
              </template>
              <v-list-item-title>商品信息</v-list-item-title>
              <v-list-item-subtitle>{{ selectedPoint.items }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedPoint.notes">
              <template #prepend>
                <v-icon>mdi-note-text</v-icon>
              </template>
              <v-list-item-title>备注</v-list-item-title>
              <v-list-item-subtitle>{{ selectedPoint.notes }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedPoint.distanceToNext > 0">
              <template #prepend>
                <v-icon>mdi-map-marker-distance</v-icon>
              </template>
              <v-list-item-title>到下一点</v-list-item-title>
              <v-list-item-subtitle>
                {{ (selectedPoint.distanceToNext / 1000).toFixed(2) }} km ·
                {{ Math.round(selectedPoint.durationToNext / 60) }} 分钟
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 提示信息 -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
useHead({
  title: '地图视图 - 配送路径优化系统',
});

console.log('Map page loaded');

const mapRef = ref();
const mapInstance = ref<any>(null);
const mapCenter = ref<[number, number]>([116.397428, 39.90923]);
const mapZoom = ref(13);
const locating = ref(false);
const addMarkerMode = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

interface MarkerData {
  type: 'start' | 'point';
  position: [number, number];
  markerInstance: any;
}

const markers = ref<MarkerData[]>([]);
const { createNumberedMarker, createStartMarker, removeMarker } = useMapMarker();

// 路线数据
const { routeData } = useRouteStore();
const routePoints = computed(() => {
  return routeData.value?.optimizedRoute || [];
});

// 页面加载时检查路线数据
onMounted(() => {
  console.log('Map page mounted, route points:', routePoints.value.length);
});

// 监听路线数据，自动调整地图中心
watch(
  routePoints,
  (points) => {
    if (points.length > 0 && mapInstance.value) {
      // 使用第一个点（起始位置）作为中心
      const firstPoint = points[0];
      if (firstPoint) {
        mapCenter.value = [firstPoint.lng, firstPoint.lat];
        mapInstance.value.setCenter([firstPoint.lng, firstPoint.lat]);
        mapInstance.value.setZoom(13);
      }
    }
  },
  { immediate: true }
);

const detailDialog = ref(false);
const selectedPoint = ref<any>(null);

const handleMapReady = (map: any) => {
  mapInstance.value = map;
  console.log('Map ready, route points:', routePoints.value.length);
  showSnackbar('地图加载完成');
};

const handleMarkerClick = (point: any) => {
  selectedPoint.value = point;
  detailDialog.value = true;
};

const handleMapClick = (lnglat: { lng: number; lat: number }) => {
  if (!addMarkerMode.value || !mapInstance.value) return;

  const position: [number, number] = [lnglat.lng, lnglat.lat];

  // 如果还没有起始点，第一个点作为起始点
  if (markers.value.length === 0) {
    const markerInstance = createStartMarker(mapInstance.value, position);
    markers.value.push({
      type: 'start',
      position,
      markerInstance,
    });
    showSnackbar('已添加起始位置');
  } else {
    // 后续点作为配送点
    const number = markers.value.filter((m) => m.type === 'point').length + 1;
    const markerInstance = createNumberedMarker(mapInstance.value, position, number);
    markers.value.push({
      type: 'point',
      position,
      markerInstance,
    });
    showSnackbar(`已添加标记点 ${number}`);
  }
};

const getCurrentLocation = () => {
  locating.value = true;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;

        mapCenter.value = [lng, lat];

        if (mapInstance.value) {
          mapInstance.value.setCenter([lng, lat]);
          mapInstance.value.setZoom(15);
        }

        showSnackbar('定位成功');
        locating.value = false;
      },
      (error) => {
        console.error('Geolocation error:', error);
        showSnackbar('定位失败，请检查定位权限', 'error');
        locating.value = false;
      }
    );
  } else {
    showSnackbar('浏览器不支持定位功能', 'error');
    locating.value = false;
  }
};

const removeMarkerAt = (index: number) => {
  const marker = markers.value[index];
  if (!marker) return;

  if (marker.markerInstance) {
    removeMarker(marker.markerInstance);
  }
  markers.value.splice(index, 1);

  // 重新编号剩余的配送点
  markers.value.forEach((m, i) => {
    if (m.type === 'point' && m.markerInstance) {
      removeMarker(m.markerInstance);
      const number = markers.value.slice(0, i + 1).filter((mk) => mk.type === 'point').length;
      m.markerInstance = createNumberedMarker(mapInstance.value, m.position, number);
    }
  });

  showSnackbar('标记已删除');
};

const showSnackbar = (text: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

// 清理标记
onBeforeUnmount(() => {
  markers.value.forEach((marker) => {
    if (marker.markerInstance) {
      removeMarker(marker.markerInstance);
    }
  });
});
</script>
