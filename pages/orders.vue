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

    <!-- 订单列表 -->
    <v-row>
      <v-col cols="12">
        <OrderList :orders="orders" @edit="handleEditOrder" @delete="handleDeleteOrder" />
      </v-col>
    </v-row>

    <!-- 路线优化 -->
    <v-row v-if="orders.length > 0">
      <v-col cols="12">
        <v-card>
          <v-card-title>路线优化</v-card-title>
          <v-card-text>
            <!-- 检查订单坐标 -->
            <v-alert
              v-if="ordersWithoutCoords.length > 0"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              <div class="d-flex justify-space-between align-center">
                <span>
                  有 {{ ordersWithoutCoords.length }} 个订单缺少坐标信息，需要先进行地理编码
                </span>
                <v-btn size="small" color="warning" :loading="geocoding" @click="geocodeAllOrders">
                  批量地理编码
                </v-btn>
              </div>
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
                    !startLocationData || orders.length === 0 || ordersWithoutCoords.length > 0
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

useHead({
  title: '订单管理 - 配送路径优化系统',
});

const orders = ref<Order[]>([]);
const editDialog = ref(false);
const deleteDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
const optimizing = ref(false);
const gettingLocation = ref(false);
const geocoding = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

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

// 计算缺少坐标的订单
const ordersWithoutCoords = computed(() => {
  return orders.value.filter((order) => !order.lat || !order.lng);
});

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
    const response = await $fetch<{ success: boolean; data: Order[] }>('/api/orders');
    orders.value = response.data;
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
    await $fetch(`/api/orders/${deleteOrderId.value}`, {
      method: 'DELETE',
    });

    orders.value = orders.value.filter((o) => o.id !== deleteOrderId.value);
    deleteDialog.value = false;
    showSnackbar('订单删除成功');
  } catch (error) {
    showSnackbar('删除订单失败', 'error');
    console.error('Failed to delete order:', error);
  } finally {
    deleting.value = false;
  }
};

// 获取当前位置
const getCurrentLocation = () => {
  gettingLocation.value = true;

  if (navigator.geolocation) {
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
        showSnackbar('定位失败，请检查定位权限', 'error');
        gettingLocation.value = false;
      }
    );
  } else {
    showSnackbar('浏览器不支持定位功能', 'error');
    gettingLocation.value = false;
  }
};

// 批量地理编码
const geocodeAllOrders = async () => {
  const ordersToGeocode = ordersWithoutCoords.value;

  if (ordersToGeocode.length === 0) {
    showSnackbar('所有订单都已有坐标信息');
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
  if (!startLocation.value) {
    showSnackbar('请输入起始地址或获取当前位置', 'error');
    return;
  }

  if (orders.value.length === 0) {
    showSnackbar('请先添加订单', 'error');
    return;
  }

  optimizing.value = true;

  try {
    // 调用路线优化 API
    const response = await $fetch<{ success: boolean; data: any }>('/api/routes/optimize-orders', {
      method: 'POST',
      body: {
        startLocation: {
          lat: startLocation.value.lat,
          lng: startLocation.value.lng,
          address: startLocation.value.address,
        },
        orderIds: orders.value.map((o) => o.id),
      },
    });

    if (response.success) {
      routeResult.value = response.data;
      showSnackbar('路线优化成功');
    }
  } catch (error: any) {
    console.error('Route optimization error:', error);
    showSnackbar(error.data?.error?.message || '路线优化失败', 'error');
  } finally {
    optimizing.value = false;
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
  // TODO: 创建配送会话并导航到配送页面
  showSnackbar('配送功能即将推出');
};

// 显示提示信息
const showSnackbar = (text: string, color: 'success' | 'error' | 'warning' = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

// 页面加载时获取订单列表
onMounted(() => {
  loadOrders();
});
</script>
