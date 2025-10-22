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
              <v-list-item
                v-for="(marker, index) in markers"
                :key="index"
              >
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
                  经度: {{ marker.position[0].toFixed(6) }}, 纬度: {{ marker.position[1].toFixed(6) }}
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

const handleMapReady = (map: any) => {
  mapInstance.value = map;
  showSnackbar('地图加载完成');
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
    const number = markers.value.filter(m => m.type === 'point').length + 1;
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
  if (!process.client) return;

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
      const number = markers.value.slice(0, i + 1).filter(mk => mk.type === 'point').length;
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
  markers.value.forEach(marker => {
    if (marker.markerInstance) {
      removeMarker(marker.markerInstance);
    }
  });
});
</script>
