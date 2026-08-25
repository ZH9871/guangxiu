<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-head">
        <span class="auth-logo">🧮</span>
        <h2>注册</h2>
        <p>创建账号，素材将保存到个人账号里</p>
      </div>

      <form class="auth-form" @submit.prevent="handleRegister">
        <label class="field">
          <span class="field-label">用户名</span>
          <input v-model="username" type="text" placeholder="2-20个字符" autocomplete="username" />
        </label>
        <label class="field">
          <span class="field-label">密码</span>
          <input v-model="password" type="password" placeholder="不少于6位" autocomplete="new-password" />
        </label>
        <label class="field">
          <span class="field-label">确认密码</span>
          <input v-model="confirm" type="password" placeholder="请再次输入密码" autocomplete="new-password" />
        </label>
        <button class="auth-btn" type="submit" :disabled="loading">
          {{ loading ? '注册中…' : '注 册' }}
        </button>
      </form>

      <p v-if="error" class="auth-error">{{ error }}</p>

      <p class="auth-switch">
        已有账号？<router-link to="/login">去登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, api, notyf } from '@/store'

const userStore = useUserStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  const name = username.value.trim()
  if (name.length < 2 || name.length > 20) {
    error.value = '用户名长度需为2-20个字符'
    return
  }
  if (password.value.length < 6) {
    error.value = '密码长度不能少于6位'
    return
  }
  if (password.value !== confirm.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await api.post('/register', {
      username: name,
      password: password.value,
    })
    const { token, user_id, username: uname } = res.data
    userStore.token = token
    userStore.username = uname
    userStore.user_id = user_id
    userStore.isLoggedIn = true
    notyf.success('注册成功，已自动登录')
    router.push('/PicManage')
  } catch (e) {
    error.value = e.response?.data?.error || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 15%, rgba(113, 186, 148, 0.18), transparent 45%),
    radial-gradient(circle at 85% 80%, rgba(28, 123, 81, 0.15), transparent 45%),
    #f2faf3;
  padding: 20px;
}
.auth-card {
  width: 360px;
  max-width: 100%;
  background: #ffffff;
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow: 0 10px 30px rgba(28, 123, 81, 0.12);
}
.auth-head {
  text-align: center;
  margin-bottom: 26px;
}
.auth-logo {
  font-size: 38px;
  display: block;
  margin-bottom: 6px;
}
.auth-head h2 {
  margin: 0 0 6px;
  font-size: 24px;
  color: #1c7b51;
}
.auth-head p {
  margin: 0;
  font-size: 13px;
  color: #8a94a6;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  color: #4a5568;
  font-weight: 500;
}
.field input {
  padding: 11px 14px;
  border: 1px solid #dbe8de;
  border-radius: 10px;
  font-size: 14px;
  background: #fbfefb;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.field input:focus {
  border-color: #71ba94;
  box-shadow: 0 0 0 3px rgba(113, 186, 148, 0.18);
}
.auth-btn {
  margin-top: 6px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #71ba94, #1c7b51);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}
.auth-btn:hover {
  opacity: 0.92;
}
.auth-btn:active {
  transform: translateY(1px);
}
.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.auth-error {
  margin: 14px 0 0;
  font-size: 13px;
  color: #d64545;
  text-align: center;
}
.auth-switch {
  margin: 20px 0 0;
  font-size: 13px;
  color: #7a8794;
  text-align: center;
}
.auth-switch a {
  color: #1c7b51;
  font-weight: 600;
  text-decoration: none;
}
.auth-switch a:hover {
  text-decoration: underline;
}
</style>
