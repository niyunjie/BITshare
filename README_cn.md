# BITshare

BITshare 是一个基于 Vue 3、Express 和 SQLite 的课程资源浏览系统。

当前仓库定位为“公开代码仓库”，只保留应用代码、结构说明和通用脚本，不包含真实数据、上传文件、数据库文件或任何本地凭据。

## 功能概览

- 按学院、专业、课程浏览目录
- 支持关键词搜索
- 课程详情页支持资料下载与大纲预览
- 支持部分资源类型上传
- 支持从本地 JSON 同步目录数据到 SQLite
- 登录后访问受保护页面

## 技术栈

### 前端

- Vue 3
- Vue Router
- Pinia
- Vite

### 后端

- Node.js
- Express
- SQLite
- Multer

## 目录结构

```text
.
├─ backend/
│  ├─ scripts/                 # 本地辅助脚本
│  ├─ src/
│  │  ├─ db/                   # SQLite 初始化与连接
│  │  ├─ middleware/           # 同步中间件
│  │  ├─ routes/               # 后端接口
│  │  ├─ services/             # 登录与目录同步逻辑
│  │  └─ utils/
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ stores/
│  │  ├─ utils/
│  │  └─ views/
│  └─ package.json
├─ bit-kcdg-fetch.browser.js   # 可选的本地浏览器侧抓取辅助脚本
└─ start.bat
```

## 本地开发

### 环境要求

- 建议 Node.js 20+
- npm

### 安装依赖

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 启动方式

后端：

```bash
cd backend
npm run dev
```

前端：

```bash
cd frontend
npm run dev
```

## 数据文件说明

后端默认从以下本地文件读取目录数据：

```text
backend/data/college_major.json
backend/data/courses.json
```

这两个文件是本地数据源，不应提交到公开仓库。

系统会在启动时以及访问目录相关接口前，将本地 JSON 同步到 SQLite 数据库中，用于查询和展示。

## 隐私与公开仓库边界

公开仓库中不应包含以下内容：

- 真实账号或密码
- 本地登录态、Cookie、会话数据
- 机构内部课程数据或原始表格
- 本地上传的文档资源
- 运行过程中生成的 SQLite 数据库文件

公开仓库应仅保留：

- 可复用代码
- 通用脚本
- 文档说明

## 关于抓取脚本

`bit-kcdg-fetch.browser.js` 可以保留在仓库中，作为一个可选的本地辅助脚本使用。

它不属于应用核心运行所必需的部分，使用时应确保数据来源和使用权限合法合规。

## 当前结构结论

目前代码结构已经整理为：

- 本地 JSON 是目录数据源
- SQLite 是查询层
- 前后端围绕同步后的目录接口工作
- 后续如果补充“专业-课程映射”，可以在现有结构上继续扩展
