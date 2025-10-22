<template>
  <v-app>
    <!-- 顶部应用栏 -->
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>配送路径优化</v-app-bar-title>
    </v-app-bar>

    <!-- 主内容区 -->
    <v-main>
      <slot />
    </v-main>

    <!-- 底部导航栏 -->
    <v-bottom-navigation v-model="activeTab" grow bg-color="white" elevation="8">
      <v-btn value="home" to="/">
        <v-icon :color="activeTab === 'home' ? '#667eea' : '#9E9E9E'">mdi-home</v-icon>
        <span>首页</span>
      </v-btn>

      <v-btn value="orders" to="/orders">
        <v-icon :color="activeTab === 'orders' ? '#FF6B6B' : '#9E9E9E'">mdi-package-variant</v-icon>
        <span>订单</span>
      </v-btn>

      <v-btn value="map" to="/map">
        <v-icon :color="activeTab === 'map' ? '#4ECDC4' : '#9E9E9E'">mdi-map</v-icon>
        <span>地图</span>
      </v-btn>

      <v-btn value="history" to="/history">
        <v-icon :color="activeTab === 'history' ? '#FFD93D' : '#9E9E9E'">mdi-chart-line</v-icon>
        <span>历史</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup lang="ts">
const route = useRoute();

const activeTab = computed(() => {
  const path = route.path;
  if (path === '/') return 'home';
  if (path.startsWith('/orders')) return 'orders';
  if (path.startsWith('/map')) return 'map';
  if (path.startsWith('/history')) return 'history';
  return 'home';
});
</script>
