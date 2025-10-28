<template>
  <v-dialog :model-value="modelValue" max-width="500" persistent>
    <v-card>
      <v-card-title>
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        {{ title }}
      </v-card-title>

      <v-card-text>
        <p class="mb-4">{{ message }}</p>

        <v-textarea
          v-model="reason"
          label="取消原因"
          placeholder="请输入取消原因..."
          rows="3"
          :rules="reasonRules"
          counter="200"
          required
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">取消</v-btn>
        <v-btn color="error" variant="flat" :disabled="!isReasonValid" @click="handleConfirm">
          确认
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  modelValue: boolean;
  title: string;
  message: string;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [reason: string];
}>();

const reason = ref('');

const reasonRules = [
  (v: string) => !!v || '请输入取消原因',
  (v: string) => (v && v.length <= 200) || '原因不能超过200字符',
];

const isReasonValid = computed(() => {
  return reason.value && reason.value.trim().length > 0 && reason.value.length <= 200;
});

const handleCancel = () => {
  reason.value = '';
  emit('update:modelValue', false);
};

const handleConfirm = () => {
  if (isReasonValid.value) {
    emit('confirm', reason.value.trim());
    reason.value = '';
  }
};
</script>
