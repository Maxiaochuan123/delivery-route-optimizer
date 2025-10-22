<template>
  <v-btn
    :color="color"
    :size="size"
    :block="block"
    :loading="loading"
    :disabled="disabled || loading"
    :prepend-icon="icon"
    @click="handleClick"
  >
    <slot>{{ text }}</slot>
  </v-btn>
</template>

<script setup lang="ts">
interface Props {
  text?: string;
  color?: string;
  size?: 'small' | 'default' | 'large' | 'x-small' | 'x-large';
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  text: '优化路线',
  color: 'primary',
  size: 'default',
  block: false,
  disabled: false,
  loading: false,
  icon: 'mdi-map-search',
});

const emit = defineEmits<{
  click: [];
}>();

const handleClick = () => {
  emit('click');
};
</script>
