<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useImageStore,useUserStore,api,notyf,resolve_current_user} from '@/store'
const userStore =useUserStore()
const imageStore =useImageStore()

// 访客登录提示气泡
const showGuestTip = ref(false)
let tipTimer = null
function guestActionTip() {
  if (userStore.isLoggedIn) return
  showGuestTip.value = true
  if (tipTimer) clearTimeout(tipTimer)
  tipTimer = setTimeout(() => { showGuestTip.value = false }, 2600)
}
// 集中拦截：访客状态点击到带 data-guest-action 的操作（上传/选图/生成/保存等）时，仅提示不阻断
function onGuestAction(e) {
  if (!e || !e.target) return
  const node = e.target.closest ? e.target.closest('[data-guest-action]') : null
  if (node) guestActionTip()
}
onMounted(() => document.addEventListener('click', onGuestAction, true))
onUnmounted(() => {
  document.removeEventListener('click', onGuestAction, true)
  if (tipTimer) clearTimeout(tipTimer)
})

resolve_current_user().then(uid => {
  imageStore.update_image_infos(uid).then(imageStore.load_thumbnails)
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
  const uid = await resolve_current_user()
  imageStore.update_image_infos(uid).then(imageStore.load_thumbnails)
}

//notyf.success('操作成功！');

</script>
<template>
  <header>
    <div class="navbar">
      <div class="navbar-link-container">
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
          <span class="login-seat">
            <router-link class="auth-link" to="/login">登录</router-link>
            <transition name="tip">
              <div v-if="showGuestTip" class="guest-tip">如需将操作数据保存到个人账号，请先登录</div>
            </transition>
          </span>
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
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.login-seat {
  position: relative;
}
.guest-tip {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;              /* 以登录钮右缘对齐，向左展开，避免超屏右裁 */
  white-space: nowrap;
  pointer-events: none; /* 不影响任何操作 */
  z-index: 999;
  background: #ffffff;
  color: #c0392b;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 0;      /* 直角长方形 */
  border: 1px solid #f5b7b1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}
.guest-tip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  right: 18px;
  border: 6px solid transparent;
  border-bottom-color: #ffffff;
}
/* 提示淡入淡出 */
.tip-enter-active,
.tip-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}
.tip-enter-from,
.tip-leave-to {
  opacity: 0;
  transform: translateX(-12px);
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
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 2rem;
  background: #d9534f;
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
