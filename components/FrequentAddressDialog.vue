<template>
  <v-dialog v-model="dialogVisible" max-width="600" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-star</v-icon>
          选择常用客户
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0" style="max-height: 500px">
        <v-list v-if="addresses.length > 0">
          <v-list-item
            v-for="address in addresses"
            :key="address.id"
            @click="toggleAddress(address)"
          >
            <template #prepend>
              <v-checkbox
                :model-value="isSelected(address.id)"
                hide-details
                density="compact"
                @click.stop="toggleAddress(address)"
              />
            </template>

            <v-list-item-title>
              {{ address.alias || address.customerName }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ address.address }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-if="address.contactType && address.contactValue" class="text-caption">
              <v-icon size="small" class="mr-1">
                {{ address.contactType === 'phone' ? 'mdi-phone' : 'mdi-wechat' }}
              </v-icon>
              {{ address.contactValue }}
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-caption">
              使用 {{ address.usageCount }} 次
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-alert v-else type="info" variant="tonal" class="ma-4">
          暂无常用客户，请先收藏一些客户
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="selectedAddresses.length === 0"
          @click="confirm"
        >
          添加 {{ selectedAddresses.length }} 个订单
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface FrequentAddress {
  id: number;
  customerName: string;
  address: string;
  alias?: string;
  lat: number;
  lng: number;
  contactType?: 'phone' | 'wechat';
  contactValue?: string;
  usageCount: number;
  lastUsed: string;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [addresses: FrequentAddress[]];
}>();

const addresses = ref<FrequentAddress[]>([]);
const selectedAddresses = ref<FrequentAddress[]>([]);

const loadAddresses = async () => {
  try {
    const response = await $fetch<{ success: boolean; data: FrequentAddress[] }>(
      '/api/addresses/frequent'
    );
    addresses.value = response.data || [];
  } catch (error) {
    console.error('Failed to load frequent addresses:', error);
  }
};

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isSelected = (id: number) => {
  return selectedAddresses.value.some((addr: FrequentAddress) => addr.id === id);
};

const toggleAddress = (address: FrequentAddress) => {
  const index = selectedAddresses.value.findIndex((addr: FrequentAddress) => addr.id === address.id);
  if (index > -1) {
    selectedAddresses.value.splice(index, 1);
  } else {
    selectedAddresses.value.push(address);
  }
};

const close = () => {
  dialogVisible.value = false;
  selectedAddresses.value = [];
};

const confirm = () => {
  emit('confirm', selectedAddresses.value);
  close();
};

// 当对话框打开时加载地址
watch(dialogVisible, (visible) => {
  if (visible) {
    loadAddresses();
    selectedAddresses.value = [];
  }
});
</script>
