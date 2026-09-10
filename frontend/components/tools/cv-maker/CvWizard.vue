<template>
  <div class="cv-wizard">
    <v-stepper v-model="step" class="elevation-0 bg-transparent" flat>
      <v-stepper-header class="elevation-0 px-0">
        <v-stepper-item value="1" title="Info"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item value="2" title="Skills"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item value="3" title="Experience"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item value="4" title="Education"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item value="5" title="Finish"></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <!-- Step 1: Personal Info & Template -->
        <v-stepper-window-item value="1">
          <v-card flat class="pa-4 mt-2">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">Personal Details</h3>
            <v-row>
              <v-col cols="12">
                <p class="text-caption font-weight-bold mb-1">Select Template</p>
                <v-btn-toggle v-model="localData.template" mandatory color="primary" variant="outlined" divided class="w-100 flex-wrap mb-4">
                  <v-btn value="TemplateOne" size="small" class="flex-grow-1">Modern</v-btn>
                  <v-btn value="TemplateTwo" size="small" class="flex-grow-1">Classic</v-btn>
                  <v-btn value="TemplateThree" size="small" class="flex-grow-1">Minimal</v-btn>
                  <v-btn value="TemplateFour" size="small" class="flex-grow-1">Creative</v-btn>
                  <v-btn value="TemplateFive" size="small" class="flex-grow-1">Professional</v-btn>
                </v-btn-toggle>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="localData.personal.firstName" label="First Name" variant="outlined" density="compact" hide-details class="mb-3"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="localData.personal.lastName" label="Last Name" variant="outlined" density="compact" hide-details class="mb-3"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <div class="d-flex align-center mb-3 h-100">
                  <v-avatar size="64" color="grey-lighten-2" class="mr-4" variant="tonal">
                    <v-img v-if="localData.personal.photo" :src="localData.personal.photo" cover></v-img>
                    <v-icon v-else>mdi-camera</v-icon>
                  </v-avatar>
                  <div>
                    <v-btn size="small" color="primary" variant="tonal" @click="triggerFileInput">
                      {{ localData.personal.photo ? 'Change Photo' : 'Upload Photo' }}
                    </v-btn>
                    <v-btn v-if="localData.personal.photo" size="small" color="error" variant="text" class="ml-2" @click="localData.personal.photo = null">Remove</v-btn>
                    <div class="text-caption text-grey mt-1">Optional. Ideal size 250x250px.</div>
                    <input type="file" ref="fileInputRef" accept="image/*" class="d-none" @change="onFileSelected" />
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-caption text-grey-darken-1 mb-1">Years of Experience</div>
                <v-slider
                  v-model="localData.personal.yearsOfExperience"
                  :min="0"
                  :max="30"
                  :step="1"
                  color="primary"
                  thumb-label
                  @update:model-value="updateSummaryExperience"
                  hide-details
                >
                  <template v-slot:append>
                    <v-text-field
                      v-model="localData.personal.yearsOfExperience"
                      type="number"
                      style="width: 70px"
                      density="compact"
                      hide-details
                      variant="outlined"
                      @input="updateSummaryExperience"
                    ></v-text-field>
                  </template>
                </v-slider>
                <div class="text-caption text-grey mt-1">Automatically updates your professional summary</div>
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  v-model="localData.personal.profession"
                  :items="professionList"
                  label="Profession (Select closest match)"
                  variant="outlined"
                  density="compact"
                  hint="Auto-suggests skills and duties based on this selection"
                  persistent-hint
                  class="mb-2"
                  @update:modelValue="onProfessionChange"
                ></v-autocomplete>
                <div class="d-flex align-center">
                  <v-checkbox
                    v-model="localData.personal.isOtherProfession"
                    label="Use a custom profession name"
                    hide-details
                    density="compact"
                    color="primary"
                    @change="updateSummaryExperience"
                  ></v-checkbox>
                </div>
                <v-text-field
                  v-if="localData.personal.isOtherProfession"
                  v-model="localData.personal.otherProfessionName"
                  label="Custom Profession Name (Will appear on CV)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mt-2"
                  @input="updateSummaryExperience"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="localData.personal.email" label="Email" variant="outlined" density="compact" hide-details class="mb-3"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="localData.personal.phone" label="Phone" variant="outlined" density="compact" hide-details class="mb-3"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="localData.personal.address" label="Address" variant="outlined" density="compact" hide-details class="mb-3"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="localData.personal.summary" label="Professional Summary" variant="outlined" density="compact" rows="3" hide-details auto-grow></v-textarea>
              </v-col>
            </v-row>
            <div class="d-flex justify-end mt-6">
              <v-btn color="primary" @click="step = '2'">Next <v-icon right>mdi-arrow-right</v-icon></v-btn>
            </div>
          </v-card>
        </v-stepper-window-item>

        <!-- Step 2: Skills -->
        <v-stepper-window-item value="2">
          <v-card flat class="pa-4 mt-2">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">Core Skills</h3>
            <p class="text-caption mb-3" v-if="suggestedSkills.length > 0">
              Suggested for <strong>{{ localData.personal.profession }}</strong>:
            </p>
            <div class="d-flex flex-wrap gap-2 mb-4" v-if="suggestedSkills.length > 0">
              <v-chip
                v-for="skill in suggestedSkills"
                :key="skill"
                color="secondary"
                size="small"
                variant="outlined"
                @click="addSkill(skill)"
                :disabled="localData.skills.includes(skill)"
              >
                + {{ skill }}
              </v-chip>
            </div>
            
            <v-combobox
              v-model="localData.skills"
              multiple
              chips
              closable-chips
              density="compact"
              label="Your Skills (Type and press Enter)"
              variant="outlined"
              hide-details
              class="mb-4"
            ></v-combobox>

            <h3 class="text-subtitle-1 font-weight-bold mb-3 mt-4">Languages & Software</h3>
            <v-combobox
              v-model="localData.languages"
              multiple
              chips
              closable-chips
              density="compact"
              label="Languages"
              variant="outlined"
              hide-details
              class="mb-3"
            ></v-combobox>
            <v-combobox
              v-model="localData.software"
              multiple
              chips
              closable-chips
              density="compact"
              label="Software / Tools"
              variant="outlined"
              hide-details
            ></v-combobox>

            <div class="d-flex justify-space-between mt-4">
              <v-btn variant="text" @click="step = '1'">Back</v-btn>
              <v-btn color="primary" @click="step = '3'">Next <v-icon right>mdi-arrow-right</v-icon></v-btn>
            </div>
          </v-card>
        </v-stepper-window-item>

        <!-- Step 3: Experience -->
        <v-stepper-window-item value="3">
          <v-card flat class="pa-4 mt-2">
            <div class="d-flex justify-space-between align-center mb-3">
              <h3 class="text-subtitle-1 font-weight-bold">Work Experience</h3>
              <v-btn size="small" color="primary" variant="tonal" @click="addExperience">+ Add Experience</v-btn>
            </div>

            <v-expansion-panels variant="accordion" class="mb-4">
              <v-expansion-panel v-for="(exp, index) in localData.experience" :key="index">
                <v-expansion-panel-title class="pa-3">
                  <span class="font-weight-bold">{{ exp.position || 'New Position' }}</span>
                  <span class="text-caption ml-2 opacity-60">at {{ exp.company || 'Company' }}</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="pt-3">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="exp.company" label="Company Name" variant="outlined" density="compact" hide-details class="mb-3"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-autocomplete
                        v-model="exp.professionMatch"
                        :items="professionList"
                        label="Job Role (Select closest match)"
                        variant="outlined"
                        density="compact"
                        hint="Loads duty suggestions"
                        persistent-hint
                        class="mb-2"
                        @update:modelValue="onExperienceProfessionChange(index)"
                      ></v-autocomplete>
                      <div class="d-flex align-center mt-n2 mb-2">
                        <v-checkbox
                          v-model="exp.isOtherProfession"
                          label="Use custom job title"
                          hide-details
                          density="compact"
                          color="primary"
                          @change="onExperienceOtherToggle(index)"
                        ></v-checkbox>
                      </div>
                      <v-text-field 
                        v-if="exp.isOtherProfession"
                        v-model="exp.position" 
                        label="Custom Job Title (Appears on CV)" 
                        variant="outlined" 
                        density="compact" 
                        hide-details 
                        class="mb-3"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <div class="d-flex align-start gap-2 mb-2">
                        <div class="flex-grow-1">
                          <div class="text-caption text-grey-darken-1 mb-1">Start Date</div>
                          <div class="d-flex gap-2">
                            <v-autocomplete
                              v-model="exp.startMonth"
                              :items="monthsList"
                              label="Month"
                              variant="outlined"
                              density="compact"
                              hide-details
                              style="width: 120px"
                            ></v-autocomplete>
                            <v-autocomplete
                              v-model="exp.startYear"
                              :items="yearsList"
                              label="Year"
                              variant="outlined"
                              density="compact"
                              hide-details
                              style="width: 120px"
                            ></v-autocomplete>
                          </div>
                        </div>
                        <div class="d-flex flex-column justify-center px-2 pt-6">
                          <v-icon color="grey">mdi-arrow-right</v-icon>
                        </div>
                        <div class="flex-grow-1">
                          <div class="text-caption text-grey-darken-1 mb-1">End Date</div>
                          <div class="d-flex gap-2 mb-1">
                            <v-autocomplete
                              v-model="exp.endMonth"
                              :items="monthsList"
                              label="Month"
                              variant="outlined"
                              density="compact"
                              hide-details
                              :disabled="exp.isCurrent"
                              style="width: 120px"
                            ></v-autocomplete>
                            <v-autocomplete
                              v-model="exp.endYear"
                              :items="yearsList"
                              label="Year"
                              variant="outlined"
                              density="compact"
                              hide-details
                              :disabled="exp.isCurrent"
                              style="width: 120px"
                            ></v-autocomplete>
                          </div>
                          <div>
                            <v-checkbox
                              v-model="exp.isCurrent"
                              label="To Present"
                              hide-details
                              density="compact"
                              color="primary"
                              class="ma-0 pa-0"
                            ></v-checkbox>
                          </div>
                        </div>
                      </div>
                      <div v-if="exp.error" class="text-caption text-error mt-1">{{ exp.error }}</div>
                    </v-col>
                  </v-row>
                  
                  <div class="mt-4">
                    <p class="text-caption font-weight-bold mb-1">Duties & Responsibilities</p>
                    <div class="d-flex flex-wrap gap-2 mb-3" v-if="exp.suggestedDuties && exp.suggestedDuties.length > 0">
                      <v-chip
                        v-for="(duty, dIndex) in exp.suggestedDuties"
                        :key="dIndex"
                        size="small"
                        color="info"
                        variant="tonal"
                        @click="addDuty(index, duty)"
                        style="white-space: normal; height: auto; padding: 4px 8px;"
                      >
                        + {{ duty }}
                      </v-chip>
                    </div>
                    <v-textarea v-model="exp.duties" label="Duties (One per line)" rows="3" variant="outlined" density="compact" hide-details auto-grow></v-textarea>
                  </div>
                  
                  <div class="d-flex justify-end mt-2">
                    <v-btn size="small" color="error" variant="text" @click="removeExperience(index)">Remove</v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div class="d-flex justify-space-between mt-4">
              <v-btn variant="text" @click="step = '2'">Back</v-btn>
              <v-btn color="primary" @click="step = '4'">Next <v-icon right>mdi-arrow-right</v-icon></v-btn>
            </div>
          </v-card>
        </v-stepper-window-item>

        <!-- Step 4: Education -->
        <v-stepper-window-item value="4">
          <v-card flat class="pa-4 mt-2">
            <div class="d-flex justify-space-between align-center mb-3">
              <h3 class="text-subtitle-1 font-weight-bold">Education</h3>
              <v-btn size="small" color="primary" variant="tonal" @click="addEducation">+ Add Education</v-btn>
            </div>

            <v-expansion-panels variant="accordion" class="mb-4">
              <v-expansion-panel v-for="(edu, index) in localData.education" :key="index">
                <v-expansion-panel-title class="pa-3">
                  <span class="font-weight-bold">{{ edu.degree || 'Degree' }}</span>
                  <span class="text-caption ml-2 opacity-60">{{ edu.institution || 'Institution' }}</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="pt-3">
                  <v-row>
                    <v-col cols="12">
                      <v-text-field v-model="edu.institution" label="Institution / University" variant="outlined" density="compact" hide-details class="mb-3"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="8">
                      <v-text-field v-model="edu.degree" label="Degree / Certificate" variant="outlined" density="compact" hide-details class="mb-3"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-autocomplete v-model="edu.year" :items="gradYearsList" label="Year of Graduation" variant="outlined" density="compact" hide-details class="mb-3"></v-autocomplete>
                    </v-col>
                  </v-row>
                  <div class="d-flex justify-end mt-2">
                    <v-btn size="small" color="error" variant="text" @click="removeEducation(index)">Remove</v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div class="d-flex justify-space-between mt-4">
              <v-btn variant="text" @click="step = '3'">Back</v-btn>
              <v-btn color="primary" @click="step = '5'">Next <v-icon right>mdi-arrow-right</v-icon></v-btn>
            </div>
          </v-card>
        </v-stepper-window-item>

        <!-- Step 5: Finish & Declaration -->
        <v-stepper-window-item value="5">
          <v-card flat class="pa-4 mt-2">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">Final Touches</h3>
            
            <p class="text-caption font-weight-bold mb-1">Switch Template</p>
            <v-btn-toggle v-model="localData.template" mandatory color="primary" variant="outlined" divided class="w-100 flex-wrap mb-4">
              <v-btn value="TemplateOne" size="small" class="flex-grow-1">Modern</v-btn>
              <v-btn value="TemplateTwo" size="small" class="flex-grow-1">Classic</v-btn>
              <v-btn value="TemplateThree" size="small" class="flex-grow-1">Minimal</v-btn>
              <v-btn value="TemplateFour" size="small" class="flex-grow-1">Creative</v-btn>
              <v-btn value="TemplateFive" size="small" class="flex-grow-1">Professional</v-btn>
            </v-btn-toggle>

            <v-textarea
              v-model="localData.declaration"
              label="Declaration (Optional)"
              variant="outlined"
              density="compact"
              rows="2"
              auto-grow
              hide-details
              hint="Printed at the bottom of the CV"
            ></v-textarea>

            <div class="bg-success-subtle pa-4 rounded mt-4 border border-success">
              <div class="d-flex align-center text-success-darken-1 mb-1">
                <v-icon class="mr-2" size="small">mdi-check-circle</v-icon>
                <strong>All Done!</strong>
              </div>
              <p class="text-caption">Your CV is ready. You can save it to your account or download it as a PDF using the buttons at the top right.</p>
            </div>

            <div class="d-flex justify-start mt-4">
              <v-btn variant="text" @click="step = '4'">Back</v-btn>
            </div>
          </v-card>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <!-- Photo Cropper Dialog -->
    <v-dialog v-model="photoDialog" max-width="500" persistent>
      <v-card>
        <v-card-title>Crop Photo</v-card-title>
        <v-card-text class="pa-0 bg-black">
          <cropper
            ref="cropperRef"
            class="cropper"
            :src="rawImageSrc"
            :stencil-props="{ aspectRatio: 1 }"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="cancelCrop">Cancel</v-btn>
          <v-btn color="primary" @click="cropImage">Crop & Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import professionDataRaw from '~/data/professionData.json';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});
const emit = defineEmits(['update:modelValue']);

const step = ref('1');

// Reactive local copy
const localData = ref(props.modelValue);

// Sync up
watch(localData, (newVal) => {
  emit('update:modelValue', newVal);
}, { deep: true });

// Sync down (if parent updates, e.g. after load)
watch(() => props.modelValue, (newVal) => {
  localData.value = newVal;
}, { deep: true });

// Profession Data Handling
const professionList = computed(() => {
  return professionDataRaw.professions.map(p => p.name).sort();
});

const currentYear = new Date().getFullYear();
const yearsList = Array.from({ length: 26 }, (_, i) => currentYear - i);
const gradYearsList = Array.from({ length: 28 }, (_, i) => currentYear + 2 - i);
const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const suggestedSkills = ref([]);
const suggestedDuties = ref([]);

const onProfessionChange = () => {
  const pName = localData.value.personal.profession;
  const prof = professionDataRaw.professions.find(p => p.name === pName);
  
  if (prof) {
    suggestedSkills.value = prof.skills || [];
    suggestedDuties.value = prof.duties || [];
    
    // Auto-fill summary if empty
    if (!localData.value.personal.summary && prof.summary) {
      localData.value.personal.summary = prof.summary;
      // Inject years of experience if already filled out
      if (localData.value.personal.yearsOfExperience) {
        updateSummaryExperience();
      }
    }
    
    // Auto-fill some skills if empty
    if (localData.value.skills.length === 0) {
      localData.value.skills = [...suggestedSkills.value.slice(0, 5)];
    }
  } else {
    suggestedSkills.value = [];
    suggestedDuties.value = [];
  }
};

const updateSummaryExperience = () => {
  if (!localData.value.personal.summary || localData.value.personal.yearsOfExperience === null || localData.value.personal.yearsOfExperience === '') return;
  
  const years = localData.value.personal.yearsOfExperience;
  const baseProf = localData.value.personal.profession;
  const prof = localData.value.personal.isOtherProfession && localData.value.personal.otherProfessionName 
                ? localData.value.personal.otherProfessionName 
                : baseProf;
  let summary = localData.value.personal.summary;
  
  // Clean out any accumulated junk at the beginning like "With 5+ years of experience, , , "
  summary = summary.replace(/^(?:With \d+\+ years of experience,?\s*|,\s*)+/i, '');
  // Clean out any inline " with X+ years of experience" 
  summary = summary.replace(/\s*with \d+\+ years of experience/gi, '');
  
  if (prof && years > 0) {
    // Check if it says "[Profession] experienced" to avoid "experienced experienced"
    // Also support checking the base profession if we are using an 'Other' name, to replace the base profession with the new one
    const regexExp = new RegExp((baseProf || prof) + '\\s+experienced', 'i');
    if (regexExp.test(summary)) {
      summary = summary.replace(regexExp, `${prof} with ${years}+ years of experience`);
    } else {
      // Inject right after profession name
      const regex = new RegExp((baseProf || prof), 'i');
      if (regex.test(summary)) {
        summary = summary.replace(regex, `${prof} with ${years}+ years of experience`);
      } else {
        summary = `With ${years}+ years of experience, ` + summary;
      }
    }
  } else if (years > 0) {
    // No profession selected, just prepend
    summary = `With ${years}+ years of experience, ` + summary;
  } else if (prof && baseProf && prof !== baseProf) {
     // If years is not filled, but custom name is used, replace base profession name in summary
     const regex = new RegExp(baseProf, 'i');
     if (regex.test(summary)) {
        summary = summary.replace(regex, prof);
     }
  }
  
  localData.value.personal.summary = summary;
};

onMounted(() => {
  if (localData.value.personal.profession) {
    onProfessionChange();
  }
  
  // Parse existing dates for the new UI format if they already existed
  if (localData.value.experience && localData.value.experience.length > 0) {
    localData.value.experience.forEach(exp => {
      if (exp.startDate && !exp.startMonth) {
        const parts = exp.startDate.split(' ');
        if (parts.length === 2) { exp.startMonth = parts[0]; exp.startYear = parseInt(parts[1]); }
      }
      if (exp.endDate === 'Present') {
        exp.isCurrent = true;
      } else if (exp.endDate && !exp.endMonth) {
        const parts = exp.endDate.split(' ');
        if (parts.length === 2) { exp.endMonth = parts[0]; exp.endYear = parseInt(parts[1]); }
      }
    });
  }
});

watch(() => localData.value.experience, (exps) => {
  if (!exps) return;
  exps.forEach(exp => exp.error = '');
  
  const parsedExps = exps.map((exp, index) => {
    // Generate the string versions for the CV template consumption
    if (exp.startMonth && exp.startYear) {
      exp.startDate = `${exp.startMonth} ${exp.startYear}`;
    } else {
      exp.startDate = '';
    }
    
    if (exp.isCurrent) {
      exp.endDate = 'Present';
      exp.endMonth = '';
      exp.endYear = '';
    } else if (exp.endMonth && exp.endYear) {
      exp.endDate = `${exp.endMonth} ${exp.endYear}`;
    } else {
      exp.endDate = '';
    }

    if (!exp.startMonth || !exp.startYear) return null;
    let start = new Date(exp.startYear, monthsList.indexOf(exp.startMonth));
    let end;
    if (exp.isCurrent) {
      end = new Date(); // Present
    } else if (exp.endMonth && exp.endYear) {
      end = new Date(exp.endYear, monthsList.indexOf(exp.endMonth));
    } else {
      return null; // Missing end date, can't validate yet
    }
    
    if (end < start) {
      exp.error = 'End date cannot be before start date.';
    }
    
    return { index, start, end };
  }).filter(Boolean);

  // Check overlaps
  for (let i = 0; i < parsedExps.length; i++) {
    for (let j = i + 1; j < parsedExps.length; j++) {
      let a = parsedExps[i];
      let b = parsedExps[j];
      
      // Allow overlapping on the exact same month (e.g. ending Dec 2020 and starting Dec 2020)
      if (a.start < b.end && a.end > b.start) {
        exps[a.index].error = 'Experience dates overlap with another entry.';
        exps[b.index].error = 'Experience dates overlap with another entry.';
      }
    }
  }
}, { deep: true });

const addSkill = (skill) => {
  if (!localData.value.skills.includes(skill)) {
    localData.value.skills.push(skill);
  }
};

const addExperience = () => {
  localData.value.experience.push({
    company: '',
    position: '',
    professionMatch: '',
    isOtherProfession: false,
    suggestedDuties: [],
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    isCurrent: false,
    startDate: '',
    endDate: '',
    duties: '',
    error: ''
  });
};

const onExperienceProfessionChange = (index) => {
  const exp = localData.value.experience[index];
  const prof = professionDataRaw.professions.find(p => p.name === exp.professionMatch);
  
  if (prof) {
    exp.suggestedDuties = prof.duties || [];
    if (!exp.isOtherProfession) {
      exp.position = exp.professionMatch;
    }
  } else {
    exp.suggestedDuties = [];
  }
};

const onExperienceOtherToggle = (index) => {
  const exp = localData.value.experience[index];
  if (!exp.isOtherProfession && exp.professionMatch) {
    exp.position = exp.professionMatch;
  }
};

const removeExperience = (index) => {
  localData.value.experience.splice(index, 1);
};

const addDuty = (expIndex, dutyText) => {
  const currentDuties = localData.value.experience[expIndex].duties;
  if (currentDuties) {
    localData.value.experience[expIndex].duties = currentDuties + '\n' + dutyText;
  } else {
    localData.value.experience[expIndex].duties = dutyText;
  }
};

const addEducation = () => {
  localData.value.education.push({
    institution: '',
    degree: '',
    year: ''
  });
};

const removeEducation = (index) => {
  localData.value.education.splice(index, 1);
};

// Photo Cropper Logic
const fileInputRef = ref(null);
const photoDialog = ref(false);
const rawImageSrc = ref('');
const cropperRef = ref(null);

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const onFileSelected = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      rawImageSrc.value = e.target.result;
      photoDialog.value = true;
    };
    reader.readAsDataURL(file);
  }
  // reset input so the same file can be selected again if needed
  event.target.value = '';
};

const cropImage = () => {
  if (cropperRef.value) {
    const { canvas } = cropperRef.value.getResult();
    if (canvas) {
      localData.value.personal.photo = canvas.toDataURL('image/jpeg');
      photoDialog.value = false;
    }
  }
};

const cancelCrop = () => {
  photoDialog.value = false;
  rawImageSrc.value = '';
};
</script>

<style scoped>
.cv-wizard {
  height: 100%;
}
.cropper {
  height: 400px;
  width: 100%;
  background: #222;
}
</style>
