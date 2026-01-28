import antfu from '@antfu/eslint-config'

export default antfu({
  settings: {
    'import/core-modules': ['vue-router/auto-routes'],
  },
  ignores: [
    'src-tauri',
    'dist',
    'public',
    'node_modules',
    '.vscode',
  ],
  rules: {
    'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
  },
  globals: {
    definePage: 'readonly',
  },
})
