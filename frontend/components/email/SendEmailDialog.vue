<template>
  <v-dialog v-model="model" max-width="620" persistent>
    <v-card class="soft-card" variant="flat">
      <v-card-title class="pa-6 border-b d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-email-fast</v-icon>
        <span class="text-h6 font-weight-bold">Send Email</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="model = false" />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-text-field
          v-model="form.to"
          label="To (Email Address)*"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          prepend-inner-icon="mdi-email"
        />

        <v-select
          v-model="selectedTemplateId"
          :items="templates"
          item-title="name"
          item-value="id"
          label="Use Template (optional)"
          variant="outlined"
          density="comfortable"
          clearable
          class="mb-3"
          prepend-inner-icon="mdi-file-document"
          @update:modelValue="applyTemplate"
        />

        <v-text-field
          v-model="form.subject"
          label="Subject*"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />

        <v-textarea
          v-model="form.body_html"
          label="Message (HTML supported)*"
          variant="outlined"
          rows="8"
          class="mb-2"
        />

        <p class="text-caption text-secondary">
          <strong>Available variables:</strong> {{customer_name}}, {{business_name}}, {{contact_email}}, {{message}}
        </p>
      </v-card-text>

      <v-card-actions class="pa-6 border-t">
        <v-spacer />
        <v-btn variant="text" color="secondary" @click="model = false">Cancel</v-btn>
        <v-btn class="btn-standard" :loading="sending" @click="send" :disabled="!form.to || !form.subject || !form.body_html">
          <v-icon start>mdi-send</v-icon> Send Email
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import { useUIStore } from '~/stores/ui'

const { $api } = useNuxtApp()
const uiStore = useUIStore()

const props = defineProps({
  modelValue: Boolean,
  prefillTo: { type: String, default: '' },
  prefillCustomerName: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

import { computed } from 'vue'

const sending = ref(false)
const templates = ref([])
const selectedTemplateId = ref(null)

const form = ref({
  to: '',
  subject: '',
  body_html: ''
})

watch(() => props.prefillTo, (v) => { if (v) form.value.to = v }, { immediate: true })
watch(() => props.prefillCustomerName, (v) => {
  if (v && form.value.body_html) {
    form.value.body_html = form.value.body_html.replace(/\{\{customer_name\}\}/g, v)
  }
})

const loadTemplates = async () => {
  try {
    const res = await $api.get('/email/templates')
    templates.value = res.data.data.filter(t => t.is_active)
  } catch (err) {
    console.error(err)
  }
}

const applyTemplate = (id) => {
  if (!id) return
  const tmpl = templates.value.find(t => t.id === id)
  if (tmpl) {
    form.value.subject = tmpl.subject
    form.value.body_html = tmpl.body_html
  }
}

const send = async () => {
  sending.value = true
  try {
    const payload = {
      to: form.value.to,
      subject: form.value.subject,
      body_html: form.value.body_html
    }
    const res = await $api.post('/email/send', payload)
    if (res.data.success) {
      uiStore.showSuccess('Email sent successfully!')
      emit('update:modelValue', false)
    } else {
      uiStore.showError(res.data.message || 'Failed to send email')
    }
  } catch (err) {
    uiStore.showError(err.response?.data?.message || 'Failed to send email')
  } finally {
    sending.value = false
  }
}

onMounted(loadTemplates)
</script>
