<template>
  <v-autocomplete
    v-model="selectedAddress"
    v-model:search="addressSearch"
    :items="addressSuggestions"
    :loading="searchingAddress"
    :label="label"
    :placeholder="placeholder"
    :rules="rules"
    prepend-inner-icon="mdi-map-marker"
    variant="outlined"
    item-title="name"
    item-value="id"
    return-object
    no-filter
    clearable
    @update:search="handleAddressSearch"
    @update:model-value="handleAddressSelect"
  >
    <template #item="{ props, item }">
      <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.fullAddress">
      </v-list-item>
    </template>
  </v-autocomplete>
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

interface AddressData {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  label?: string;
  placeholder?: string;
  rules?: Array<(value: any) => boolean | string>;
  modelValue?: AddressData | null;
}

const props = withDefaults(defineProps<Props>(), {
  label: '地址',
  placeholder: '请输入地址',
  rules: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: AddressData | null];
}>();

const searchingAddress = ref(false);
const addressSearch = ref('');
const selectedAddress = ref<AddressSuggestion | null>(null);
const addressSuggestions = ref<AddressSuggestion[]>([]);

let searchTimeout: NodeJS.Timeout | null = null;

// 监听外部传入的值
watch(
  () => props.modelValue,
  (value) => {
    if (value && value.address) {
      selectedAddress.value = {
        id: `${value.lat}-${value.lng}`,
        name: value.address,
        fullAddress: value.address,
        location: {
          lat: value.lat,
          lng: value.lng,
        },
      };
      addressSearch.value = value.address;
    } else if (!value) {
      selectedAddress.value = null;
      addressSearch.value = '';
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

// 处理地址选择
const handleAddressSelect = (selected: AddressSuggestion | null) => {
  if (selected) {
    emit('update:modelValue', {
      address: selected.name,
      lat: selected.location.lat,
      lng: selected.location.lng,
    });
  } else {
    emit('update:modelValue', null);
  }
};

// 暴露方法供父组件调用
defineExpose({
  reset: () => {
    selectedAddress.value = null;
    addressSearch.value = '';
    addressSuggestions.value = [];
  },
});
</script>
