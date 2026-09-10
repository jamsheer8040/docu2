<template>
  <div class="cv-template-one">
    <div class="header bg-primary text-white pa-8 d-flex align-center justify-space-between">
      <div>
        <h1 class="text-h3 font-weight-black mb-1">{{ data.personal.firstName }} {{ data.personal.lastName }}</h1>
        <h2 class="text-h6 font-weight-regular opacity-80">{{ data.personal.isOtherProfession && data.personal.otherProfessionName ? data.personal.otherProfessionName : data.personal.profession }}</h2>
      </div>
      <v-avatar v-if="data.personal.photo" size="120" class="elevation-4 border-2">
        <v-img :src="data.personal.photo" cover></v-img>
      </v-avatar>
    </div>

    <div class="content d-flex">
      <!-- Left Column -->
      <div class="left-col bg-grey-lighten-4 pa-6" style="width: 35%;">
        <div class="contact-info mb-8 page-breakable">
          <h3 class="section-title text-primary font-weight-bold mb-4">Contact</h3>
          <div class="d-flex align-center mb-2" v-if="data.personal.phone">
            <v-icon size="small" class="mr-2" color="primary">mdi-phone</v-icon>
            <span class="text-body-2">{{ data.personal.phone }}</span>
          </div>
          <div class="d-flex align-center mb-2" v-if="data.personal.email">
            <v-icon size="small" class="mr-2" color="primary">mdi-email</v-icon>
            <span class="text-body-2">{{ data.personal.email }}</span>
          </div>
          <div class="d-flex align-center mb-2" v-if="data.personal.address">
            <v-icon size="small" class="mr-2" color="primary">mdi-map-marker</v-icon>
            <span class="text-body-2">{{ data.personal.address }}</span>
          </div>
        </div>

        <div class="skills mb-8 page-breakable" v-if="data.skills && data.skills.length">
          <h3 class="section-title text-primary font-weight-bold mb-4">Skills</h3>
          <div class="d-flex flex-wrap gap-2">
            <v-chip v-for="skill in data.skills" :key="skill" size="small" color="primary" variant="flat">{{ skill }}</v-chip>
          </div>
        </div>

        <div class="languages mb-8 page-breakable" v-if="data.languages && data.languages.length">
          <h3 class="section-title text-primary font-weight-bold mb-4">Languages</h3>
          <div v-for="lang in data.languages" :key="lang" class="text-body-2 mb-1">• {{ lang }}</div>
        </div>

        <div class="software mb-8 page-breakable" v-if="data.software && data.software.length">
          <h3 class="section-title text-primary font-weight-bold mb-4">Software</h3>
          <div v-for="soft in data.software" :key="soft" class="text-body-2 mb-1">• {{ soft }}</div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="right-col pa-6" style="width: 65%;">
        <div class="summary mb-8 page-breakable" v-if="data.personal.summary">
          <h3 class="section-title text-primary font-weight-bold mb-4 pb-2 border-b">Profile</h3>
          <p class="text-body-2 text-justify">{{ data.personal.summary }}</p>
        </div>

        <div class="experience mb-8" v-if="data.experience && data.experience.length">
          <h3 class="section-title text-primary font-weight-bold mb-4 pb-2 border-b">Experience</h3>
          <div class="exp-item mb-4 page-breakable" v-for="(exp, index) in data.experience" :key="index">
            <div class="d-flex justify-space-between align-baseline mb-1">
              <strong class="text-subtitle-1">{{ exp.position }}</strong>
              <span class="text-caption font-weight-bold text-primary">{{ exp.startDate }} - {{ exp.endDate }}</span>
            </div>
            <div class="text-subtitle-2 mb-2 opacity-80">{{ exp.company }}</div>
            <p class="text-body-2 pl-3" style="white-space: pre-line; border-left: 2px solid var(--v-theme-primary);">{{ exp.duties }}</p>
          </div>
        </div>

        <div class="education mb-8" v-if="data.education && data.education.length">
          <h3 class="section-title text-primary font-weight-bold mb-4 pb-2 border-b">Education</h3>
          <div class="edu-item mb-3 page-breakable" v-for="(edu, index) in data.education" :key="index">
            <div class="d-flex justify-space-between align-baseline mb-1">
              <strong class="text-subtitle-1">{{ edu.degree }}</strong>
              <span class="text-caption font-weight-bold text-primary">{{ edu.year }}</span>
            </div>
            <div class="text-subtitle-2 opacity-80">{{ edu.institution }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Declaration footer -->
    <div class="footer pa-8 pt-0" v-if="data.declaration">
      <p class="text-caption text-center font-italic opacity-60">
        "{{ data.declaration }}"
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: Object
});
</script>

<style scoped>
.cv-template-one {
  background: white;
  min-height: unset;
  font-family: 'Inter', sans-serif;
  color: #333;
}
.section-title {
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>

