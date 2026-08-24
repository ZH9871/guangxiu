<template>
  <div v-html="svgContent" class="svg-container"></div>
</template>

<script setup>
import {ref, onMounted, watch} from 'vue';

const props = defineProps({
  name: { type: String, required: true },
  color: { type: String, default: 'currentColor' } // 默认继承父级颜色
});
const svgContent = ref('');
async function load(){
  const response = await fetch(`/src/assets/${props.name}.svg`);
  let svgText = await response.text();
  // 移除可能存在的内联颜色
  svgText = svgText.replace(/fill="[^"]*"/g, '')
      .replace(/stroke="[^"]*"/g, '');
  // 添加可控制的颜色类
  svgContent.value = svgText.replace('<svg', `<svg class="svg-icon"`);
}
onMounted(async () => {
  await load()
});
watch(
    () => props.name, // 监听函数
    (newVal) =>{
      load()
    }
)
</script>

<style scoped>
.svg-container {
  display: inline-block;
}

.svg-icon {
  fill: v-bind('props.color'); /* 使用动态绑定 */
  stroke: v-bind('props.color');
}

/* 或者直接设置黄色 */
.svg-icon.yellow {
  fill: #FFD700 !important; /* 金色黄 */
  stroke: #FFD700 !important;
}
</style>