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
        <OrderInput @submit="handleAddOrder" />
      </v-col>
    </v-row>

    <!-- 订单列表 -->
    <v-row>
      <v-col cols="12">
        <OrderList :orders="orders" @edit="handleEditOrder" @delete="handleDeleteOrder" />
      </v-col>
    </v-row>

    <!-- 编辑订单对话框 -->
    <v-dialog v-model="editDialog" max-width="600">
      <v-card>
        <v-card-title>编辑订单</v-card-title>
        <v-card-text>
          <v-form ref="editFormRef">
            <v-text-field
              v-model="editForm.address"
              label="配送地址"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-map-marker"
              variant="outlined"
              class="mb-3"
            />

            <v-text-field
              v-model="editForm.customerName"
              label="客户姓名"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              class="mb-3"
            />

            <v-text-field
              v-model="editForm.items"
              label="商品信息"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-package-variant"
              variant="outlined"
              class="mb-3"
            />

            <v-textarea
              v-model="editForm.notes"
              label="备注"
              prepend-inner-icon="mdi-note-text"
              variant="outlined"
              rows="3"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="handleSaveEdit">
            保存
          </v-btn>
        </v-card-actions>
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
const editFormRef = ref();
const saving = ref(false);
const deleting = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const editForm = reactive({
  id: 0,
  address: '',
  customerName: '',
  items: '',
  notes: '',
});

const deleteOrderId = ref<number | null>(null);

const rules = {
  required: (value: string) => !!value || '此项为必填',
};

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
const handleAddOrder = async (orderData: Omit<Order, 'id' | 'status' | 'createdAt'>) => {
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
  editForm.id = order.id;
  editForm.address = order.address;
  editForm.customerName = order.customerName;
  editForm.items = order.items;
  editForm.notes = order.notes || '';
  editDialog.value = true;
};

// 保存编辑
const handleSaveEdit = async () => {
  const { valid } = await editFormRef.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const response = await $fetch<{ success: boolean; data: Order }>(`/api/orders/${editForm.id}`, {
      method: 'PUT',
      body: {
        address: editForm.address,
        customerName: editForm.customerName,
        items: editForm.items,
        notes: editForm.notes || undefined,
      },
    });

    const index = orders.value.findIndex((o) => o.id === editForm.id);
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

// 显示提示信息
const showSnackbar = (text: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

// 页面加载时获取订单列表
onMounted(() => {
  loadOrders();
});
</script>
