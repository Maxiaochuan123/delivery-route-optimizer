<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>编辑客户信息</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="handleCancel" />
      </v-card-title>

      <v-divider />

      <v-card-text>
        <CustomerForm
          v-if="customer"
          :key="customer.id"
          ref="customerFormRef"
          :initial-data="customerFormData"
          :loading="saving"
          @submit="handleSave"
        >
          <template #actions="{ submit, loading, valid }">
            <v-row>
              <v-col cols="6">
                <v-btn variant="text" block @click="handleCancel">取消</v-btn>
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
        </CustomerForm>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useSnackbar } from '~/composables/useSnackbar';

interface Customer {
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
  modelValue: boolean;
  customer?: Customer;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const customerFormRef = ref();
const saving = ref(false);

// Import snackbar composable
const { show: showSnackbar } = useSnackbar();

// 将客户数据转换为表单数据格式
const customerFormData = computed(() => {
  if (!props.customer) return undefined;

  return {
    address: props.customer.address,
    lat: props.customer.lat,
    lng: props.customer.lng,
    customerName: props.customer.customerName,
    alias: props.customer.alias,
    contactType: props.customer.contactType,
    contactValue: props.customer.contactValue,
  };
});

const handleSave = async (formData: CustomerFormData) => {
  if (!props.customer) return;

  saving.value = true;

  try {
    // 更新客户信息
    const response = await fetch(`/api/addresses/frequent/${props.customer.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: formData.customerName,
        address: formData.address,
        alias: formData.alias,
        lat: formData.lat,
        lng: formData.lng,
        contactType: formData.contactType,
        contactValue: formData.contactValue,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update customer');
    }

    // 同步更新相关订单
    try {
      await fetch('/api/orders/sync-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldCustomerName: props.customer.customerName,
          oldAddress: props.customer.address,
          newCustomerName: formData.customerName,
          newAddress: formData.address,
          newLat: formData.lat,
          newLng: formData.lng,
          newContactType: formData.contactType,
          newContactValue: formData.contactValue,
        }),
      });
    } catch (error) {
      console.error('Failed to sync orders:', error);
      // 不阻止客户信息更新，只是记录错误
    }

    showSnackbar('客户信息更新成功', 'success');
    emit('saved');
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Failed to update customer:', error);
    showSnackbar('更新失败，请重试', 'error');
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  emit('update:modelValue', false);
};
</script>
