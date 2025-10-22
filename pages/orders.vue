<template>
  <v-container>
    <!-- 页面标题 -->
    <v-row class="text-center mb-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold">订单管理</h2>
        <p class="text-body-2 text-medium-emphasis">管理您的配送订单</p>
      </v-col>
    </v-row>

    <!-- 空状态 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <v-empty-state
              icon="mdi-package-variant"
              title="暂无订单"
              text="点击下方按钮添加新订单"
            >
              <template #actions>
                <v-btn color="primary" size="large" prepend-icon="mdi-plus">
                  添加订单
                </v-btn>
              </template>
            </v-empty-state>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
useHead({
  title: '订单管理 - 配送路径优化系统',
});
</script>
