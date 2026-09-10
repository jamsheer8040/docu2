<template>
  <v-dialog v-model="internalDialog" max-width="500px" persistent>
    <v-card class="glass-card-ethereal pa-4" variant="flat">
      <v-card-title class="text-h6 font-weight-bold text-blue-grey-darken-4">
        Make Payment
      </v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="submitPayment">
          <v-select
            v-model="paymentData.wallet_id"
            :items="walletAccounts"
            item-title="name"
            item-value="id"
            label="Pay From Wallet"
            variant="outlined"
            density="comfortable"
            bg-color="rgba(255,255,255,0.4)"
            :loading="loadingWallets"
            :disabled="loadingWallets"
            :rules="[v => !!v || 'Wallet is required']"
          ></v-select>

          <v-text-field
            v-model.number="paymentData.amount"
            label="Payment Amount"
            type="number"
            variant="outlined"
            density="comfortable"
            bg-color="rgba(255,255,255,0.4)"
            :rules="[
              v => !!v || 'Amount is required',
              v => v > 0 || 'Must be greater than 0',
              v => v <= maxAmount || `Cannot exceed remaining balance (${maxAmount})`
            ]"
          ></v-text-field>

          <v-text-field
            v-model="paymentData.payment_date"
            label="Payment Date"
            type="date"
            variant="outlined"
            density="comfortable"
            bg-color="rgba(255,255,255,0.4)"
            :rules="[v => !!v || 'Date is required']"
          ></v-text-field>

          <v-text-field
            v-model="paymentData.reference"
            label="Reference (Optional)"
            variant="outlined"
            density="comfortable"
            bg-color="rgba(255,255,255,0.4)"
          ></v-text-field>
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
          @click="submitPayment"
        >
          Confirm Payment
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useNuxtApp } from '#app';
import { useWalletStore } from '@/stores/wallet';

const props = defineProps({
  modelValue: Boolean,
  purchase: { type: Object, default: null },
  supplierId: { type: Number, required: true }
});

const emit = defineEmits(['update:modelValue', 'paid']);
const { $api } = useNuxtApp();
const walletStore = useWalletStore();

const internalDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const form = ref(null);
const saving = ref(false);
const loadingWallets = ref(false);

const paymentData = ref({
  wallet_id: null,
  amount: 0,
  payment_date: new Date().toISOString().substr(0, 10),
  reference: ''
});

const walletAccounts = computed(() => walletStore.accounts);

const maxAmount = computed(() => {
  if (!props.purchase) return 0;
  return parseFloat(props.purchase.amount) - parseFloat(props.purchase.paid_amount);
});

watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    paymentData.value.amount = maxAmount.value;
    paymentData.value.wallet_id = null;
    paymentData.value.reference = '';
    paymentData.value.payment_date = new Date().toISOString().substr(0, 10);
    if (!walletStore.accounts.length) {
      loadingWallets.value = true;
      try {
        await walletStore.fetchAccounts();
      } catch (e) {
        console.error('Failed to load wallet accounts:', e);
      } finally {
        loadingWallets.value = false;
      }
    }
  }
});

const close = () => {
  internalDialog.value = false;
};

const submitPayment = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const payload = {
      purchase_id: props.purchase.id,
      ...paymentData.value
    };
    await $api.post(`/suppliers/${props.supplierId}/payments`, payload);
    emit('paid');
    close();
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || 'Error making payment');
  } finally {
    saving.value = false;
  }
};
</script>
