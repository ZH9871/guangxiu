<script setup>
import { ref, computed, watch } from 'vue'
import { useImageStore, useUserStore, api } from '@/store'
import SvgIcon from "@/components/Toolbox/SvgIcon.vue";
import { download_image } from "@/tools.js";
import ImageUploader from '@/components/Toolbox/ImageUploader.vue';
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
  uploads: { name: '上传图', key: 'uploads' },
  generated_statics: { name: '文生图', key: 'generated_statics' },
  generated_dynamics: { name: '图生视频', key: 'generated_dynamics' },
  segmentations: { name: '分割图', key: 'segmentations' }
}

// 获取当前分类的完整图片数组
const currentImages = computed(() => {
  switch (activeCategory.value) {
    case 'uploads': return imageStore.uploads
    case 'generated_statics': return imageStore.generated_statics
    case 'generated_dynamics': return imageStore.generated_dynamics
    case 'segmentations': return imageStore.segmentations
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

// 分页事件
function handlePageChange(page) {
  currentPage.value = page
}
</script>

<template>
  <div class="two-col-layout">
    <!-- 左侧面板（不变） -->
    <div class="left-panel">
      <div class="upload-area">
        <ImageUploader style="width:100%;" />
      </div>
      <div class="category-buttons">
        <button 
          v-for="(info, key) in categoryMap" 
          :key="key"
          :class="['cat-btn', { active: activeCategory === key }]"
          @click="activeCategory = key"
        >
          {{ info.name }}
        </button>
      </div>
    </div>

    <!-- 中间区域（网格 + 分页） -->
    <div class="middle-area">
      <div class="grid-container">
        <div v-for="(img, idx) in gridCells" :key="idx" class="grid-cell" :class="{ empty: !img }">
          <template v-if="img">
            <!-- 右上角收藏星 -->
            <button class="star-icon" @click.stop="toggleStar(img)">
              <SvgIcon :name="img.is_star ? 'star_full' : 'star'" style="height: 20px; width: 20px; fill: gold" />
            </button>
            <!-- 删除按钮 -->
            <button class="delete-icon" @click.stop="delete_img(img, activeCategory)">
              <SvgIcon name="trash-can" style="height: 18px; width: 18px; fill: red" />
            </button>
            <!-- 下载按钮 -->
            <button class="download-icon" @click.stop="download_img(img)">
              <SvgIcon name="download" style="height: 18px; width: 18px; fill: steelblue" />
            </button>
            <!-- 图片 -->
            <img :src="img.thumbnail" @click="previewImage(img)" class="grid-img" />
            <!-- 底部名称编辑 -->
            <div class="img-name">
              <ImageNameEditor :info="img" />
            </div>
          </template>
          <div v-else class="empty-placeholder"></div>
        </div>
      </div>

      <!-- 分页组件 -->
      <div class="pagination-wrapper">
  <el-pagination
    background
    layout="prev, pager, next"
    :total="totalCount"
    :page-size="pageSize"
    :current-page="currentPage"
    @current-change="handlePageChange"
  />
</div>
<div v-if="totalCount === 0" class="empty-tip">暂无图片</div>
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
  background: #e8f5e9;
}

/* 左侧面板样式不变 */
.left-panel {
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.upload-area {
  min-height: 200px;
}
.category-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cat-btn {
  padding: 10px;
  background: #e8f5e9;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.cat-btn.active {
  background: #71BA94;
  color: white;
}
.cat-btn:hover {
  transform: translateX(4px);
}

/* 中间区域 */
.middle-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #e8f5e9;
  border-radius: 16px;
  padding: 16px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.grid-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.grid-cell {
  aspect-ratio: 1 / 1;
  background: #fff9e8;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.grid-cell.empty {
  background: #fef7e0;
}
.star-icon,
.delete-icon,
.download-icon {
  position: absolute;
  background: rgba(0,0,0,0.5);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}
.star-icon {
  top: 6px;
  right: 6px;
}
.delete-icon {
  bottom: 6px;
  right: 6px;
}
.download-icon {
  bottom: 6px;
  left: 6px;
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
  font-size: 12px;
  padding: 4px;
  text-align: center;
}
.empty-placeholder {
  width: 100%;
  height: 100%;
  background: #fef7e0;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
.empty-tip {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

/* 响应式调整：当宽度不足时，保持网格比例 */
@media (max-width: 768px) {
  .two-col-layout {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .category-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>