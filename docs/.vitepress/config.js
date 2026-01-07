import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/interview-markdown/',
  title: '我的文档网站',
  description: '前端知识点总结',

  // 头部标签（可选）
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],

  // 主题配置
  themeConfig: {
    // 网站 logo（可选）
    logo: '/logo.svg',

    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '面试题', link: '/guide/answers-vue' },
      //   { text: '示例', link: '/examples/demo' },
      //   {
      //     text: '相关链接',
      //     items: [
      //       { text: 'GitHub', link: 'https://github.com/yourname' },
      //       { text: 'Vue 官网', link: 'https://vuejs.org' },
      //     ],
      //   },
    ],

    // 侧边栏
    sidebar: {
      {
          text: '前端面试知识点',
          collapsible: true,
          items: [
            { text: 'Vue 面试题', link: '/guide/answers-vue' },
            { text: 'React 面试题', link: '/guide/answers-react' },
            { text: '架构设计', link: '/guide/answers-architecture' },
            { text: '工程化', link: '/guide/answers-engineering' },
            { text: '性能优化', link: '/guide/answers-performance' },
            { text: '网络协议', link: '/guide/answers-network' },
            { text: 'V8 引擎', link: '/guide/answers-v8' },
            { text: 'Web3', link: '/guide/answers-web3' },
          ],
        }
    },

    // 页脚（可选）
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Your Name',
    },

    // 搜索（本地搜索，无需 Algolia）
    search: {
      provider: 'local',
    },

    // 社交图标（可选）
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/yeliping/interview-markdown',
      },
    ],
  },
})
