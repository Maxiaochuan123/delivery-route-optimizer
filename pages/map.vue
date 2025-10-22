<template>
  <v-container>
    <!-- 页面标题 -->
    <v-row class="text-center mb-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold">地图视图</h2>
        <p class="text-body-2 text-medium-emphasis">查看配送路线和位置</p>
      </v-col>
    </v-row>

    <!-- 地图占位 -->
    <v-row>
      <v-col cols="12">
        <v-card height="500">
          <v-card-text class="d-flex flex-column align-center justify-center" style="height: 100%">
            <v-icon size="100" color="grey-lighten-2">mdi-map-outline</v-icon>
            <p class="text-h6 text-medium-emphasis mt-4">地图功能开发中...</p>
            <p class="text-body-2 text-medium-emphasis">即将支持实时路线显示</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
useHead({
  title: '地图视图 - 配送路径优化系统',
});
</script>
