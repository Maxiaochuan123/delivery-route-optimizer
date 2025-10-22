<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <!-- 地址自动完成 -->
    <v-autocomplete
      v-model="selectedAddress"
      v-model:search="addressSearch"
      :items="addressSuggestions"
      :loading="searchingAddress"
      label="配送地址"
      placeholder="请输入详细地址"
      :rules="[rules.required]"
      prepend-inner-icon="mdi-map-marker"
      variant="outlined"
      class="mb-3"
      item-title="name"
      item-value="id"
      return-object
      no-filter
      clearable
      @update:search="handleAddressSearch"
    >
      <template #item="{ props, item }">
        <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.fullAddress">
        </v-list-item>
      </template>
    </v-autocomplete>

    <v-text-field
      v-model="form.customerName"
      label="客户姓名"
      placeholder="请输入客户姓名"
      :rules="[rules.required]"
      prepend-inner-icon="mdi-account"
      variant="outlined"
      class="mb-3"
    />

    <v-text-field
      v-model="form.items"
      label="商品信息"
      placeholder="请输入商品信息"
      :rules="[rules.required]"
      prepend-inner-icon="mdi-package-variant"
      variant="outlined"
      class="mb-3"
    />

    <v-textarea
      v-model="form.notes"
      label="备注"
      placeholder="选填：其他备注信息"
      prepend-inner-icon="mdi-note-text"
      variant="outlined"
      rows="3"
      class="mb-3"
    />

    <slot name="actions" :submit="handleSubmit" :loading="loading" :valid="isValid">
      <v-btn
        type="submit"
        color="primary"
        block
        size="large"
        :loading="loading"
        :disabled="loading || !isValid"
      >
        {{ mode === 'edit' ? '保存' : '添加订单' }}
      </v-btn>
    </slot>
  </v-form>
</template>

<script setup lang="ts">
interface AddressSuggestion {
  id: string;
  name: string;
  fullAddress: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface OrderFormData {
  address: string;
  lat: number;
  lng: number;
  customerName: string;
  items: string;
  notes?: string;
}

interface Props {
  mode?: 'create' | 'edit';
  initialData?: Partial<OrderFormData> & { address?: string };
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  loading: false,
});

const emit = defineEmits<{
  submit: [data: OrderFormData];
}>();

const formRef = ref();
const searchingAddress = ref(false);
const addressSearch = ref('');
const selectedAddress = ref<AddressSuggestion | null>(null);
const addressSuggestions = ref<AddressSuggestion[]>([]);

let searchTimeout: NodeJS.Timeout | null = null;

const form = reactive({
  customerName: '',
  items: '',
  notes: '',
});

const rules = {
  required: (value: any) => !!value || '此项为必填',
};

const isValid = computed(() => {
  return !!selectedAddress.value && !!form.customerName && !!form.items;
});

// 初始化表单数据（编辑模式）
watch(
  () => props.initialData,
  (data) => {
    if (data && props.mode === 'edit') {
      form.customerName = data.customerName || '';
      form.items = data.items || '';
      form.notes = data.notes || '';
      
      // 如果有地址信息，设置为选中的地址
      if (data.address && data.lat && data.lng) {
        selectedAddress.value = {
          id: `${data.lat}-${data.lng}`,
          name: data.address,
          fullAddress: data.address,
          location: {
            lat: data.lat,
            lng: data.lng,
          },
        };
        addressSearch.value = data.address;
      }
    }
  },
  { immediate: true }
);

// 地址搜索防抖
const handleAddressSearch = (query: string) => {
  if (!query || query.length < 2) {
    addressSuggestions.value = [];
    return;
  }

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    await searchAddress(query);
  }, 300);
};

// 调用高德地图搜索 API
const searchAddress = async (keyword: string) => {
  searchingAddress.value = true;

  try {
    const response = await $fetch<{ success: boolean; data: any }>('/api/geocode/search', {
      method: 'POST',
      body: { keyword },
    });

    if (response.success && response.data.pois) {
      addressSuggestions.value = response.data.pois.map((poi: any) => ({
        id: poi.id,
        name: poi.name,
        fullAddress: poi.fullAddress,
        location: {
          lat: poi.location.lat,
          lng: poi.location.lng,
        },
      }));
    }
  } catch (error) {
    console.error('Address search error:', error);
    addressSuggestions.value = [];
  } finally {
    searchingAddress.value = false;
  }
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid || !selectedAddress.value) return;

  emit('submit', {
    address: selectedAddress.value.name,
    lat: selectedAddress.value.location.lat,
    lng: selectedAddress.value.location.lng,
    customerName: form.customerName,
    items: form.items,
    notes: form.notes || undefined,
  });

  // 如果是创建模式，重置表单
  if (props.mode === 'create') {
    selectedAddress.value = null;
    addressSearch.value = '';
    form.customerName = '';
    form.items = '';
    form.notes = '';
    formRef.value.reset();
  }
};

// 暴露方法供父组件调用
defineExpose({
  reset: () => {
    selectedAddress.value = null;
    addressSearch.value = '';
    form.customerName = '';
    form.items = '';
    form.notes = '';
    formRef.value?.reset();
  },
});
</script>
