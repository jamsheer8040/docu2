<template>
  <v-container fluid class="pa-2 pa-sm-4 pa-md-6">
    <!-- Top KPI Cards (Ethereal Neomorphism Style) -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card-ethereal pa-5 d-flex flex-column" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="icon-glow-base icon-glow-purple" style="width: 56px; height: 56px;">
              <v-icon icon="mdi-account-group" color="white" size="28"></v-icon>
            </div>
            <div class="text-right">
              <div class="text-caption font-weight-bold text-blue-grey-darken-1">Total Clients</div>
              <div class="text-h4 font-weight-black text-blue-grey-darken-4">{{ dashboardStore.stats?.total_customers || 0 }}</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card-ethereal pa-5 d-flex flex-column" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="icon-glow-base icon-glow-green" style="width: 56px; height: 56px;">
              <v-icon icon="mdi-check-circle-outline" color="white" size="28"></v-icon>
            </div>
            <div class="text-right">
              <div class="text-caption font-weight-bold text-blue-grey-darken-1">Active Now</div>
              <div class="text-h4 font-weight-black text-blue-grey-darken-4">{{ dashboardStore.stats?.active_customers || 0 }}</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card-ethereal pa-5 d-flex flex-column" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="icon-glow-base icon-glow-blue" style="width: 56px; height: 56px;">
              <v-icon icon="mdi-file-document-outline" color="white" size="28"></v-icon>
            </div>
            <div class="text-right">
              <div class="text-caption font-weight-bold text-blue-grey-darken-1">Active Docs</div>
              <div class="text-h4 font-weight-black text-blue-grey-darken-4">{{ dashboardStore.stats?.active_documents || 0 }}</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card-ethereal pa-5 d-flex flex-column" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="icon-glow-base icon-glow-orange" style="width: 56px; height: 56px;">
              <v-icon icon="mdi-alert-outline" color="white" size="28"></v-icon>
            </div>
            <div class="text-right">
              <div class="text-caption font-weight-bold text-blue-grey-darken-1">Action Required</div>
              <div class="text-h4 font-weight-black text-blue-grey-darken-4">{{ dashboardStore.stats?.critical_count || 0 }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>


    <!-- Plan Usage Limit Info -->
    <v-alert
      v-if="auth.user?.Tenant?.Plan?.max_customers && totalItems >= auth.user.Tenant.Plan.max_customers"
      type="error"
      variant="tonal"
      class="mb-4 rounded-lg font-weight-medium"
      icon="mdi-alert-octagon"
      border="start"
    >
      You have reached your workspace limit of <strong>{{ auth.user.Tenant.Plan.max_customers }}</strong> customers on the {{ auth.user.Tenant.Plan.name }} plan. You cannot add any more customers until you upgrade.
    </v-alert>

    <!-- Main Data Table Container -->
    <v-card class="glass-card-ethereal overflow-hidden" variant="flat">
      <!-- Top Action Bar -->
      <div class="pa-4 d-flex align-center flex-wrap gap-4" style="background: rgba(255,255,255,0.1);">
        <div style="width: 250px;">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search directory..."
            variant="solo"
            density="comfortable"
            hide-details
            flat
            class="search-pill bg-transparent"
            @update:model-value="onSearch"
          ></v-text-field>
        </div>
        
        <v-spacer></v-spacer>

        <!-- Ghost Dropdowns for Filters -->
        <div class="d-flex align-center gap-2">
          <v-btn-toggle 
            v-model="statusFilter" 
            mandatory 
            density="comfortable" 
            class="d-flex rounded-lg" 
            variant="text"
            style="background: rgba(255,255,255,0.4);"
            @update:model-value="onSearch"
          >
            <v-btn value="true" class="px-4 font-weight-bold text-caption text-blue-grey-darken-3">Active</v-btn>
            <v-btn value="false" class="px-4 font-weight-bold text-caption text-blue-grey-darken-3">Inactive</v-btn>
          </v-btn-toggle>
        </div>

        <input type="file" ref="fileInput" accept=".csv" style="display: none" @change="handleFileUpload" />
        
        <!-- Add Button (Glossy 3D) -->
        <v-btn
          v-if="auth.can('customers', 'write')"
          class="btn-3d px-3 ml-2"
          height="40"
          width="40"
          min-width="40"
          @click="openCreateDialog"
        >
          <v-icon icon="mdi-plus" size="24"></v-icon>
        </v-btn>

        <!-- More Options Menu -->
        <v-menu v-if="auth.can('customers', 'write')" location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" class="ml-1 text-blue-grey-darken-2"></v-btn>
          </template>
          <v-list class="glass-card-ethereal pa-2" density="compact">
            <v-list-item @click="downloadTemplate" prepend-icon="mdi-file-download" title="Download CSV Template" class="rounded-lg mb-1"></v-list-item>
            <v-list-item @click="triggerFileInput" prepend-icon="mdi-file-upload" title="Import CSV" class="rounded-lg"></v-list-item>
          </v-list>
        </v-menu>
      </div>

      <v-divider style="opacity: 0.1"></v-divider>

      <!-- The Table -->
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="customers"
        :items-length="totalItems"
        :loading="loading"
        @update:options="loadCustomers"
        class="bg-transparent elevation-0 ethereal-table"
        hover
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="rgba(147, 51, 234, 0.1)" size="36" class="mr-3 text-primary font-weight-black">
              {{ item.name.charAt(0).toUpperCase() }}
            </v-avatar>
            <div class="font-weight-bold text-blue-grey-darken-4 clickable-name text-truncate" style="max-width: 200px;" @click="viewCustomer(item.id)">
              {{ item.name }}
            </div>
          </div>
        </template>

        <template v-slot:item.phone_whatsapp="{ item }">
          <div class="d-flex align-center">
            <span class="text-blue-grey-darken-3 font-weight-medium">{{ item.phone_whatsapp }}</span>
          </div>
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
            <v-btn icon="mdi-file-document-outline" variant="flat" size="x-small" class="ethereal-action-btn" @click="viewCustomer(item.id)"></v-btn>
            <v-btn icon="mdi-whatsapp" variant="flat" size="x-small" class="ethereal-action-btn" @click.stop="openWhatsApp(item.phone_whatsapp, GENERAL_MSG)"></v-btn>
            <v-btn icon="mdi-email-fast" variant="flat" size="x-small" class="ethereal-action-btn" title="Send Email" @click.stop="openSendEmail(item)"></v-btn>
            <v-menu v-if="auth.can('customers', 'write')" location="bottom end">
               <template v-slot:activator="{ props }">
                 <v-btn v-bind="props" icon="mdi-dots-vertical" variant="flat" size="x-small" class="ethereal-action-btn"></v-btn>
               </template>
               <v-list class="glass-card-ethereal pa-2" density="compact">
                 <v-list-item @click="openEditDialog(item)" prepend-icon="mdi-pencil" title="Edit Customer" class="rounded-lg mb-1"></v-list-item>
                 <v-list-item v-if="item.is_active && auth.can('customers', 'delete')" @click="confirmDelete(item)" prepend-icon="mdi-delete" title="Deactivate" base-color="error" class="rounded-lg mb-1"></v-list-item>
                 <v-list-item v-if="!item.is_active" @click="reactivateCustomer(item)" prepend-icon="mdi-account-reactivate" title="Reactivate" base-color="success" class="rounded-lg"></v-list-item>
               </v-list>
            </v-menu>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <CustomerForm
      v-model="dialog"
      :customer="editingCustomer"
      @saved="onSaved"
    />

    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card class="glass-card-ethereal pa-2" variant="flat">
        <v-card-title class="text-h6 font-weight-bold text-blue-grey-darken-4">Deactivate Customer?</v-card-title>
        <v-card-text class="text-blue-grey-darken-2">
          Are you sure you want to deactivate <b class="text-blue-grey-darken-4">{{ itemToDelete?.name }}</b>?
          This will hide them from active lists.
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

    <SendEmailDialog
      v-model="emailDialog"
      :prefill-to="emailTarget?.email"
      :prefill-customer-name="emailTarget?.name"
    />
  </v-container>
</template>

<script setup>
import { useWhatsApp } from '@/composables/useWhatsApp';
import CustomerForm from '@/components/customers/CustomerForm.vue';
import SendEmailDialog from '@/components/email/SendEmailDialog.vue';
import Papa from 'papaparse';
import { useDashboardStore } from '~/stores/dashboard';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const dashboardStore = useDashboardStore();
const { openWhatsApp, GENERAL_MSG } = useWhatsApp();
const { $api } = useNuxtApp();
const router = useRouter();

const customers = ref([]);
const totalItems = ref(0);
const loading = ref(false);
const search = ref('');
const statusFilter = ref('true');
const itemsPerPage = ref(10);
const currentPage = ref(1);

const dialog = ref(false);
const editingCustomer = ref(null);
const deleteDialog = ref(false);
const itemToDelete = ref(null);

const snackbar = reactive({ show: false, text: '', color: '' })

const emailDialog = ref(false)
const emailTarget = ref(null)

const openSendEmail = (customer) => {
  emailTarget.value = customer
  emailDialog.value = true
}

const fileInput = ref(null)
const importing = ref(false)

onMounted(() => {
    dashboardStore.fetchStats();
});

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.value = '';
    fileInput.value.click();
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  importing.value = true;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      try {
        const res = await $api.post('/customers/bulk-import', { customers: results.data });
        if (res.data.success) {
          snackbar.text = res.data.message || 'Import successful';
          snackbar.color = 'success';
          snackbar.show = true;
          loadCustomers({ page: 1, itemsPerPage: itemsPerPage.value });
        }
      } catch (err) {
        console.error(err);
        snackbar.text = err.response?.data?.message || 'Failed to import CSV';
        snackbar.color = 'error';
        snackbar.show = true;
      } finally {
        importing.value = false;
      }
    },
    error: (error) => {
      console.error(error);
      snackbar.text = 'Failed to parse CSV file';
      snackbar.color = 'error';
      snackbar.show = true;
      importing.value = false;
    }
  });
};

const downloadTemplate = () => {
  const headers = ['name', 'phone_whatsapp', 'email', 'address', 'city', 'country', 'trade_license_no', 'notes', 'pricing_category'];
  const dummyRow = ['John Doe', '+971501234567', 'john@example.com', 'Business Bay', 'Dubai', 'UAE', 'TL123456', 'VIP Customer', 'Prime'];
  
  const csvContent = [headers.join(','), dummyRow.join(',')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Customer_Import_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const headers = [
  { title: 'Customer Name', key: 'name', align: 'start' },
  { title: 'Email Address', key: 'email' },
  { title: 'Contact', key: 'phone_whatsapp' },
  { title: 'Location', key: 'city' },
  { title: 'Status', key: 'is_active', align: 'center' },
  { title: '', key: 'actions', align: 'end', sortable: false }
];

const loadCustomers = async ({ page, itemsPerPage: limit }) => {
  loading.value = true;
  currentPage.value = page;
  try {
    const response = await $api.get('/customers', {
      params: {
        page,
        limit,
        search: search.value,
        is_active: statusFilter.value
      }
    });

    if (response.data.success) {
      customers.value = response.data.data;
      totalItems.value = response.data.meta.total;
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
  } finally {
    loading.value = false;
  }
};

let searchTimer;
const onSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadCustomers({ page: 1, itemsPerPage: itemsPerPage.value });
  }, 400);
};

const openCreateDialog = () => {
  editingCustomer.value = null;
  dialog.value = true;
};

const openEditDialog = (item) => {
  editingCustomer.value = { ...item };
  dialog.value = true;
};

const viewCustomer = (id) => {
  router.push(`/customers/${id}`);
};

const onSaved = () => {
  loadCustomers({ page: currentPage.value, itemsPerPage: itemsPerPage.value });
  snackbar.text = 'Customer saved successfully';
  snackbar.color = 'success';
  snackbar.show = true;
};

const confirmDelete = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const doDelete = async () => {
  try {
    const response = await $api.delete(`/customers/${itemToDelete.value.id}`);
    if (response.data.success) {
      loadCustomers({ page: currentPage.value, itemsPerPage: itemsPerPage.value });
      snackbar.text = response.data.message;
      snackbar.color = 'success';
      snackbar.show = true;
    }
  } catch (error) {
    snackbar.text = error.response?.data?.message || 'Error deleting customer';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    deleteDialog.value = false;
  }
};

const reactivateCustomer = async (item) => {
  try {
    const payload = { ...item, is_active: true };
    const response = await $api.put(`/customers/${item.id}`, payload);
    if (response.data.success) {
      loadCustomers({ page: currentPage.value, itemsPerPage: itemsPerPage.value });
      snackbar.text = 'Customer successfully reactivated!';
      snackbar.color = 'success';
      snackbar.show = true;
    }
  } catch (error) {
    snackbar.text = error.response?.data?.message || 'Error reactivating customer';
    snackbar.color = 'error';
    snackbar.show = true;
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

/* Ethereal Table Tweaks */
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
