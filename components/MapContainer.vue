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
const nuxtApp = useNuxtApp();

onMounted(async () => {
  try {
    // 等待 AMap 加载完成
    if (nuxtApp.$waitForAMap) {
      await (nuxtApp.$waitForAMap as () => Promise<void>)();
    }
    initMap();
  } catch (error) {
    console.error('Failed to load AMap:', error);
  }
});

const initMap = () => {
  if (!mapContainer.value) {
    console.error('Map container not found');
    return;
  }

  console.log('Initializing AMap with center:', props.center, 'zoom:', props.zoom);

  try {
    map.value = new window.AMap.Map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      viewMode: '2D',
      resizeEnable: true,
    });

    console.log('AMap initialized successfully');

    // 地图点击事件
    map.value.on('click', (e: any) => {
      emit('click', {
        lng: e.lnglat.getLng(),
        lat: e.lnglat.getLat(),
      });
    });

    emit('mapReady', map.value);
  } catch (error) {
    console.error('Error initializing AMap:', error);
  }
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
