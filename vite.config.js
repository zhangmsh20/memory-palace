import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 如果部署到 GitHub Pages 子路径，把下面这行取消注释并改成你的仓库名
  // base: '/memory-palace/',
})
