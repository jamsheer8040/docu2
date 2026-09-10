<template>
  <div class="cv-template-three pa-8">
    <div class="d-flex justify-space-between align-end mb-6 pb-2 border-b-2">
      <div class="d-flex align-end">
        <v-avatar v-if="data.personal.photo" size="80" class="mr-4 mb-2 rounded-0">
          <v-img :src="data.personal.photo" cover></v-img>
        </v-avatar>
        <div>
          <h1 class="text-h3 font-weight-bold mb-1">{{ data.personal.firstName }} {{ data.personal.lastName }}</h1>
          <h2 class="text-h6 font-weight-regular opacity-60">{{ data.personal.isOtherProfession && data.personal.otherProfessionName ? data.personal.otherProfessionName : data.personal.profession }}</h2>
        </div>
      </div>
      <div class="contact-info text-right text-caption">
        <div v-if="data.personal.phone">{{ data.personal.phone }}</div>
        <div v-if="data.personal.email">{{ data.personal.email }}</div>
        <div v-if="data.personal.address">{{ data.personal.address }}</div>
      </div>
    </div>

    <v-row>
      <v-col cols="4" class="pr-6">
        <div class="skills mb-6" v-if="data.skills && data.skills.length">
          <h3 class="section-title text-overline font-weight-bold mb-2">Skills</h3>
          <ul class="pl-4 text-body-2">
            <li v-for="skill in data.skills" :key="skill" class="mb-1">{{ skill }}</li>
          </ul>
        </div>
        
        <div class="education mb-6" v-if="data.education && data.education.length">
          <h3 class="section-title text-overline font-weight-bold mb-2">Education</h3>
          <div class="edu-item mb-3" v-for="(edu, index) in data.education" :key="index">
            <div class="text-subtitle-2 font-weight-bold">{{ edu.degree }}</div>
            <div class="text-caption opacity-80">{{ edu.institution }}</div>
            <div class="text-caption">{{ edu.year }}</div>
          </div>
        </div>

        <div class="languages mb-6" v-if="data.languages && data.languages.length">
          <h3 class="section-title text-overline font-weight-bold mb-2">Languages</h3>
          <ul class="pl-4 text-body-2">
            <li v-for="lang in data.languages" :key="lang" class="mb-1">{{ lang }}</li>
          </ul>
        </div>
      </v-col>
      
      <v-col cols="8" class="pl-6 border-l">
        <div class="summary mb-8" v-if="data.personal.summary">
          <h3 class="section-title text-overline font-weight-bold mb-2">Profile</h3>
          <p class="text-body-2">{{ data.personal.summary }}</p>
        </div>

        <div class="experience mb-8" v-if="data.experience && data.experience.length">
          <h3 class="section-title text-overline font-weight-bold mb-2">Experience</h3>
          <div class="exp-item mb-5" v-for="(exp, index) in data.experience" :key="index">
            <div class="text-subtitle-1 font-weight-bold">{{ exp.position }}</div>
            <div class="text-subtitle-2 opacity-80 mb-1">{{ exp.company }} | {{ exp.startDate }} - {{ exp.endDate }}</div>
            <p class="text-body-2" style="white-space: pre-line;">{{ exp.duties }}</p>
          </div>
        </div>
      </v-col>
    </v-row>
    
    <div class="footer text-center mt-8 pt-4 border-t" v-if="data.declaration">
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
.cv-template-three {
  background: white;
  min-height: unset;
  font-family: 'Roboto', sans-serif;
  color: #2c3e50;
}
.border-b-2 {
  border-bottom: 2px solid #2c3e50 !important;
}
.border-l {
  border-left: 1px solid #e0e0e0 !important;
}
</style>

