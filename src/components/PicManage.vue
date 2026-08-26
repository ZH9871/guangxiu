<script setup>
import { ref, computed, watch } from 'vue'
import { useImageStore, useUserStore, api } from '@/store'
import SvgIcon from "@/components/Toolbox/SvgIcon.vue";
import { download_image } from "@/tools.js";
import ImageNameEditor from "@/components/Toolbox/ImageNameEditor.vue";

const userStore = useUserStore()
const imageStore = useImageStore()

// 当前激活的分类
const activeCategory = ref('uploads')

// 分页相关
const currentPage = ref(1)
const pageSize = 20  // 每页20个格子 (5x4)

// 分类映射
const categoryMap = {
  uploads: { name: '上传图', icon: '🖼️', key: 'uploads' },
  generated_statics: { name: '文生图', icon: '✨', key: 'generated_statics' },
  generated_dynamics: { name: '图生视频', icon: '🎬', key: 'generated_dynamics' },
  segmentations: { name: '分割图', icon: '✂️', key: 'segmentations' },
  system_library: { name: '系统图库', icon: '🏛️', key: 'system_library' }
}

// 当前分类标题信息
const activeInfo = computed(() => categoryMap[activeCategory.value] || categoryMap.uploads)

// 获取当前分类的完整图片数组
const currentImages = computed(() => {
  switch (activeCategory.value) {
    case 'uploads': return imageStore.uploads
    case 'generated_statics': return imageStore.generated_statics
    case 'generated_dynamics': return imageStore.generated_dynamics
    case 'segmentations': return imageStore.segmentations
    case 'system_library': return imageStore.systemImages
    default: return []
  }
})

// 总图片数
const totalCount = computed(() => currentImages.value.length)

// 当前页显示的图片（切片）
const paginatedImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return currentImages.value.slice(start, end)
})

// 生成20个格子（不满补null）
const gridCells = computed(() => {
  const cells = []
  for (let i = 0; i < pageSize; i++) {
    cells.push(paginatedImages.value[i] || null)
  }
  return cells
})

// 刷新数据（删除或上传后调用）
const refreshData = async () => {
  await imageStore.update_image_infos(userStore.user_id)
  await imageStore.load_thumbnails()
}

// 收藏切换
async function toggleStar(item) {
  item.is_star = !item.is_star
  await api.put("image/" + item.id, item)
  await refreshData() // 刷新星标状态
}

// 删除图片
async function delete_img(item, cate) {
  await api.delete("image/" + userStore.user_id + "/" + cate + "/" + item.id)
  await refreshData()
  // 如果当前页没有数据了，跳转到上一页
  const newTotal = currentImages.value.length
  const maxPage = Math.ceil(newTotal / pageSize)
  if (currentPage.value > maxPage && maxPage > 0) {
    currentPage.value = maxPage
  } else if (newTotal === 0) {
    currentPage.value = 1
  }
}

// 下载图片
async function download_img(item) {
  await imageStore.load_full(item)
  download_image(item.src, item.name)
}

// 预览图片：静态图弹窗，视频弹窗
async function previewImage(item) {
  if (activeCategory.value === 'generated_dynamics') {
    await on_show_video_modal(item)
  } else {
    await on_show_modal(item)
  }
}

// 静态图弹窗（复用原来的Fancybox）
async function on_show_modal(item) {
  await imageStore.load_full(item)
  Fancybox.show([{
    src: item.src
  }]);
}

// 视频弹窗
async function on_show_video_modal(item) {
  let d = await imageStore.get_video_full(item.id)
  try {
    Fancybox.show([{
      src: d,
      type: 'video',
    }]);
  } catch (e) {
    console.log(e)
  }
}

// 分类切换时重置页码
watch(activeCategory, () => {
  currentPage.value = 1
})

// 初始加载数据
api.get("/first_user_id").then(res => {
  userStore.user_id = res.data
  imageStore.update_image_infos(userStore.user_id).then(imageStore.load_thumbnails)
})
imageStore.load_system_images()

// 分页事件
function handlePageChange(page) {
  currentPage.value = page
}

// ===== 上传图片控件（与 TeachingHelper 一致）=====
const fileInput = ref(null)

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
  event.target.value = null
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
  }
}

async function processFile(file) {
  if (!file.type.match('image.*')) {
    alert('请选择图片文件（JPG、PNG、WEBP格式）')
    return
  }
  const formData = new FormData()
  formData.append('image', file)
  try {
    const res = await api.post(`/image/${userStore.user_id}/uploads`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    try {
      await api.get('/detections/update/' + res.data.id)
    } catch (e) {}
    // 跳回第一页并切到"上传图"分类，使新图立即显示
    currentPage.value = 1
    activeCategory.value = 'uploads'
    await refreshData()
  } catch (e) {
    console.error('上传失败:', e)
    alert('上传失败')
  }
}
</script>

<template>
  <div class="two-col-layout">
    <!-- 左侧导航面板 -->
    <div class="left-panel">
      <!-- 面板标题 -->
      <div class="panel-heading">
        <span class="panel-logo">🧮</span>
        <span class="panel-title">素材管理</span>
      </div>

      <!-- 上传图片控件（样式与 TeachingHelper 一致） -->
      <div class="container-upload">
        <div class="upload-area" @click="triggerUpload" @drop.prevent="handleDrop" @dragover.prevent>
          <div class="upload-icon">
            <span class="icon-unicode">📁</span>
          </div>
          <p>点击上传刺绣图片或拖放文件到此处</p>
          <p class="hint-text">支持 JPG、PNG、WEBP格式</p>
          <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none;" accept="image/*" />
        </div>
      </div>

      <!-- 分类导航 -->
      <nav class="side-nav">
        <button
          v-for="(info, key) in categoryMap"
          :key="key"
          :class="['nav-item', { active: activeCategory === key }]"
          @click="activeCategory = key"
        >
          <span class="nav-icon">{{ info.icon }}</span>
          <span class="nav-text">{{ info.name }}</span>
        </button>
      </nav>
    </div>

    <!-- 中间区域（网格 + 分页） -->
    <div class="middle-area">
      <!-- 可滚动内容区 -->
      <div class="content-scroll">
        <!-- 分类标题栏 -->
        <div class="content-header">
          <h2 class="content-title">
            <span class="title-icon">{{ activeInfo.icon }}</span>
            {{ activeInfo.name }}
          </h2>
          <span class="content-count">共 {{ totalCount }} 张</span>
        </div>

        <div class="grid-container">
          <div v-for="(img, idx) in gridCells" :key="idx" class="grid-cell" :class="{ empty: !img }">
            <template v-if="img">
              <!-- 系统图为前端静态图，无后端id，不提供收藏/删除/改名 -->
              <div v-if="!img.is_system" class="card-actions">
                <button class="act star" :class="{ starred: img.is_star }" title="收藏" @click.stop="toggleStar(img)">
                  <SvgIcon :name="img.is_star ? 'star_full' : 'star'" />
                </button>
                <button class="act download" title="下载" @click.stop="download_img(img)">
                  <SvgIcon name="download" />
                </button>
                <button class="act delete" title="删除" @click.stop="delete_img(img, activeCategory)">
                  <SvgIcon name="trash-can" />
                </button>
              </div>
              <div v-else class="card-actions">
                <button class="act download" title="下载" @click.stop="download_img(img)">
                  <SvgIcon name="download" />
                </button>
              </div>
              <!-- 图片 -->
              <img :src="img.thumbnail" @click="previewImage(img)" class="grid-img" />
              <!-- 底部名称编辑 -->
              <div class="img-name">
                <ImageNameEditor v-if="!img.is_system" :info="img" />
                <span v-else class="sys-img-name">{{ img.name }}</span>
              </div>
            </template>
            <div v-else class="empty-placeholder"></div>
          </div>
        </div>
        <div v-if="totalCount === 0" class="empty-tip">暂无图片</div>
      </div>

      <!-- 固定底部分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          small
          background
          layout="prev, pager, next"
          :total="totalCount"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.two-col-layout {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: 90dvh;
  box-sizing: border-box;
  overflow: hidden;
  background: #f0f7f1;
}

/* 左侧面板 */
.left-panel {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* 面板标题 */
.panel-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #2e7d32;
  padding: 4px 6px 10px;
  border-bottom: 1px solid #eef4ee;
}
.panel-logo {
  font-size: 20px;
}

/* 上传图片控件（与 TeachingHelper 一致，适当缩小适配左栏） */
.container-upload {
  --primary-light: #e8f5e9;
  --primary-main: #66bb6a;
  --primary-dark: #2e7d32;
  --text-secondary: #757575;

  width: 100%;
  padding: 14px;
  background: #F3FEEA;
  border-radius: 10px;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
  font-family: 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #212121;
  line-height: 1.6;
  box-sizing: border-box;
}
.container-upload .upload-area {
  border: 2px dashed var(--primary-main);
  border-radius: 8px;
  padding: 16px 14px;
  text-align: center;
  margin-bottom: 0;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--primary-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}
.container-upload .upload-area:hover {
  background: #dcf0dd;
}
.container-upload .upload-icon {
  font-size: 1.6rem;
  color: var(--primary-dark);
  margin-bottom: 2px;
}
.container-upload p {
  font-size: 12px;
}
.container-upload .hint-text {
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 10px;
  text-align: center;
}

/* 分类导航 */
.side-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  color: #4a5568;
  text-align: left;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}
.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}
.nav-text {
  flex: 1;
  font-weight: 500;
}
/* 激活态：左侧指示条 + 渐变浅绿背景 */
.nav-item.active {
  background: linear-gradient(90deg, #dff3e2, #eff9f0);
  color: #1b6e31;
  font-weight: 600;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  border-radius: 0 3px 3px 0;
  background: #2e7d32;
}
.nav-item:hover {
  background: #f0faf2;
}

/* 中间区域 */
.middle-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
/* 可滚动内容区（高度自适应屏幕，超出时仅此区滚动） */
.content-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 主区域标题栏 */
.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eef4ee;
}
.content-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2e7d32;
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon {
  font-size: 22px;
}
.content-count {
  font-size: 13px;
  color: #8a94a6;
  background: #eff6f0;
  padding: 4px 12px;
  border-radius: 20px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}
.grid-cell {
  aspect-ratio: 1 / 1;
  background: #fff9e8;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}
.grid-cell.empty {
  background: #fef7e0;
}
/* 卡片操作按钮（右上角竖排，简洁半透明） */
.card-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
}
.act {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  transition: all 0.2s ease;
}
.act :deep(.svg-container) {
  width: 14px;
  height: 14px;
  display: flex;
}
.act :deep(.svg-icon) {
  width: 100%;
  height: 100%;
}
/* 收藏：悬停淡金色，已收藏态强制金黄色填充 */
.act.star.starred :deep(.svg-icon) {
  fill: #ffd700 !important;
  stroke: #ffd700 !important;
}
.act.star.starred {
  background: #fff7d6;
}
.act.star:hover {
  background: #fff3cd;
  color: #d4a017;
  transform: scale(1.1);
}
/* 下载：悬停化蓝 */
.act.download:hover {
  background: #e4f0ff;
  color: #3a7bd5;
  transform: scale(1.1);
}
/* 删除：悬停化红 */
.act.delete:hover {
  background: #ffe3e3;
  color: #d64545;
  transform: scale(1.1);
}
.grid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}
.grid-img:hover {
  transform: scale(1.05);
}
.img-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 11px;
  padding: 2px 4px;
  text-align: center;
}
.empty-placeholder {
  width: 100%;
  height: 100%;
  background: #fef7e0;
}

/* 分页样式（固定底部，始终可见） */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.empty-tip {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

/* 响应式：屏幕越窄，每行列数越少，自适应分辨率 */
@media (max-width: 1600px) {
  .grid-container { grid-template-columns: repeat(7, 1fr); }
}
@media (max-width: 1300px) {
  .grid-container { grid-template-columns: repeat(6, 1fr); }
}
@media (max-width: 1000px) {
  .grid-container { grid-template-columns: repeat(5, 1fr); }
}
@media (max-width: 768px) {
  .grid-container { grid-template-columns: repeat(4, 1fr); }
  .two-col-layout {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .side-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>