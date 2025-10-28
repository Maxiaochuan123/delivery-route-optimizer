<template>
  <v-autocomplete
    ref="autocompleteRef"
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

const autocompleteRef = ref();
const searchingAddress = ref(false);
const addressSearch = ref('');
const selectedAddress = ref<AddressSuggestion | null>(null);
const addressSuggestions = ref<AddressSuggestion[]>([]);

let searchTimeout: NodeJS.Timeout | null = null;
let isComposing = ref(false); // 标记是否正在输入法组合中

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

// 监听搜索输入变化
watch(addressSearch, (query) => {
  // 如果正在输入法组合中，不触发搜索
  if (isComposing.value) {
    return;
  }

  // 使用 nextTick 确保在 compositionend 事件处理完成后再触发搜索
  nextTick(() => {
    if (!isComposing.value) {
      handleAddressSearch(query);
    }
  });
});

// 地址搜索防抖
const handleAddressSearch = (query: string) => {
  // 如果查询为空，清空建议列表
  if (!query || query.trim().length === 0) {
    addressSuggestions.value = [];
    return;
  }

  // 检查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(query);

  // 如果是纯英文/数字，要求至少2个字符；如果包含中文，1个字符即可
  if (!hasChinese && query.length < 2) {
    addressSuggestions.value = [];
    return;
  }

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    await searchAddress(query);
  }, 500); // 增加防抖时间到500ms
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

// 在组件挂载后添加输入法事件监听
onMounted(() => {
  nextTick(() => {
    const inputElement = autocompleteRef.value?.$el?.querySelector('input');
    if (inputElement) {
      // 监听输入法开始组合
      inputElement.addEventListener('compositionstart', () => {
        isComposing.value = true;
      });

      // 监听输入法结束组合
      inputElement.addEventListener('compositionend', () => {
        isComposing.value = false;
        // 输入法结束后，手动触发一次搜索
        nextTick(() => {
          handleAddressSearch(addressSearch.value);
        });
      });
    }
  });
});

// 暴露方法供父组件调用
defineExpose({
  reset: () => {
    selectedAddress.value = null;
    addressSearch.value = '';
    addressSuggestions.value = [];
  },
});
</script>
