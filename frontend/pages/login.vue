<template>
  <v-container fluid fill-height class="login-container pa-0" style="font-family: 'Montserrat', sans-serif; background-color: #F8FAFC;">
    <v-row align="center" justify="center" class="fill-height ma-0">
      <v-col cols="12" sm="10" md="8" lg="5" xl="3" class="d-flex justify-center">
        <!-- Soft Card Container -->
        <v-card class="pa-10 soft-login-card text-center w-100" max-width="440" variant="flat">
          
          <!-- Logo area (optional, kept minimal) -->
          <div v-if="configStore.appLogo" class="mb-8 d-flex align-center justify-center mx-auto">
             <v-img 
               :src="configStore.appLogo" 
               width="140"
               height="60"
               contain
             ></v-img>
          </div>
          <div v-else class="mb-10 mt-2">
             <div style="width: 48px; height: 48px; border-radius: 16px; background: linear-gradient(135deg, #A855F7, #6366F1); display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);">
                <v-icon size="24" color="white">mdi-shield-check-outline</v-icon>
             </div>
          </div>
          <div class="text-h5 font-weight-black color-primary mb-6" v-if="!configStore.appLogo">{{ configStore.appName }}</div>

          <v-form @submit.prevent="handleLogin" class="text-left mt-2">
            
            <!-- External Label for Email -->
            <label class="text-caption font-weight-bold text-slate-700 mb-2 d-block ml-1">Email Address</label>
            <v-text-field
              v-model="state.email"
              prepend-inner-icon="mdi-email-outline"
              type="email"
              autocomplete="email"
              :error-messages="v$.email.$errors.map(e => e.$message)"
              @blur="v$.email.$touch"
              class="soft-input mb-4"
              variant="outlined"
              density="comfortable"
              placeholder="admin@example.com"
              hide-details="auto"
            ></v-text-field>

            <!-- External Label for Password -->
            <label class="text-caption font-weight-bold text-slate-700 mb-2 d-block ml-1 mt-4">Password</label>
            <v-text-field
              v-model="state.password"
              prepend-inner-icon="mdi-lock-outline"
              type="password"
              autocomplete="current-password"
              :error-messages="v$.password.$errors.map(e => e.$message)"
              @blur="v$.password.$touch"
              class="soft-input mb-8"
              variant="outlined"
              density="comfortable"
              placeholder="••••••••"
              hide-details="auto"
            ></v-text-field>

            <!-- Pill-shaped Glowing Button -->
            <v-btn
              type="submit"
              block
              size="x-large"
              height="52"
              class="soft-btn-primary font-weight-bold text-body-1"
              :loading="loading"
              append-icon="mdi-arrow-right"
            >
              Sign in to Dashboard
            </v-btn>
          </v-form>

          <v-alert
            v-if="error"
            type="error"
            class="mt-6 text-left rounded-xl"
            variant="tonal"
            closable
          >
            {{ error }}
          </v-alert>
          
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength } from '@vuelidate/validators';
import { useAuthStore } from '~/stores/auth';
import { useConfigStore } from '~/stores/config';

definePageMeta({
  layout: false
});

const authStore = useAuthStore();
const configStore = useConfigStore();
const router = useRouter();

onMounted(async () => {
    await configStore.fetchSettings();
});

const state = reactive({
  email: '',
  password: ''
});

const rules = {
  email: { required, email },
  password: { required, minLength: minLength(6) }
};

const v$ = useVuelidate(rules, state);

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  const isFormValid = await v$.value.$validate();
  if (!isFormValid) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const result = await authStore.login({
      email: state.email,
      password: state.password
    });
    
    if (result.success) {
      if (authStore.user?.role === 'Developer') {
        router.push('/saas-portal');
      } else {
        router.push('/');
      }
    } else {
      error.value = Array.isArray(result.message) ? result.message[0].msg : result.message;
    }
  } catch (err) {
    error.value = 'An unexpected error occurred.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  overflow: hidden;
}

/* 1. Soft Card Background */
.soft-login-card {
  background-color: #FFFFFF !important;
  border-radius: 24px !important;
  border: 1px solid rgba(226, 232, 240, 0.4) !important;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.03) !important;
}

/* 2. Soft Inputs (Whisper thin borders, muted text) */
:deep(.soft-input .v-field) {
  border-radius: 16px !important;
  background-color: #F8FAFC !important;
  transition: all 0.3s ease;
}
:deep(.soft-input .v-field__outline__start),
:deep(.soft-input .v-field__outline__end),
:deep(.soft-input .v-field__outline__notch) {
  border-color: rgba(226, 232, 240, 0.8) !important;
}
:deep(.soft-input .v-field--focused .v-field__outline__start),
:deep(.soft-input .v-field--focused .v-field__outline__end),
:deep(.soft-input .v-field--focused .v-field__outline__notch) {
  border-color: #6366F1 !important;
}

/* Muted Icons and Text */
:deep(.soft-input .v-icon) {
  color: #94A3B8 !important; /* Soft dusty grey */
  opacity: 1 !important;
}
:deep(.soft-input input) {
  color: #64748B !important;
  font-weight: 500;
}
:deep(.soft-input input::placeholder) {
  color: #CBD5E1 !important;
  opacity: 1 !important;
}

/* 3. Pill-Shaped Glowing Button */
.soft-btn-primary {
  background: #2563EB !important; /* Standard modern blue from the image */
  color: #FFFFFF !important;
  border-radius: 999px !important;
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.45) !important; /* The wide, diffused glow */
  text-transform: none !important;
  letter-spacing: 0px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: none !important;
}
.soft-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.55) !important;
}
</style>
