<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>订单列表</span>
      <v-chip v-if="orders.length > 0" color="primary" size="small">
        {{ orders.length }} 个订单
        <span v-if="selectable && selectedOrders.length > 0">
          (已选 {{ selectedOrders.length }})
        </span>
      </v-chip>
    </v-card-title>

    <v-card-text v-if="orders.length === 0" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
      <p class="text-body-1 text-medium-emphasis mt-4">暂无订单</p>
      <p class="text-body-2 text-medium-emphasis">请添加订单开始配送</p>
    </v-card-text>

    <v-list v-else>
      <v-list-item
        v-for="(order, index) in orders"
        :key="order.id"
        class="border-b"
      >
        <template #prepend>
          <v-checkbox
            v-if="selectable"
            :model-value="selectedOrders.includes(order.id)"
            @update:model-value="toggleSelection(order.id)"
            hide-details
            density="compact"
            class="mr-2"
          />
          <v-avatar :color="getStatusColor(order.status)" size="40">
            <span class="text-h6">{{ index + 1 }}</span>
          </v-avatar>
        </template>

        <v-list-item-title class="font-weight-medium">
          {{ order.customerName }}
        </v-list-item-title>
        
        <v-list-item-subtitle class="mt-1">
          <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
          {{ order.address }}
        </v-list-item-subtitle>
        
        <v-list-item-subtitle class="mt-1">
          <v-icon size="small" class="mr-1">mdi-package-variant</v-icon>
          {{ order.items }}
        </v-list-item-subtitle>

        <v-list-item-subtitle v-if="order.notes" class="mt-1">
          <v-icon size="small" class="mr-1">mdi-note-text</v-icon>
          {{ order.notes }}
        </v-list-item-subtitle>

        <template #append>
          <div v-if="!props.readonly" class="d-flex flex-column ga-2">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click="$emit('edit', order)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="$emit('delete', order.id)"
            />
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
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

const props = defineProps<{
  orders: Order[];
  readonly?: boolean;
  selectable?: boolean;
  selectedOrders?: number[];
}>();

const emit = defineEmits<{
  edit: [order: Order];
  delete: [id: number];
  'update:selectedOrders': [ids: number[]];
}>();

const getStatusColor = (status: string) => {
  return status === 'completed' ? 'success' : 'primary';
};

const selectedOrders = computed(() => props.selectedOrders || []);

const toggleSelection = (orderId: number) => {
  if (!props.selectable) return;
  
  const currentSelection = selectedOrders.value;
  const index = currentSelection.indexOf(orderId);
  
  let newSelection: number[];
  if (index > -1) {
    // 取消选中
    newSelection = currentSelection.filter(id => id !== orderId);
  } else {
    // 选中
    newSelection = [...currentSelection, orderId];
  }
  
  emit('update:selectedOrders', newSelection);
};
</script>
