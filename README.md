# Chronicle

一个以 RPG/编年史风格呈现的个人主页项目，使用纯前端技术（HTML + CSS + JavaScript）与 JSON 数据驱动内容。

## 在线地址

- 主域名：<https://miracleyang.com>
- 兼容访问：<https://www.miracleyang.com>

## 项目特点

- 双语切换：中英文内容展示
- 主题切换：亮色/暗色主题
- 数据驱动：通过 `database/*.json` 管理页面内容
- 模块化内容区域：Profile / Vocation / Being
- 纯静态站点：无需后端服务
- SVG 站点图标：适配 PC 和移动端，可通过网址链接引入

## 时间格式规范

- 全站时间统一显示为**年-月**（YYYY-MM）格式
- 例外：站点更新时间（footer）保持完整日期；随笔（Essays）文章时间保持原样

## 目录结构

```text
.
├─ index.html                # 页面入口
├─ favicon.svg               # 站点图标（SVG）
├─ 404.html                  # 404 页面
├─ CNAME                     # GitHub Pages 自定义域名
├─ style/
│  ├─ chronicle.css          # 样式文件
│  └─ chronicle.js           # 渲染逻辑与交互
├─ database/
│  ├─ profile.json           # 站点与个人信息、文档链接
│  ├─ vocation.json          # 属性、进度、典籍、任务目标
│  ├─ being.json             # 随笔、记录、成就
│  ├─ notify-template.txt    # 邮件通知模板
│  └─ documents/             # 附件（如简历 PDF）
└─ .github/
   └─ workflows/
      └─ notify-subscribers.yml  # 订阅者邮件通知工作流
```

## 模块说明

| 模块 | 说明 |
|------|------|
| Profile > Character | 个人角色信息卡片 |
| Profile > Documents | 简历等文档链接 |
| Vocation > Stats | 属性星级评分 |
| Vocation > Progress | 技能进度条（含时间标记） |
| Vocation > Codex | GitHub 代码仓库展示（含语言与时间标记） |
| Vocation > Quest Log | 任务目标与进度 |
| Being > Essays | 随笔文章 |
| Being > Records | 收藏/打卡记录（含时间与进度条） |
| Being > Achievements | 成就展示 |

## 本地预览

本项目是静态网站，直接打开 `index.html` 即可查看。

如果你希望避免部分浏览器对本地 `fetch` 的限制，建议启动一个本地静态服务器：

```bash
# 方式 1：Node.js
npx serve .

# 方式 2：Python
python -m http.server 8000
py -m http.server 8000
```

然后在浏览器访问对应地址（如 <http://localhost:8000>）。

## 内容维护

1. 修改 `database/profile.json`：站点标题、副标题、个人信息、外链、简历链接等。
2. 修改 `database/vocation.json`：属性评分、能力进度（含时间）、典籍仓库（含时间）、任务目标。
3. 修改 `database/being.json`：随笔、记录（含时间）与成就。
4. 若更新简历等附件，请将文件放到 `database/documents/` 并同步更新 JSON 中的路径。
5. 站点图标为 `favicon.svg`，可直接替换。

## 订阅功能配置

订阅系统通过 Cloudflare Worker 代理 GitHub API，避免在前端暴露 Token。

### 架构

```
用户输入邮箱 → 前端调用 Cloudflare Worker → Worker 持有 PAT 调用 GitHub API → 创建 Issue 记录订阅
手动触发 Actions → 读取订阅 Issues → SMTP 群发邮件通知
```

### 配置步骤

1. **生成 GitHub PAT**：GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens，仅授予本仓库 Issues 读写权限。
2. **部署 Cloudflare Worker**：在 Cloudflare Dashboard 创建 Worker（如 `chronicle-sub`），部署代理脚本，并在 Worker 的环境变量中添加 `GITHUB_PAT`（值为上一步生成的 PAT）。
3. **配置前端**：在 [style/chronicle.js](style/chronicle.js) 中将 `SUB_CONFIG.workerUrl` 设为你的 Worker URL。
4. **确保仓库标签**：仓库需存在 `subscribe` 标签（用于标记订阅 Issue）。
5. **配置邮件通知**：在仓库 Settings → Secrets and variables → Actions 中新增：
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
6. **发送通知**：在 GitHub Actions 中手动触发 [notify-subscribers.yml](.github/workflows/notify-subscribers.yml)，填写邮件标题与内容即可群发。

## 部署说明

推荐使用 GitHub Pages 托管，当前仓库结构可直接部署。

1. 将代码推送到 GitHub 仓库（默认分支建议为 `main`）。
2. 打开仓库设置：`Settings` -> `Pages`。
3. 在 `Build and deployment` 中选择：
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` + `/ (root)`
4. 保存后等待部署完成，GitHub 会生成 `*.github.io` 地址。
5. 若使用自定义域名，保留根目录 `CNAME` 文件（当前为 `miracleyang.com`），并在 DNS 服务商处配置：
   - 根域名（`@`）添加 `A` 记录到 GitHub Pages 官方 IP
   - 子域名（如 `www`）添加 `CNAME` 到 `<你的用户名>.github.io`
6. 在 GitHub Pages 设置里启用 `Enforce HTTPS`（证书生效后）。

## 技术栈

- HTML5
- CSS3
- Vanilla JavaScript
- JSON

## License

本项目采用 [MIT License](LICENSE)。
