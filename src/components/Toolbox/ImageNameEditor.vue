<template>
  <div class="relative">
    <!-- 编辑模式显示 textarea -->
    <textarea
        v-if="isEditing"
        ref="textareaRef"
        v-model="content"
        class="textarea wrap-normal textarea-bordered w-full p-2 resize-none"
        :class="textClasses"
        @blur="saveChanges"
        @keydown.enter.exact.prevent="saveChanges"
        @keydown.esc="cancelEditing"
    />

    <!-- 查看模式显示伪装段落 -->
    <p
        v-else
        class="cursor-pointer text-base whitespace-pre-wrap break-words"
        :class="textClasses"
        @dblclick="startEditing"
    >
      {{ content || placeholder }}
    </p>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import {api} from "@/store.js";

const props = defineProps({
  info:Object,
  textClasses: {
    type: String,
    default: 'text-base leading-normal' // DaisyUI 文本样式
  }
})

const emit = defineEmits(['update:modelValue'])

const content = ref(props.info.name || '')
const isEditing = ref(false)
const textareaRef = ref(null)

// 自动聚焦指令
const vFocus = {
  mounted: (el) => el.focus()
}

const startEditing = () => {
  isEditing.value = true
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
      // 全选文本（可选）
      textareaRef.value.select()
    }
  })
}

const saveChanges = () => {
  isEditing.value = false
  api.put("image/"+props.info.id,props.info)
  props.info.name=content.value
  // emit('update:modelValue', content.value)
}

const cancelEditing = () => {
  isEditing.value = false
  // 恢复原始值
  content.value = props.info.name
}
</script>

<style scoped>
/* 使 textarea 在非编辑状态时看起来像普通文本 */
.textarea {
  border: none;
  outline: none;
  box-shadow: none;
  background-color: transparent;
  font: inherit;
  padding: 0;
  margin: 0;
}

/* 移除 textarea 的滚动条 */
.textarea::-webkit-scrollbar {
  display: none;
}

/* 双击区域样式 */
.cursor-pointer {
  cursor: pointer;
}
</style>