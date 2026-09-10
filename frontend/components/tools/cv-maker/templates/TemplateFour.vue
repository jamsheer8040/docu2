<template>
  <div class="cv-template-four">
    <div class="header text-center pa-8" style="background: var(--v-theme-secondary); color: white;">
      <v-avatar v-if="data.personal.photo" size="120" class="elevation-4 mb-4 border-2 border-white">
        <v-img :src="data.personal.photo" cover></v-img>
      </v-avatar>
      <h1 class="text-h2 font-weight-black mb-2" style="font-family: 'Outfit', sans-serif;">{{ data.personal.firstName }} <span class="opacity-70">{{ data.personal.lastName }}</span></h1>
      <v-chip color="white" variant="outlined" class="text-uppercase tracking-widest px-4 font-weight-bold">{{ data.personal.isOtherProfession && data.personal.otherProfessionName ? data.personal.otherProfessionName : data.personal.profession }}</v-chip>
    </div>

    <div class="content pa-8">
      <div class="summary text-center mb-10 mx-auto" style="max-width: 80%;" v-if="data.personal.summary">
        <p class="text-body-1 font-weight-medium font-italic">"{{ data.personal.summary }}"</p>
      </div>

      <v-row>
        <v-col cols="5">
          <div class="contact-card bg-grey-lighten-4 pa-5 rounded-lg mb-6">
            <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center"><v-icon size="small" class="mr-2">mdi-account-box</v-icon> CONTACT</h3>
            <div class="text-body-2 mb-2" v-if="data.personal.phone">{{ data.personal.phone }}</div>
            <div class="text-body-2 mb-2" v-if="data.personal.email">{{ data.personal.email }}</div>
            <div class="text-body-2" v-if="data.personal.address">{{ data.personal.address }}</div>
          </div>

          <div class="skills mb-6" v-if="data.skills && data.skills.length">
            <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center"><v-icon size="small" class="mr-2">mdi-star</v-icon> EXPERTISE</h3>
            <div v-for="skill in data.skills" :key="skill" class="mb-2">
              <div class="text-body-2 font-weight-bold mb-1">{{ skill }}</div>
              <v-progress-linear model-value="80" color="secondary" height="4" rounded></v-progress-linear>
            </div>
          </div>
          
          <div class="education mb-6" v-if="data.education && data.education.length">
            <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center"><v-icon size="small" class="mr-2">mdi-school</v-icon> EDUCATION</h3>
            <div class="edu-item mb-3" v-for="(edu, index) in data.education" :key="index">
              <div class="text-body-2 font-weight-bold">{{ edu.degree }}</div>
              <div class="text-caption opacity-80">{{ edu.institution }} | {{ edu.year }}</div>
            </div>
          </div>
        </v-col>

        <v-col cols="7" class="pl-6">
          <div class="experience mb-8" v-if="data.experience && data.experience.length">
            <h3 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center"><v-icon size="small" class="mr-2">mdi-briefcase</v-icon> WORK EXPERIENCE</h3>
            <div class="timeline">
              <div class="timeline-item pb-4 pl-6 position-relative" v-for="(exp, index) in data.experience" :key="index">
                <div class="timeline-dot"></div>
                <div class="d-flex justify-space-between align-baseline mb-1">
                  <strong class="text-subtitle-1">{{ exp.position }}</strong>
                  <v-chip size="x-small" color="secondary" variant="tonal" class="font-weight-bold">{{ exp.startDate }} - {{ exp.endDate }}</v-chip>
                </div>
                <div class="text-subtitle-2 mb-2 opacity-80">{{ exp.company }}</div>
                <p class="text-body-2" style="white-space: pre-line;">{{ exp.duties }}</p>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: Object
});
</script>

<style scoped>
.cv-template-four {
  background: white;
  min-height: unset;
  font-family: 'Inter', sans-serif;
  color: #333;
}
.tracking-widest {
  letter-spacing: 3px;
}
.timeline {
  border-left: 2px solid #eee;
}
.timeline-item {
  position: relative;
}
.timeline-dot {
  position: absolute;
  left: -6px;
  top: 6px;
  width: 10px;
  height: 10px;
  background: var(--v-theme-secondary);
  border-radius: 50%;
}
</style>

