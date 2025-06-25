# 🩺 糖尿病知识交互式答题网站

一个基于React + TypeScript开发的现代化答题系统，专为糖尿病基础知识培训设计。采用Linear App简约设计风格，支持多种知识领域的快速切换。

## ✨ 核心功能

### 🔐 用户身份验证
- 答题前必须填写姓名和手机号
- 手机号格式验证（11位数字）
- 重复答题控制（查看答案后禁止再次答题）

### 📝 智能答题系统
- ⏰ 30分钟倒计时，时间到自动提交
- 🔀 25道题目随机化显示
- 📊 实时答题进度显示
- 🔄 题目间自由切换和导航
- ✅ 提交前确认对话框

### 📈 详细结果分析
- 🎯 准确率和得分统计
- 📋 逐题详细解析和正确答案
- 🔍 用户答案与正确答案对比
- 💡 基于正确率的个性化反馈建议

### 👨‍💼 管理员功能
- 🔒 密码保护访问（密码：`adminpassword`）
- 📊 答题记录统计和数据分析
- 📤 Excel格式数据导出
- 🗑️ 数据管理和清空功能

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- pnpm（推荐）或 npm
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装部署

#### 1. 克隆项目
```bash
cd diabetes-quiz
```

#### 2. 安装依赖
```bash
cd diabetes-quiz
pnpm install
# 或使用 npm install
```

#### 3. 启动开发服务器
```bash
pnpm dev
# 或使用 npm run dev
```

访问 `http://localhost:5173` 即可使用答题系统。

#### 4. 生产环境部署
```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

构建完成后，`dist` 目录包含所有静态文件，可直接部署到任何Web服务器。

## 📚 更新题目内容

### 方法一：使用Python自动化工具（推荐）

#### 1. 准备新的知识库文档
支持的格式：
- ✅ **Word文档 (.docx)** - 推荐格式
- ✅ **PDF文档 (.pdf)** 
- ✅ **纯文本 (.txt)**

#### 2. 文档格式要求
```
什么是糖尿病？
答：糖尿病是一种慢性疾病...

如何预防糖尿病？
答：预防糖尿病的方法包括：
1. 保持健康饮食
2. 定期运动
3. 控制体重
```

#### 3. 生成新题目
```bash
# 基本用法
python code/universal_quiz_generator.py 您的文档路径.docx

# 完整参数示例
python code/universal_quiz_generator.py \
  新知识库.docx \
  --title "企业安全培训测试" \
  --description "基于企业安全手册的培训测试" \
  --num-questions 30 \
  --time-limit 45
```

#### 4. 更新网站
```bash
# 自动更新题目数据
python code/update_website_questions.py data/quiz_questions.json
```

### 方法二：手动更新题目

直接编辑 `diabetes-quiz/public/quiz_questions.json` 文件：

```json
{
  "title": "您的测试标题",
  "description": "测试描述",
  "time_limit": 30,
  "total_questions": 25,
  "questions": [
    {
      "id": 1,
      "question": "问题内容？",
      "options": [
        "选项A",
        "选项B", 
        "选项C",
        "选项D"
      ],
      "correct_answer": 1,
      "explanation": "答案解析内容"
    }
  ]
}
```

## 🎨 自定义配置

### 修改答题时间
编辑题目数据中的 `time_limit` 字段（单位：分钟）

### 修改题目数量
调整 `total_questions` 字段和 `questions` 数组长度

### 更换主题色彩
编辑 `diabetes-quiz/tailwind.config.js` 中的颜色配置

### 修改管理员密码
在 `diabetes-quiz/src/App.tsx` 中搜索 `adminpassword` 进行修改

## 📁 项目结构

```
diabetes-quiz/
├── code/                          # Python工具脚本
│   ├── universal_quiz_generator.py # 通用题目生成器
│   └── update_website_questions.py # 网站更新工具
├── data/                          # 数据文件
│   └── quiz_questions.json       # 生成的题目数据
├── diabetes-quiz/                 # React前端项目
│   ├── src/
│   │   ├── components/           # React组件
│   │   │   ├── UserForm.tsx     # 用户信息表单
│   │   │   ├── Quiz.tsx         # 答题界面
│   │   │   ├── Results.tsx      # 结果展示
│   │   │   ├── AdminPanel.tsx   # 管理员面板
│   │   │   └── Timer.tsx        # 倒计时组件
│   │   ├── App.tsx              # 主应用组件
│   │   └── main.tsx             # 应用入口
│   ├── public/
│   │   └── quiz_questions.json  # 题目数据文件
│   └── dist/                     # 构建输出目录
└── docs/                         # 文档目录
```

## 🔧 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Radix UI + TailwindCSS
- **状态管理**: React Hooks
- **数据存储**: localStorage
- **数据导出**: XLSX.js
- **后端工具**: Python 3.7+

## 📊 数据管理

### 答题记录存储
- 所有答题记录保存在浏览器的 localStorage 中
- 数据格式：JSON，包含用户信息、答题结果、时间戳等
- 支持Excel格式导出，便于数据分析

### 数据安全
- 本地存储，无隐私泄露风险
- 管理员密码保护
- 支持数据备份和恢复

## 🌟 支持的知识领域

- ✅ **医疗健康**: 疾病知识、药物使用、健康管理
- ✅ **企业培训**: 安全规范、操作流程、政策制度  
- ✅ **技术知识**: 软件使用、技术规范、最佳实践
- ✅ **法律法规**: 法律条文、合规要求、案例分析
- ✅ **教育考试**: 学科知识、考试大纲、题库内容
- ✅ **行业标准**: 行业规范、质量标准、认证要求

## 🆘 常见问题

### Q: 如何重置所有答题记录？
A: 访问管理员面板，使用"清空数据"功能，或手动清除浏览器localStorage。

### Q: 题目显示不正确怎么办？
A: 检查 `quiz_questions.json` 文件格式是否正确，确保所有必需字段都存在。

### Q: 如何修改答题时间限制？
A: 编辑题目数据文件中的 `time_limit` 字段（单位：分钟）。

### Q: 支持哪些浏览器？
A: 支持所有现代浏览器，推荐使用Chrome、Firefox、Safari或Edge最新版本。

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目！

---

**💡 提示**: 如需技术支持或定制开发，请联系项目维护者。