// 侧边栏可拖动调整宽度功能
export default {
  setup() {
    // 等待 DOM 加载完成
    if (typeof document === 'undefined') return

    const initResizableSidebar = () => {
      const sidebar = document.querySelector('.VPSidebar')
      if (!sidebar) return

      // 创建拖动柄
      const handle = document.createElement('div')
      handle.className = 'resize-handle'
      sidebar.appendChild(handle)

      let isResizing = false
      let startX = 0
      let startWidth = 0

      // 鼠标按下事件
      handle.addEventListener('mousedown', (e) => {
        isResizing = true
        startX = e.clientX
        startWidth = sidebar.offsetWidth
        handle.classList.add('active')
        e.preventDefault()
      })

      // 鼠标移动事件
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return

        const deltaX = e.clientX - startX
        const newWidth = startWidth + deltaX

        // 限制最小和最大宽度
        const minWidth = 200
        const maxWidth = 500

        if (newWidth >= minWidth && newWidth <= maxWidth) {
          sidebar.style.width = `${newWidth}px`

          // 调整内容区域的左边距
          const content = document.querySelector('.VPContent')
          if (content) {
            content.style.paddingLeft = `${newWidth}px`
          }

          // 保存宽度到 localStorage
          localStorage.setItem('sidebarWidth', newWidth)
        }
      })

      // 鼠标释放事件
      document.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false
          handle.classList.remove('active')
        }
      })

      // 触摸事件支持（移动端）
      handle.addEventListener('touchstart', (e) => {
        isResizing = true
        startX = e.touches[0].clientX
        startWidth = sidebar.offsetWidth
        handle.classList.add('active')
        e.preventDefault()
      })

      document.addEventListener('touchmove', (e) => {
        if (!isResizing) return

        const deltaX = e.touches[0].clientX - startX
        const newWidth = startWidth + deltaX

        const minWidth = 200
        const maxWidth = 500

        if (newWidth >= minWidth && newWidth <= maxWidth) {
          sidebar.style.width = `${newWidth}px`

          const content = document.querySelector('.VPContent')
          if (content) {
            content.style.paddingLeft = `${newWidth}px`
          }

          localStorage.setItem('sidebarWidth', newWidth)
        }
      })

      document.addEventListener('touchend', () => {
        if (isResizing) {
          isResizing = false
          handle.classList.remove('active')
        }
      })

      // 恢复保存的宽度
      const savedWidth = localStorage.getItem('sidebarWidth')
      if (savedWidth) {
        const width = parseInt(savedWidth, 10)
        if (width >= 200 && width <= 500) {
          sidebar.style.width = `${width}px`
          const content = document.querySelector('.VPContent')
          if (content) {
            content.style.paddingLeft = `${width}px`
          }
        }
      }
    }

    // 在 Vue 应用挂载后初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initResizableSidebar)
    } else {
      initResizableSidebar()
    }
  },
}

// 监听路由变化，重新初始化
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      const sidebar = document.querySelector('.VPSidebar')
      const handle = document.querySelector('.resize-handle')
      if (sidebar && !handle) {
        // 重新初始化
        const script = document.querySelector(
          'script[src*="resizable-sidebar"]',
        )
        if (script) {
          const event = new Event('load')
          script.dispatchEvent(event)
        }
      }
    }, 100)
  })
}
