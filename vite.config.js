import { fileURLToPath, URL } from 'node:url'

import vueDevTools from 'vite-plugin-vue-devtools'
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    // vueDevTools(),
  ],
  server:{
    hmr: false,
    host: "0.0.0.0",
    port: 5173,   // 固定端口
    allowedHosts: [
		"http://localhost:5000",
		"127.0.0.1:5000",
        "charint.sv6.tunnelfrp.com",
		"3595425ecte0.vicp.fun"  // 你的内网穿透域名
    ],
    strictPort: true // 如果 5173 被占用就报错，而不是自动换端口
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})