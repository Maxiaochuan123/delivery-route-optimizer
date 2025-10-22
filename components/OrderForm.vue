<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <!-- 地址自动完成 -->
    <AddressAutocomplete
      v-model="addressData"
      label="配送地址"
      placeholder="请输入详细地址"
      :rules="[rules.required]"
      class="mb-3"
    />

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
const addressData = ref<{ address: string; lat: number; lng: number } | null>(null);

const form = reactive({
  customerName: '',
  items: '',
  notes: '',
});

const rules = {
  required: (value: any) => !!value || '此项为必填',
};

const isValid = computed(() => {
  return !!addressData.value && !!form.customerName && !!form.items;
});

// 初始化表单数据（编辑模式）
watch(
  () => props.initialData,
  (data) => {
    if (data && props.mode === 'edit') {
      form.customerName = data.customerName || '';
      form.items = data.items || '';
      form.notes = data.notes || '';
      
      // 如果有地址信息，设置地址数据
      if (data.address && data.lat && data.lng) {
        addressData.value = {
          address: data.address,
          lat: data.lat,
          lng: data.lng,
        };
      }
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid || !addressData.value) return;

  emit('submit', {
    address: addressData.value.address,
    lat: addressData.value.lat,
    lng: addressData.value.lng,
    customerName: form.customerName,
    items: form.items,
    notes: form.notes || undefined,
  });

  // 如果是创建模式，重置表单
  if (props.mode === 'create') {
    addressData.value = null;
    form.customerName = '';
    form.items = '';
    form.notes = '';
    formRef.value.reset();
  }
};

// 暴露方法供父组件调用
defineExpose({
  reset: () => {
    addressData.value = null;
    form.customerName = '';
    form.items = '';
    form.notes = '';
    formRef.value?.reset();
  },
});
</script>
