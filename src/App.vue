<script setup>
import { useImageStore,useUserStore,api,notyf} from '@/store'
const userStore =useUserStore()
const imageStore =useImageStore()
api.get("/first_user_id").then(res => {
  userStore.user_id=res.data
  imageStore.update_image_infos(userStore.user_id).then(imageStore.load_thumbnails)
})

async function logout() {
  try {
    await api.post('/logout')
  } catch (e) {}
  userStore.token = ''
  userStore.username = ''
  userStore.user_id = ''
  userStore.isLoggedIn = false
  notyf.success('已退出登录')
  // 重新拿游客数据
  const res = await api.get('/first_user_id')
  userStore.user_id = res.data
  imageStore.update_image_infos(userStore.user_id).then(imageStore.load_thumbnails)
}

//notyf.success('操作成功！');

</script>
<template>
  <header>
    <div class="navbar">
      <div class="navbar-link-container">
        <router-link class="router-link" to="/">首页</router-link>
        <router-link class="router-link" to="/Guangxiu">走进广绣</router-link>
        <router-link class="router-link" to="/Teaching">辅助教学</router-link>
        <router-link class="router-link" to="/T2I">古诗词场景生成</router-link>
        <router-link class="router-link" to="/I2V">广绣活化</router-link>
        <router-link class="router-link" to="/PicManage">图库管理</router-link>
      </div>
      <div class="auth-area">
        <template v-if="userStore.isLoggedIn">
          <span class="user-chip">{{ userStore.username }}</span>
          <button class="auth-link" @click="logout">退出</button>
        </template>
        <template v-else>
          <router-link class="auth-link" to="/login">登录</router-link>
          <span class="auth-sep">/</span>
          <router-link class="auth-link" to="/register">注册</router-link>
          <span class="guest-tag">访客</span>
        </template>
      </div>
    </div>
  </header>
  <main class="guangxiu-minimalist-blue justify-center overflow-auto">

    <router-view style="flex:1;overflow-y: clip;"></router-view>
  </main>
</template>

<style scoped lang="scss">
.navbar {
  position: fixed; /* 固定在顶部 */
  top: 0;
  left: 0;
  display: flex;
  justify-content: space-between; /* 左右完全分开 */
  align-content: center;
  width: 100%; /* 全宽度 */
  height: 8dvh;
  background-color: #71BA94;
  padding: 0 2rem;
  box-sizing: border-box; /* 保证内边距不增加总宽度 */
  z-index: 1000;

  /* 祥云背景图：水平重复、垂直不重复，居中垂直对齐 */
  background-image: url("/public_imgs/顶部栏-祥云logo.png"); 
  background-repeat: repeat-x; /* 仅水平重复 */
  background-position: center; /* 垂直方向居中 */
  background-size: auto 60px; /* 背景图高度 60px，宽度自适应（保持比例） */
  padding: 15px 20px; /* 内边距，避免内容贴边 */
}
.navbar-link-container{
  display: flex;
  align-items: center;
  overflow: clip;
  gap: clamp(0.8dvh, 1.6dvh, 5dvh);
}
.router-link {
  color: #ffffff;
  background-color: transparent;
  font-size: clamp(1.2dvh, 1.9dvh, 2.4dvh);
  padding: 0.5rem 1.2rem;
  border-radius: 2rem;
  text-decoration: none;
  font-weight: 500;
  letter-spacing: 0.03em;
  white-space: nowrap;
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
    color: #ffffff;
  }
}
.router-link-active {
  align-content: center;
  justify-content: center;
  background: #ffffff;
  color: #1C7B51;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);

  &:hover {
    background: #ffffff;
    color: #1C7B51;
  }
}
.auth-area {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.auth-link {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 2rem;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.18);
  transition: background-color 0.25s ease, color 0.25s ease;
  &:hover {
    background: #ffffff;
    color: #1C7B51;
  }
}
.auth-sep {
  color: rgba(255, 255, 255, 0.85);
}
.guest-tag {
  color: #eafff2;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 2rem;
  background: rgba(255, 255, 255, 0.15);
  margin-left: 4px;
}
.user-chip {
  color: #1C7B51;
  background: #ffffff;
  font-size: 14px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 2rem;
}
.guangxiu-minimalist-blue {
  background: linear-gradient(
    #fcfdef
  );
  position: fixed;
  top:8dvh;
  left: 0;
  height: 90dvh;
  width: 100vw
}
</style>
