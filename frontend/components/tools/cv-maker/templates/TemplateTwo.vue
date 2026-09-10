<template>
  <div class="cv-template-two pa-10">
    <div class="text-center mb-8 pb-4 border-b">
      <div v-if="data.personal.photo" class="mb-4">
        <v-avatar size="100" class="elevation-2">
          <v-img :src="data.personal.photo" cover></v-img>
        </v-avatar>
      </div>
      <h1 class="text-h3 font-weight-regular mb-1 text-uppercase tracking-wide">{{ data.personal.firstName }} {{ data.personal.lastName }}</h1>
      <h2 class="text-h6 font-weight-light opacity-80 text-uppercase tracking-widest">{{ data.personal.isOtherProfession && data.personal.otherProfessionName ? data.personal.otherProfessionName : data.personal.profession }}</h2>
      
      <div class="contact-info mt-4 d-flex justify-center flex-wrap gap-4 text-caption font-weight-medium">
        <span v-if="data.personal.phone">{{ data.personal.phone }}</span>
        <span v-if="data.personal.phone && data.personal.email">•</span>
        <span v-if="data.personal.email">{{ data.personal.email }}</span>
        <span v-if="data.personal.email && data.personal.address">•</span>
        <span v-if="data.personal.address">{{ data.personal.address }}</span>
      </div>
    </div>

    <div class="summary mb-8" v-if="data.personal.summary">
      <h3 class="section-title font-weight-bold mb-3 text-uppercase text-center tracking-widest">Professional Summary</h3>
      <p class="text-body-2 text-justify">{{ data.personal.summary }}</p>
    </div>

    <div class="experience mb-8" v-if="data.experience && data.experience.length">
      <h3 class="section-title font-weight-bold mb-4 text-uppercase text-center tracking-widest">Experience</h3>
      <div class="exp-item mb-5" v-for="(exp, index) in data.experience" :key="index">
        <div class="d-flex justify-space-between align-baseline mb-1">
          <strong class="text-subtitle-1">{{ exp.position }}</strong>
          <span class="text-caption font-weight-bold">{{ exp.startDate }} - {{ exp.endDate }}</span>
        </div>
        <div class="text-subtitle-2 mb-2 font-italic">{{ exp.company }}</div>
        <ul class="text-body-2 pl-5">
          <li v-for="(duty, i) in exp.duties.split('\n')" :key="i" class="mb-1" v-show="duty.trim()">{{ duty }}</li>
        </ul>
      </div>
    </div>

    <v-row>
      <v-col cols="6" v-if="data.education && data.education.length">
        <h3 class="section-title font-weight-bold mb-4 text-uppercase tracking-widest">Education</h3>
        <div class="edu-item mb-4" v-for="(edu, index) in data.education" :key="index">
          <strong class="text-subtitle-2 d-block">{{ edu.degree }}</strong>
          <div class="text-caption font-italic">{{ edu.institution }}</div>
          <div class="text-caption">{{ edu.year }}</div>
        </div>
      </v-col>

      <v-col cols="6">
        <div class="skills-section mb-6" v-if="data.skills && data.skills.length">
          <h3 class="section-title font-weight-bold mb-3 text-uppercase tracking-widest">Core Skills</h3>
          <div class="d-flex flex-wrap gap-2">
            <span v-for="(skill, idx) in data.skills" :key="skill" class="text-body-2">
              {{ skill }}<span v-if="idx < data.skills.length - 1" class="mx-1 opacity-40">|</span>
            </span>
          </div>
        </div>

        <div class="languages-section mb-6" v-if="data.languages && data.languages.length">
          <h3 class="section-title font-weight-bold mb-3 text-uppercase tracking-widest">Languages</h3>
          <p class="text-body-2">{{ data.languages.join(', ') }}</p>
        </div>
      </v-col>
    </v-row>

    <!-- Declaration footer -->
    <div class="footer mt-10" v-if="data.declaration">
      <p class="text-caption font-italic opacity-60">
        {{ data.declaration }}
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
.cv-template-two {
  background: white;
  min-height: unset;
  font-family: 'Times New Roman', Times, serif;
  color: #000;
}
.tracking-wide {
  letter-spacing: 2px;
}
.tracking-widest {
  letter-spacing: 4px;
}
.section-title {
  border-bottom: 1px solid #000;
  padding-bottom: 4px;
}
</style>

