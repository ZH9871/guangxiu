<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useImageStore, useUserStore, api, notyf } from '@/store'
import { download_image, generateImageWithText } from '@/tools'
import GenMask2 from '@/components/Toolbox/GenMask.vue'
import ImageNameEditor from "@/components/Toolbox/ImageNameEditor.vue";

const userStore = useUserStore()
const imageStore = useImageStore()

// 图库折叠状态
const galleryOpen = ref(true)

// 初始化
api.get("/first_user_id").then(res => {
  userStore.user_id = res.data
  imageStore.update_image_infos(userStore.user_id).then(imageStore.load_thumbnails)
})

// 参考图相关
const ref_src = ref(generateImageWithText(600, 600, '请从左侧图库\n单击选择参考图'))
const ref_id = ref("")

function selected_change(item) {
  ref_id.value = item.id
  ref_src.value = item.thumbnail
}

// AI 提示词
function get_hint() {
  if (ref_id.value == "") {
    notyf.error('请先选择参考图');
    return
  }
  userStore.i2v_hint = '生成中。。。'
  api.get("qwen_vl/" + ref_id.value + "/" + userStore.i2v_style).then(res => {
    if (res.data && res.data.length > 0) {
      userStore.i2v_hint = res.data.map(item => item.prompt).join('，')
    } else {
      userStore.i2v_hint = ''
      notyf.error('生成提示词失败，请重试')
    }
  }).catch(() => {
    userStore.i2v_hint = ''
    notyf.error('生成提示词失败，请重试')
  })
}

// 视频生成
let progressInterval;
const gen_process = ref(0)
async function make() {
  if (ref_id.value == "") {
    notyf.error('请先选择参考图');
    return
  }
  userStore.i2v_gen_mask = true
  gen_process.value = 0
  notyf.success('开始生成，大约耗时三分钟');
  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (gen_process.value >= 90) {
      clearInterval(progressInterval);
    } else {
      gen_process.value += 1.0 / 25 / 2;
    }
  }, 40);

  api.get(`i2v/${userStore.user_id}/${ref_id.value}/${userStore.i2v_hint}`).then(async (res) => {
    let item = res.data
    item.selected = ref(false);
    item.src = api.defaults.baseURL + "/video/src/" + item.id
    let src_thumbnail = await imageStore.get_thumbnail(item.id);
    selected_g.value = item.src
    item.thumbnail = src_thumbnail
    imageStore.temp_generated_dynamics.unshift(item)
    userStore.i2v_gen_mask = false
    selected_g_changed(item)
    gen_process.value = 100
  });
}

// 右侧生成视频列表相关
var selected_g = ref(null)
const video_src = ref("")
let videoRef = null
onMounted(() => {
  videoRef = document.getElementById("videoRef")
})

async function selected_g_changed(item) {
  userStore.i2v_gen_mask = false
  selected_g.value = item
  try {
    selected_g.value.selected = false
  } catch (e) { }
  item.src = api.defaults.baseURL + "/video/src/" + item.id
  video_src.value = api.defaults.baseURL + "/video/src/" + item.id
  selected_g.value = item
  item.selected = ref(true)
  rating.value = selected_g.value.rating
  await nextTick()
  if (videoRef) {
    videoRef.load()
    videoRef.play().catch(e => console.log("播放失败:", e))
  }
}

function to_user_g() {
  api.post(`/image/${userStore.user_id}/generated_dynamics/${selected_g.value.id}`)
  notyf.success('已成功保存！');
}
function download_g() {
  download_image(video_src.value, "download")
}
function delete_g() {
  const index = imageStore.temp_generated_dynamics.indexOf(selected_g.value);
  if (index > -1) {
    imageStore.temp_generated_dynamics.splice(index, 1);
  }
  api.delete(`/image/${userStore.user_id}/temp_generated_dynamics/${selected_g.value.id}`)
}
function clear_g() {
  imageStore.temp_generated_dynamics.length = 0
  api.delete(`/image_clear/${userStore.user_id}/temp_generated_dynamics`)
}

// 评分
const rating = ref(0)
function make_rating(i) {
  rating.value = i
  if (selected_g.value) {
    selected_g.value.rating = i
    api.put("image/" + selected_g.value.id, selected_g.value)
  }
}

// 图库图片列表
const galleryImages = computed(() => {
  return [...imageStore.uploads, ...imageStore.generated_statics]
})

import { nextTick } from 'vue'
</script>

<template>
  <div class="three-column-layout">
    <!-- 左侧面板 -->
    <div class="left-panel">
      <!-- 图库区域（可折叠） -->
      <div class="gallery-area">
        <div class="gallery-header" @click="galleryOpen = !galleryOpen">
          <span class="section-title">📁 图库（点击选择参考图）</span>
          <span class="toggle-icon">{{ galleryOpen ? '▾' : '▸' }}</span>
        </div>
        <div v-show="galleryOpen" class="gallery-grid">
          <div v-for="img in galleryImages" :key="img.id" class="gallery-item" @click="selected_change(img)">
            <img :src="img.thumbnail" class="gallery-thumb" />
            <div class="gallery-name">{{ img.name }}</div>
          </div>
        </div>
      </div>

      <!-- 参考图（标题左对齐，图片居中） -->
      <div class="ref-image">
        <div class="section-title">参考图</div>
        <div class="ref-img-wrapper">
          <img :src="ref_src" class="ref-img" />
        </div>
      </div>

      <!-- AI 提示词生成 -->
      <div class="ai-section">
        <div class="section-title">AI 提示词生成</div>
        <div class="ai-header">
          <button class="style-btn" popovertarget="style-popover">风格：{{ userStore.i2v_style }}</button>
          <ul class="dropdown" popover id="style-popover">
            <li @click="userStore.i2v_style='默认'">默认</li>
            <li @click="userStore.i2v_style='优雅'">优雅</li>
            <li @click="userStore.i2v_style='有趣'">有趣</li>
          </ul>
          <button class="refresh-btn" @click="get_hint">生成提示词</button>
          <button class="refresh-btn" @click="get_hint">换一批</button>
        </div>
      </div>

      <!-- 提示词文本框 -->
      <div class="prompt-section">
        <div class="section-title">提示词</div>
        <textarea class="prompt-input" v-model="userStore.i2v_hint" rows="4" placeholder="请选择参考图后点击'生成提示词'，或手动输入"></textarea>
      </div>

      <button class="generate-btn" @click="make">开始生成</button>
    </div>

    <!-- 中间面板：视频 -->
    <div class="center-panel">
      <div class="video-container" style="position: relative;top: 0.1125rem;">
        <video ref="videoRef" :src="video_src" class="video-player" controls></video>
        <GenMask2 v-show="userStore.i2v_gen_mask" class="gen-mask" />
      </div>
      <progress class="progress-bar" :value="gen_process" max="100"></progress>
    </div>

    <!-- 右侧面板 -->
    <div class="right-panel">
      <div class="video-management">
        <div class="section-title">暂存生成视频</div>
        <div class="video-list">
          <div v-for="item in imageStore.temp_generated_dynamics" :key="item.id"
               :class="['video-item', { active: selected_g === item }]"
               @click="selected_g_changed(item)">
            <img :src="item.thumbnail" class="video-thumb" />
            <ImageNameEditor :info="item" class="video-name" />
          </div>
        </div>

        <div class="panel-footer">
          <div class="action-buttons">
            <button class="action-btn save" @click="to_user_g">保存</button>
            <button class="action-btn download" @click="download_g">下载</button>
            <button class="action-btn delete" @click="delete_g">删除</button>
            <button class="action-btn clear" @click="clear_g">全部清空</button>
          </div>

          <!-- 评分置底 -->
          <div class="rating-area">
            <div class="rating-title">✨ 请为这份生成视频打个分吧~</div>
            <div class="rating-stars">
              <span v-for="i in 5" :key="i" class="star" :class="{ active: rating >= i }" @click="make_rating(i)">★</span>
            </div>
            <div class="rating-labels">
              <span :class="{ active: rating === 1 }">很差</span>
              <span :class="{ active: rating === 2 }">较差</span>
              <span :class="{ active: rating === 3 }">一般</span>
              <span :class="{ active: rating === 4 }">较好</span>
              <span :class="{ active: rating === 5 }">很好</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 整体布局 */
.three-column-layout {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: 90dvh;
  box-sizing: border-box;
  background: #f5f7fa;
  overflow: hidden;
}

.left-panel {
  width: 380px;
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.center-panel {
  flex: 1;
  background: white;
  border-radius: 20px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  padding-top: 16px;
}

.right-panel {
  width: 320px;
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 图库区域 */
.gallery-area {
  flex-shrink: 0;
  border-bottom: 2px solid #e8f5e9;
  padding-bottom: 12px;
}
.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}
.gallery-header .section-title {
  margin-bottom: 0;
}
.toggle-icon {
  font-size: 1.2rem;
  color: #71ba94;
  margin-right: 4px;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  margin-top: 8px;
  overflow-y: auto;
  max-height: 320px;
  padding-right: 4px;
}
.gallery-item {
  cursor: pointer;
  background: #f9f9f9;
  border-radius: 10px;
  padding: 4px;
  text-align: center;
  transition: 0.2s;
}
.gallery-item:hover {
  background: #e0f2e9;
  transform: scale(1.02);
}
.gallery-thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
}
.gallery-name {
  font-size: 0.7rem;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 参考图：标题左对齐，图片居中 */
.ref-image {
  /* 保持默认左对齐，不设置 align-items */
}
.ref-img-wrapper {
  display: flex;
  justify-content: center;   /* 图片居中 */
  width: 100%;
}
.ref-img {
  width: 150px;
  height: 150px;
  object-fit: contain;
  background: #f5f5f5;
  border-radius: 12px;
  margin-top: 4px;
}

/* 通用标题 */
.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 6px;
  border-left: 4px solid #71ba94;
  padding-left: 10px;
}
.prompt-input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 10px;
  font-size: 0.9rem;
  resize: vertical;
}
.ai-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.style-btn, .refresh-btn {
  background: #e8f5e9;
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  text-decoration: none;
}
.refresh-btn {
  background: #d4edda;
}
.refresh-btn:hover {
  background: #b7e4c7;
}
.hint-list {
  max-height: 180px;
  overflow-y: auto;
  border-top: 1px solid #eee;
}
.hint-item {
  padding: 6px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.hint-item:hover {
  background: #f1f8e9;
}
.hint-prompt {
  font-weight: 500;
}
.hint-suggestion {
  font-size: 0.8rem;
  color: #666;
  white-space: pre-line;
}
.generate-btn {
  background: #71ba94;
  color: white;
  border: none;
  border-radius: 40px;
  padding: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
}

/* 中间视频 */
.video-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 16 / 10;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}
.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.gen-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
}
.progress-bar {
  width: 100%;
  max-width: 800px;
  height: 12px;
  border-radius: 6px;
}

/* 右侧视频管理 */
.video-management {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.video-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.panel-footer {
  flex-shrink: 0;
  margin-top: auto;
  border-top: 1px solid #e8f5e9;
  padding-top: 12px;
}
.video-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  background: #f5f5f5;
}
.video-item.active {
  background: #e0f2e9;
  border: 1px solid #71ba94;
}
.video-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
}
.video-name {
  flex: 1;
  font-size: 0.8rem;
}
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.action-btn {
  padding: 8px;
  border: none;
  border-radius: 30px;
  font-weight: bold;
  cursor: pointer;
  background: #f0f0f0;
}
.action-btn.save { background: #71ba94; color: white; }
.action-btn.download { background: #4caf50; color: white; }
.action-btn.delete { background: #f44336; color: white; }
.action-btn.clear { background: #ff9800; color: white; }

/* 评分置底 */
.rating-area {
  text-align: center;
  padding-top: 12px;
}
.rating-title {
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 6px;
}
.rating-stars {
  font-size: 1.8rem;
  letter-spacing: 5px;
  cursor: pointer;
}
.star {
  color: #ccc;
  transition: 0.2s;
}
.star.active {
  color: #ffc107;
}
.rating-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-top: 4px;
  color: #aaa;
}
.rating-labels span {
  flex: 1;
  text-align: center;
}
.rating-labels span.active {
  color: #ffc107;
  font-weight: bold;
}
</style>