<template>
  <div>
    <v-card class="soft-card" variant="flat">
      <div class="pa-6 d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h6 font-weight-bold">Email Templates</h2>
          <p class="text-caption text-secondary">Customize the emails sent automatically or manually from the platform. Use <code>&#123;&#123;variable&#125;&#125;</code> placeholders.</p>
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="templates"
        :loading="loading"
        class="bg-transparent"
        item-value="id"
      >
        <template v-slot:item.type="{ item }">
          <v-chip :color="typeColor(item.type)" variant="flat" size="small" class="font-weight-bold">{{ item.type }}</v-chip>
        </template>

        <template v-slot:item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'default'" variant="flat" size="small">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" color="primary" size="small" @click="openEdit(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Edit Dialog -->
    <v-dialog v-model="dialog" max-width="780" persistent>
      <v-card class="soft-card" variant="flat">
        <v-card-title class="pa-6 border-b">
          <span class="text-h6 font-weight-bold">Edit Template: {{ editItem?.name }}</span>
        </v-card-title>
        <v-card-text class="pa-6" v-if="editItem">
          <v-text-field v-model="editItem.subject" label="Email Subject" variant="outlined" density="comfortable" class="mb-4" />
          <label class="text-caption text-secondary font-weight-bold mb-1 d-block">HTML Body (use &#123;&#123;variable&#125;&#125; for placeholders)</label>
          <v-textarea v-model="editItem.body_html" variant="outlined" rows="14" class="mb-4 mono-text" />
          <v-switch v-model="editItem.is_active" label="Active" color="primary" inset density="comfortable" />
        </v-card-text>
        <v-card-actions class="pa-6 border-t">
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="dialog = false">Cancel</v-btn>
          <v-btn class="btn-standard" :loading="saving" @click="saveTemplate">Save Template</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import { useUIStore } from '~/stores/ui'

const { $api } = useNuxtApp()
const uiStore = useUIStore()

const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const templates = ref([])
const editItem = ref(null)

const headers = [
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Subject', key: 'subject', sortable: false },
  { title: 'Status', key: 'is_active', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const typeColor = (type) => {
  const map = {
    invoice_issued: 'primary',
    payment_received: 'success',
    document_reminder: 'warning',
    document_expired: 'error',
    sales_order_confirmation: 'info',
    manual: 'default'
  }
  return map[type] || 'default'
}

const load = async () => {
  loading.value = true
  try {
    const res = await $api.get('/email/templates')
    templates.value = res.data.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const openEdit = (item) => {
  editItem.value = { ...item }
  dialog.value = true
}

const saveTemplate = async () => {
  saving.value = true
  try {
    await $api.post('/email/templates', editItem.value)
    uiStore.showSuccess('Template saved successfully!')
    dialog.value = false
    load()
  } catch (err) {
    uiStore.showError('Failed to save template')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.mono-text :deep(textarea) {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>
