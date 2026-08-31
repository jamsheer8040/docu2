<template>
  <v-container fluid class="sales-orders-page py-8 px-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h3 font-weight-black text-gradient mb-1">Sales Orders</h1>
        <p class="text-subtitle-1 text-secondary font-weight-medium">Manage customer service requests and dispatches</p>
      </div>
      <v-btn
        class="btn-standard"
        size="large"
        prepend-icon="mdi-plus-circle"
        @click="openCreateDialog"
      >
        Create Sales Order
      </v-btn>
    </div>

    <!-- Search & Filters -->
    <v-card class="soft-card mb-6 pa-4" variant="flat">
      <v-row align="center">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search Orders..."
            variant="solo"
            flat
            density="comfortable"
            hide-details
            class="search-pill"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="customerFilter"
            :items="customers"
            item-title="name"
            item-value="id"
            prepend-inner-icon="mdi-filter-variant"
            placeholder="Filter by Customer"
            variant="solo"
            flat
            density="comfortable"
            hide-details
            clearable
            class="search-pill"
          ></v-select>
        </v-col>
      </v-row>
    </v-card>

    <!-- Data Table -->
    <v-card class="soft-card overflow-hidden" variant="flat">
      <v-data-table
        :headers="headers"
        :items="filteredSalesOrders"
        :search="search"
        :loading="loading"
        class="bg-transparent cursor-pointer"
        hover
        @click:row="(_, { item }) => viewOrder(item)"
      >
        <template v-slot:item.order_number="{ item }">
          <span class="font-weight-black text-primary">{{ item.order_number }}</span>
        </template>

        <template v-slot:item.customer="{ item }">
          <div class="font-weight-bold">{{ item.Customer?.name || 'N/A' }}</div>
          <div class="text-caption text-secondary">{{ item.Customer?.email }}</div>
        </template>

        <template v-slot:item.order_date="{ item }">
          {{ formatDate(item.order_date) }}
        </template>

        <template v-slot:item.services_count="{ item }">
          <v-chip size="small" color="info" variant="flat" class="font-weight-bold">
            {{ item.SalesOrderItems?.length || 0 }} Services
          </v-chip>
        </template>

        <template v-slot:item.confirmed="{ item }">
          <div class="d-flex align-center">
            <span class="text-subtitle-2 font-weight-medium mr-1" :class="getConfirmedCount(item) > 0 ? 'text-success' : 'text-grey'">
              {{ getConfirmedCount(item) > 0 ? `${getConfirmedCount(item)}/${item.SalesOrderItems?.length} confirmed` : '-' }}
            </span>
            <v-icon
              v-if="item.SalesOrderItems?.length > 0 && (getConfirmedCount(item) + getCancelledCount(item)) >= item.SalesOrderItems?.length"
              color="success"
              size="small"
              title="All services processed"
            >mdi-check-circle</v-icon>
          </div>
        </template>

        <template v-slot:item.started="{ item }">
          <span class="text-subtitle-2 font-weight-medium" :class="getStartedCount(item) > 0 ? 'text-primary' : 'text-grey'">
            {{ getStartedCount(item) > 0 ? `${getStartedCount(item)}/${item.SalesOrderItems?.length} started` : '-' }}
          </span>
        </template>

        <template v-slot:item.cancelled="{ item }">
          <span class="text-subtitle-2 font-weight-medium" :class="getCancelledCount(item) > 0 ? 'text-error' : 'text-grey'">
            {{ getCancelledCount(item) > 0 ? `${getCancelledCount(item)} cancelled` : '-' }}
          </span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-download"
            variant="text"
            color="success"
            size="small"
            class="mr-2"
            title="Download Proforma Invoice"
            @click.stop="downloadProforma(item)"
          ></v-btn>
          <v-btn
            icon="mdi-eye"
            variant="text"
            color="primary"
            size="small"
            class="mr-2"
            @click.stop="viewOrder(item)"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            variant="text"
            color="error"
            size="small"
            @click.stop="deleteOrder(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <SalesOrderDialog
      v-model="dialogVisible"
      :customers="customers"
      :service-types="serviceTypes"
      @saved="fetchData"
    />

    <SalesOrderDetail
      v-model="detailVisible"
      :order="selectedOrder"
      @refresh="fetchData"
    />
  </v-container>
</template>

<script setup>
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import SalesOrderDialog from '@/components/sales-orders/SalesOrderDialog.vue'
import SalesOrderDetail from '@/components/sales-orders/SalesOrderDetail.vue'
import { useNuxtApp } from '#app'

const { $api } = useNuxtApp()
const authStore = useAuthStore()

const loading = ref(false)
const search = ref('')
const customerFilter = ref(null)

const salesOrders = ref([])
const customers = ref([])
const serviceTypes = ref([])

const dialogVisible = ref(false)
const detailVisible = ref(false)
const selectedOrder = ref(null)

const headers = [
  { title: 'Order No.', key: 'order_number', sortable: true },
  { title: 'Customer', key: 'customer', sortable: true },
  { title: 'Date', key: 'order_date', sortable: true },
  { title: 'Contact Person', key: 'contact_person', sortable: true },
  { title: 'Total Services', key: 'services_count', sortable: false },
  { title: 'Confirmed', key: 'confirmed', sortable: true },
  { title: 'Started', key: 'started', sortable: true },
  { title: 'Cancelled', key: 'cancelled', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const filteredSalesOrders = computed(() => {
  let list = salesOrders.value
  if (customerFilter.value) {
    list = list.filter(o => o.customer_id === customerFilter.value)
  }
  return list
})

const fetchData = async () => {
  loading.value = true
  try {
    const [ordersRes, custRes, servRes] = await Promise.all([
      $api.get('/sales-orders'),
      $api.get('/customers?limit=1000&is_active=true'),
      $api.get('/services/types')
    ])
    salesOrders.value = ordersRes.data.data
    customers.value = custRes.data.data
    serviceTypes.value = servRes.data.data

    if (selectedOrder.value) {
      const updatedOrder = salesOrders.value.find(o => o.id === selectedOrder.value.id)
      if (updatedOrder) {
        selectedOrder.value = updatedOrder
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const openCreateDialog = () => {
  dialogVisible.value = true
}

const viewOrder = (item) => {
  selectedOrder.value = item
  detailVisible.value = true
}

const deleteOrder = async (item) => {
  if (!confirm(`Are you sure you want to delete ${item.order_number}?`)) return
  try {
    await $api.delete(`/sales-orders/${item.id}`)
    fetchData()
  } catch (err) {
    console.error(err)
    uiStore.showError('Failed to delete')
  }
}

const downloadProforma = async (item) => {
  if (!item?.id) return
  try {
    const res = await $api.get(`/sales-orders/${item.id}/proforma-pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Proforma_Invoice_${item.order_number}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download proforma pdf', error)
    uiStore.showError('Failed to download Proforma Invoice')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const getConfirmedCount = (item) => {
  return item.SalesOrderItems?.filter(i => i.confirmed || i.service_order_id != null).length || 0
}

const getStartedCount = (item) => {
  return item.SalesOrderItems?.filter(i => i.service_order_id != null).length || 0
}

const getCancelledCount = (item) => {
  return item.SalesOrderItems?.filter(i => i.cancelled || i.status === 'Cancelled').length || 0
}
</script>

<style scoped>
.sales-orders-page {
  max-width: 1600px;
  margin: 0 auto;
}
.text-gradient {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
