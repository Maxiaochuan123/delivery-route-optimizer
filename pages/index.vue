<template>
  <v-container>
    <!-- 页面标题 -->
    <v-row class="text-center mb-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold">配送路线规划</h2>
        <p class="text-body-2 text-medium-emphasis">输入订单信息，智能优化配送路线</p>
      </v-col>
    </v-row>

    <!-- 快速开始 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>快速开始</v-card-title>
          <v-card-text>
            <v-btn block color="primary" size="large" class="mb-3" prepend-icon="mdi-package-variant">
              添加订单
            </v-btn>
            <v-btn block variant="outlined" size="large" class="mb-3" prepend-icon="mdi-map-marker">
              设置起点
            </v-btn>
            <v-btn block variant="outlined" size="large" prepend-icon="mdi-map-search">
              优化路线
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 功能特性 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>功能特性</v-card-title>
          <v-list>
            <v-list-item prepend-icon="mdi-check-circle" title="智能路线优化算法" />
            <v-list-item prepend-icon="mdi-check-circle" title="实时地图显示" />
            <v-list-item prepend-icon="mdi-check-circle" title="一键导航功能" />
            <v-list-item prepend-icon="mdi-check-circle" title="配送历史记录" />
            <v-list-item prepend-icon="mdi-check-circle" title="常用地址管理" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
useHead({
  title: '首页 - 配送路径优化系统',
});
</script>
