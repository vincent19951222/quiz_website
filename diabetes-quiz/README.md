# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## 功能特点

- 📝 **专业题库**：精选糖尿病相关知识题目
- 🎯 **智能评分**：实时计算答题正确率和得分
- 📊 **数据统计**：详细的答题记录和统计分析
- 👥 **用户管理**：支持用户信息收集和管理
- 📱 **响应式设计**：完美适配手机、平板、电脑
- 🔒 **管理员功能**：数据导出、记录管理等高级功能
- 🚀 **飞书集成**：自动同步答题记录到飞书多维表格

## 管理员功能

访问管理员面板需要密码：`admin123`

### 主要功能
- 📈 查看答题统计数据
- 👥 管理用户答题记录
- 📊 导出Excel格式数据
- 🔍 搜索和筛选记录
- 🗑️ 清理历史数据
- 🚀 **飞书同步**：将答题记录同步到飞书多维表格

### 飞书集成

本项目支持将答题记录自动同步到飞书多维表格，方便团队协作和数据管理。

**配置步骤：**
1. 在项目根目录创建 `.env` 文件
2. 配置飞书API密钥（参考 `.env.example`）
3. 在管理员面板测试连接并同步数据

**详细配置指南：** 请查看 [FEISHU_INTEGRATION.md](./FEISHU_INTEGRATION.md)

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
