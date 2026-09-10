<template>
  <v-dialog v-model="internalDialog" max-width="600px" persistent>
    <v-card class="glass-card-ethereal pa-4" variant="flat">
      <v-card-title class="text-h5 font-weight-bold text-blue-grey-darken-4 mb-2">
        {{ isEdit ? 'Edit Supplier' : 'New Supplier' }}
      </v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="save">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.name"
                label="Supplier Name *"
                variant="outlined"
                density="comfortable"
                bg-color="rgba(255,255,255,0.4)"
                :rules="[v => !!v || 'Name is required']"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.contact_person"
                label="Contact Person"
                variant="outlined"
                density="comfortable"
                bg-color="rgba(255,255,255,0.4)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.phone"
                label="Phone"
                variant="outlined"
                density="comfortable"
                bg-color="rgba(255,255,255,0.4)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.email"
                label="Email"
                type="email"
                variant="outlined"
                density="comfortable"
                bg-color="rgba(255,255,255,0.4)"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.address"
                label="Address"
                variant="outlined"
                density="comfortable"
                bg-color="rgba(255,255,255,0.4)"
                rows="2"
              ></v-textarea>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Notes"
                variant="outlined"
                density="comfortable"
                bg-color="rgba(255,255,255,0.4)"
                rows="2"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions class="px-6 pb-6">
        <v-spacer></v-spacer>
        <v-btn variant="text" class="text-none font-weight-bold text-blue-grey-darken-2" @click="close">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none font-weight-bold px-6 rounded-lg btn-3d"
          :loading="saving"
          @click="save"
        >
          Save Supplier
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useNuxtApp } from '#app';

const props = defineProps({
  modelValue: Boolean,
  supplier: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'saved']);
const { $api } = useNuxtApp();

const internalDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const isEdit = computed(() => !!props.supplier);
const form = ref(null);
const saving = ref(false);

const formData = ref({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: ''
});

watch(() => props.supplier, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal };
  } else {
    formData.value = {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    };
  }
}, { immediate: true });

const close = () => {
  internalDialog.value = false;
};

const save = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    if (isEdit.value) {
      await $api.put(`/suppliers/${props.supplier.id}`, formData.value);
    } else {
      await $api.post('/suppliers', formData.value);
    }
    emit('saved');
    close();
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || 'Error saving supplier');
  } finally {
    saving.value = false;
  }
};
</script>
