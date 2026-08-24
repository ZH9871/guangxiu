<template>
  <div class="uploader-container">
    <div
        class="upload-area"
        :class="{ 'dragover': isDragover }"
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop.prevent="handleDrop"
    >
      <input
          type="file"
          ref="fileInput"
          accept="image/*"
          multiple
          class="hidden-input"
          @change="handleFileChange"
      >

      <div class="upload-placeholder">
        <i class="fas fa-cloud-upload-alt"></i>
        <h3 class="title">{{ title }}</h3>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive,toRaw ,computed, onMounted,  watch} from "vue";
import { useImageStore,useUserStore,api } from '@/store'
const userStore =useUserStore()
const imageStore =useImageStore()
const props = defineProps({
  // 占位标题
  title: {
    type: String,
    default: "拖放图片或点击上传"
  },
  // 占位描述
  description: {
    type: String,
    default: "支持JPG, PNG, GIF格式"
  },
  // 可接受的MIME类型
  acceptTypes: {
    type: Array,
    default: () => ['image/jpeg', 'image/png', 'image/gif']
  },
  // 最大文件大小(字节)
  maxFileSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  },
  // 最大文件数量
  maxFiles: {
    type: Number,
    default: 10
  },
  // 初始值
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'update:modelValue',
  'upload',
  'error'
]);

// 创建响应式变量
const isDragover = ref(false);
const fileInput = ref(null);
const previewItems = ref([]);

// 初始化时设置初始值
watch(() => props.modelValue, (newValue) => {
  previewItems.value = [...newValue];
}, { immediate: true });

// 处理文件拖放
function handleDragOver() {
  isDragover.value = true;
}

function handleDragLeave() {
  isDragover.value = false;
}

function handleDrop(e) {
  isDragover.value = false;
  processFiles(e.dataTransfer.files);
}

// 触发文件选择
function triggerFileInput() {
  fileInput.value.click();
}

// 处理文件选择变化
function handleFileChange(e) {
  processFiles(e.target.files);
  e.target.value = null;
}

// 处理并验证文件
function processFiles(files) {
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // 验证文件类型
    if (!props.acceptTypes.includes(file.type)) {
      emitError(`不支持的图片格式: ${file.name} (仅支持 ${props.acceptTypes.join(', ')})`);
      continue;
    }
    const formData = new FormData();
    formData.append('image', file);
    api.post(`/image/${userStore.user_id}/uploads`, formData,{
        headers: {
      'Content-Type': 'multipart/form-data'
    }}).then(res => {
      console.log("上传返回结果",res);
      api.get("/detections/update/"+res.data.id).then(r2 => {
      })
      api.get("/first_user_id").then(res => {
        userStore.user_id=res.data
        imageStore.update_image_infos(userStore.user_id).then(imageStore.load_thumbnails)


      })
    })
  }
}

// 移除图片
function removeImage(index) {
  // 释放占用的内存
  URL.revokeObjectURL(previewItems.value[index].url);
  previewItems.value.splice(index, 1);
  emit('update:modelValue', [...previewItems.value]);
}

// 重置上传器
function resetUploader() {
  previewItems.value.forEach(item => URL.revokeObjectURL(item.url));
  previewItems.value = [];
  emit('update:modelValue', []);
}

// 触发上传事件
function emitUpload() {
  if (previewItems.value.length === 0) {
    emitError('请先选择要上传的图片');
    return;
  }

  emit('upload', previewItems.value.map(item => item.file));
}

// 工具函数：格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 工具函数：截断文件名
function truncateName(name, maxLength = 15) {
  if (name.length <= maxLength) return name;
  const extension = name.split('.').pop();
  const nameWithoutExtension = name.substring(0, name.length - extension.length - 1);
  return nameWithoutExtension.substring(0, maxLength - 3) + '...' + extension;
}

// 错误处理
function emitError(message) {
  emit('error', {
    message,
    files: [...previewItems.value]
  });
}
</script>

<style scoped>
.uploader-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 300px;
  max-width: 200px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.upload-area {
  padding: 40px;
  border: 3px dashed #e0e0e0;
  border-radius: 12px;
  margin: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
  position: relative;
}

.upload-area:hover {
  border-color: #2196f3;
  background: #f5fbff;
}

.upload-area.dragover {
  border-color: #2196f3;
  background-color: rgba(33, 150, 243, 0.1);
}

.upload-placeholder {
  text-align: center;
}

.upload-placeholder i {
  font-size: 16px;
  color: #2196f3;
  /* margin-bottom: 20px; */
}

.upload-placeholder .title {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
}

.upload-placeholder .description {
  font-size: 1rem;
  color: #666;
  margin-bottom: 8px;
}

.upload-placeholder .limit {
  font-size: 0.9rem;
  color: #888;
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.preview-container {
  padding: 0 30px 20px;
}

.preview-title {
  font-size: 1.2rem;
  color: #444;
  margin-bottom: 20px;
  font-weight: 500;
}

.preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1/1;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.preview-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 10px;
  color: white;
  transition: opacity 0.3s;
  opacity: 0;
}

.preview-item:hover .preview-overlay {
  opacity: 1;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff5252;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: white;
  transform: scale(1.1);
}

.file-info {
  margin-top: 30px;
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  opacity: 0.8;
  font-size: 0.75rem;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 30px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.btn {
  padding: 12px 30px;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.reset-btn {
  background: #f5f5f5;
  color: #666;
}

.reset-btn:hover {
  background: #e0e0e0;
  color: #444;
}

.upload-btn {
  background: linear-gradient(45deg, #2196f3, #21cbf3);
  color: white;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}

.upload-btn:hover {
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
  transform: translateY(-2px);
}
</style>