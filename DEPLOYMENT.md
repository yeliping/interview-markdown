# GitHub Pages 部署指南

## 环境保护规则问题解决方案

如果遇到以下错误：
```
Branch "main" is not allowed to deploy to github-pages due to environment protection rules.
```

### 方法 1：配置环境保护规则（推荐）

1. 访问仓库设置：https://github.com/yeliping/interview-markdown/settings/environments
2. 找到 `github-pages` 环境
3. 点击进入，配置环境保护规则：
   - **Deployment branches**: 点击 "Add deployment branch protection rule"
   - 选择 `main` 分支
   - 或者直接禁用环境保护规则（删除规则）
4. 保存设置

### 方法 2：通过 Pages 设置启用

1. 访问仓库设置：https://github.com/yeliping/interview-markdown/settings/pages
2. 在 **Source** 部分，确保选择了 **GitHub Actions**
3. 如果配置正确，会显示 "GitHub Actions is configured for your site"
4. 点击 **Save**（如果有变动）

## 部署流程

项目配置了自动部署，每次推送到 `main` 分支时会自动触发：

1. **构建阶段**：运行 `npm run docs:build` 构建 VitePress 网站
2. **部署阶段**：自动将构建产物部署到 GitHub Pages

## 访问网站

部署成功后，访问：https://yeliping.github.io/interview-markdown/

## 手动触发部署

如果需要手动触发部署（不推送代码）：

1. 访问 Actions 页面：https://github.com/yeliping/interview-markdown/actions
2. 选择 "Deploy to GitHub Pages" workflow
3. 点击 "Run workflow" 按钮
4. 选择 `main` 分支，点击 "Run workflow"

## 常见问题

### Q: 构建成功但部署失败
A: 检查环境保护规则配置，确保允许 `main` 分支部署

### Q: 部署成功但无法访问网站
A: 
- 等待 1-2 分钟让 DNS 生效
- 检查 GitHub Pages 状态：https://www.githubstatus.com/
- 确认仓库是公开的

### Q: 如何查看部署日志
A: 访问 Actions 页面，点击最新的 workflow 运行查看详细日志
