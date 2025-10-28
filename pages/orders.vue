<template>
  <v-container>
    <!-- 页面标题 -->
    <v-row class="text-center mb-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold">订单管理</h2>
        <p class="text-body-2 text-medium-emphasis">管理您的配送订单</p>
      </v-col>
    </v-row>

    <!-- 订单输入表单 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>添加订单</v-card-title>
          <v-card-text>
            <OrderForm mode="create" @submit="handleAddOrder" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 进行中的订单 -->
    <v-row v-if="inProgressOrders.length > 0">
      <v-col cols="12">
        <v-card class="in-progress-card">
          <v-card-title class="d-flex align-center justify-space-between">
            <div
              class="d-flex align-center flex-grow-1"
              @click="goToDelivery"
              style="cursor: pointer"
            >
              <v-icon class="mr-2">mdi-truck-delivery</v-icon>
              进行中
              <v-chip class="ml-2" size="small" color="warning">
                {{ inProgressOrders.length }} 个订单
              </v-chip>
            </div>
            <v-btn
              icon="mdi-close"
              size="small"
              variant="text"
              color="error"
              @click.stop="handleAbandonDelivery"
            />
          </v-card-title>
          <v-card-text @click="goToDelivery" style="cursor: pointer">
            <OrderList :orders="inProgressOrders" :readonly="true" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 待开始的订单 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-clock-outline</v-icon>
              待开始
              <v-chip class="ml-2" size="small">{{ orders.length }} 个订单</v-chip>
            </div>
            <div v-if="orders.length > 0" class="d-flex align-center ga-2">
              <v-btn size="small" variant="text" @click="selectAllOrders">
                {{ selectedOrderIds.length === orders.length ? '取消全选' : '全选' }}
              </v-btn>
            </div>
          </v-card-title>
          <v-card-text>
            <OrderList
              :orders="orders"
              :selectable="true"
              v-model:selected-orders="selectedOrderIds"
              @edit="handleEditOrder"
              @delete="handleDeleteOrder"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 路线优化 -->
    <v-row v-if="selectedOrderIds.length > 1">
      <v-col cols="12">
        <v-card ref="routeOptimizationCard">
          <v-card-title>路线优化</v-card-title>
          <v-card-text>
            <!-- 检查订单坐标 -->
            <v-alert
              v-if="selectedOrdersWithoutCoords.length > 0"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              <div class="d-flex justify-space-between align-center">
                <span>
                  有
                  {{ selectedOrdersWithoutCoords.length }}
                  个选中订单缺少坐标信息，需要先进行地理编码
                </span>
                <v-btn
                  size="small"
                  color="warning"
                  :loading="geocoding"
                  @click="geocodeSelectedOrders"
                >
                  批量地理编码
                </v-btn>
              </div>
            </v-alert>

            <v-alert type="info" variant="tonal" class="mb-4">
              已选择 {{ selectedOrderIds.length }} 个订单进行路线优化
            </v-alert>

            <AddressAutocomplete
              v-model="startLocationData"
              label="起始地址"
              placeholder="请输入起始地址或点击获取当前位置"
              class="mb-3"
            />

            <v-row>
              <v-col cols="12" md="6">
                <v-btn
                  block
                  variant="outlined"
                  prepend-icon="mdi-crosshairs-gps"
                  :loading="gettingLocation"
                  @click="getCurrentLocation"
                >
                  获取当前位置
                </v-btn>
              </v-col>
              <v-col cols="12" md="6">
                <OptimizeButton
                  block
                  :loading="optimizing"
                  :disabled="
                    !startLocationData ||
                    selectedOrderIds.length === 0 ||
                    selectedOrdersWithoutCoords.length > 0
                  "
                  @click="handleOptimize"
                />
              </v-col>
            </v-row>

            <!-- 当前位置显示 -->
            <v-alert v-if="startLocation" type="success" variant="tonal" class="mt-3">
              <div class="d-flex align-center">
                <div>
                  <div class="font-weight-medium">起始位置已设定</div>
                  <div class="text-caption">{{ startLocation.address }}</div>
                </div>
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 单个订单快速开始 -->
    <v-row v-if="selectedOrderIds.length === 1">
      <v-col cols="12">
        <v-card>
          <v-card-title>快速开始配送</v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal" class="mb-4">
              只选择了一个订单，可以直接开始配送
            </v-alert>
            <v-btn
              block
              color="primary"
              size="large"
              prepend-icon="mdi-navigation"
              @click="startSingleOrderDelivery"
            >
              开始配送
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 未选择订单提示 -->
    <v-row v-if="orders.length > 0 && selectedOrderIds.length === 0">
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-checkbox-marked-circle-outline</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-4">请选择要配送的订单</p>
            <p class="text-body-2 text-medium-emphasis">勾选订单后可以进行路线优化或开始配送</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 优化结果 -->
    <v-row v-if="routeResult">
      <v-col cols="12">
        <RouteResult
          :result="routeResult"
          @view-on-map="viewOnMap"
          @start-delivery="startDelivery"
        />
      </v-col>
    </v-row>

    <!-- 编辑订单对话框 -->
    <v-dialog v-model="editDialog" max-width="600">
      <v-card>
        <v-card-title>编辑订单</v-card-title>
        <v-card-text>
          <OrderForm
            mode="edit"
            :initial-data="editForm"
            :loading="saving"
            @submit="handleSaveEdit"
          >
            <template #actions="{ submit, loading, valid }">
              <v-row>
                <v-col cols="6">
                  <v-btn variant="text" block @click="editDialog = false">取消</v-btn>
                </v-col>
                <v-col cols="6">
                  <v-btn
                    color="primary"
                    variant="flat"
                    block
                    :loading="loading"
                    :disabled="!valid"
                    @click="submit"
                  >
                    保存
                  </v-btn>
                </v-col>
              </v-row>
            </template>
          </OrderForm>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text> 确定要删除这个订单吗？此操作无法撤销。 </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 放弃配送对话框（使用 CancelReasonDialog 组件） -->
    <CancelReasonDialog
      v-model="abandonDialog"
      title="放弃配送"
      message="确定要放弃当前的配送会话吗？所有进行中的订单将恢复为待开始状态。请输入放弃原因："
      @confirm="confirmAbandonDelivery"
    />

    <!-- 成功提示 -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
interface Order {
  id: number;
  address: string;
  lat?: number;
  lng?: number;
  customerName: string;
  items: string;
  notes?: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

definePageMeta({
  name: 'orders',
});

useHead({
  title: '订单管理 - 配送路径优化系统',
});

const orders = ref<Order[]>([]);
const inProgressOrders = ref<Order[]>([]);
const hasActiveSession = ref(false);
const selectedOrderIds = ref<number[]>([]);
const editDialog = ref(false);
const deleteDialog = ref(false);
const abandonDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
const abandoning = ref(false);
const optimizing = ref(false);
const gettingLocation = ref(false);
const geocoding = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const routeOptimizationCard = ref<HTMLElement | null>(null);

// 路线优化相关
const startLocationData = ref<{ address: string; lat: number; lng: number } | null>(null);
const routeResult = ref<any>(null);

const startLocation = computed(() => {
  if (!startLocationData.value) return null;
  return {
    lat: startLocationData.value.lat,
    lng: startLocationData.value.lng,
    address: startLocationData.value.address,
  };
});

// 计算选中的订单
const selectedOrders = computed(() => {
  return orders.value.filter((order) => selectedOrderIds.value.includes(order.id));
});

// 计算选中订单中缺少坐标的订单
const selectedOrdersWithoutCoords = computed(() => {
  return selectedOrders.value.filter((order) => !order.lat || !order.lng);
});

// 全选/取消全选
const selectAllOrders = () => {
  if (selectedOrderIds.value.length === orders.value.length) {
    selectedOrderIds.value = [];
  } else {
    selectedOrderIds.value = orders.value.map((order) => order.id);
  }
};

const editForm = ref<{
  id: number;
  address: string;
  lat?: number;
  lng?: number;
  customerName: string;
  items: string;
  notes?: string;
}>();

const deleteOrderId = ref<number | null>(null);

// 加载订单列表
const loadOrders = async () => {
  try {
    // 加载待开始的订单
    const response = await $fetch<{ success: boolean; data: Order[] }>('/api/orders');
    orders.value = response.data;

    // 加载进行中的订单
    const inProgressResponse = await $fetch<{ success: boolean; data: Order[] }>(
      '/api/orders/in-progress'
    );
    inProgressOrders.value = inProgressResponse.data;

    // 检查是否有活动会话
    const activeSessionResponse = await $fetch<{
      success: boolean;
      data: { hasActiveSession: boolean };
    }>('/api/delivery-sessions/active');
    hasActiveSession.value = activeSessionResponse.data.hasActiveSession;
  } catch (error) {
    showSnackbar('加载订单失败', 'error');
    console.error('Failed to load orders:', error);
  }
};

// 添加订单
const handleAddOrder = async (orderData: {
  address: string;
  lat: number;
  lng: number;
  customerName: string;
  items: string;
  notes?: string;
}) => {
  try {
    const response = await $fetch<{ success: boolean; data: Order }>('/api/orders', {
      method: 'POST',
      body: orderData,
    });

    orders.value.push(response.data);

    // 清除路线优化结果
    routeResult.value = null;

    showSnackbar('订单添加成功');
  } catch (error) {
    showSnackbar('添加订单失败', 'error');
    console.error('Failed to add order:', error);
  }
};

// 编辑订单
const handleEditOrder = (order: Order) => {
  editForm.value = {
    id: order.id,
    address: order.address,
    lat: order.lat,
    lng: order.lng,
    customerName: order.customerName,
    items: order.items,
    notes: order.notes || '',
  };
  editDialog.value = true;
};

// 保存编辑
const handleSaveEdit = async (formData: {
  address: string;
  lat: number;
  lng: number;
  customerName: string;
  items: string;
  notes?: string;
}) => {
  if (!editForm.value) return;

  saving.value = true;
  try {
    const response = await $fetch<{ success: boolean; data: Order }>(
      `/api/orders/${editForm.value.id}`,
      {
        method: 'PUT',
        body: {
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng,
          customerName: formData.customerName,
          items: formData.items,
          notes: formData.notes || undefined,
        },
      }
    );

    const index = orders.value.findIndex((o) => o.id === editForm.value!.id);
    if (index !== -1) {
      orders.value[index] = response.data;
    }

    editDialog.value = false;

    // 清除路线优化结果
    routeResult.value = null;

    showSnackbar('订单更新成功');
  } catch (error) {
    showSnackbar('更新订单失败', 'error');
    console.error('Failed to update order:', error);
  } finally {
    saving.value = false;
  }
};

// 删除订单
const handleDeleteOrder = (id: number) => {
  deleteOrderId.value = id;
  deleteDialog.value = true;
};

// 确认删除
const confirmDelete = async () => {
  if (!deleteOrderId.value) return;

  deleting.value = true;
  try {
    const response = await $fetch<{ success: boolean; data: { message: string; id: number } }>(
      `/api/orders/${deleteOrderId.value}`,
      {
        method: 'DELETE',
      }
    );

    if (response.success) {
      orders.value = orders.value.filter((o) => o.id !== deleteOrderId.value);
      deleteDialog.value = false;
      deleteOrderId.value = null;

      // 清除路线优化结果
      routeResult.value = null;

      showSnackbar('订单删除成功');
    }
  } catch (error: any) {
    console.error('Failed to delete order:', error);
    const errorMessage = error.data?.error?.message || '删除订单失败';
    showSnackbar(errorMessage, 'error');
  } finally {
    deleting.value = false;
  }
};

// 获取当前位置
const getCurrentLocation = () => {
  gettingLocation.value = true;

  if (!navigator.geolocation) {
    showSnackbar('浏览器不支持定位功能', 'error');
    gettingLocation.value = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lng = position.coords.longitude;
      const lat = position.coords.latitude;

      // 使用高德地图逆地理编码获取地址
      try {
        const response = await $fetch<{ success: boolean; data: any }>('/api/geocode/reverse', {
          method: 'POST',
          body: { lat, lng },
        });

        if (response.success && response.data.formattedAddress) {
          const formattedAddress = response.data.formattedAddress;
          startLocationData.value = {
            address: formattedAddress,
            lat,
            lng,
          };
          showSnackbar('定位成功', 'success');
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        const coordsAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        startLocationData.value = {
          address: coordsAddress,
          lat,
          lng,
        };
        showSnackbar('定位成功，但无法获取详细地址', 'warning');
      }

      gettingLocation.value = false;
    },
    (error) => {
      console.error('Geolocation error:', error);
      let errorMessage = '定位失败';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '定位权限被拒绝。请在浏览器设置中允许定位权限，或手动输入地址';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = '无法获取位置信息，请手动输入地址';
          break;
        case error.TIMEOUT:
          errorMessage = '定位超时，请重试或手动输入地址';
          break;
      }

      showSnackbar(errorMessage, 'error');
      gettingLocation.value = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

// 批量地理编码选中的订单
const geocodeSelectedOrders = async () => {
  const ordersToGeocode = selectedOrdersWithoutCoords.value;

  if (ordersToGeocode.length === 0) {
    showSnackbar('所有选中订单都已有坐标信息');
    return;
  }

  geocoding.value = true;
  let successCount = 0;
  let failCount = 0;

  for (const order of ordersToGeocode) {
    try {
      // 获取坐标
      const geocodeResponse = await $fetch<{ success: boolean; data: any }>('/api/geocode', {
        method: 'POST',
        body: { address: order.address },
      });

      if (geocodeResponse.success && geocodeResponse.data) {
        // 更新订单
        const updateResponse = await $fetch<{ success: boolean; data: Order }>(
          `/api/orders/${order.id}`,
          {
            method: 'PUT',
            body: {
              address: order.address,
              customerName: order.customerName,
              items: order.items,
              notes: order.notes,
              lat: geocodeResponse.data.lat,
              lng: geocodeResponse.data.lng,
            },
          }
        );

        if (updateResponse.success) {
          // 更新本地数据
          const index = orders.value.findIndex((o) => o.id === order.id);
          if (index !== -1) {
            orders.value[index] = updateResponse.data;
          }
          successCount++;
        }
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`Failed to geocode order ${order.id}:`, error);
      failCount++;
    }
  }

  geocoding.value = false;

  if (failCount === 0) {
    showSnackbar(`成功为 ${successCount} 个订单添加坐标`);
  } else {
    showSnackbar(`完成地理编码：成功 ${successCount} 个，失败 ${failCount} 个`, 'error');
  }
};

// 优化路线
const handleOptimize = async () => {
  // 检查是否有活动会话
  if (hasActiveSession.value) {
    showSnackbar('您已经有进行中的订单，请先完成！', 'error');
    return;
  }

  if (!startLocation.value) {
    showSnackbar('请输入起始地址或获取当前位置', 'error');
    return;
  }

  if (selectedOrderIds.value.length === 0) {
    showSnackbar('请先选择要配送的订单', 'error');
    return;
  }

  optimizing.value = true;

  try {
    // 调用路线优化 API，只使用选中的订单
    const response = await $fetch<{ success: boolean; data: any }>('/api/routes/optimize-orders', {
      method: 'POST',
      body: {
        startLocation: {
          lat: startLocation.value.lat,
          lng: startLocation.value.lng,
          address: startLocation.value.address,
        },
        orderIds: selectedOrderIds.value,
      },
    });

    if (response.success) {
      routeResult.value = response.data;
      showSnackbar('路线优化成功');

      // 平滑滚动到页面底部
      await nextTick();
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  } catch (error: any) {
    console.error('Route optimization error:', error);
    showSnackbar(error.data?.error?.message || '路线优化失败', 'error');
  } finally {
    optimizing.value = false;
  }
};

// 单个订单直接开始配送
const startSingleOrderDelivery = async () => {
  // 检查是否有活动会话
  if (hasActiveSession.value) {
    showSnackbar('您已经有进行中的订单，请先完成！', 'error');
    return;
  }

  // 获取选中的订单（应该只有一个）
  const selectedOrder = selectedOrders.value[0];

  if (!selectedOrder) {
    showSnackbar('没有选中的订单', 'error');
    return;
  }

  // 检查订单是否有坐标
  if (!selectedOrder.lat || !selectedOrder.lng) {
    showSnackbar('订单缺少坐标信息，请先进行地理编码', 'error');
    return;
  }

  try {
    // 创建简单的路线数据（只有一个订单）
    const simpleRoute = {
      optimizedRoute: [
        {
          orderId: selectedOrder.id,
          sequence: 1,
          lat: selectedOrder.lat,
          lng: selectedOrder.lng,
          address: selectedOrder.address,
          customerName: selectedOrder.customerName,
          items: selectedOrder.items,
          notes: selectedOrder.notes,
          distanceToNext: 0,
          durationToNext: 0,
        },
      ],
      totalDistance: 0,
      totalDuration: 0,
      summary: {
        totalDistanceKm: '0',
        totalDurationMin: 0,
        totalDurationHours: '0',
        stopCount: 1,
        orderCount: 1,
      },
    };

    const { setRouteData } = useRouteStore();
    setRouteData(simpleRoute);
    navigateTo('/delivery');
  } catch (error: any) {
    console.error('Start single order delivery error:', error);
    showSnackbar('开始配送失败', 'error');
  }
};

// 在地图上查看
const viewOnMap = () => {
  console.log('viewOnMap called', routeResult.value);
  if (routeResult.value) {
    const { setRouteData } = useRouteStore();
    setRouteData(routeResult.value);
    console.log('Navigating to map...');
    navigateTo('/map');
  } else {
    showSnackbar('没有路线数据', 'error');
  }
};

// 开始配送
const startDelivery = () => {
  if (routeResult.value) {
    const { setRouteData } = useRouteStore();
    setRouteData(routeResult.value);
    navigateTo('/delivery');
  } else {
    showSnackbar('没有路线数据', 'error');
  }
};

// 显示提示信息
const showSnackbar = (text: string, color: 'success' | 'error' | 'warning' = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

// 进入配送页面
const goToDelivery = () => {
  navigateTo('/delivery');
};

// 处理放弃配送
const handleAbandonDelivery = () => {
  abandonDialog.value = true;
};

// 确认放弃配送
const confirmAbandonDelivery = async (reason: string) => {
  const { sessionData, clearSession } = useDeliverySession();

  if (!sessionData.value || !sessionData.value.sessionId) {
    showSnackbar('没有活动的配送会话', 'error');
    abandonDialog.value = false;
    return;
  }

  abandoning.value = true;

  try {
    await $fetch(`/api/delivery-sessions/${sessionData.value.sessionId}/abandon`, {
      method: 'POST',
      body: {
        cancelReason: reason,
      },
    });

    // 清除本地会话数据
    clearSession();

    // 重新加载订单列表
    await loadOrders();

    abandonDialog.value = false;
    showSnackbar('已放弃配送，订单已恢复为待开始状态', 'success');
  } catch (error: unknown) {
    console.error('Failed to abandon delivery:', error);
    showSnackbar(error.data?.error?.message || '放弃配送失败', 'error');
  } finally {
    abandoning.value = false;
  }
};

// 监听订单列表变化，清除路线优化结果并自动选中所有订单
watch(
  () => orders.value.length,
  (newLength, oldLength) => {
    // 当订单数量变化时，清除路线优化结果
    if (oldLength !== undefined && newLength !== oldLength && routeResult.value) {
      routeResult.value = null;
    }

    // 自动选中所有订单
    if (newLength > 0) {
      selectedOrderIds.value = orders.value.map((order) => order.id);
    }
  }
);

// 页面加载时获取订单列表
onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
.in-progress-card {
  cursor: pointer;
  position: relative;
  border: 1px solid rgb(255, 193, 7);
  animation: border-glow 2s ease-in-out infinite;
}

.in-progress-card:hover {
  border-color: rgb(255, 193, 7);
  box-shadow:
    0 0 15px rgba(255, 193, 7, 0.9),
    0 0 25px rgba(255, 193, 7, 0.6);
}
</style>
