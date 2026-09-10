<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold tracking-tight mb-1">Tools & Utilities</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Access built-in tools like the CV Maker</p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        to="/tools/cv-maker"
        size="large"
        class="font-weight-bold"
        rounded="pill"
        elevation="2"
      >
        Create New CV
      </v-btn>
    </div>

    <!-- Saved CVs Section -->
    <v-card class="rounded-xl border border-surface bg-surface elevation-0 overflow-hidden">
      <div class="bg-primary-subtle px-6 py-4 border-b d-flex align-center">
        <v-icon color="primary" class="mr-3">mdi-file-document-multiple</v-icon>
        <h2 class="text-h6 font-weight-bold mb-0 text-primary-darken-1">Saved CVs (Last 30 Days)</h2>
      </div>

      <v-data-table
        :headers="headers"
        :items="cvs"
        :loading="loading"
        class="bg-transparent"
        hover
      >
        <template v-slot:item.name="{ item }">
          <div class="font-weight-bold text-primary">{{ item.name }}</div>
        </template>
        
        <template v-slot:item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleDateString() }}
        </template>
        
        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-btn
              icon="mdi-pencil"
              variant="text"
              color="primary"
              size="small"
              @click="editCv(item)"
              title="Edit CV"
            ></v-btn>
            <v-btn
              icon="mdi-download"
              variant="text"
              color="success"
              size="small"
              @click="downloadCv(item)"
              title="Download PDF"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              size="small"
              @click="confirmDelete(item)"
              title="Delete"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="rounded-xl border">
        <v-card-title class="text-error font-weight-bold pt-6 px-6">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          Delete CV
        </v-card-title>
        <v-card-text class="px-6 py-4">
          Are you sure you want to delete this CV? This action cannot be undone.
        </v-card-text>
        <v-card-actions class="px-6 pb-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="tonal" rounded="pill" class="px-6" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" rounded="pill" class="px-6" @click="deleteCv" :loading="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import { useAuthStore } from '~/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const { $api } = useNuxtApp();

const cvs = ref([]);
const loading = ref(true);
const deleteDialog = ref(false);
const deleting = ref(false);
const cvToDelete = ref(null);

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Profession', key: 'profession', sortable: true },
  { title: 'Template', key: 'template', sortable: true },
  { title: 'Created At', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

const fetchCvs = async () => {
  loading.value = true;
  try {
    const res = await $api.get('/tools/cvs');
    if (res.data.success) {
      cvs.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load CVs', error);
  } finally {
    loading.value = false;
  }
};

const editCv = (item) => {
  router.push({ path: '/tools/cv-maker', query: { id: item.id } });
};

// We will handle downloading properly in cv-maker page or here.
// For now, downloading from here redirects to cv-maker in download mode, 
// since the PDF generation requires the HTML template to be rendered.
const downloadCv = (item) => {
  router.push({ path: '/tools/cv-maker', query: { id: item.id, download: true } });
};

const confirmDelete = (item) => {
  cvToDelete.value = item;
  deleteDialog.value = true;
};

const deleteCv = async () => {
  if (!cvToDelete.value) return;
  deleting.value = true;
  try {
    const res = await $api.delete(`/tools/cvs/${cvToDelete.value.id}`);
    if (res.data.success) {
      cvs.value = cvs.value.filter(c => c.id !== cvToDelete.value.id);
      deleteDialog.value = false;
    }
  } catch (error) {
    console.error('Failed to delete CV', error);
  } finally {
    deleting.value = false;
    cvToDelete.value = null;
  }
};

onMounted(() => {
  if (authStore.isAdmin || authStore.can('tools')) {
    fetchCvs();
  } else {
    router.push('/');
  }
});
</script>
