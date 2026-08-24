<script setup lang="ts">
import { useImageStore,useUserStore,api } from '@/store'
const userStore =useUserStore()
const imageStore =useImageStore()
api.get("/first_user_id").then(res => {
  userStore.user_id=res.data
  imageStore.update_image_infos(userStore.user_id).then(imageStore.load_thumbnails)
})
async function save() {
  // 发起请求，明确设置 responseType 为 'arraybuffer'
  const response = await api.get("save_backup", );
  alert(response.data)
}
async function load() {
  // 发起请求，明确设置 responseType 为 'arraybuffer'
  const response = await api.get("load_backup", );
  alert(response.data)
}
async function detect() {
  // 发起请求，明确设置 responseType 为 'arraybuffer'
  const response = await api.get("detections/update", );
  alert(response.data)
}
</script>

<template>
<button class="btn" @click="save">保存备份</button>
<button class="btn" @click="load">加载备份</button>
<button class="btn" @click="detect">重新检测</button>
</template>

<style scoped>

</style>