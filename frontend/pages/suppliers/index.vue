<template>
  <v-container fluid class="pa-2 pa-sm-4 pa-md-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-black text-blue-grey-darken-4">Suppliers</h1>
        <p class="text-blue-grey-darken-1 mt-1">Manage your service providers and vendors</p>
      </div>
      <v-btn
        v-if="auth.can('suppliers', 'write')"
        color="primary"
        class="btn-3d rounded-lg font-weight-bold px-6"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        New Supplier
      </v-btn>
    </div>

    <v-card class="glass-card-ethereal overflow-hidden" variant="flat">
      <div class="pa-4 d-flex align-center flex-wrap gap-4" style="background: rgba(255,255,255,0.1);">
        <div style="width: 250px;">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search suppliers..."
            variant="solo"
            density="comfortable"
            hide-details
            flat
            class="search-pill bg-transparent"
          ></v-text-field>
        </div>
      </div>

      <v-divider style="opacity: 0.1"></v-divider>

      <v-data-table
        :headers="headers"
        :items="filteredSuppliers"
        :loading="loading"
        class="bg-transparent elevation-0 ethereal-table cursor-pointer-table"
        hover
        @click:row="(event, { item }) => viewSupplier(item.id)"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="rgba(147, 51, 234, 0.1)" size="36" class="mr-3 text-primary font-weight-black">
              {{ item.name.charAt(0).toUpperCase() }}
            </v-avatar>
            <div class="font-weight-bold text-blue-grey-darken-4 clickable-name text-truncate" style="max-width: 200px;" @click="viewSupplier(item.id)">
              {{ item.name }}
            </div>
          </div>
        </template>

        <template v-slot:item.contact_person="{ item }">
          <span class="text-blue-grey-darken-3 font-weight-medium">{{ item.contact_person || '-' }}</span>
        </template>
        
        <template v-slot:item.phone="{ item }">
          <span class="text-blue-grey-darken-3 font-weight-medium">{{ item.phone || '-' }}</span>
        </template>

        <template v-slot:item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? '#22C55E' : '#94A3B8'"
            variant="flat"
            size="small"
            class="font-weight-bold text-white px-3"
            style="opacity: 0.8;"
          >
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end gap-1">
            <v-btn icon="mdi-eye-outline" variant="flat" size="x-small" class="ethereal-action-btn" @click="viewSupplier(item.id)"></v-btn>
            <v-menu v-if="auth.can('suppliers', 'write')" location="bottom end">
               <template v-slot:activator="{ props }">
                 <v-btn v-bind="props" icon="mdi-dots-vertical" variant="flat" size="x-small" class="ethereal-action-btn"></v-btn>
               </template>
               <v-list class="glass-card-ethereal pa-2" density="compact">
                 <v-list-item @click="openEditDialog(item)" prepend-icon="mdi-pencil" title="Edit Supplier" class="rounded-lg mb-1"></v-list-item>
                 <v-list-item v-if="item.is_active && auth.can('suppliers', 'delete')" @click="confirmDelete(item)" prepend-icon="mdi-delete" title="Deactivate" base-color="error" class="rounded-lg mb-1"></v-list-item>
               </v-list>
            </v-menu>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <SupplierForm
      v-model="dialog"
      :supplier="editingSupplier"
      @saved="onSaved"
    />

    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card class="glass-card-ethereal pa-2" variant="flat">
        <v-card-title class="text-h6 font-weight-bold text-blue-grey-darken-4">Deactivate Supplier?</v-card-title>
        <v-card-text class="text-blue-grey-darken-2">
          Are you sure you want to deactivate <b class="text-blue-grey-darken-4">{{ itemToDelete?.name }}</b>?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none font-weight-bold text-blue-grey-darken-2" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" class="text-none font-weight-bold px-4 rounded-lg" @click="doDelete">Deactivate</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import SupplierForm from '@/components/suppliers/SupplierForm.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const { $api } = useNuxtApp();
const router = useRouter();

const suppliers = ref([]);
const loading = ref(false);
const search = ref('');

const dialog = ref(false);
const editingSupplier = ref(null);
const deleteDialog = ref(false);
const itemToDelete = ref(null);

const snackbar = reactive({ show: false, text: '', color: '' });

const headers = [
  { title: 'Supplier Name', key: 'name', align: 'start' },
  { title: 'Contact Person', key: 'contact_person' },
  { title: 'Phone', key: 'phone' },
  { title: 'Status', key: 'is_active', align: 'center' },
  { title: '', key: 'actions', align: 'end', sortable: false }
];

const filteredSuppliers = computed(() => {
  if (!search.value) return suppliers.value;
  const s = search.value.toLowerCase();
  return suppliers.value.filter(sup => sup.name.toLowerCase().includes(s) || (sup.contact_person && sup.contact_person.toLowerCase().includes(s)));
});

const loadSuppliers = async () => {
  loading.value = true;
  try {
    const response = await $api.get('/suppliers');
    if (response.data.success) {
      suppliers.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching suppliers:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSuppliers();
});

const openCreateDialog = () => {
  editingSupplier.value = null;
  dialog.value = true;
};

const openEditDialog = (item) => {
  editingSupplier.value = { ...item };
  dialog.value = true;
};

const viewSupplier = (id) => {
  router.push(`/suppliers/${id}`);
};

const onSaved = () => {
  loadSuppliers();
  snackbar.text = 'Supplier saved successfully';
  snackbar.color = 'success';
  snackbar.show = true;
};

const confirmDelete = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const doDelete = async () => {
  try {
    const payload = { is_active: false };
    const response = await $api.put(`/suppliers/${itemToDelete.value.id}`, payload);
    if (response.data.success) {
      loadSuppliers();
      snackbar.text = 'Supplier deactivated successfully';
      snackbar.color = 'success';
      snackbar.show = true;
    }
  } catch (error) {
    snackbar.text = error.response?.data?.message || 'Error deactivating supplier';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    deleteDialog.value = false;
  }
};
</script>

<style scoped>
.clickable-name {
  cursor: pointer;
  transition: color 0.2s;
}
.clickable-name:hover {
  color: #9333EA !important;
}

:deep(.cursor-pointer-table tbody tr) {
  cursor: pointer;
}

:deep(.ethereal-table th) {
  background: transparent !important;
  color: #94A3B8 !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.4) !important;
}

:deep(.ethereal-table td) {
  border-bottom: 1px solid rgba(255,255,255,0.2) !important;
  background: transparent !important;
}

:deep(.ethereal-table tr:hover td) {
  background: rgba(255,255,255,0.3) !important;
}

.ethereal-action-btn {
  background: rgba(255,255,255,0.5) !important;
  border-radius: 8px !important;
  color: #64748B !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
}
.ethereal-action-btn:hover {
  background: rgba(255,255,255,0.8) !important;
  color: #0F172A !important;
}
</style>
