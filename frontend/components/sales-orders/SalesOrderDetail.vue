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
            prepend-icon="mdi-download"
            class="mr-4 text-none font-weight-bold btn-3d"
            rounded="xl"
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
          <!-- 80% Left Column: Details & Services -->
          <v-col cols="12" class="col-md-80 pr-md-6" style="border-right: 1px solid rgba(0,0,0,0.1)">
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

          <!-- 20% Right Column: Lifecycle Tracker -->
          <v-col cols="12" class="col-md-20 pl-md-6 pt-6 pt-md-2">
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
                <div class="text-caption text-secondary mt-1">
                  <v-icon v-if="event.isNote" size="12" class="mr-1">mdi-note-text-outline</v-icon>
                  {{ event.subtitle }}
                </div>
                <div v-if="event.list && event.list.length" class="mt-3 pl-3" style="border-left: 2px solid rgba(var(--v-theme-primary), 0.15); margin-left: 10px;">
                  <div v-for="(listItem, j) in event.list" :key="j" class="text-caption text-secondary d-flex align-center pb-3 position-relative" style="left: -11.5px;">
                    <div class="bg-surface rounded-circle d-flex justify-center align-center mr-2" style="width: 21px; height: 21px; border: 2px solid rgb(var(--v-theme-surface)); box-shadow: 0 0 0 1px white;">
                      <v-icon size="18" :color="listItem.done ? 'success' : 'grey-lighten-2'">
                        {{ listItem.done ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                      </v-icon>
                    </div>
                    <span class="text-truncate" :class="{ 'font-weight-bold text-blue-grey-darken-3': listItem.done }">{{ listItem.label }}</span>
                    <v-btn
                      v-if="listItem.attachment"
                      icon="mdi-paperclip"
                      size="20"
                      variant="text"
                      color="primary"
                      class="ml-1"
                      @click="openAttachmentViewer(listItem.attachment)"
                      title="View Attachment"
                    ></v-btn>
                    <span v-if="listItem.date" class="ml-auto ml-2 opacity-70">{{ listItem.date }}</span>
                  </div>
                </div>
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
          hide-details="auto"
          class="soft-input mb-4"
          rows="3"
        ></v-textarea>
        <v-file-input
          v-if="confirmAction === 'confirm'"
          v-model="confirmAttachment"
          label="Attachment (Optional)"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          accept=".jpg,.jpeg,.png,.pdf,.webp"
          prepend-icon=""
          prepend-inner-icon="mdi-paperclip"
          class="soft-input"
        ></v-file-input>
      </v-card-text>
      <v-card-actions class="pa-6 pt-0 justify-end">
        <v-btn variant="text" class="text-none font-weight-bold" @click="confirmDialogVisible = false">Go Back</v-btn>
        <v-btn
          :color="confirmAction === 'confirm' ? 'success' : 'error'"
          class="btn-3d px-6 text-none"
          :loading="submittingConfirm"
          @click="submitConfirmation"
        >
          Yes, {{ confirmAction }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Attachment Viewer Dialog -->
  <v-dialog v-model="attachmentViewerVisible" max-width="900px" height="80vh">
    <v-card class="rounded-xl glass-card fill-height">
      <v-card-title class="pa-4 border-b d-flex align-center justify-space-between bg-surface">
        <span class="font-weight-bold">Attachment Viewer</span>
        <div class="d-flex align-center gap-2">
          <v-btn icon="mdi-whatsapp" color="success" variant="text" size="small" @click="shareWhatsApp"></v-btn>
          <v-btn icon="mdi-download" color="primary" variant="text" size="small" @click="downloadAttachment"></v-btn>
          <v-btn icon="mdi-close" variant="text" size="small" @click="attachmentViewerVisible = false"></v-btn>
        </div>
      </v-card-title>
      <v-card-text class="pa-0 fill-height position-relative bg-grey-lighten-4 d-flex justify-center align-center">
        <!-- Render PDF or Image based on extension -->
        <template v-if="currentAttachmentUrl">
          <iframe 
            v-if="currentAttachmentUrl.toLowerCase().endsWith('.pdf')" 
            :src="currentAttachmentUrl" 
            width="100%" 
            height="100%" 
            style="border: none;">
          </iframe>
          <img 
            v-else 
            :src="currentAttachmentUrl" 
            style="max-width: 100%; max-height: 100%; object-fit: contain;" 
          />
        </template>
      </v-card-text>
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

const attachmentViewerVisible = ref(false)
const currentAttachmentUrl = ref(null)

const openAttachmentViewer = (url) => {
  currentAttachmentUrl.value = url
  attachmentViewerVisible.value = true
}

const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return window.location.origin + url
}

const downloadAttachment = () => {
  if (!currentAttachmentUrl.value) return
  const link = document.createElement('a')
  link.href = currentAttachmentUrl.value
  link.download = currentAttachmentUrl.value.split('/').pop() || 'attachment'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const shareWhatsApp = () => {
  if (!currentAttachmentUrl.value) return
  const fullUrl = getFullUrl(currentAttachmentUrl.value)
  const text = encodeURIComponent(`Please review this attachment: ${fullUrl}`)
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
}

const confirmDialogVisible = ref(false)
const confirmAction = ref('confirm')
const confirmItem = ref(null)
const confirmNotes = ref('')
const confirmAttachment = ref(null)
const submittingConfirm = ref(false)

const openConfirmDialog = (item, action) => {
  confirmItem.value = item
  confirmAction.value = action
  confirmNotes.value = ''
  confirmAttachment.value = null
  confirmDialogVisible.value = true
}

const submitConfirmation = async () => {
  if (!confirmItem.value) return
  submittingConfirm.value = true
  try {
    const formData = new FormData()
    formData.append('action', confirmAction.value)
    if (confirmNotes.value) {
      formData.append('notes', confirmNotes.value)
    }
    if (confirmAction.value === 'confirm' && confirmAttachment.value) {
      const file = Array.isArray(confirmAttachment.value) ? confirmAttachment.value[0] : confirmAttachment.value
      if (file) {
        formData.append('attachment', file)
      }
    }

    const res = await $api.post(`/sales-orders/items/${confirmItem.value.id}/confirm`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    uiStore.showSuccess(res.data.message)
    emit('refresh')
    confirmDialogVisible.value = false
  } catch (err) {
    console.error('Failed to confirm/cancel service', err)
    uiStore.showError(err.response?.data?.message || 'Failed to submit action')
  } finally {
    submittingConfirm.value = false
  }
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
  const inProgressCount = items.filter(i => i.status === 'In Progress').length
  const invoicedCount = items.filter(i => i.invoice).length
  const completedCount = items.filter(i => i.status === 'CompletedInvoiceCreated' || i.status === 'CompletedInvoicePending').length

  const events = []
  
  // 1. Order Creation
  events.push({
    title: 'Created',
    subtitle: `${total} services requested`,
    color: 'primary',
    icon: 'mdi-file-document-edit-outline',
    date: formatDate(props.order.order_date)
  })

  // 2. Iterate each item (Service-centric timeline)
  items.forEach((item, index) => {
    const numIcon = index < 9 ? `mdi-numeric-${index + 1}-circle` : 'mdi-circle-small'
    const serviceIdLabel = item.service_order_id ? ` (#${String(item.service_order_id).padStart(5, '0')})` : ''
    
    const isCompleted = item.status === 'CompletedInvoiceCreated' || item.status === 'CompletedInvoicePending'
    const isInitiated = isCompleted || (item.status !== 'Not Started' && item.status !== 'Pending' && item.status !== 'Cancelled')
    const isConfirmed = item.confirmed || isInitiated
    const isCancelled = item.cancelled || item.status === 'Cancelled'

    if (isCancelled) {
       events.push({
         title: `${item.service_name}${serviceIdLabel} - Cancelled`,
         subtitle: item.cancel_notes || 'Cancelled by customer',
         isNote: !!item.cancel_notes,
         color: 'error',
         icon: numIcon,
         date: formatDate(item.updatedAt || item.updated_at)
       })
       return;
    }

    const list = []
    
    // Confirmed Step
    list.push({
      label: 'Confirmed',
      done: isConfirmed,
      date: isConfirmed ? formatDate(item.updatedAt || item.updated_at) : null,
      attachment: item.confirm_attachment ? (useRuntimeConfig().public.apiBase.replace('/api/v1', '') + item.confirm_attachment) : null
    })

    // Initiated Step
    list.push({
      label: 'Initiated',
      done: isInitiated,
      date: isInitiated ? formatDate(item.started_at || item.updatedAt || item.updated_at) : null
    })

    // Completed Step
    list.push({
      label: 'Completed',
      done: isCompleted,
      date: isCompleted ? formatDate(item.completed_at || item.updatedAt || item.updated_at) : null
    })

    events.push({
      title: `${item.service_name}${serviceIdLabel}`,
      subtitle: item.confirm_notes || '',
      isNote: !!item.confirm_notes,
      color: isCompleted ? 'success' : (isInitiated ? 'primary' : (isConfirmed ? 'info' : 'grey')),
      icon: numIcon,
      list: list
    })
  })

  // 5. Invoicing
  if (invoicedCount > 0) {
    const invoicedItems = items.filter(i => i.invoice)
    const latestInvoice = [...invoicedItems].sort((a, b) => new Date(b.invoice.createdAt || b.invoice.created_at) - new Date(a.invoice.createdAt || a.invoice.created_at))[0]
    events.push({
      title: 'Invoiced',
      subtitle: `${invoicedCount} invoices generated`,
      color: 'success',
      icon: 'mdi-receipt-text-outline',
      date: latestInvoice ? formatDate(latestInvoice.invoice.createdAt || latestInvoice.invoice.created_at) : ''
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
@media (min-width: 960px) {
  .col-md-80 {
    flex: 0 0 80%;
    max-width: 80%;
  }
  .col-md-20 {
    flex: 0 0 20%;
    max-width: 20%;
  }
}
</style>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
}
</style>
