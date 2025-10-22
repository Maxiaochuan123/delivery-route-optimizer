<template>
  <div ref="mapContainer" class="map-container" />
</template>

<script setup lang="ts">
interface Props {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [116.397428, 39.90923], // 默认北京
  zoom: 13,
  height: '400px',
});

const emit = defineEmits<{
  mapReady: [map: any];
  click: [lnglat: { lng: number; lat: number }];
}>();

const mapContainer = ref<HTMLDivElement>();
const map = ref<any>(null);

onMounted(() => {
  // 确保在客户端环境且 AMap 已加载
  if (process.client && window.AMap) {
    initMap();
  } else if (process.client) {
    // 如果 AMap 还未加载，等待加载完成
    const checkAMap = setInterval(() => {
      if (window.AMap) {
        clearInterval(checkAMap);
        initMap();
      }
    }, 100);
  }
});

const initMap = () => {
  if (!mapContainer.value) return;

  map.value = new window.AMap.Map(mapContainer.value, {
    center: props.center,
    zoom: props.zoom,
    viewMode: '2D',
    resizeEnable: true,
  });

  // 地图点击事件
  map.value.on('click', (e: any) => {
    emit('click', {
      lng: e.lnglat.getLng(),
      lat: e.lnglat.getLat(),
    });
  });

  emit('mapReady', map.value);
};

// 暴露地图实例给父组件
defineExpose({
  map,
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: v-bind(height);
  border-radius: 8px;
  overflow: hidden;
}
</style>
