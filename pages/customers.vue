<template>
  <div class="customers-page">
    <!-- App Bar with back button and title -->
    <v-app-bar color="primary" density="compact" elevation="0">
      <v-btn icon="mdi-arrow-left" @click="goBack" />
      <v-toolbar-title>常用客户管理</v-toolbar-title>
      <v-spacer />
      <v-btn
        v-if="!selectionMode"
        icon="mdi-checkbox-multiple-marked"
        @click="enterSelectionMode"
      />
      <v-btn
        v-else-if="existingOrderCustomers.size === 0"
        variant="text"
        @click="exitSelectionMode"
      >
        取消
      </v-btn>
    </v-app-bar>

    <!-- Fixed header section -->
    <div class="fixed-header">
      <!-- Search box -->
      <v-text-field
        v-model="searchQuery"
        placeholder="搜索客户姓名..."
        prepend-inner-icon="mdi-magnify"
        clearable
        variant="outlined"
        density="comfortable"
        hide-details
        class="mb-3"
      />

      <!-- Recent customers section -->
      <div v-if="recentCustomers.length > 0 && !searchQuery" class="recent-customers">
        <div class="recent-header">
          <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
          <span class="text-subtitle-2">最近联系</span>
        </div>
        <div class="recent-chips">
          <v-chip
            v-for="customer in recentCustomers"
            :key="customer.id"
            :class="['recent-chip', { highlighted: highlightedCustomerId === customer.id }]"
            size="small"
            variant="tonal"
            color="primary"
            @click="scrollToCustomer(customer.id)"
          >
            <v-icon start size="x-small">mdi-account</v-icon>
            {{ customer.customerName }}
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Scrollable customer list -->
    <div
      class="page-content"
      :class="{ 'with-bottom-bar': selectionMode && selectedCustomerIds.length > 0 }"
    >
      <CustomerList
        v-model:selected-ids="selectedCustomerIds"
        :customers="customers"
        :search-query="searchQuery"
        :loading="loading"
        :selectable="selectionMode"
        :disabled-checker="hasExistingOrder"
        :hide-actions="selectionMode"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Bottom action bar -->
    <div v-if="selectionMode && selectedCustomerIds.length > 0" class="bottom-action-bar">
      <div class="action-bar-content">
        <div class="action-info">
          <v-icon class="mr-2">mdi-checkbox-marked-circle</v-icon>
          <span class="text-subtitle-1 font-weight-medium">
            已选择 {{ selectedCustomerIds.length }} 个客户
          </span>
        </div>
        <div class="action-buttons">
          <v-btn variant="outlined" @click="exitSelectionMode"> 取消 </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="addingOrders"
            @click="addOrdersFromSelection"
          >
            添加 {{ selectedCustomerIds.length }} 个订单
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Alphabet index -->
    <AlphabetIndex
      v-if="availableLetters.length > 0 && !searchQuery"
      :letters="availableLetters"
      :active-letter="activeLetter"
      @letter-click="scrollToLetter"
    />

    <!-- Customer edit dialog -->
    <CustomerEditDialog
      v-model="editDialog"
      :customer="editingCustomer"
      @saved="handleCustomerSaved"
    />

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="450">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" :color="hasOrdersToDelete ? 'warning' : 'error'">
            {{ hasOrdersToDelete ? 'mdi-alert' : 'mdi-delete' }}
          </v-icon>
          确认删除
        </v-card-title>
        <v-card-text>
          <div class="mb-3">
            确定要删除客户 <strong>"{{ deletingCustomer?.customerName }}"</strong> 吗？
          </div>

          <v-alert
            v-if="hasOrdersToDelete"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            <div class="text-body-2">
              <v-icon size="small" class="mr-1">mdi-package-variant</v-icon>
              该客户存在 <strong>{{ pendingOrdersCount }}</strong> 个待开始订单
            </div>
          </v-alert>

          <div v-if="hasOrdersToDelete" class="text-body-2 text-medium-emphasis">
            删除客户将同时从订单列表中移除相关订单。此操作无法撤销。
          </div>
          <div v-else class="text-body-2 text-medium-emphasis">此操作无法撤销。</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDelete">取消</v-btn>
          <v-btn
            :color="hasOrdersToDelete ? 'warning' : 'error'"
            variant="flat"
            :loading="deleting"
            @click="confirmDelete"
          >
            {{ hasOrdersToDelete ? '确认删除并移除订单' : '确认删除' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
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

// State variables
const customers = ref<Customer[]>([]);
const recentCustomers = ref<Customer[]>([]);
const searchQuery = ref('');
const debouncedSearchQuery = ref('');
const loading = ref(false);
const editDialog = ref(false);
const deleteDialog = ref(false);
const editingCustomer = ref<Customer | undefined>(undefined);
const deletingCustomer = ref<Customer | undefined>(undefined);
const deleting = ref(false);
const activeLetter = ref<string | undefined>(undefined);
const highlightedCustomerId = ref<number | null>(null);
const selectionMode = ref(false);
const selectedCustomerIds = ref<number[]>([]);
const addingOrders = ref(false);
const existingOrderCustomers = ref<Set<string>>(new Set());
const pendingOrdersCount = ref(0);
const hasOrdersToDelete = computed(() => pendingOrdersCount.value > 0);

// Debounced search with 300ms delay
const updateDebouncedSearch = useDebounceFn((value: string) => {
  debouncedSearchQuery.value = value;
}, 300);

// Navigation
const goBack = () => {
  navigateTo('/orders');
};

// Selection mode
const enterSelectionMode = () => {
  selectionMode.value = true;
  selectedCustomerIds.value = [];
};

const exitSelectionMode = () => {
  // 如果还有订单存在，不允许退出选择模式
  if (existingOrderCustomers.value.size > 0) {
    // 只清空选择，但保持选择模式
    selectedCustomerIds.value = [];
  } else {
    // 没有订单时才允许退出选择模式
    selectionMode.value = false;
    selectedCustomerIds.value = [];
  }
};

// Add orders from selected customers
const addOrdersFromSelection = async () => {
  if (selectedCustomerIds.value.length === 0) return;

  addingOrders.value = true;
  let successCount = 0;

  try {
    const selectedCustomers = customers.value.filter((c) =>
      selectedCustomerIds.value.includes(c.id)
    );

    for (const customer of selectedCustomers) {
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: customer.customerName,
            address: customer.address,
            lat: customer.lat,
            lng: customer.lng,
            contactType: customer.contactType,
            contactValue: customer.contactValue,
            items: '', // 留空，需要用户填写
            notes: '', // 留空，需要用户填写
          }),
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to add order for ${customer.customerName}:`, error);
      }
    }

    // 退出选择模式
    exitSelectionMode();

    // 返回订单页面，并通过 query 参数传递消息
    await navigateTo({
      path: '/orders',
      query: {
        message: `成功添加 ${successCount} 个订单，请补充订单商品信息和备注`,
        type: 'success',
      },
    });
  } catch (error) {
    console.error('Failed to add orders:', error);
  } finally {
    addingOrders.value = false;
  }
};

// Load recent customers
const loadRecentCustomers = async () => {
  try {
    const response = await fetch('/api/addresses/frequent/recent');
    if (!response.ok) {
      throw new Error('Failed to load recent customers');
    }
    const result = await response.json();
    recentCustomers.value = result.data || result;
  } catch (error) {
    console.error('Failed to load recent customers:', error);
  }
};

// Scroll to customer and highlight
const scrollToCustomer = (customerId: number) => {
  const element = document.getElementById(`customer-${customerId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight the customer
    highlightedCustomerId.value = customerId;

    // Remove highlight after 2 seconds
    setTimeout(() => {
      highlightedCustomerId.value = null;
    }, 2000);
  }
};

// Handle edit customer
const handleEdit = (customer: Customer) => {
  editingCustomer.value = customer;
  editDialog.value = true;
};

// Handle delete customer
const handleDelete = async (customer: Customer) => {
  deletingCustomer.value = customer;

  // 检查该客户是否有待处理订单
  try {
    const response = await fetch('/api/orders/count-by-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: customer.customerName,
        address: customer.address,
      }),
    });

    const result = await response.json();
    pendingOrdersCount.value = result.data?.count || 0;
  } catch (error) {
    console.error('Failed to check orders:', error);
    pendingOrdersCount.value = 0;
  }

  deleteDialog.value = true;
};

// Cancel delete
const cancelDelete = () => {
  deleteDialog.value = false;
  deletingCustomer.value = undefined;
  pendingOrdersCount.value = 0;
};

// Confirm delete customer
const confirmDelete = async () => {
  if (!deletingCustomer.value) return;

  deleting.value = true;
  try {
    // 先同步删除相关订单
    try {
      await fetch('/api/orders/delete-by-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: deletingCustomer.value.customerName,
          address: deletingCustomer.value.address,
        }),
      });
    } catch (error) {
      console.error('Failed to delete related orders:', error);
      // 继续删除客户
    }

    // 删除客户
    const response = await fetch(`/api/addresses/frequent/${deletingCustomer.value.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete customer');
    }

    // Reload customers
    await loadCustomers();
    await loadRecentCustomers();
    await loadExistingOrders();

    cancelDelete();

    // 根据是否有订单决定选择模式
    checkAndUpdateSelectionMode();
  } catch (error) {
    console.error('Failed to delete customer:', error);
  } finally {
    deleting.value = false;
  }
};

// Cache for first letter calculations to improve performance
const firstLetterCache = new Map<string, string>();

// Get first letter for grouping with caching
const getFirstLetter = (name: string): string => {
  if (!name) return '#';

  // Check cache first
  if (firstLetterCache.has(name)) {
    return firstLetterCache.get(name)!;
  }

  const py = pinyin(name, { style: pinyin.STYLE_FIRST_LETTER });

  let letter = '#';
  if (py && py[0] && py[0][0]) {
    const firstChar = py[0][0].toUpperCase();
    if (/^[A-Z]$/.test(firstChar)) {
      letter = firstChar;
    }
  }

  // Cache the result
  firstLetterCache.set(name, letter);
  return letter;
};

// Group customers by first letter
const groupByFirstLetter = (customerList: Customer[]) => {
  const groups: Record<string, Customer[]> = {};

  customerList.forEach((customer) => {
    const letter = getFirstLetter(customer.customerName);
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(customer);
  });

  return Object.keys(groups)
    .sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    })
    .map((letter) => ({
      letter,
      customers: groups[letter]!,
    }));
};

// Watch searchQuery and update debounced version
watch(searchQuery, (newValue) => {
  updateDebouncedSearch(newValue);
});

// Filtered customers based on debounced search
const filteredCustomers = computed(() => {
  if (!debouncedSearchQuery.value || debouncedSearchQuery.value.trim() === '') {
    return customers.value;
  }

  const query = debouncedSearchQuery.value.toLowerCase().trim();

  return customers.value.filter((customer) => {
    const nameMatch = customer.customerName.toLowerCase().includes(query);
    const aliasMatch = customer.alias?.toLowerCase().includes(query);
    return nameMatch || aliasMatch;
  });
});

// Grouped customers
const groupedCustomers = computed(() => {
  return groupByFirstLetter(filteredCustomers.value);
});

// Available letters for alphabet index
const availableLetters = computed(() => {
  return groupedCustomers.value.map((group) => group.letter);
});

// Scroll to letter group
const scrollToLetter = (letter: string) => {
  const element = document.getElementById(`letter-${letter}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Handle scroll to update active letter
const handleScroll = () => {
  const pageContent = document.querySelector('.page-content');
  if (!pageContent) return;

  const letterElements = document.querySelectorAll('[id^="letter-"]');

  let currentLetter: string | undefined = undefined;

  letterElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const pageContentRect = pageContent.getBoundingClientRect();

    // Check if element is in viewport
    if (rect.top <= pageContentRect.top + 100) {
      const letterId = element.id.replace('letter-', '');
      currentLetter = letterId;
    }
  });

  activeLetter.value = currentLetter;
};

// Handle customer saved - refresh the list
const handleCustomerSaved = async () => {
  await loadCustomers();
  await loadRecentCustomers();
  await loadExistingOrders();

  // 根据是否有订单决定选择模式
  checkAndUpdateSelectionMode();
};

// Load existing orders to check which customers already have pending orders
const loadExistingOrders = async () => {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) {
      throw new Error('Failed to load orders');
    }
    const result = await response.json();
    const orders = result.data || result;

    // Create a set of customer keys (name + address) that have pending orders
    const customerKeys = new Set<string>();
    orders.forEach((order: { customerName: string; address: string }) => {
      const key = `${order.customerName}|${order.address}`;
      customerKeys.add(key);
    });

    existingOrderCustomers.value = customerKeys;
  } catch (error) {
    console.error('Failed to load existing orders:', error);
  }
};

// Check if a customer already has a pending order
const hasExistingOrder = (customer: Customer): boolean => {
  const key = `${customer.customerName}|${customer.address}`;
  return existingOrderCustomers.value.has(key);
};

// Load all customers
const loadCustomers = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/addresses/frequent');
    if (!response.ok) {
      throw new Error('Failed to load customers');
    }
    const result = await response.json();
    customers.value = result.data || result;
  } catch (error) {
    console.error('Failed to load customers:', error);
  } finally {
    loading.value = false;
  }
};

// Check and update selection mode based on existing orders
const checkAndUpdateSelectionMode = () => {
  if (existingOrderCustomers.value.size > 0) {
    selectionMode.value = true;
  } else {
    selectionMode.value = false;
    selectedCustomerIds.value = [];
  }
};

// Initialize data on mount
onMounted(async () => {
  await Promise.all([loadCustomers(), loadRecentCustomers(), loadExistingOrders()]);

  // 如果有客户已在订单中，自动进入选择模式
  checkAndUpdateSelectionMode();

  // Setup scroll listener
  const pageContent = document.querySelector('.page-content');
  if (pageContent) {
    pageContent.addEventListener('scroll', handleScroll);
  }
});

// Cleanup scroll listener
onUnmounted(() => {
  const pageContent = document.querySelector('.page-content');
  if (pageContent) {
    pageContent.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped>
.customers-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-surface));
}

.fixed-header {
  flex-shrink: 0;
  background-color: rgb(var(--v-theme-surface));
  padding: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  margin-top: 48px;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  transition: padding-bottom 0.3s ease;
}

.page-content.with-bottom-bar {
  padding-bottom: 80px;
}

.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.action-bar-content {
  width: 100%;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 60px;
}

.action-info {
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.recent-customers {
  padding: 12px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-primary), 0.04) 100%
  );
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.recent-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.recent-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.recent-chip {
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.recent-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(var(--v-theme-primary), 0.3);
}

.recent-chip.highlighted {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
  transform: scale(1.05);
}

:deep(.highlighted) {
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0%,
  100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(var(--v-theme-primary), 0.2);
  }
}
</style>
