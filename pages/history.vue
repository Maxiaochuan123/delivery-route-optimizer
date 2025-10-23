<template>
  <div>
    <!-- 顶部应用栏 -->
    <v-app-bar color="primary" density="compact">
      <v-btn icon="mdi-arrow-left" @click="goBack" />
      <v-app-bar-title>配送历史记录</v-app-bar-title>
    </v-app-bar>

    <v-container class="mt-4">
      <v-row class="mb-2">
        <v-col cols="12">
          <p class="text-body-2 text-medium-emphasis text-center">查看过往配送记录和统计信息</p>
        </v-col>
      </v-row>

    <!-- 统计卡片 -->
    <v-row>
      <v-col cols="4">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 text-primary font-weight-bold">0</div>
            <div class="text-caption text-medium-emphasis">总配送次数</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 text-primary font-weight-bold">0</div>
            <div class="text-caption text-medium-emphasis">总距离(km)</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 text-primary font-weight-bold">0</div>
            <div class="text-caption text-medium-emphasis">总订单数</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 配送记录 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>配送记录</span>
            <v-select
              v-model="filter"
              :items="filterOptions"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 150px"
            />
          </v-card-title>
          <v-card-text>
            <v-empty-state
              icon="mdi-clipboard-text-outline"
              title="暂无配送记录"
              text="完成配送后，记录将显示在这里"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  name: 'history',
  keepalive: true,
});

useHead({
  title: '历史记录 - 配送路径优化系统',
});

const filter = ref('all');
const filterOptions = [
  { title: '全部记录', value: 'all' },
  { title: '今天', value: 'today' },
  { title: '本周', value: 'week' },
  { title: '本月', value: 'month' },
];

// 返回首页
const goBack = () => {
  navigateTo('/');
};
</script>
