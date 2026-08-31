<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" width="97vw" max-width="1900px" height="97vh" scrollable>
    <v-card class="rounded-xl glass-card" v-if="order">
      <v-card-title class="pa-6 border-b d-flex align-center justify-space-between bg-surface">
        <div>
          <span class="text-h5 font-weight-black text-primary mr-3">{{ order.order_number }}</span>
          <v-chip size="small" color="secondary" variant="flat" class="font-weight-bold">{{ formatDate(order.order_date) }}</v-chip>
        </div>
        <div>
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-download"
            class="mr-4 text-none font-weight-bold"
            rounded="lg"
            @click="downloadProforma"
            :loading="downloading"
            size="small"
          >
            Proforma Invoice
          </v-btn>
          <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)"></v-btn>
        </div>

      </v-card-title>

      <v-card-text class="pa-6 bg-transparent" style="max-height: 100vh">
        <v-row class="fill-height">
          <!-- 75% Left Column: Details & Services -->
          <v-col cols="12" md="9" class="pr-md-6" style="border-right: 1px solid rgba(0,0,0,0.1)">
        <!-- Header Info -->
        <v-row class="mb-6">
          <v-col cols="12" md="3">
            <div class="text-caption text-secondary font-weight-bold text-uppercase mb-1">Customer</div>
            <div class="font-weight-bold text-body-1">{{ order.Customer?.name || 'N/A' }}</div>
            <div class="text-caption">{{ order.Customer?.email }}</div>
          </v-col>
          <v-col cols="12" md="3">
            <div class="text-caption text-secondary font-weight-bold text-uppercase mb-1">Contact Person</div>
            <div class="font-weight-medium">{{ order.contact_person || '-' }}</div>
          </v-col>
          <v-col cols="12" md="3">
            <div class="text-caption text-secondary font-weight-bold text-uppercase mb-1">Customer Reference</div>
            <div class="font-weight-medium">{{ order.customer_reference || '-' }}</div>
          </v-col>
          <v-col cols="12" md="3">
            <div class="text-caption text-secondary font-weight-bold text-uppercase mb-1">Branch</div>
            <div class="font-weight-medium">{{ order.branch || '-' }}</div>
          </v-col>
          <v-col cols="12" v-if="order.internal_remarks">
            <v-alert color="info" variant="tonal" class="rounded-lg">
              <div class="font-weight-bold mb-1">Internal Remarks</div>
              <div>{{ order.internal_remarks }}</div>
            </v-alert>
          </v-col>
        </v-row>

        <h3 class="text-h6 font-weight-bold mb-4">Requested Services</h3>
        <v-table class="bg-surface border rounded-xl overflow-hidden">
          <thead>
            <tr>
              <th class="font-weight-bold">Service</th>
              <th class="font-weight-bold">Description</th>
              <th class="font-weight-bold">Qty</th>
              <th class="font-weight-bold">Cost</th>
              <th class="font-weight-bold">Service Charge</th>
              <th class="font-weight-bold">Total Price</th>
              <th class="font-weight-bold">Priority</th>
              <th class="font-weight-bold">Expected Date</th>
              <th class="font-weight-bold">Status</th>
              <th class="font-weight-bold text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.SalesOrderItems" :key="item.id" class="align-center">
              <td class="py-3">
                <div class="font-weight-bold">{{ item.service_name }}</div>
              </td>
              <td>
                <div class="text-caption text-secondary">{{ item.description || '-' }}</div>
              </td>
              <td>{{ item.quantity }}</td>
              <td>AED {{ item.cost || 0 }}</td>
              <td>AED {{ item.service_charge || 0 }}</td>
              <td class="font-weight-bold">AED {{ item.estimated_price }}</td>
              <td>
                <v-chip size="x-small" :color="getPriorityColor(item.priority)" class="font-weight-bold text-uppercase">{{ item.priority }}</v-chip>
              </td>
              <td>{{ formatDate(item.expected_date) || '-' }}</td>
              <td>
                <v-chip size="small" :color="getStatusColor(item.status)" class="font-weight-bold">
                  {{ getStatusLabel(item.status) }}
                </v-chip>
                <div v-if="item.status === 'CompletedInvoiceCreated' && item.invoice" class="mt-1">
                  <span 
                    class="text-caption text-primary font-weight-black cursor-pointer text-decoration-underline"
                    @click="openInvoiceView(item.invoice)"
                  >
                    <v-icon size="x-small" icon="mdi-receipt-text-outline" class="mr-1"></v-icon>
                    {{ item.invoice.invoice_number }}
                  </span>
                </div>
              </td>
              <td class="text-end" style="min-width: 200px;">
                <template v-if="!item.service_order_id">
                  <template v-if="!item.confirmed && !item.cancelled">
                    <v-btn
                      color="success"
                      size="small"
                      variant="tonal"
                      class="mr-2 rounded-lg font-weight-bold"
                      @click="openConfirmDialog(item, 'confirm')"
                    >
                      Confirm
                    </v-btn>
                    <v-btn
                      color="error"
                      size="small"
                      variant="outlined"
                      class="rounded-lg font-weight-bold"
                      @click="openConfirmDialog(item, 'cancel')"
                    >
                      Cancel
                    </v-btn>
                  </template>
                  <template v-else-if="item.cancelled">
                    <v-chip color="error" size="small" class="font-weight-bold" variant="flat">Cancelled</v-chip>
                  </template>
                  <v-btn
                    v-else
                    color="primary"
                    size="small"
                    variant="flat"
                    rounded="lg"
                    class="font-weight-bold text-none"
                    prepend-icon="mdi-send"
                    @click="pushService(item)"
                    :loading="pushing === item.id"
                  >
                    Push to Service
                  </v-btn>
                </template>
                <v-btn
                  v-else
                  color="secondary"
                  size="small"
                  variant="outlined"
                  rounded="lg"
                  class="font-weight-bold text-none"
                  prepend-icon="mdi-open-in-new"
                  @click="viewService(item.service_order_id)"
                >
                  View Service
                </v-btn>
              </td>
            </tr>
            <tr v-if="!order.SalesOrderItems?.length">
              <td colspan="7" class="text-center pa-4 text-secondary opacity-60">No services found for this order.</td>
            </tr>
          </tbody>
        </v-table>
          </v-col>

          <!-- 25% Right Column: Lifecycle Tracker -->
          <v-col cols="12" md="3" class="pl-md-6 pt-6 pt-md-2">
            <h3 class="text-h6 font-weight-bold mb-8 text-blue-grey-darken-3">Order Lifecycle</h3>
            <v-timeline density="compact" align="start" truncate-line="both" side="end">
              <v-timeline-item
                v-for="(event, i) in lifecycleEvents"
                :key="i"
                :dot-color="event.color"
                :icon="event.icon"
                size="small"
                fill-dot
              >
                <div class="font-weight-bold text-blue-grey-darken-4">{{ event.title }}</div>
                <div class="text-caption text-secondary mt-1">{{ event.subtitle }}</div>
                <div v-if="event.date" class="text-caption text-primary font-weight-black mt-2">
                  {{ event.date }}
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Invoice Detail View Dialog -->
  <v-dialog v-model="invoiceDetailVisible" max-width="900px">
    <InvoiceDetailView
      v-if="invoiceDetailVisible"
      :invoice-id="selectedInvoiceId"
      @close="invoiceDetailVisible = false"
    />
  </v-dialog>

  <!-- Confirmation Dialog -->
  <v-dialog v-model="confirmDialogVisible" max-width="500px">
    <v-card class="rounded-xl glass-card">
      <v-card-title class="pa-6 border-b font-weight-bold text-h6">
        {{ confirmAction === 'confirm' ? 'Confirm Service' : 'Cancel Service' }}
      </v-card-title>
      <v-card-text class="pa-6">
        <div class="mb-4">Are you sure you want to {{ confirmAction }} this service?</div>
        <v-textarea
          v-model="confirmNotes"
          label="Notes (Optional)"
          variant="outlined"
          density="comfortable"
          hide-details
          class="soft-input"
          rows="3"
        ></v-textarea>
      </v-card-text>
      <v-card-actions class="pa-6 pt-0 justify-end">
        <v-btn variant="text" class="text-none font-weight-bold" @click="confirmDialogVisible = false">Go Back</v-btn>
        <v-btn
          :color="confirmAction === 'confirm' ? 'success' : 'error'"
          class="btn-3d px-6 text-none"
          @click="submitConfirmation"
        >
          Yes, {{ confirmAction }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNuxtApp } from '#app'
import { useRouter } from 'vue-router'
import { useUIStore } from '~/stores/ui'
import InvoiceDetailView from '~/components/invoices/InvoiceDetailView.vue'

const uiStore = useUIStore()

const props = defineProps({
  modelValue: Boolean,
  order: Object
})

const emit = defineEmits(['update:modelValue', 'refresh'])
const { $api } = useNuxtApp()
const router = useRouter()

const pushing = ref(null)
const downloading = ref(false)
const invoiceDetailVisible = ref(false)
const selectedInvoiceId = ref(null)

const confirmDialogVisible = ref(false)
const confirmAction = ref('confirm')
const confirmItem = ref(null)
const confirmNotes = ref('')

const openConfirmDialog = (item, action) => {
  confirmItem.value = item
  confirmAction.value = action
  confirmNotes.value = ''
  confirmDialogVisible.value = true
}

const submitConfirmation = () => {
  if (confirmAction.value === 'confirm') {
    confirmItem.value.confirmed = true
    confirmItem.value.confirm_notes = confirmNotes.value
  } else {
    confirmItem.value.cancelled = true
    confirmItem.value.cancel_notes = confirmNotes.value
  }
  confirmDialogVisible.value = false
}

const downloadProforma = async () => {
  if (!props.order?.id) return
  downloading.value = true
  try {
    const res = await $api.get(`/sales-orders/${props.order.id}/proforma-pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Proforma_Invoice_${props.order.order_number}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download proforma pdf', error)
    uiStore.showError('Failed to download Proforma Invoice')
  } finally {
    downloading.value = false
  }
}

const openInvoiceView = (invoice) => {
  selectedInvoiceId.value = invoice.id
  invoiceDetailVisible.value = true
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const lifecycleEvents = computed(() => {
  if (!props.order) return []
  const items = props.order.SalesOrderItems || []
  const total = items.length
  if (total === 0) {
    return [
      { title: 'Draft Created', subtitle: 'Order created with no services', color: 'primary', icon: 'mdi-file-document-outline', date: formatDate(props.order.order_date) }
    ]
  }

  const confirmedCount = items.filter(i => i.confirmed).length
  const cancelledCount = items.filter(i => i.cancelled).length
  const dispatchedCount = items.filter(i => i.service_order_id).length
  const invoicedCount = items.filter(i => i.invoice).length
  const completedCount = items.filter(i => i.status === 'CompletedInvoiceCreated' || i.status === 'CompletedInvoicePending').length

  const events = []
  
  // 1. Order Creation
  events.push({
    title: 'Order Drafted',
    subtitle: `${total} services requested`,
    color: 'primary',
    icon: 'mdi-file-document-edit-outline',
    date: formatDate(props.order.order_date)
  })

  // 2. Customer Confirmation
  if (confirmedCount > 0 || cancelledCount > 0) {
    if (confirmedCount === total - cancelledCount && confirmedCount > 0) {
      events.push({
        title: 'Customer Confirmed',
        subtitle: 'All active services confirmed',
        color: 'success',
        icon: 'mdi-check-all',
        date: 'Done'
      })
    } else {
      events.push({
        title: 'Partial Confirmation',
        subtitle: `${confirmedCount} confirmed, ${cancelledCount} cancelled`,
        color: 'warning',
        icon: 'mdi-check',
        date: 'In Progress'
      })
    }
  }

  // 3. Dispatch to Execution
  if (dispatchedCount > 0) {
    events.push({
      title: 'Dispatched to Execution',
      subtitle: `${dispatchedCount}/${confirmedCount} services dispatched`,
      color: dispatchedCount === confirmedCount ? 'success' : 'primary',
      icon: 'mdi-truck-delivery-outline',
      date: dispatchedCount === confirmedCount ? 'Done' : 'In Progress'
    })
  } else if (confirmedCount > 0) {
    events.push({
      title: 'Pending Dispatch',
      subtitle: 'Awaiting push to execution team',
      color: 'grey',
      icon: 'mdi-clock-outline'
    })
  }

  // 4. Execution / Completion
  if (completedCount > 0) {
    events.push({
      title: 'Service Execution',
      subtitle: `${completedCount}/${dispatchedCount} services completed`,
      color: completedCount === dispatchedCount ? 'success' : 'primary',
      icon: 'mdi-cog-outline',
      date: completedCount === dispatchedCount ? 'Done' : 'In Progress'
    })
  }

  // 5. Invoicing
  if (invoicedCount > 0) {
    events.push({
      title: 'Invoicing',
      subtitle: `${invoicedCount} invoices generated`,
      color: 'success',
      icon: 'mdi-receipt-text-outline',
      date: 'Done'
    })
  }

  return events
})

const getPriorityColor = (priority) => {
  const map = { Normal: 'info', Moderate: 'warning', Critical: 'error' }
  return map[priority] || 'secondary'
}

const getStatusColor = (status) => {
  const map = {
    'Not Started': 'secondary',
    'Pending': 'warning',
    'In Progress': 'primary',
    'CompletedInvoicePending': 'orange',
    'CompletedInvoiceCreated': 'success',
    'Cancelled': 'error'
  }
  return map[status] || 'grey'
}

const getStatusLabel = (status) => {
  const map = {
    'Not Started': 'Not Started',
    'Pending': 'Pending',
    'In Progress': 'In Progress',
    'CompletedInvoicePending': 'Completed - Invoice Pending',
    'CompletedInvoiceCreated': 'Completed - Invoice Created',
    'Cancelled': 'Cancelled'
  }
  return map[status] || status || 'Not Started'
}

const pushService = async (item) => {
  if (!confirm(`Are you sure you want to dispatch "${item.service_name}" to the execution team?`)) return
  
  pushing.value = item.id
  try {
    const res = await $api.post(`/sales-orders/items/${item.id}/push`)
    uiStore.showSuccess(res.data.message)
    emit('refresh') // Refreshes parent to get updated order info
    
    // We should close the modal or ideally just wait for the refresh to update the items.
    // Parent refresh will eventually update `order.SalesOrderItems` from the API.
  } catch (err) {
    console.error(err)
    uiStore.showError(err.response?.data?.message || 'Failed to push service')
  } finally {
    pushing.value = null
  }
}

const viewService = (serviceOrderId) => {
  // Emit event to close this dialog and navigate
  emit('update:modelValue', false)
  // Assuming the Services module is at /services?id=... or we can just go to /services
  // For now we just route to /services. The user can find it.
  router.push(`/services?search=SRV-${String(serviceOrderId).padStart(5, '0')}`)
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
}
</style>
