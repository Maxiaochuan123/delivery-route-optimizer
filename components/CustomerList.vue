<template>
  <div class="customer-list">
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Empty state when no customers match search -->
    <div
      v-else-if="filteredCustomers.length === 0"
      class="text-center py-8 text-medium-emphasis"
    >
      <v-icon size="64" class="mb-4">mdi-account-search</v-icon>
      <div class="text-h6">未找到匹配的客户</div>
    </div>

    <!-- Customer list grouped by first letter -->
    <div v-else>
      <div
        v-for="group in groupedCustomers"
        :id="`letter-${group.letter}`"
        :key="group.letter"
        class="letter-group"
      >
        <!-- Letter header -->
        <div class="letter-header">
          {{ group.letter }}
        </div>

        <!-- Customer items -->
        <v-list>
          <CustomerListItem
            v-for="customer in group.customers"
            :key="customer.id"
            :customer="customer"
            :selectable="selectable"
            :selected="selectedIds?.includes(customer.id)"
            :disabled="disabledChecker?.(customer) || false"
            :hide-actions="hideActions"
            @edit="$emit('edit', customer)"
            @delete="$emit('delete', customer)"
            @update:selected="(value) => toggleSelection(customer.id, value)"
          />
        </v-list>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import pinyin from 'pinyin';

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

interface LetterGroup {
  letter: string;
  customers: Customer[];
}

const props = defineProps<{
  customers: Customer[];
  searchQuery?: string;
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: number[];
  disabledChecker?: (customer: Customer) => boolean;
  hideActions?: boolean;
}>();

const emit = defineEmits<{
  edit: [customer: Customer];
  delete: [customer: Customer];
  'update:selectedIds': [ids: number[]];
}>();

const toggleSelection = (customerId: number, selected: boolean) => {
  const currentIds = props.selectedIds || [];
  let newIds: number[];
  
  if (selected) {
    newIds = [...currentIds, customerId];
  } else {
    newIds = currentIds.filter(id => id !== customerId);
  }
  
  emit('update:selectedIds', newIds);
};

// Debounced search query for better performance
const debouncedSearchQuery = ref('');

// Debounce search updates with 300ms delay
const updateDebouncedSearch = useDebounceFn((value: string) => {
  debouncedSearchQuery.value = value;
}, 300);

// Watch for search query changes
watch(() => props.searchQuery, (newValue) => {
  updateDebouncedSearch(newValue || '');
}, { immediate: true });

// Cache for first letter calculations to improve performance
const firstLetterCache = new Map<string, string>();

/**
 * Get the first letter of a Chinese name using pinyin with caching
 */
const getFirstLetter = (name: string): string => {
  if (!name) return '#';
  
  // Check cache first
  if (firstLetterCache.has(name)) {
    return firstLetterCache.get(name)!;
  }
  
  // Get pinyin for the first character
  const py = pinyin(name, { style: pinyin.STYLE_FIRST_LETTER });
  
  let letter = '#';
  if (py && py[0] && py[0][0]) {
    const firstChar = py[0][0].toUpperCase();
    // Check if it's a valid letter A-Z
    if (/^[A-Z]$/.test(firstChar)) {
      letter = firstChar;
    }
  }
  
  // Cache the result
  firstLetterCache.set(name, letter);
  return letter;
};

/**
 * Group customers by their first letter
 */
const groupByFirstLetter = (customers: Customer[]): LetterGroup[] => {
  const groups: Record<string, Customer[]> = {};
  
  customers.forEach(customer => {
    const letter = getFirstLetter(customer.customerName);
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(customer);
  });
  
  // Sort groups by letter, with '#' at the end
  return Object.keys(groups)
    .sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    })
    .map(letter => ({
      letter,
      customers: groups[letter]!,
    }));
};

/**
 * Filter customers based on debounced search query
 */
const filteredCustomers = computed(() => {
  if (!debouncedSearchQuery.value || debouncedSearchQuery.value.trim() === '') {
    return props.customers;
  }
  
  const query = debouncedSearchQuery.value.toLowerCase().trim();
  
  return props.customers.filter(customer => {
    const nameMatch = customer.customerName.toLowerCase().includes(query);
    const aliasMatch = customer.alias?.toLowerCase().includes(query);
    return nameMatch || aliasMatch;
  });
});

/**
 * Group filtered customers by first letter
 */
const groupedCustomers = computed(() => {
  return groupByFirstLetter(filteredCustomers.value);
});
</script>

<style scoped>
.customer-list {
  width: 100%;
}

.letter-group {
  margin-bottom: 8px;
}

.letter-header {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
