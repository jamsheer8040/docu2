<template>
  <div class="cv-preview">
    <component :is="activeTemplate" :data="data" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import TemplateOne from './templates/TemplateOne.vue';
import TemplateTwo from './templates/TemplateTwo.vue';
import TemplateThree from './templates/TemplateThree.vue';
import TemplateFour from './templates/TemplateFour.vue';
import TemplateFive from './templates/TemplateFive.vue';

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});

const templates = {
  TemplateOne,
  TemplateTwo,
  TemplateThree,
  TemplateFour,
  TemplateFive
};

const activeTemplate = computed(() => {
  return templates[props.data.template] || TemplateOne;
});
</script>

<style scoped>
.cv-preview {
  width: 100%;
  height: auto;
  box-sizing: border-box;
}
</style>
