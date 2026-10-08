import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vite'
import VueRouter from 'vue-router/vite'
import packageJson from './package.json' with { type: 'json' }

const commitSha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
export default defineConfig({
  plugins: [
    VueRouter({ dts: 'src/types/typed-router.d.ts' }),
    vue(),
    Icons(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  define: {
    'import.meta.env.VITE_GIT_COMMIT_SHA': JSON.stringify(commitSha),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  clearScreen: false,
})
