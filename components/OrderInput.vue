<template>
  <v-card>
    <v-card-title>添加订单</v-card-title>
    <v-card-text>
      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-text-field
          v-model="form.address"
          label="配送地址"
          placeholder="请输入详细地址"
          :rules="[rules.required]"
          prepend-inner-icon="mdi-map-marker"
          variant="outlined"
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

        <v-btn
          type="submit"
          color="primary"
          block
          size="large"
          :loading="loading"
          :disabled="loading"
        >
          添加订单
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  submit: [order: {
    address: string;
    customerName: string;
    items: string;
    notes?: string;
  }];
}>();

const formRef = ref();
const loading = ref(false);

const form = reactive({
  address: '',
  customerName: '',
  items: '',
  notes: '',
});

const rules = {
  required: (value: string) => !!value || '此项为必填',
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  
  if (!valid) return;

  loading.value = true;
  
  try {
    emit('submit', {
      address: form.address,
      customerName: form.customerName,
      items: form.items,
      notes: form.notes || undefined,
    });
    
    // 重置表单
    form.address = '';
    form.customerName = '';
    form.items = '';
    form.notes = '';
    formRef.value.reset();
  } finally {
    loading.value = false;
  }
};
</script>
