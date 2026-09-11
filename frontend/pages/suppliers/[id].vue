<template>
  <v-container fluid class="pa-2 pa-sm-4 pa-md-6">
    <!-- Back Button -->
    <div class="d-flex align-center mb-2">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        to="/suppliers"
        class="font-weight-bold px-0 text-grey-darken-1"
        size="small"
        density="comfortable"
      >
        Back to Suppliers
      </v-btn>
    </div>

    <!-- Header Section -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6" v-if="supplier || loadingSupplier">
      <div class="d-flex align-center gap-4">
        <v-avatar color="primary" size="56" class="rounded-xl elevation-2 text-white font-weight-black text-h5">
          {{ (supplier?.name || 'S').charAt(0).toUpperCase() }}
        </v-avatar>
        <div>
          <div class="d-flex align-center gap-2 flex-wrap">
            <h1 class="text-h4 font-weight-black text-blue-grey-darken-4 mb-0">
              {{ supplier?.name || 'Loading Supplier...' }}
            </h1>
            <v-chip
              v-if="supplier"
              :color="supplier.is_active ? '#22C55E' : '#94A3B8'"
              variant="flat"
              size="small"
              class="font-weight-bold text-white px-3"
            >
              {{ supplier.is_active ? 'Active' : 'Inactive' }}
            </v-chip>
          </div>
          <p class="text-blue-grey-darken-1 text-subtitle-2 mt-1 mb-0">
            Supplier Profile, Purchases & Accounts Payable (AP)
          </p>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <v-btn
          v-if="supplier && auth.can('suppliers', 'write')"
          color="white"
          variant="flat"
          class="font-weight-bold px-4 rounded-lg elevation-1"
          prepend-icon="mdi-pencil-outline"
          @click="openEditDialog"
        >
          Edit Supplier
        </v-btn>
      </div>
    </div>

    <!-- KPI Summary Stat Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-xl h-100" variant="flat">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-caption font-weight-bold text-blue-grey-darken-1 text-uppercase ls-1">
                Total Billed
              </div>
              <div class="text-h5 font-weight-black text-blue-grey-darken-4 mt-1">
                {{ formatCurrency(totalPurchasesAmount) }}
              </div>
              <div class="text-caption text-grey mt-1">{{ purchases.length }} purchase bills</div>
            </div>
            <v-avatar color="rgba(147, 51, 234, 0.1)" size="48" class="rounded-lg text-primary">
              <v-icon icon="mdi-receipt-text-outline" size="28"></v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-xl h-100" variant="flat">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-caption font-weight-bold text-blue-grey-darken-1 text-uppercase ls-1">
                Total Paid
              </div>
              <div class="text-h5 font-weight-black text-success mt-1">
                {{ formatCurrency(totalPaidAmount) }}
              </div>
              <div class="text-caption text-grey mt-1">{{ payments.length }} payments settled</div>
            </div>
            <v-avatar color="rgba(34, 197, 94, 0.1)" size="48" class="rounded-lg text-success">
              <v-icon icon="mdi-check-circle-outline" size="28"></v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-xl h-100" variant="flat">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-caption font-weight-bold text-blue-grey-darken-1 text-uppercase ls-1">
                Balance Due (AP)
              </div>
              <div class="text-h5 font-weight-black text-error mt-1">
                {{ formatCurrency(totalOutstandingAmount) }}
              </div>
              <div class="text-caption text-grey mt-1">
                {{ pendingBillsCount }} unpaid/partial bills
              </div>
            </div>
            <v-avatar color="rgba(239, 68, 68, 0.1)" size="48" class="rounded-lg text-error">
              <v-icon icon="mdi-clock-alert-outline" size="28"></v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-xl h-100" variant="flat">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-caption font-weight-bold text-blue-grey-darken-1 text-uppercase ls-1">
                Settlement Rate
              </div>
              <div class="text-h5 font-weight-black text-primary mt-1">
                {{ settlementRate }}%
              </div>
              <div class="text-caption text-grey mt-1">of all liabilities cleared</div>
            </div>
            <v-avatar color="rgba(59, 130, 246, 0.1)" size="48" class="rounded-lg text-info">
              <v-icon icon="mdi-finance" size="28"></v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Detail Content -->
    <v-row>
      <!-- Supplier Profile & Contact Info -->
      <v-col cols="12" md="3">
        <v-card class="glass-card-ethereal pa-6 rounded-2xl h-100" variant="flat">
          <h3 class="text-h6 font-weight-black text-blue-grey-darken-4 mb-4 d-flex align-center gap-2">
            <v-icon color="primary" size="22">mdi-office-building-outline</v-icon>
            Contact Information
          </h3>

          <v-list class="bg-transparent pa-0">
            <v-list-item class="px-0 py-2">
              <template v-slot:prepend>
                <v-avatar color="rgba(147, 51, 234, 0.08)" size="36" class="mr-3 text-primary">
                  <v-icon size="18">mdi-account-circle-outline</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-caption text-grey-darken-1 font-weight-bold">Contact Person</v-list-item-title>
              <v-list-item-subtitle class="font-weight-bold text-blue-grey-darken-4 text-body-2">
                {{ supplier?.contact_person || '—' }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider style="opacity: 0.1"></v-divider>

            <v-list-item class="px-0 py-2">
              <template v-slot:prepend>
                <v-avatar color="rgba(34, 197, 94, 0.08)" size="36" class="mr-3 text-success">
                  <v-icon size="18">mdi-phone-outline</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-caption text-grey-darken-1 font-weight-bold">Phone Number</v-list-item-title>
              <v-list-item-subtitle class="font-weight-bold text-blue-grey-darken-4 text-body-2">
                <a v-if="supplier?.phone" :href="`tel:${supplier.phone}`" class="text-decoration-none text-primary">
                  {{ supplier.phone }}
                </a>
                <span v-else>—</span>
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider style="opacity: 0.1"></v-divider>

            <v-list-item class="px-0 py-2">
              <template v-slot:prepend>
                <v-avatar color="rgba(59, 130, 246, 0.08)" size="36" class="mr-3 text-info">
                  <v-icon size="18">mdi-email-outline</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-caption text-grey-darken-1 font-weight-bold">Email Address</v-list-item-title>
              <v-list-item-subtitle class="font-weight-bold text-blue-grey-darken-4 text-body-2">
                <a v-if="supplier?.email" :href="`mailto:${supplier.email}`" class="text-decoration-none text-primary">
                  {{ supplier.email }}
                </a>
                <span v-else>—</span>
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider style="opacity: 0.1"></v-divider>

            <v-list-item class="px-0 py-2">
              <template v-slot:prepend>
                <v-avatar color="rgba(245, 158, 11, 0.08)" size="36" class="mr-3 text-warning">
                  <v-icon size="18">mdi-map-marker-outline</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-caption text-grey-darken-1 font-weight-bold">Address</v-list-item-title>
              <v-list-item-subtitle class="font-weight-bold text-blue-grey-darken-4 text-body-2" style="white-space: pre-wrap;">
                {{ supplier?.address || '—' }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-4" style="opacity: 0.1"></v-divider>

          <div>
            <div class="text-caption font-weight-bold text-grey-darken-1 mb-1">Notes & Details</div>
            <p v-if="supplier?.notes" class="text-body-2 font-weight-medium pa-3 rounded-lg bg-grey-lighten-4 text-blue-grey-darken-3 mb-0" style="white-space: pre-wrap;">
              {{ supplier.notes }}
            </p>
            <p v-else class="text-caption text-grey font-italic mb-0">
              No additional notes recorded for this supplier.
            </p>
          </div>
        </v-card>
      </v-col>

      <!-- Accounting Tabs: Purchases & Payments -->
      <v-col cols="12" md="9">
        <v-card class="glass-card-ethereal overflow-hidden rounded-2xl h-100" variant="flat">
          <div class="px-4 pt-3 pb-0" style="background: rgba(255,255,255,0.2); border-bottom: 1px solid rgba(0,0,0,0.06)">
            <v-tabs v-model="tab" color="primary" class="bg-transparent">
              <v-tab value="purchases" class="font-weight-bold text-none px-6">
                <v-icon start icon="mdi-receipt"></v-icon>
                Purchases & Bills
                <v-chip size="x-small" color="primary" variant="flat" class="ml-2 font-weight-bold">
                  {{ purchases.length }}
                </v-chip>
              </v-tab>
              <v-tab value="payments" class="font-weight-bold text-none px-6">
                <v-icon start icon="mdi-cash-multiple"></v-icon>
                Payment History
                <v-chip size="x-small" color="success" variant="flat" class="ml-2 font-weight-bold">
                  {{ payments.length }}
                </v-chip>
              </v-tab>
            </v-tabs>
          </div>

          <v-window v-model="tab">
            <!-- PURCHASES TAB -->
            <v-window-item value="purchases">
              <v-data-table
                :headers="purchaseHeaders"
                :items="purchases"
                :loading="loadingPurchases"
                class="bg-transparent elevation-0 ethereal-table"
                hover
              >
                <template v-slot:item.created_at="{ item }">
                  <span class="text-body-2 text-blue-grey-darken-3">{{ formatDate(item.created_at) }}</span>
                </template>

                <template v-slot:item.reference_type="{ item }">
                  <div class="font-weight-bold text-blue-grey-darken-4">
                    {{ item.reference_type }}
                    <span v-if="item.reference_id" class="text-caption text-grey font-weight-regular">
                      #{{ item.reference_id }}
                    </span>
                  </div>
                </template>

                <template v-slot:item.description="{ item }">
                  <span class="text-body-2 text-blue-grey-darken-3">{{ item.description || '—' }}</span>
                </template>

                <template v-slot:item.amount="{ item }">
                  <span class="font-weight-bold text-blue-grey-darken-4">{{ formatCurrency(item.amount) }}</span>
                </template>

                <template v-slot:item.paid_amount="{ item }">
                  <span class="font-weight-bold text-success">{{ formatCurrency(item.paid_amount) }}</span>
                </template>

                <template v-slot:item.balance_due="{ item }">
                  <span class="font-weight-bold" :class="item.amount - item.paid_amount > 0 ? 'text-error' : 'text-grey'">
                    {{ formatCurrency(item.amount - item.paid_amount) }}
                  </span>
                </template>

                <template v-slot:item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    variant="flat"
                    size="small"
                    class="font-weight-bold text-white px-3"
                  >
                    {{ item.status }}
                  </v-chip>
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn
                    v-if="item.status !== 'Paid' && auth.can('suppliers', 'write')"
                    color="primary"
                    variant="flat"
                    size="small"
                    class="btn-3d text-none font-weight-bold px-3 rounded-lg"
                    prepend-icon="mdi-cash-fast"
                    @click="openPaymentDialog(item)"
                  >
                    Pay
                  </v-btn>
                  <span v-else-if="item.status === 'Paid'" class="text-caption text-success font-weight-bold">
                    <v-icon size="14" class="mr-1">mdi-check-all</v-icon> Settled
                  </span>
                </template>

                <template v-slot:no-data>
                  <div class="pa-8 text-center text-grey">
                    <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-receipt-outline</v-icon>
                    <div class="text-body-1 font-weight-bold">No purchase records yet</div>
                    <div class="text-caption text-grey">Supplier costs from invoice items will appear here automatically.</div>
                  </div>
                </template>
              </v-data-table>
            </v-window-item>

            <!-- PAYMENTS TAB -->
            <v-window-item value="payments">
              <v-data-table
                :headers="paymentHeaders"
                :items="payments"
                :loading="loadingPayments"
                class="bg-transparent elevation-0 ethereal-table"
                hover
              >
                <template v-slot:item.payment_date="{ item }">
                  <span class="text-body-2 text-blue-grey-darken-3">{{ formatDate(item.payment_date) }}</span>
                </template>

                <template v-slot:item.amount="{ item }">
                  <span class="font-weight-black text-primary">{{ formatCurrency(item.amount) }}</span>
                </template>

                <template v-slot:item.WalletAccount="{ item }">
                  <v-chip v-if="item.WalletAccount" size="small" variant="tonal" color="primary" class="font-weight-bold">
                    <v-icon start size="14">mdi-wallet-outline</v-icon>
                    {{ item.WalletAccount.name }}
                  </v-chip>
                  <span v-else class="text-grey">—</span>
                </template>

                <template v-slot:item.purchase_id="{ item }">
                  <span v-if="item.purchase_id" class="text-caption font-weight-bold text-grey-darken-1">
                    Bill #{{ item.purchase_id }}
                  </span>
                  <span v-else class="text-grey">—</span>
                </template>

                <template v-slot:item.reference="{ item }">
                  <span class="text-body-2 text-blue-grey-darken-3">{{ item.reference || '—' }}</span>
                </template>

                <template v-slot:no-data>
                  <div class="pa-8 text-center text-grey">
                    <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-cash-remove</v-icon>
                    <div class="text-body-1 font-weight-bold">No payment history yet</div>
                    <div class="text-caption text-grey">Payments settled through wallet accounts will be recorded here.</div>
                  </div>
                </template>
              </v-data-table>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Payment Dialog -->
    <SupplierPaymentDialog
      v-model="paymentDialog"
      :purchase="selectedPurchase"
      :supplier-id="supplierId"
      @paid="onPaymentMade"
    />

    <!-- Edit Supplier Dialog -->
    <SupplierForm
      v-model="editDialog"
      :supplier="supplier"
      @saved="onSupplierSaved"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import { useAuthStore } from '@/stores/auth';
import { useCurrency } from '@/composables/useCurrency';
import SupplierPaymentDialog from '@/components/suppliers/SupplierPaymentDialog.vue';
import SupplierForm from '@/components/suppliers/SupplierForm.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { $api } = useNuxtApp();
const { formatCurrency } = useCurrency();

const supplierId = parseInt(route.params.id, 10);
const tab = ref('purchases');

const supplier = ref(null);
const loadingSupplier = ref(false);
const purchases = ref([]);
const payments = ref([]);

const loadingPurchases = ref(false);
const loadingPayments = ref(false);

const paymentDialog = ref(false);
const editDialog = ref(false);
const selectedPurchase = ref(null);
const snackbar = reactive({ show: false, text: '', color: '' });

// Headers for Purchases
const purchaseHeaders = [
  { title: 'Date', key: 'created_at' },
  { title: 'Reference', key: 'reference_type' },
  { title: 'Description', key: 'description' },
  { title: 'Billed (AED)', key: 'amount', align: 'end' },
  { title: 'Paid (AED)', key: 'paid_amount', align: 'end' },
  { title: 'Balance Due', key: 'balance_due', align: 'end' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Action', key: 'actions', align: 'end', sortable: false }
];

// Headers for Payments
const paymentHeaders = [
  { title: 'Payment Date', key: 'payment_date' },
  { title: 'Paid Amount', key: 'amount' },
  { title: 'Deducted From', key: 'WalletAccount' },
  { title: 'For Purchase', key: 'purchase_id' },
  { title: 'Reference / Note', key: 'reference' }
];

// Computed Stats
const totalPurchasesAmount = computed(() => {
  return purchases.value.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
});

const totalPaidAmount = computed(() => {
  return payments.value.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
});

const totalOutstandingAmount = computed(() => {
  return purchases.value.reduce((sum, p) => {
    const due = parseFloat(p.amount || 0) - parseFloat(p.paid_amount || 0);
    return sum + (due > 0 ? due : 0);
  }, 0);
});

const pendingBillsCount = computed(() => {
  return purchases.value.filter(p => p.status !== 'Paid').length;
});

const settlementRate = computed(() => {
  if (totalPurchasesAmount.value <= 0) return 100;
  const rate = (totalPaidAmount.value / totalPurchasesAmount.value) * 100;
  return Math.min(100, Math.round(rate));
});

const loadSupplier = async () => {
  loadingSupplier.value = true;
  try {
    const response = await $api.get(`/suppliers/${supplierId}`);
    if (response.data.success) {
      supplier.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching supplier:', error);
    snackbar.text = error.response?.data?.message || 'Failed to load supplier';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loadingSupplier.value = false;
  }
};

const loadPurchases = async () => {
  loadingPurchases.value = true;
  try {
    const response = await $api.get(`/suppliers/${supplierId}/purchases`);
    if (response.data.success) {
      purchases.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching purchases:', error);
  } finally {
    loadingPurchases.value = false;
  }
};

const loadPayments = async () => {
  loadingPayments.value = true;
  try {
    const response = await $api.get(`/suppliers/${supplierId}/payments`);
    if (response.data.success) {
      payments.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching payments:', error);
  } finally {
    loadingPayments.value = false;
  }
};

onMounted(() => {
  loadSupplier();
  loadPurchases();
  loadPayments();
});

watch(tab, (newVal) => {
  if (newVal === 'purchases') loadPurchases();
  if (newVal === 'payments') loadPayments();
});

const openEditDialog = () => {
  editDialog.value = true;
};

const onSupplierSaved = () => {
  loadSupplier();
  snackbar.text = 'Supplier updated successfully!';
  snackbar.color = 'success';
  snackbar.show = true;
};

const openPaymentDialog = (purchase) => {
  selectedPurchase.value = purchase;
  paymentDialog.value = true;
};

const onPaymentMade = () => {
  snackbar.text = 'Payment successfully settled from wallet!';
  snackbar.color = 'success';
  snackbar.show = true;
  loadPurchases();
  loadPayments();
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Paid': return '#22C55E';
    case 'Partially Paid': return '#F59E0B';
    default: return '#EF4444';
  }
};
</script>

<style scoped>
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

.ls-1 {
  letter-spacing: 0.5px;
}
</style>
