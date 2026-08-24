<!-- 图片选择器模态窗口组件（样式对齐 T2I 词库弹窗） -->
<template>
  <!-- 模态窗口 -->
  <div v-if="showModal" class="img-modal-mask" @mousedown="handleMaskClick">
    <div class="img-modal">
      <!-- 弹窗头部 -->
      <div class="img-modal-header">
        <h2 class="img-modal-title"><i class="fa fa-picture-o mr-2"></i>选择图片</h2>
        <button @click="closeModal" class="img-modal-close">×</button>
      </div>

      <!-- 分类标签栏 -->
      <div class="img-modal-tabs">
        <div class="img-modal-tabgroup">
          <button class="img-tab-btn" :class="{ active: activeTab === 'uploads' }"
               @click="activeTab = 'uploads'">上传记录</button>
          <button class="img-tab-btn" :class="{ active: activeTab === 'generated' }"
               @click="activeTab = 'generated'">文生图</button>
        </div>
      </div>

      <!-- 图片内容区域 -->
      <div class="img-modal-content">
        <div v-if="activeTab === 'uploads'" class="images-grid">
          <div v-for="item in imageStore.uploads" :key="item.id"
               class="image-item"
               :class="{ 'selected': selectedImage?.id === item.id }"
               @click="selectImage(item)">
            <img :src="item.thumbnail" :alt="item.name"
                 class="image-thumb" />
            <div class="checkmark">✓</div>
          </div>
          <div v-if="imageStore.uploads.length === 0" class="img-empty">暂无上传记录</div>
        </div>

        <div v-if="activeTab === 'generated'" class="images-grid">
          <div v-for="item in imageStore.generated_statics" :key="item.id"
               class="image-item"
               :class="{ 'selected': selectedImage?.id === item.id }"
               @click="selectImage(item)">
            <img :src="item.thumbnail" :alt="item.name"
                 class="image-thumb" />
            <div class="checkmark">✓</div>
          </div>
          <div v-if="imageStore.generated_statics.length === 0" class="img-empty">暂无生成图片</div>
        </div>
      </div>

      <!-- 弹窗底部 -->
      <div class="img-modal-footer">
        <button class="img-modal-confirm" @click="confirmSelection" :disabled="!selectedImage">
          <i class="fa fa-check mr-2"></i>确定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useImageStore } from '@/store'

const emit = defineEmits(['image-selected'])

// 定义props接收selected_change函数
const props = defineProps({
  onSelectedChange: {
    type: Function,
    required: true
  }
})

const imageStore = useImageStore()
const showModal = ref(false)
const activeTab = ref('uploads')
const selectedImage = ref(null)

// 打开模态窗口
const openModal = () => {
  showModal.value = true
  selectedImage.value = null
}

// 关闭模态窗口
const closeModal = () => {
  showModal.value = false
  selectedImage.value = null
}

// 选择图片
const selectImage = (image) => {
  selectedImage.value = image
}

// 确认选择
const confirmSelection = () => {
  if (selectedImage.value) {
    // 调用父组件传递的selected_change函数
    props.onSelectedChange(selectedImage.value.id)
    closeModal()
  }
}

// ESC键关闭弹窗
const handleEscKey = (e) => {
  if (e.key === 'Escape' && showModal.value) {
    closeModal()
  }
}

// 点击遮罩外部关闭
const handleMaskClick = (e) => {
  if (e.target === e.currentTarget) {
    closeModal()
  }
}

// 在组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

// 在组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})

// 暴露方法给父组件
defineExpose({
  openModal
})
</script>

<style scoped>
/* ===== 遮罩（对齐 T2I poem-modal-mask） ===== */
.img-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

/* ===== 弹窗主体 ===== */
.img-modal {
  width: 100%;
  max-width: 900px;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8e4;
}

/* ===== 弹窗头部 ===== */
.img-modal-header {
  background: linear-gradient(135deg, #71ba94 0%, #5cae85 100%);
  color: #fff;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.img-modal-title {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
}
.img-modal-close {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.8rem;
  line-height: 1;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.25s ease;
}
.img-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ===== 分类标签栏 ===== */
.img-modal-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 24px;
  background: #ffffff;
  border-bottom: 1px solid #eef3ef;
  flex-shrink: 0;
}
.img-modal-tabgroup {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.img-tab-btn {
  background: #eef7ee;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4a7c63;
  font-weight: 500;
  transition: all 0.25s ease;
  white-space: nowrap;
  border: 1px solid transparent;
}
.img-tab-btn:hover {
  background: #d9eed9;
}
.img-tab-btn.active {
  background: #71ba94;
  color: #fff;
  box-shadow: 0 2px 8px rgba(113, 186, 148, 0.4);
}

/* ===== 图片内容区域 ===== */
.img-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: #ffffff;
}

.img-modal-footer {
  background: #ffffff;
  padding: 14px 24px;
  border-top: 1px solid #eef3ef;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}
.img-modal-confirm {
  background: #71ba94;
  color: #fff;
  border: none;
  padding: 9px 32px;
  border-radius: 24px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}
.img-modal-confirm:hover:not(:disabled) {
  background: #5cae85;
  box-shadow: 0 3px 10px rgba(113, 186, 148, 0.4);
}
.img-modal-confirm:disabled {
  background: #c4ccc7;
  cursor: not-allowed;
}

/* ===== 图片网格 ===== */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 8px;
}
.image-item {
  position: relative;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.25s ease;
}
.image-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}
.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(113, 186, 148, 0.2);
  border-color: #71ba94;
}
.image-item.selected {
  border-color: #10b981;
}
.checkmark {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: #10b981;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.9rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.image-item.selected .checkmark {
  opacity: 1;
}
.img-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 0.95rem;
}

/* ===== 响应式设计 ===== */
@media (max-width: 768px) {
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
@media (max-width: 480px) {
  .images-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
