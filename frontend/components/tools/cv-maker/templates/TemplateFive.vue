<template>
  <div class="cv-template-five pa-10">
    <div class="header d-flex justify-space-between align-center mb-8 border-b-thick pb-4">
      <div class="d-flex align-center">
        <v-avatar v-if="data.personal.photo" size="90" class="mr-6 border">
          <v-img :src="data.personal.photo" cover></v-img>
        </v-avatar>
        <div>
          <h1 class="text-h3 font-weight-bold mb-1">{{ data.personal.firstName }} {{ data.personal.lastName }}</h1>
          <h2 class="text-subtitle-1 font-weight-medium text-primary text-uppercase">{{ data.personal.isOtherProfession && data.personal.otherProfessionName ? data.personal.otherProfessionName : data.personal.profession }}</h2>
        </div>
      </div>
      <div class="contact-box text-right text-caption">
        <div class="mb-1" v-if="data.personal.phone"><v-icon size="x-small" class="mr-1">mdi-phone</v-icon> {{ data.personal.phone }}</div>
        <div class="mb-1" v-if="data.personal.email"><v-icon size="x-small" class="mr-1">mdi-email</v-icon> {{ data.personal.email }}</div>
        <div v-if="data.personal.address"><v-icon size="x-small" class="mr-1">mdi-map-marker</v-icon> {{ data.personal.address }}</div>
      </div>
    </div>

    <div class="summary mb-8" v-if="data.personal.summary">
      <div class="text-body-1 text-justify font-weight-medium">{{ data.personal.summary }}</div>
    </div>

    <v-row>
      <v-col cols="8" class="pr-6">
        <div class="experience mb-8" v-if="data.experience && data.experience.length">
          <h3 class="section-heading mb-4"><span class="bg-primary px-2 text-white">PROFESSIONAL EXPERIENCE</span></h3>
          <div class="exp-item mb-6" v-for="(exp, index) in data.experience" :key="index">
            <div class="d-flex justify-space-between align-end mb-1">
              <strong class="text-subtitle-1 font-weight-bold">{{ exp.position }}</strong>
              <span class="text-caption font-weight-bold text-grey-darken-1">{{ exp.startDate }} — {{ exp.endDate }}</span>
            </div>
            <div class="text-subtitle-2 mb-2 font-weight-medium">{{ exp.company }}</div>
            <ul class="text-body-2 pl-4">
              <li v-for="(duty, i) in exp.duties.split('\n')" :key="i" class="mb-1" v-show="duty.trim()">{{ duty }}</li>
            </ul>
          </div>
        </div>
      </v-col>

      <v-col cols="4" class="pl-4">
        <div class="education mb-8" v-if="data.education && data.education.length">
          <h3 class="section-heading mb-4"><span class="bg-primary px-2 text-white">EDUCATION</span></h3>
          <div class="edu-item mb-4" v-for="(edu, index) in data.education" :key="index">
            <div class="text-subtitle-2 font-weight-bold">{{ edu.degree }}</div>
            <div class="text-caption">{{ edu.institution }}</div>
            <div class="text-caption font-weight-bold text-primary">{{ edu.year }}</div>
          </div>
        </div>

        <div class="skills mb-8" v-if="data.skills && data.skills.length">
          <h3 class="section-heading mb-4"><span class="bg-primary px-2 text-white">CORE COMPETENCIES</span></h3>
          <v-chip-group column>
            <v-chip v-for="skill in data.skills" :key="skill" size="small" variant="outlined" color="primary">{{ skill }}</v-chip>
          </v-chip-group>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
const props = defineProps({
  data: Object
});
</script>

<style scoped>
.cv-template-five {
  background: white;
  min-height: unset;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #222;
}
.border-b-thick {
  border-bottom: 4px solid var(--v-theme-primary) !important;
}
.section-heading {
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
}
.section-heading span {
  display: inline-block;
  transform: translateY(5px);
  padding: 2px 8px;
}
</style>

