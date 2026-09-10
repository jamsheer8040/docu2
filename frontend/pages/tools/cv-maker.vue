<template>
  <v-container fluid class="pa-0 h-100 bg-background" style="overflow: hidden;">
    <!-- Top Nav Bar -->
    <v-toolbar color="surface" flat border-b class="px-4">
      <v-btn icon="mdi-arrow-left" variant="text" to="/tools" class="mr-2"></v-btn>
      <v-toolbar-title class="font-weight-bold text-h6">CV Maker</v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="d-flex align-center gap-2">
        <v-text-field
          v-model="cvTitle"
          variant="outlined"
          density="compact"
          hide-details
          placeholder="CV Title (e.g. John Doe - Dev)"
          style="width: 250px"
          class="bg-surface rounded"
        ></v-text-field>
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-content-save"
          @click="saveCv" :loading="saving" class="font-weight-bold">Save</v-btn>
        <v-btn color="success" variant="flat" prepend-icon="mdi-download"
          @click="downloadPdf" :loading="downloading" class="font-weight-bold">Download PDF</v-btn>
      </div>
    </v-toolbar>

    <!-- Split Screen -->
    <v-row no-gutters style="height: calc(100vh - 64px);">
      <!-- Left: Wizard -->
      <v-col cols="12" md="6" class="h-100 overflow-y-auto custom-scrollbar border-r">
        <div class="pa-6">
          <CvWizard v-model="cvData" />
        </div>
      </v-col>

      <!-- Right: Live paginated preview -->
      <v-col cols="12" md="6" class="h-100 bg-grey-lighten-3 overflow-y-auto custom-scrollbar">
        <div class="pages-area">

          <!-- Page count badge -->
          <div class="page-count-badge">
            <v-icon size="14" class="mr-1">mdi-file-document-outline</v-icon>
            {{ pageCount }} {{ pageCount === 1 ? 'Page' : 'Pages' }}
          </div>

          <!-- One shell per A4 page -->
          <div
            v-for="n in pageCount"
            :key="n"
            class="page-shell"
          >
            <div class="page-label">Page {{ n }}</div>

            <!-- Clip window: exactly the PDF content area -->
            <div class="page-clip">
              <div class="page-inner" :style="{ marginTop: `-${(n - 1) * PAGE_CONTENT_H}px` }">
                <CvPreview :data="cvData" />
              </div>
            </div>

            <!-- Bottom margin zone: 1cm gap at end of every page -->
            <div class="margin-zone margin-zone--bottom">
              <span>1cm bottom margin ↓</span>
            </div>

          </div>

        </div>
      </v-col>
    </v-row>

    <!-- Hidden off-screen full render — used ONLY for PDF export measurement -->
    <div class="pdf-source" ref="measureRef">
      <CvPreview :data="cvData" id="cv-pdf-content" />
    </div>

  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';
import CvWizard from '~/components/tools/cv-maker/CvWizard.vue';
import CvPreview from '~/components/tools/cv-maker/CvPreview.vue';

definePageMeta({ layout: 'empty' });

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

// A4 page height at 96dpi = 1123px
const PAGE_H = 1123;
// PDF has 1cm bottom margin only (0.394in × 96dpi ≈ 38px)
const PAGE_MARGIN_BOTTOM_PX = 38;
// Actual content area per PDF page (what user sees between margins)
const PAGE_CONTENT_H = PAGE_H - PAGE_MARGIN_BOTTOM_PX; // 1085px

const cvId = ref(route.query.id || null);
const cvTitle = ref('My Awesome CV');
const saving = ref(false);
const downloading = ref(false);

const measureRef = ref(null);
const pageCount = ref(1);

const recalcPages = () => {
  if (!measureRef.value) return;
  const h = measureRef.value.scrollHeight;
  pageCount.value = Math.max(1, Math.ceil(h / PAGE_CONTENT_H));
};

// ─── CV Data ─────────────────────────────────────────────────
const cvData = ref({
  template: 'TemplateOne',
  personal: {
    firstName: '', lastName: '', profession: '',
    email: '', phone: '', address: '', summary: '',
    photo: null, yearsOfExperience: '',
    isOtherProfession: false, otherProfessionName: ''
  },
  skills: [], experience: [], education: [],
  languages: [], software: [],
  declaration: 'I hereby declare that the information given above is true and correct to the best of my knowledge.'
});

// Recalc pages after every data change
watch(() => cvData.value, async () => {
  await nextTick();
  setTimeout(recalcPages, 100);
}, { deep: true });

// ─── Lifecycle ───────────────────────────────────────────────
onMounted(() => {
  loadCv();
  setTimeout(() => {
    if (!measureRef.value) return;
    const ro = new ResizeObserver(() => recalcPages());
    ro.observe(measureRef.value);
    recalcPages();
  }, 800);
});

// ─── API ─────────────────────────────────────────────────────
const loadCv = async () => {
  if (!cvId.value) return;
  try {
    const res = await $api.get(`/tools/cvs/${cvId.value}`);
    if (res.data.success) {
      const dbCv = res.data.data;
      cvTitle.value = dbCv.name;
      cvData.value = { ...cvData.value, ...dbCv.data, template: dbCv.template };
      if (route.query.download) setTimeout(() => downloadPdf(), 1000);
    }
  } catch (e) { console.error(e); }
};

const saveCv = async () => {
  saving.value = true;
  try {
    const payload = {
      name: cvTitle.value,
      profession: cvData.value.personal.profession,
      template: cvData.value.template,
      data: cvData.value
    };
    if (cvId.value) {
      await $api.put(`/tools/cvs/${cvId.value}`, payload);
    } else {
      const res = await $api.post(`/tools/cvs`, payload);
      if (res.data.success) {
        cvId.value = res.data.data.id;
        router.replace({ query: { id: cvId.value } });
      }
    }
  } catch (e) { console.error(e); }
  finally { saving.value = false; }
};

const downloadPdf = async () => {
  if (import.meta.server) return;
  downloading.value = true;
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('cv-pdf-content');
    const opt = {
      // 1 cm ≈ 0.394 inches — bottom margin only
      margin:      [0, 0, 0.394, 0],
      filename:    `${cvTitle.value}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:       { unit: 'in', format: 'a4', orientation: 'portrait' }
      // No pagebreak avoid — content flows naturally line by line
    };
    await html2pdf().set(opt).from(element).save();
  } catch (e) { console.error('PDF error', e); }
  finally { downloading.value = false; }
};
</script>

<style scoped>
/* ── Pages container ────────────────────────────────────────── */
.pages-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 80px;
  gap: 0;
  min-height: 100%;
}

/* ── Page count badge ───────────────────────────────────────── */
.page-count-badge {
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

/* ── One page shell ─────────────────────────────────────────── */
.page-shell {
  /* CSS zoom: scales visual AND layout — no transform side-effects */
  zoom: 0.74;
  width: 794px;
  margin-bottom: 12px; /* gap between pages (pre-zoom, ~9px visual) */
  flex-shrink: 0;
}

/* ── Page number label ──────────────────────────────────────── */
.page-label {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(0,0,0,0.38);
  padding-bottom: 5px;
}

/* ── Clip window: exactly the PDF content area ── */
.page-clip {
  width: 794px;
  height: 1085px; /* PAGE_CONTENT_H */
  overflow: hidden;
  background: white;
  box-shadow: 0 3px 20px rgba(0,0,0,0.2);
  border-radius: 2px;
  position: relative;
}

/* ── Inner full render: shifted up by negative margin ──────── */
.page-inner {
  width: 794px;
  /* marginTop is set dynamically via :style to shift content */
  /* IMPORTANT: do NOT set height here — let content be natural height */
}

/* Override any height constraints from CvPreview or templates */
.page-inner :deep(.cv-preview) {
  height: auto !important;
  min-height: 0 !important;
}
.page-inner :deep([class*="cv-template-"]) {
  min-height: 0 !important;
}

/* ── Margin zone indicators — outside the clip, representing PDF whitespace ─── */
.margin-zone {
  width: 794px;
  height: 38px; /* 1cm at 96dpi */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  pointer-events: none;
  flex-shrink: 0;
}
.margin-zone span {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(63, 110, 210, 0.65);
}
.margin-zone--bottom {
  background: linear-gradient(to top,
    rgba(232, 240, 254, 0.9) 0%,
    rgba(232, 240, 254, 0.3) 100%
  );
  border-top: 1px dashed rgba(63, 110, 210, 0.3);
  align-items: flex-start;
  padding-top: 3px;
}

/* ── Hidden div for PDF source ──────────────────────────────── */
.pdf-source {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 794px;
  height: auto;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
}

/* ── Scrollbar ──────────────────────────────────────────────── */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.12);
  border-radius: 10px;
}
</style>
