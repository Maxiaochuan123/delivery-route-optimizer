<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <!-- 地址自动完成 -->
    <AddressAutocomplete
      v-model="addressData"
      label="客户地址"
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
      v-model="form.alias"
      label="客户别名"
      placeholder="选填：如老张、李总"
      prepend-inner-icon="mdi-account-edit"
      variant="outlined"
      class="mb-3"
    />

    <!-- 联系方式类型选择器 -->
    <v-select
      v-model="form.contactType"
      label="联系方式类型"
      placeholder="选择联系方式类型（可选）"
      :items="contactTypeOptions"
      item-title="label"
      item-value="value"
      variant="outlined"
      class="mb-3"
      clearable
    >
      <template #prepend-inner>
        <v-icon v-if="form.contactType === 'phone'">mdi-phone</v-icon>
        <v-icon v-else-if="form.contactType === 'wechat'">mdi-wechat</v-icon>
        <v-icon v-else>mdi-card-account-phone</v-icon>
      </template>
    </v-select>

    <!-- 联系方式值输入框 -->
    <v-text-field
      v-if="form.contactType"
      v-model="form.contactValue"
      :label="form.contactType === 'phone' ? '电话号码' : '微信号'"
      :placeholder="form.contactType === 'phone' ? '请输入电话号码' : '请输入微信号'"
      :rules="contactValueRules"
      :prepend-inner-icon="form.contactType === 'phone' ? 'mdi-phone' : 'mdi-wechat'"
      variant="outlined"
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
        保存
      </v-btn>
    </slot>
  </v-form>
</template>

<script setup lang="ts">
interface CustomerFormData {
  address: string;
  lat: number;
  lng: number;
  customerName: string;
  alias?: string;
  contactType?: 'phone' | 'wechat';
  contactValue?: string;
}

interface Props {
  initialData?: Partial<CustomerFormData>;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  submit: [data: CustomerFormData];
}>();

const formRef = ref();
const addressData = ref<{ address: string; lat: number; lng: number } | null>(null);

const form = reactive({
  customerName: '',
  alias: '',
  contactType: undefined as 'phone' | 'wechat' | undefined,
  contactValue: '',
});

const contactTypeOptions = [
  { label: '电话', value: 'phone' },
  { label: '微信', value: 'wechat' },
];

const rules = {
  required: (value: string) => !!value || '此项为必填',
};

const contactValueRules = computed(() => {
  if (!form.contactType) return [];

  if (form.contactType === 'phone') {
    return [
      (value: string) => {
        if (!value) return true; // 可选字段
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(value) || '请输入有效的手机号码';
      },
    ];
  } else if (form.contactType === 'wechat') {
    return [
      (value: string) => {
        if (!value) return true; // 可选字段
        return value.length >= 6 || '微信号至少6个字符';
      },
    ];
  }

  return [];
});

const isValid = computed(() => {
  return !!addressData.value && !!form.customerName;
});

// 初始化表单数据
watch(
  () => props.initialData,
  (data) => {
    if (data) {
      // 使用nextTick确保DOM更新后再设置值
      nextTick(() => {
        form.customerName = data.customerName || '';
        form.alias = data.alias || '';
        // 确保contactType正确设置，即使是undefined也要显式赋值
        form.contactType = data.contactType || undefined;
        form.contactValue = data.contactValue || '';

        // 如果有地址信息，设置地址数据
        if (data.address && data.lat && data.lng) {
          addressData.value = {
            address: data.address,
            lat: data.lat,
            lng: data.lng,
          };
        }
      });
    }
  },
  { immediate: true, deep: true }
);

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid || !addressData.value) return;

  emit('submit', {
    address: addressData.value.address,
    lat: addressData.value.lat,
    lng: addressData.value.lng,
    customerName: form.customerName,
    alias: form.alias || undefined,
    contactType: form.contactType,
    contactValue: form.contactValue || undefined,
  });
};

// 暴露方法和属性供父组件调用
defineExpose({
  reset: () => {
    addressData.value = null;
    form.customerName = '';
    form.alias = '';
    form.contactType = undefined;
    form.contactValue = '';
    formRef.value?.reset();
  },
  submit: handleSubmit,
  valid: isValid,
});
</script>
