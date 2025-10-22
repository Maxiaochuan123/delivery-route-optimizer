<template>
  <div></div>
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
}

interface Props {
  map: any;
  route: RoutePoint[];
  showLabels?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLabels: true,
});

const emit = defineEmits<{
  'marker-click': [point: RoutePoint];
}>();

const polyline = ref<any>(null);
const markers = ref<any[]>([]);
const hasDrawn = ref(false);

// 组件挂载后绘制
onMounted(() => {
  if (props.map && props.route && props.route.length > 0) {
    nextTick(() => {
      drawRoute();
    });
  }
});

// 只监听路线数组的引用变化，不使用 deep
watch(
  () => props.route,
  (newRoute, oldRoute) => {
    // 只在路线真正改变时重新绘制
    if (newRoute !== oldRoute && newRoute && newRoute.length > 0 && props.map) {
      nextTick(() => {
        drawRoute();
      });
    }
  }
);

// 监听地图实例变化（只在首次获得地图实例时绘制）
watch(
  () => props.map,
  (newMap, oldMap) => {
    if (newMap && !oldMap && props.route && props.route.length > 0 && !hasDrawn.value) {
      nextTick(() => {
        drawRoute();
      });
    }
  }
);

const drawRoute = () => {
  // 清除旧的路线和标记
  clearRoute();

  if (!props.map || !props.route || props.route.length === 0) {
    return;
  }

  // 确保 AMap 已加载
  if (!window.AMap) {
    console.warn('AMap is not loaded yet');
    return;
  }

  try {
    // 准备路径点
    const path = props.route.map((point) => [point.lng, point.lat]);

    // 绘制路线
    polyline.value = new window.AMap.Polyline({
      path,
      strokeColor: '#1976D2', // 蓝色
      strokeWeight: 6,
      strokeOpacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round',
    });

    polyline.value.setMap(props.map);

    // 添加标记
    props.route.forEach((point, index) => {
      const marker = createMarker(point, index);
      if (marker) {
        markers.value.push(marker);
      }
    });

    // 自动调整地图视野以显示所有点
    if (markers.value.length > 0) {
      props.map.setFitView(markers.value);
    }

    hasDrawn.value = true;
    console.log('Route drawn successfully with', props.route.length, 'points');
  } catch (error) {
    console.error('Error drawing route:', error);
  }
};

const createMarker = (point: RoutePoint, index: number) => {
  if (!window.AMap) return null;

  try {
    const isStart = point.orderId === null;

    // 创建标记内容
    const content = document.createElement('div');
    content.className = 'custom-marker';
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    `;

    // 创建标记图标
    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 36px;
      height: 36px;
      background-color: ${isStart ? '#4CAF50' : '#1976D2'};
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    icon.textContent = isStart ? '起' : String(index);
    content.appendChild(icon);

    // 如果需要显示标签
    if (props.showLabels) {
      const label = document.createElement('div');
      label.style.cssText = `
        margin-top: 4px;
        padding: 4px 8px;
        background-color: white;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      label.textContent = isStart ? '起始位置' : point.address;
      content.appendChild(label);
    }

    const marker = new window.AMap.Marker({
      position: [point.lng, point.lat],
      content,
      offset: new window.AMap.Pixel(-18, -18),
    });

    marker.setMap(props.map);

    // 添加点击事件
    marker.on('click', () => {
      emit('marker-click', point);
    });

    return marker;
  } catch (error) {
    console.error('Error creating marker:', error);
    return null;
  }
};

const clearRoute = () => {
  // 清除路线
  if (polyline.value) {
    polyline.value.setMap(null);
    polyline.value = null;
  }

  // 清除标记
  markers.value.forEach((marker) => {
    marker.setMap(null);
  });
  markers.value = [];
};

// 组件卸载时清理
onBeforeUnmount(() => {
  clearRoute();
});

// 暴露方法
defineExpose({
  clearRoute,
});
</script>

<style scoped>
.custom-marker {
  transition: transform 0.2s;
}

.custom-marker:hover {
  transform: scale(1.1);
}
</style>
