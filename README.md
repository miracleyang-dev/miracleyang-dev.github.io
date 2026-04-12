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

## 目录结构

```text
.
├─ index.html                # 页面入口
├─ CNAME                     # GitHub Pages 自定义域名
├─ style/
│  ├─ chronicle.css          # 样式文件
│  └─ chronicle.js           # 渲染逻辑与交互
└─ database/
   ├─ profile.json           # 站点与个人信息、文档链接
   ├─ vocation.json          # 属性、进度、目标
   ├─ being.json             # 随笔、清单、记录
   └─ documents/             # 附件（如简历 PDF）
```

## 本地预览

本项目是静态网站，直接打开 `index.html` 即可查看。

如果你希望避免部分浏览器对本地 `fetch` 的限制，建议启动一个本地静态服务器：

```bash
# 方式 1：Node.js
npx serve .

# 方式 2：Python
python -m http.server 8000
```

然后在浏览器访问对应地址（如 <http://localhost:8000>）。

## 内容维护

1. 修改 `database/profile.json`：站点标题、副标题、个人信息、外链、简历链接等。
2. 修改 `database/vocation.json`：属性评分、能力进度、任务目标。
3. 修改 `database/being.json`：随笔、清单与生活记录。
4. 若更新简历等附件，请将文件放到 `database/documents/` 并同步更新 JSON 中的路径。

## 部署说明

- 推荐使用 GitHub Pages 托管。
- 自定义域名由根目录 `CNAME` 文件配置。

## 技术栈

- HTML5
- CSS3
- Vanilla JavaScript
- JSON

## License

如需开源发布，可按你的需求补充许可证（如 MIT）。
