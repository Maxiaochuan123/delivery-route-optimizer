<template>
  <v-list-item
    :id="`customer-${customer.id}`"
    class="customer-list-item"
    :class="{ 'selectable-item': selectable && !disabled }"
    @click="handleItemClick"
  >
    <template #prepend>
      <v-checkbox
        v-if="selectable"
        :model-value="disabled ? true : selected"
        :disabled="disabled"
        hide-details
        density="compact"
        class="mr-2"
        @update:model-value="handleCheckboxChange"
        @click.stop
      />
      <v-avatar color="primary" size="48">
        <span class="text-h6">{{ getFirstChar(customer.customerName) }}</span>
      </v-avatar>
    </template>

    <v-list-item-title class="font-weight-medium">
      {{ customer.customerName }}
      <span v-if="customer.alias" class="text-caption text-medium-emphasis ml-1">
        ({{ customer.alias }})
      </span>
      <v-chip v-if="disabled" size="x-small" color="warning" variant="flat" class="ml-2">
        已添加到订单
      </v-chip>
    </v-list-item-title>

    <v-list-item-subtitle class="mt-1">
      {{ customer.address }}
    </v-list-item-subtitle>

    <v-list-item-subtitle v-if="customer.contactType && customer.contactValue" class="mt-1">
      <v-chip
        size="small"
        variant="text"
        :prepend-icon="customer.contactType === 'phone' ? 'mdi-phone' : 'mdi-wechat'"
        class="px-1"
        @click="handleContactClick"
      >
        {{ formatContactValue(customer.contactValue, customer.contactType) }}
      </v-chip>
    </v-list-item-subtitle>

    <template v-if="!hideActions" #append>
      <div class="d-flex ga-1">
        <v-btn
          icon="mdi-pencil"
          variant="text"
          size="small"
          color="primary"
          @click.stop="$emit('edit', customer)"
        />
        <v-btn
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          @click.stop="$emit('delete', customer)"
        />
      </div>
    </template>
  </v-list-item>
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

const props = defineProps<{
  customer: Customer;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  hideActions?: boolean;
}>();

const emit = defineEmits<{
  edit: [customer: Customer];
  delete: [customer: Customer];
  'update:selected': [value: boolean];
}>();

const handleCheckboxChange = (value: boolean | null) => {
  emit('update:selected', !!value);
};

const handleItemClick = () => {
  // 只在选择模式且未禁用时，点击整个 item 可以切换选中状态
  if (props.selectable && !props.disabled) {
    emit('update:selected', !props.selected);
  }
};

const { show: showSnackbar } = useSnackbar();

const getFirstChar = (name: string): string => {
  return name.charAt(0);
};

const formatContactValue = (value: string, type: 'phone' | 'wechat'): string => {
  if (type === 'phone' && value.length === 11) {
    // Format phone number as 138****1234
    return `${value.substring(0, 3)}****${value.substring(7)}`;
  }
  return value;
};

const handleContactClick = async () => {
  if (!props.customer.contactType || !props.customer.contactValue) return;

  if (props.customer.contactType === 'phone') {
    // Trigger phone dialer
    window.location.href = `tel:${props.customer.contactValue}`;
  } else if (props.customer.contactType === 'wechat') {
    // Copy WeChat ID to clipboard
    try {
      await navigator.clipboard.writeText(props.customer.contactValue);
      showSnackbar('微信号已复制', 'success');
    } catch (error) {
      console.error('Failed to copy WeChat ID:', error);
      showSnackbar('复制失败', 'error');
    }
  }
};
</script>

<style scoped>
.customer-list-item {
  transition: background-color 0.3s ease;
}

.customer-list-item.selectable-item {
  cursor: pointer;
}

.customer-list-item.selectable-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.customer-list-item.highlight {
  background-color: rgba(25, 118, 210, 0.1);
}

.customer-list-item :deep(.v-chip) {
  cursor: pointer;
}

.customer-list-item :deep(.v-chip:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
