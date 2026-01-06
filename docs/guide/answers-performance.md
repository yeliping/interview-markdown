# 前端性能方面

## 1、你所了解到的前端性能指标有哪些？

前端性能指标主要分为以下几类：

### 核心 Web 指标（Core Web Vitals）
- **LCP (Largest Contentful Paint)**：最大内容绘制，衡量页面主要内容加载完成的时间
- **FID (First Input Delay)**：首次输入延迟，衡量用户首次交互到页面响应的时间
- **CLS (Cumulative Layout Shift)**：累计布局偏移，衡量页面布局的稳定性

### 加载性能指标
- **FCP (First Contentful Paint)**：首次内容绘制，浏览器首次绘制文本或图像的时间
- **TTFB (Time to First Byte)**：首字节时间，浏览器接收到第一个字节的时间
- **TTI (Time to Interactive)**：首次交互时间，页面完全可交互的时间
- **TBT (Total Blocking Time)**：总阻塞时间，FCP 和 TTI 之间主线程被阻塞的总时间
- **L (Lighthouse)**：加载完成时间
- **Speed Index**：速度指数，衡量页面内容填充的速度

### 自定义业务指标
- **首屏时间**：用户可见的第一屏内容完全加载完成的时间
- **白屏时间**：从页面开始加载到首次显示内容的时间
- **可交互时间**：页面能够响应用户操作的时间
- **接口响应时间**：各个业务接口的响应时间
- **资源加载时间**：关键资源的加载时间

## 2、如何使用代码获取首次内容绘制（FCP）以及他的指标分数段是什么，如何提升 FCP 呢？

### 获取 FCP 的代码

```javascript
// 方法1: 使用 PerformanceObserver API
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('FCP:', entry.startTime);
  }
});

observer.observe({ type: 'paint', buffered: true });

// 方法2: 直接获取
const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
console.log('FCP:', fcpEntry ? fcpEntry.startTime : 'N/A');

// 方法3: web-vitals 库（推荐）
import { getFCP } from 'web-vitals';

getFCP((metric) => {
  console.log('FCP:', metric);
});
```

### FCP 指标分数段
- **优秀**：< 1.8 秒（绿色）
- **需要改进**：1.8 - 3.0 秒（橙色）
- **较差**：> 3.0 秒（红色）

### 提升 FCP 的方法

#### 1. 优化服务器响应
```javascript
// 使用 CDN
// 开启 gzip/brotli 压缩
// 优化服务器配置（Nginx/Apache）
// 使用 HTTP/2 或 HTTP/3
```

#### 2. 优化资源加载
```html
<!-- 关键 CSS 内联 -->
<style>
  /* 关键样式 */
</style>

<!-- 延迟加载非关键 CSS -->
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

<!-- 预加载关键资源 -->
<link rel="preload" href="critical.js" as="script">
<link rel="preload" href="font.woff2" as="font" crossorigin>
```

#### 3. 优化 JavaScript 执行
```javascript
// 延迟加载非关键 JS
<script defer src="non-critical.js"></script>
<script async src="analytics.js"></script>

// 代码分割
const lazyLoad = () => import('./heavy-module.js');

// 使用 requestIdleCallback
requestIdleCallback(() => {
  // 在空闲时间执行非关键任务
});
```

#### 4. 优化关键渲染路径
```javascript
// 移除阻塞渲染的资源
// 优化 CSS 选择器
// 减少关键资源大小
// 优化字体加载
```

#### 5. 使用 Service Worker
```javascript
// 缓存关键资源
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## 3、如何使用代码获取首次交互时间（TTI）以及他的指标分数段是什么样的，如何提升 TTI 呢？

### 获取 TTI 的代码

```javascript
// 使用 web-vitals 库（推荐）
import { getTTI } from 'web-vitals';

getTTI((metric) => {
  console.log('TTI:', metric.value, metric.rating);
});

// 手动计算 TTI
function calculateTTI() {
  // 1. 获取 FCP
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  
  // 2. 找到 FCP 之后的最长静默窗口
  const entries = performance.getEntries();
  let fcpTime = fcp ? fcp.startTime : 0;
  
  // 查找 5 秒静默窗口
  let windowStart = fcpTime;
  let tti = 0;
  
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].startTime >= windowStart) {
      if (entries[i].duration > 50) { // 长任务
        windowStart = entries[i].startTime + entries[i].duration;
      } else if (entries[i].startTime - windowStart >= 5000) {
        tti = windowStart;
        break;
      }
    }
  }
  
  return tti;
}
```

### TTI 指标分数段
- **优秀**：< 3.8 秒（绿色）
- **需要改进**：3.8 - 7.3 秒（橙色）
- **较差**：> 7.3 秒（红色）

### 提升 TTI 的方法

#### 1. 减少主线程阻塞
```javascript
// 使用 Web Worker
const worker = new Worker('worker.js');
worker.postMessage({ data: 'heavy computation' });
worker.onmessage = (e) => {
  console.log('Result:', e.data);
};

// 分割长任务
function splitLongTask(callback) {
  let index = 0;
  function runChunk() {
    const startTime = performance.now();
    while (performance.now() - startTime < 5) { // 5ms 时间片
      callback(index++);
    }
    if (index < 10000) {
      requestIdleCallback(runChunk);
    }
  }
  requestIdleCallback(runChunk);
}
```

#### 2. 延迟非关键 JavaScript
```javascript
// 动态导入
const Analytics = () => import('./analytics.js');

// 使用 requestIdleCallback
requestIdleCallback(() => {
  import('./heavy-module.js').then(module => {
    module.init();
  });
});
```

#### 3. 优化第三方脚本
```html
<!-- 延迟加载分析脚本 -->
<script>
  window.addEventListener('load', () => {
    const script = document.createElement('script');
    script.src = 'https://analytics.com/tracker.js';
    script.defer = true;
    document.body.appendChild(script);
  });
</script>
```

#### 4. 代码分割和懒加载
```javascript
// React 懒加载
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Vue 异步组件
const AsyncComponent = () => ({
  component: import('./AsyncComponent.vue'),
  loading: LoadingComponent,
  error: ErrorComponent,
  delay: 200,
  timeout: 3000
});
```

#### 5. 优化渲染性能
```javascript
// 虚拟滚动
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={400}
  itemCount={10000}
  itemSize={35}
  width={300}
>
  {({ index, style }) => (
    <div style={style}>Row {index}</div>
  )}
</FixedSizeList>

// React.memo 优化
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

## 4、如何使用代码获取首次输入延迟（FID）以及他的指标分数段是什么样的，如何提升 FID 呢？React 和 Vue 对于提升 FID 本身有什么区别？

### 获取 FID 的代码

```javascript
// 使用 web-vitals 库（推荐）
import { getFID } from 'web-vitals';

getFID((metric) => {
  console.log('FID:', metric.value, metric.rating);
  // 上报到监控平台
  sendToAnalytics({
    metricName: 'FID',
    value: metric.value,
    rating: metric.rating
  });
});

// 手动计算 FID
function measureFID() {
  let fid = 0;
  
  // 监听首次输入事件
  const measure = (event) => {
    const inputDelay = event.processingStart - event.startTime;
    fid = inputDelay;
    
    // 移除监听器
    ['mousedown', 'keydown', 'touchstart'].forEach(type => {
      window.removeEventListener(type, measure, { capture: true });
    });
  };
  
  ['mousedown', 'keydown', 'touchstart'].forEach(type => {
    window.addEventListener(type, measure, { capture: true, passive: true });
  });
  
  return fid;
}
```

### FID 指标分数段
- **优秀**：< 100 毫秒（绿色）
- **需要改进**：100 - 300 毫秒（橙色）
- **较差**：> 300 毫秒（红色）

### 提升 FID 的方法

#### 1. 减少 JavaScript 执行时间
```javascript
// 代码分割
const Home = () => import('./views/Home.vue');
const About = () => import('./views/About.vue');

// 路由懒加载
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About }
];

// 动态导入
const loadHeavyComponent = async () => {
  const module = await import('./HeavyComponent');
  return module.default;
};
```

#### 2. 使用 Web Workers
```javascript
// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  postMessage(result);
};

// main.js
const worker = new Worker('worker.js');
worker.postMessage(data);
worker.onmessage = (e) => {
  console.log('Result:', e.data);
};
```

#### 3. 优化事件处理
```javascript
// 防抖
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 节流
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 使用
input.addEventListener('input', debounce(handleInput, 300));
window.addEventListener('scroll', throttle(handleScroll, 100));
```

#### 4. 优化主线程任务
```javascript
// 使用 requestIdleCallback
function runTask(task) {
  requestIdleCallback((deadline) => {
    while (deadline.timeRemaining() > 0 && task.hasNext()) {
      task.next();
    }
    if (task.hasNext()) {
      requestIdleCallback(() => runTask(task));
    }
  });
}

// 使用 MessageChannel 进行任务调度
const channel = new MessageChannel();
channel.port2.onmessage = () => {
  // 执行下一个任务
};
channel.port1.postMessage(null);
```

### React 和 Vue 在提升 FID 方面的区别

#### React 的优化策略
```javascript
// 1. 使用 React.memo 避免不必要的重新渲染
const MemoizedComponent = React.memo(({ prop }) => {
  return <div>{prop}</div>;
});

// 2. 使用 useCallback 和 useMemo
const handleClick = useCallback(() => {
  // 处理点击
}, [dependency]);

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// 3. 使用 useTransition 和 useDeferredValue
function App() {
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState('');
  
  const deferredInput = useDeferredValue(input);
  
  const handleChange = (e) => {
    setInput(e.target.value);
    startTransition(() => {
      // 低优先级更新
      performExpensiveUpdate(e.target.value);
    });
  };
  
  return <input value={input} onChange={handleChange} />;
}

// 4. 代码分割
const LazyComponent = React.lazy(() => import('./LazyComponent'));
```

#### Vue 的优化策略
```javascript
// 1. 使用 v-once 和 v-memo
<div v-once>{{ staticContent }}</div>
<div v-memo="[dependency]">{{ content }}</div>

// 2. 使用 computed 缓存计算属性
computed: {
  expensiveValue() {
    return this.a + this.b;
  }
}

// 3. 使用异步组件
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./AsyncComponent.vue'),
  loadingComponent: LoadingComponent,
  delay: 200,
  timeout: 3000
});

// 4. 使用 nextTick
updateData();
await nextTick();
performPostUpdateTask();
```

**主要区别：**
1. **架构差异**：React 使用 Fiber 架构，支持任务中断和优先级调度；Vue 3 使用响应式系统和编译时优化
2. **更新机制**：React 需要手动优化（memo、useCallback）；Vue 的响应式系统自动追踪依赖，减少不必要的更新
3. **性能优化**：Vue 3 的编译时优化（静态提升、Block Tree）在运行时性能上更优；React 的运行时优化更灵活
4. **学习曲线**：Vue 的自动优化对开发者更友好；React 需要更深入理解原理才能有效优化

## 5、如何使用代码获取累计位移偏移（CLS）以及他的指标分数段是什么的，如何提升 CLS？

### 获取 CLS 的代码

```javascript
// 使用 web-vitals 库（推荐）
import { getCLS } from 'web-vitals';

getCLS((metric) => {
  console.log('CLS:', metric.value, metric.rating);
  // 上报到监控平台
  sendToAnalytics({
    metricName: 'CLS',
    value: metric.value,
    rating: metric.rating
  });
});

// 手动计算 CLS
function measureCLS() {
  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries = [];
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
        
        if (sessionValue && 
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            entry.startTime - firstSessionEntry.startTime < 5000) {
          sessionValue += entry.value;
          sessionEntries.push(entry);
        } else {
          sessionValue = entry.value;
          sessionEntries = [entry];
        }
        
        if (sessionValue > clsValue) {
          clsValue = sessionValue;
        }
      }
    }
  });
  
  observer.observe({ type: 'layout-shift', buffered: true });
  return clsValue;
}
```

### CLS 指标分数段
- **优秀**：< 0.1（绿色）
- **需要改进**：0.1 - 0.25（橙色）
- **较差**：> 0.25（红色）

### 提升 CLS 的方法

#### 1. 为图片和视频预留空间
```html
<!-- 不好的做法 -->
<img src="image.jpg" alt="">

<!-- 好的做法 -->
<img 
  src="image.jpg" 
  width="600" 
  height="400" 
  alt=""
  style="aspect-ratio: 600/400;"
>

<!-- 响应式图片 -->
<img 
  src="image.jpg"
  srcset="image-480w.jpg 480w,
          image-800w.jpg 800w,
          image-1600w.jpg 1600w"
  sizes="(max-width: 600px) 480px,
         (max-width: 1200px) 800px,
         1600px"
  alt=""
  style="aspect-ratio: 16/9;"
>
```

#### 2. 为广告和嵌入内容预留空间
```html
<!-- 为广告预留空间 -->
<div class="ad-container">
  <div class="ad-placeholder">
    <!-- 广告内容 -->
  </div>
</div>

<style>
.ad-container {
  min-height: 250px;
  width: 100%;
}

.ad-placeholder {
  min-height: 250px;
  background: #f0f0f0;
}
</style>
```

#### 3. 使用 CSS aspect-ratio
```css
.image-container {
  aspect-ratio: 16 / 9;
  width: 100%;
  background: #f0f0f0;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

#### 4. 避免动态插入内容
```javascript
// 不好的做法：动态插入内容导致布局偏移
function loadContent() {
  const container = document.getElementById('container');
  const content = document.createElement('div');
  content.innerHTML = '新内容';
  container.appendChild(content); // 可能导致布局偏移
}

// 好的做法：预占位或使用骨架屏
function loadContent() {
  // 1. 显示骨架屏
  const skeleton = document.getElementById('skeleton');
  skeleton.style.display = 'block';
  
  // 2. 加载内容
  fetchContent().then(content => {
    const container = document.getElementById('container');
    container.innerHTML = content;
    skeleton.style.display = 'none';
  });
}
```

#### 5. 使用 transform 而非改变布局属性
```css
/* 不好的做法：改变布局属性 */
.modal {
  display: none;
}

.modal.active {
  display: block; /* 导致布局偏移 */
}

/* 好的做法：使用 transform */
.modal {
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
  transition: all 0.3s ease;
}

.modal.active {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
```

#### 6. 字体加载优化
```html
<!-- 预加载字体 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 使用 font-display 交换 -->
<style>
  @font-face {
    font-family: 'MyFont';
    src: url('font.woff2') format('woff2');
    font-display: swap; /* 可选：fallback, optional, block */
  }
</style>
```

#### 7. React 中的优化
```javascript
// 使用 Suspense 预留空间
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function App() {
  return (
    <div>
      <h1>标题</h1>
      <Suspense fallback={<div style={{ minHeight: '300px' }}>加载中...</div>}>
        <LazyComponent />
      </Suspense>
    </div>
  );
}

// 使用 aspect-ratio 库
import { AspectRatio } from '@radix-ui/react-aspect-ratio';

<AspectRatio ratio={16 / 9}>
  <img src="image.jpg" alt="" />
</AspectRatio>
```

#### 8. Vue 中的优化
```vue
<template>
  <div>
    <h1>标题</h1>
    <Suspense>
      <template #default>
        <LazyComponent />
      </template>
      <template #fallback>
        <div class="skeleton" style="min-height: 300px;">加载中...</div>
      </template>
    </Suspense>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

const LazyComponent = defineAsyncComponent({
  loader: () => import('./LazyComponent.vue'),
  loadingComponent: LoadingComponent,
  delay: 200
});
</script>

<style>
.skeleton {
  aspect-ratio: 16/9;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
```

## 6、如何使用代码获取首字节时间（TTFB）以及他的指标分数段是什么样，如何提升 TTFB 呢？

### 获取 TTFB 的代码

```javascript
// 方法1: 使用 Performance API
const navigation = performance.getEntriesByType('navigation')[0];
const ttfb = navigation.responseStart - navigation.requestStart;
console.log('TTFB:', ttfb);

// 方法2: 使用 Resource Timing API
const resource = performance.getEntriesByType('resource')[0];
const ttfb = resource.responseStart - resource.requestStart;
console.log('TTFB:', ttfb);

// 方法3: 手动计算（适用于 XMLHttpRequest）
const start = performance.now();
fetch('/api/data')
  .then(response => {
    const ttfb = performance.now() - start;
    console.log('TTFB:', ttfb);
    return response.json();
  });

// 方法4: 使用 web-vitals 库
import { getTTFB } from 'web-vitals';

getTTFB((metric) => {
  console.log('TTFB:', metric.value, metric.rating);
});
```

### TTFB 指标分数段
- **优秀**：< 600 毫秒（绿色）
- **需要改进**：600 - 1800 毫秒（橙色）
- **较差**：> 1800 毫秒（红色）

### 提升 TTFB 的方法

#### 1. 优化服务器配置
```javascript
// Node.js 示例：使用 HTTP/2
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
}, (req, res) => {
  res.writeHead(200);
  res.end('Hello World');
});

server.listen(443);

// 使用 gzip/brotli 压缩
const compression = require('compression');
const express = require('express');
const app = express();

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

#### 2. 使用 CDN
```html
<!-- 静态资源使用 CDN -->
<link rel="stylesheet" href="https://cdn.example.com/styles.css">
<script src="https://cdn.example.com/app.js"></script>
```

#### 3. 启用 HTTP 缓存
```javascript
// Express.js 设置缓存头
app.use(express.static('public', {
  maxAge: '1y', // 1年
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// 使用 ETag
app.use(express.static('public', {
  etag: true,
  lastModified: true
}));
```

#### 4. 数据库查询优化
```javascript
// 使用索引
db.collection('users').createIndex({ email: 1 });

// 使用查询投影
db.collection('users')
  .find({ status: 'active' })
  .project({ name: 1, email: 1 }) // 只返回需要的字段
  .toArray();

// 使用连接池
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb'
});

// 使用缓存
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });

async function getUser(id) {
  const cacheKey = `user:${id}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  cache.set(cacheKey, user);
  return user;
}
```

#### 5. 使用 Service Worker 缓存
```javascript
// sw.js
const CACHE_NAME = 'v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});
```

#### 6. 使用预连接
```html
<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://api.example.com">

<!-- 预连接 -->
<link rel="preconnect" href="https://api.example.com">

<!-- 预加载 -->
<link rel="preload" href="api/data" as="fetch" crossorigin>
```

#### 7. 优化 API 响应
```javascript
// 使用流式响应
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.write('[');
  
  let first = true;
  const stream = getDataStream();
  
  stream.on('data', (chunk) => {
    if (!first) {
      res.write(',');
    }
    res.write(JSON.stringify(chunk));
    first = false;
  });
  
  stream.on('end', () => {
    res.write(']');
    res.end();
  });
});

// 使用 GraphQL 批量查询
const query = `
  query {
    users(first: 10) {
      id
      name
      email
    }
    posts(first: 10) {
      id
      title
    }
  }
`;

// 使用 HTTP/2 服务器推送
app.get('/', (req, res) => {
  const stream = res.stream;
  stream.push({ path: '/styles.css', headers: { 'content-type': 'text/css' } });
  stream.push({ path: '/main.js', headers: { 'content-type': 'application/javascript' } });
  
  res.sendFile('index.html');
});
```

## 7、如何使用代码获取总阻塞时间（TBT）以及他的指标分数段是什么样，如何提升 TBT 呢？

### 获取 TBT 的代码

```javascript
// 使用 web-vitals 库（推荐）
import { getTBT } from 'web-vitals';

getTBT((metric) => {
  console.log('TBT:', metric.value, metric.rating);
});

// 手动计算 TBT
function calculateTBT() {
  const entries = performance.getEntriesByType('navigation')[0];
  const fcp = entries.responseStart;
  
  // 获取所有长任务
  const longTasks = performance.getEntriesByType('longtask');
  
  let tbt = 0;
  longTasks.forEach(task => {
    // 只计算 FCP 之后的任务
    if (task.startTime >= fcp) {
      const blockingTime = task.duration - 50;
      if (blockingTime > 0) {
        tbt += blockingTime;
      }
    }
  });
  
  return tbt;
}

// 监控长任务
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Long task:', entry.startTime, entry.duration);
  }
});

observer.observe({ type: 'longtask', buffered: true });
```

### TBT 指标分数段
- **优秀**：< 200 毫秒（绿色）
- **需要改进**：200 - 600 毫秒（橙色）
- **较差**：> 600 毫秒（红色）

### 提升 TBT 的方法

#### 1. 分割长任务
```javascript
// 将长任务拆分为小块
function processLargeArray(array, callback, chunkSize = 50) {
  let index = 0;
  
  function processChunk() {
    const startTime = performance.now();
    const endTime = startTime + 5; // 5ms 时间片
    
    while (index < array.length && performance.now() < endTime) {
      callback(array[index]);
      index++;
    }
    
    if (index < array.length) {
      requestIdleCallback(processChunk);
    }
  }
  
  processChunk();
}

// 使用
processLargeArray(largeArray, (item) => {
  // 处理每个项目
});
```

#### 2. 使用 Web Workers
```javascript
// worker.js
self.onmessage = (e) => {
  const data = e.data;
  const result = heavyComputation(data);
  postMessage(result);
};

function heavyComputation(data) {
  // 重计算任务
  return data.reduce((acc, item) => acc + item, 0);
}

// main.js
const worker = new Worker('worker.js');

worker.postMessage([1, 2, 3, 4, 5]);

worker.onmessage = (e) => {
  console.log('Result:', e.data);
};
```

#### 3. 使用 requestIdleCallback
```javascript
function runTask(task) {
  requestIdleCallback((deadline) => {
    while (deadline.timeRemaining() > 0 && task.hasNext()) {
      task.next();
    }
    
    if (task.hasNext()) {
      requestIdleCallback(() => runTask(task));
    }
  });
}

// 使用
const task = {
  index: 0,
  data: largeArray,
  hasNext() {
    return this.index < this.data.length;
  },
  next() {
    processDataItem(this.data[this.index]);
    this.index++;
  }
};

runTask(task);
```

#### 4. 优化 JavaScript 执行
```javascript
// 使用防抖和节流
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 使用虚拟滚动减少 DOM 操作
import { FixedSizeList } from 'react-window';

function Row({ index, style }) {
  return <div style={style}>Row {index}</div>;
}

<FixedSizeList
  height={400}
  itemCount={10000}
  itemSize={35}
  width={300}
>
  {Row}
</FixedSizeList>
```

#### 5. 优化 React 渲染
```javascript
// 使用 React.memo 避免不必要的重新渲染
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// 使用 useMemo 和 useCallback
function ParentComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);
  
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);
  
  return (
    <div>
      <button onClick={handleClick}>Count: {count}</button>
      <ExpensiveComponent data={expensiveValue} />
    </div>
  );
}

// 使用 useTransition 降级更新优先级
function App() {
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState('');
  
  const handleChange = (e) => {
    setInput(e.target.value);
    
    startTransition(() => {
      // 低优先级更新
      updateExpensiveState(e.target.value);
    });
  };
  
  return <input value={input} onChange={handleChange} />;
}
```

#### 6. 优化 Vue 渲染
```vue
<template>
  <div>
    <input v-model="input" @input="handleInput">
    <ExpensiveComponent :data="expensiveData" />
  </div>
</template>

<script>
import { defineComponent, ref, computed, watchEffect } from 'vue';

export default defineComponent({
  components: {
    ExpensiveComponent: defineComponent({
      props: ['data'],
      setup(props) {
        // 使用 computed 缓存
        const processedData = computed(() => {
          return processExpensiveData(props.data);
        });
        
        return { processedData };
      }
    })
  },
  
  setup() {
    const input = ref('');
    const expensiveData = ref([]);
    
    // 使用 nextTick 延迟更新
    const handleInput = () => {
      nextTick(() => {
        updateExpensiveData(input.value);
      });
    };
    
    // 使用 watchEffect 自动追踪
    watchEffect((onCleanup) => {
      const timer = setTimeout(() => {
        // 延迟执行
      }, 0);
      
      onCleanup(() => clearTimeout(timer));
    });
    
    return { input, handleInput, expensiveData };
  }
});
</script>
```

## 8、说说你所了解性能优化手段？

性能优化可以分为多个层面，以下从不同维度详细介绍：

### 一、网络层面优化

#### 1. HTTP 优化
```javascript
// 启用 HTTP/2 或 HTTP/3
// 多路复用减少连接数
// 服务器推送
// 头部压缩

// 使用 HTTP 缓存
app.use(express.static('public', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// 使用 CDN
<link rel="stylesheet" href="https://cdn.example.com/styles.css">
```

#### 2. 资源压缩
```javascript
// 使用 gzip/brotli 压缩
const compression = require('compression');
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// 图片压缩
const sharp = require('sharp');
await sharp('input.jpg')
  .resize(800, 600)
  .jpeg({ quality: 80 })
  .toFile('output.jpg');
```

#### 3. 资源合并与分割
```javascript
// Webpack 配置
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5
        }
      }
    }
  }
};
```

### 二、代码层面优化

#### 1. JavaScript 优化
```javascript
// 1. 避免全局变量
// 2. 使用事件委托
document.addEventListener('click', (e) => {
  if (e.target.matches('.button')) {
    handleClick();
  }
});

// 3. 使用防抖和节流
const debouncedSearch = debounce(search, 300);
const throttledScroll = throttle(handleScroll, 100);

// 4. 避免内存泄漏
// 及时清除定时器、事件监听器
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);

// 5. 使用 Web Worker
const worker = new Worker('worker.js');
worker.postMessage(data);
```

#### 2. CSS 优化
```css
/* 1. 避免通配符选择器 */
/* 2. 使用 CSS 变量 */
:root {
  --primary-color: #007bff;
}

/* 3. 使用 will-change 优化 */
.element {
  will-change: transform, opacity;
}

/* 4. 使用 transform 和 opacity 动画 */
.animate {
  transform: translateX(0);
  opacity: 1;
  transition: all 0.3s ease;
}
```

#### 3. DOM 操作优化
```javascript
// 1. 减少 DOM 操作次数
// 2. 使用文档片段
const fragment = document.createDocumentFragment();
items.forEach(item => {
  const li = document.createElement('li');
  li.textContent = item;
  fragment.appendChild(li);
});
document.getElementById('list').appendChild(fragment);

// 3. 使用虚拟滚动
import { FixedSizeList } from 'react-window';
```

### 三、渲染性能优化

#### 1. React 优化
```javascript
// 1. 使用 React.memo
const MemoizedComponent = React.memo(({ prop }) => {
  return <div>{prop}</div>;
});

// 2. 使用 useMemo 和 useCallback
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);

// 3. 代码分割
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// 4. 使用虚拟化
import { FixedSizeList } from 'react-window';

// 5. 使用 useTransition
const [isPending, startTransition] = useTransition();
startTransition(() => {
  setSearchResults(filterLargeList(query));
});
```

#### 2. Vue 优化
```javascript
// 1. 使用 v-once
<div v-once>{{ staticContent }}</div>

// 2. 使用 v-memo
<div v-memo="[dependency]">{{ content }}</div>

// 3. 使用计算属性
computed: {
  expensiveValue() {
    return this.a + this.b;
  }
}

// 4. 异步组件
const AsyncComponent = defineAsyncComponent({
  loader: () => import('./AsyncComponent.vue'),
  delay: 200,
  timeout: 3000
});
```

### 四、资源加载优化

#### 1. 预加载策略
```html
<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://api.example.com">

<!-- 预连接 -->
<link rel="preconnect" href="https://api.example.com">

<!-- 预加载 -->
<link rel="preload" href="font.woff2" as="font" crossorigin>
<link rel="preload" href="critical.css" as="style">

<!-- 预获取 -->
<link rel="prefetch" href="next-page.js" as="script">
```

#### 2. 懒加载
```javascript
// 图片懒加载
<img data-src="image.jpg" class="lazy" alt="">

const lazyImages = document.querySelectorAll('img.lazy');
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      observer.unobserve(img);
    }
  });
});

lazyImages.forEach(img => imageObserver.observe(img));

// 路由懒加载
const Home = () => import('./views/Home.vue');
const About = () => import('./views/About.vue');
```

#### 3. 图片优化
```html
<!-- 响应式图片 -->
<img 
  src="image-small.jpg"
  srcset="image-small.jpg 480w,
          image-medium.jpg 800w,
          image-large.jpg 1600w"
  sizes="(max-width: 600px) 480px,
         (max-width: 1200px) 800px,
         1600px"
  alt="Responsive image"
  loading="lazy"
>

<!-- 使用 WebP 格式 -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="Image">
</picture>
```

### 五、存储和缓存优化

#### 1. Service Worker 缓存
```javascript
// sw.js
const CACHE_NAME = 'v1';
const urlsToCache = ['/', '/styles.css', '/main.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

#### 2. 本地存储策略
```javascript
// 使用 IndexedDB 存储大量数据
const request = indexedDB.open('MyDatabase', 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const objectStore = db.createObjectStore('items', { keyPath: 'id' });
  objectStore.createIndex('name', 'name', { unique: false });
};

// 使用 localStorage 存储少量数据
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');

// 使用 sessionStorage 存储会话数据
sessionStorage.setItem('key', 'value');
```

### 六、监控和分析

#### 1. 性能监控
```javascript
// 使用 Performance API
const perfData = performance.getEntriesByType('navigation')[0];
const metrics = {
  dns: perfData.domainLookupEnd - perfData.domainLookupStart,
  tcp: perfData.connectEnd - perfData.connectStart,
  ttfb: perfData.responseStart - perfData.requestStart,
  download: perfData.responseEnd - perfData.responseStart,
  dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
  load: perfData.loadEventEnd - perfData.loadEventStart
};

// 使用 web-vitals 库
import { getCLS, getFID, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
getTTFB(console.log);
```

#### 2. 错误监控
```javascript
// 全局错误捕获
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Error:', error);
  // 上报到监控平台
};

// Promise 错误捕获
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

// React 错误边界
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 上报到监控平台
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### 七、打包优化

#### 1. Webpack 优化
```javascript
module.exports = {
  mode: 'production',
  
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        }
      }
    },
    usedExports: true,
    sideEffects: false
  },
  
  performance: {
    hints: 'warning',
    maxEntrypointSize: 500000,
    maxAssetSize: 300000
  },
  
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      }
    ]
  },
  
  plugins: [
    new webpack.DllPlugin({
      name: '[name]',
      path: path.join(__dirname, 'dll', '[name]-manifest.json')
    })
  ]
};
```

#### 2. Vite 优化
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router'],
          'utils': ['lodash', 'axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://api.example.com',
        changeOrigin: true
      }
    }
  }
};
```

### 八、其他优化手段

#### 1. SSR 和 SSG
```javascript
// Next.js SSR
export async function getServerSideProps() {
  const data = await fetch('https://api.example.com/data');
  return { props: { data } };
}

// Next.js SSG
export async function getStaticProps() {
  const data = await fetch('https://api.example.com/data');
  return {
    props: { data },
    revalidate: 60 // 60秒后重新生成
  };
}
```

#### 2. 使用 WebAssembly
```javascript
// 加载 WebAssembly 模块
WebAssembly.instantiateStreaming(fetch('module.wasm'))
  .then(results => {
    const add = results.instance.exports.add;
    const result = add(1, 2);
    console.log(result);
  });
```

#### 3. 使用 OffscreenCanvas
```javascript
// 离屏渲染
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.drawImage(image, 0, 0);
```

这些优化手段需要根据具体场景选择合适的组合，不能一刀切。建议先进行性能分析，找到瓶颈，再有针对性地优化。

## 9、React 在开发过程中有哪些性能优化策略？

React 性能优化策略可以分为多个层次，从组件层面到架构层面都有相应的方法：

### 一、组件层面优化

#### 1. 使用 React.memo 避免不必要的重新渲染
```javascript
// 普通组件
function ExpensiveComponent({ data }) {
  console.log('Rendering ExpensiveComponent');
  return <div>{data}</div>;
}

// 使用 React.memo 优化
const MemoizedComponent = React.memo(function ExpensiveComponent({ data }) {
  console.log('Rendering MemoizedComponent');
  return <div>{data}</div>;
});

// 自定义比较函数
const CustomMemoComponent = React.memo(
  function ExpensiveComponent({ data }) {
    return <div>{data}</div>;
  },
  (prevProps, nextProps) => {
    // 返回 true 表示 props 相等，不需要重新渲染
    return prevProps.data.id === nextProps.data.id;
  }
);
```

#### 2. useMemo 缓存计算结果
```javascript
function Component({ items }) {
  // 没有优化：每次渲染都会重新计算
  // const total = items.reduce((sum, item) => sum + item.value, 0);
  
  // 优化后：只有 items 变化时才重新计算
  const total = useMemo(() => {
    console.log('Computing total');
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);
  
  return <div>Total: {total}</div>;
}

// 复杂计算示例
function ProcessedList({ data }) {
  const processedData = useMemo(() => {
    return data
      .filter(item => item.status === 'active')
      .map(item => ({
        ...item,
        processed: item.value * 2
      }))
      .sort((a, b) => a.processed - b.processed);
  }, [data]);
  
  return (
    <ul>
      {processedData.map(item => (
        <li key={item.id}>{item.processed}</li>
      ))}
    </ul>
  );
}
```

#### 3. useCallback 缓存函数引用
```javascript
function ParentComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  
  // 没有优化：每次渲染都会创建新的函数
  // const handleClick = () => {
  //   setItems([...items, items.length]);
  // };
  
  // 优化后：函数引用保持稳定
  const handleClick = useCallback(() => {
    setItems(prev => [...prev, prev.length]);
  }, []);
  
  // 依赖其他 state 的回调
  const handleClickWithValue = useCallback((value) => {
    setItems(prev => [...prev, value]);
  }, []);
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
      <ChildComponent onClick={handleClick} />
    </div>
  );
}

const ChildComponent = React.memo(function ChildComponent({ onClick }) {
  console.log('Rendering ChildComponent');
  return <button onClick={onClick}>Add Item</button>;
});
```

### 二、渲染优化

#### 4. 使用代码分割和懒加载
```javascript
// 路由级别的代码分割
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// 组件级别的懒加载
function App() {
  const [showModal, setShowModal] = useState(false);
  const Modal = lazy(() => import('./Modal'));
  
  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Open Modal
      </button>
      {showModal && (
        <Suspense fallback={<div>Loading modal...</div>}>
          <Modal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </div>
  );
}
```

#### 5. 虚拟化长列表
```javascript
import { FixedSizeList, VariableSizeList } from 'react-window';

// 固定高度列表
function FixedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style} className="list-item">
      {items[index].name}
    </div>
  );
  
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={35}
      width={300}
    >
      {Row}
    </FixedSizeList>
  );
}

// 可变高度列表
function VariableList({ items }) {
  const getItemSize = (index) => {
    return items[index].height || 50;
  };
  
  const Row = ({ index, style }) => (
    <div style={style} className="list-item">
      {items[index].content}
    </div>
  );
  
  return (
    <VariableSizeList
      height={400}
      itemCount={items.length}
      itemSize={getItemSize}
      width={300}
    >
      {Row}
    </VariableSizeList>
  );
}

// 使用 react-virtuoso 处理更复杂的场景
import { Virtuoso } from 'react-virtuoso';

function AdvancedList({ items }) {
  return (
    <Virtuoso
      style={{ height: 400 }}
      data={items}
      itemContent={(index, item) => (
        <div>{item.name}</div>
      )}
    />
  );
}
```

#### 6. 使用 useTransition 和 useDeferredValue
```javascript
import { useTransition, useDeferredValue, useState } from 'react';

function SearchInput({ items }) {
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState('');
  
  // 延迟更新搜索结果
  const deferredInput = useDeferredValue(input);
  
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.toLowerCase().includes(deferredInput.toLowerCase())
    );
  }, [items, deferredInput]);
  
  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // 将过滤操作标记为低优先级
    startTransition(() => {
      // React 会自动处理这个过渡
    });
  };
  
  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        placeholder="Search..."
      />
      {isPending && <div>Searching...</div>}
      <ul>
        {filteredItems.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 三、状态管理优化

#### 7. 合理拆分组件和状态
```javascript
// 不好的做法：所有状态都在一个组件中
function BadComponent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiState, setUiState] = useState({
    sidebarOpen: false,
    theme: 'dark'
  });
  
  // ... 大量代码
}

// 好的做法：拆分状态到不同组件
function GoodComponent() {
  const [uiState, setUiState] = useState({
    sidebarOpen: false,
    theme: 'dark'
  });
  
  return (
    <div>
      <Sidebar isOpen={uiState.sidebarOpen} />
      <MainContent>
        <LoginForm />
      </MainContent>
    </div>
  );
}

function LoginForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ... 表单逻辑
}
```

#### 8. 使用 Context 选择性订阅
```javascript
// 创建多个 Context 避免不必要的重渲染
const UserContext = createContext();
const ThemeContext = createContext();

function App({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        {children}
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

// 组件只订阅需要的 Context
function UserProfile() {
  const { user } = useContext(UserContext); // 只订阅 UserContext
  
  return <div>{user?.name}</div>;
}

function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext); // 只订阅 ThemeContext
  
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

#### 9. 使用状态库优化全局状态
```javascript
// 使用 Zustand（轻量级）
import create from 'zustand';

const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  }))
}));

function Component() {
  const items = useStore(state => state.items);
  const addItem = useStore(state => state.addItem);
  
  return (
    <div>
      <button onClick={() => addItem({ id: Date.now() })}>
        Add Item
      </button>
      {items.map(item => <div key={item.id}>{item.id}</div>)}
    </div>
  );
}

// 使用 Recoil（细粒度订阅）
import { atom, useRecoilState, useRecoilValue } from 'recoil';

const itemsState = atom({
  key: 'items',
  default: []
});

const filteredItemsState = selector({
  key: 'filteredItems',
  get: ({ get }) => {
    const items = get(itemsState);
    return items.filter(item => item.active);
  }
});

function Component() {
  const [items, setItems] = useRecoilState(itemsState);
  const filteredItems = useRecoilValue(filteredItemsState);
  
  return <div>{/* ... */}</div>;
}
```

### 四、事件处理优化

#### 10. 防抖和节流
```javascript
import { useCallback } from 'react';
import { debounce, throttle } from 'lodash';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  // 防抖：延迟执行
  const debouncedSearch = useCallback(
    debounce((q) => {
      fetchResults(q).then(setResults);
    }, 300),
    []
  );
  
  // 节流：限制执行频率
  const throttledScroll = useCallback(
    throttle(() => {
      console.log('Scrolling...');
    }, 100),
    []
  );
  
  useEffect(() => {
    window.addEventListener('scroll', throttledScroll);
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      debouncedSearch.cancel(); // 清理防抖
    };
  }, [throttledScroll, debouncedSearch]);
  
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 五、其他优化技巧

#### 11. 避免内联对象和函数
```javascript
// 不好的做法
function BadComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button
        onClick={() => setCount(count + 1)} // 每次渲染创建新函数
        style={{ color: 'red' }} // 每次渲染创建新对象
      >
        Count: {count}
      </button>
    </div>
  );
}

// 好的做法
function GoodComponent() {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  const buttonStyle = useMemo(() => ({
    color: 'red'
  }), []);
  
  return (
    <div>
      <button onClick={handleClick} style={buttonStyle}>
        Count: {count}
      </button>
    </div>
  );
}
```

#### 12. 使用 CSS-in-JS 优化
```javascript
import { css } from '@emotion/react';

function Component() {
  const buttonStyle = css`
    background: ${props => props.primary ? 'blue' : 'gray'};
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
  `;
  
  return (
    <button css={buttonStyle} primary>
      Click me
    </button>
  );
}
```

#### 13. 性能监控和分析
```javascript
import { Profiler } from 'react';

function onRenderCallback(
  id, // 组件标识
  phase, // "mount" 或 "update"
  actualDuration, // 渲染耗时
  baseDuration, // 不使用 memo 的预计耗时
  startTime, // 开始时间
  commitTime, // 提交时间
  interactions // 相关的交互集合
) {
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
    interactions
  });
}

function App() {
  return (
    <Profiler id="ExpensiveComponent" onRender={onRenderCallback}>
      <ExpensiveComponent />
    </Profiler>
  );
}

// 使用 React DevTools Profiler
// 安装 React DevTools 浏览器扩展
// 在 DevTools 的 Profiler 标签页中记录和分析性能
```

#### 14. 使用 Web Worker 处理复杂计算
```javascript
// worker.js
self.onmessage = function(e) {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};

function heavyComputation(data) {
  // 复杂计算
  return data.reduce((acc, item) => acc + item, 0);
}

// Component.jsx
function Component() {
  const [result, setResult] = useState(null);
  const workerRef = useRef(null);
  
  useEffect(() => {
    workerRef.current = new Worker('./worker.js');
    
    workerRef.current.onmessage = (e) => {
      setResult(e.data);
    };
    
    return () => {
      workerRef.current.terminate();
    };
  }, []);
  
  const handleCompute = () => {
    const data = Array(1000000).fill(0).map((_, i) => i);
    workerRef.current.postMessage(data);
  };
  
  return (
    <div>
      <button onClick={handleCompute}>Compute</button>
      {result !== null && <div>Result: {result}</div>}
    </div>
  );
}
```

#### 15. 使用 Offscreen Canvas 进行渲染优化
```javascript
function CanvasComponent() {
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const offscreen = canvas.transferControlToOffscreen();
    offscreenCanvasRef.current = offscreen;
    
    const worker = new Worker('./canvas-worker.js');
    worker.postMessage({ canvas: offscreen }, [offscreen]);
    
    return () => worker.terminate();
  }, []);
  
  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

### 总结

React 性能优化的关键原则：
1. **避免不必要的渲染**：使用 React.memo、useMemo、useCallback
2. **按需加载**：使用代码分割和懒加载
3. **优化列表渲染**：使用虚拟化
4. **合理管理状态**：拆分状态，使用合适的状态管理方案
5. **监控性能**：使用 Profiler 和 DevTools 分析性能瓶颈
6. **将重任务移出主线程**：使用 Web Worker
7. **选择合适的工具**：根据场景选择最适合的优化方案

记住，过早优化是万恶之源。先让代码工作，再进行性能分析，最后针对瓶颈进行优化。

## 10、Vue 在开发过程中有哪些性能优化策略？

Vue 的性能优化策略与 React 有所不同，Vue 3 的响应式系统和编译时优化使得很多优化变得自动化。

### 一、组件层面优化

#### 1. 使用 v-once 避免静态内容重新渲染
```vue
<template>
  <div>
    <!-- 只渲染一次,后续更新不会重新渲染 -->
    <h1 v-once>{{ title }}</h1>
    <p v-once>{{ description }}</p>
    
    <!-- 动态内容正常渲染 -->
    <p>{{ count }}</p>
  </div>
</template>
```

#### 2. 使用 v-memo 缓存子树
```vue
<template>
  <div>
    <!-- 只有 id 变化时才重新渲染 -->
    <div v-memo="[item.id]">
      <span>{{ item.name }}</span>
      <span>{{ item.description }}</span>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      item: {
        id: 1,
        name: 'Item 1',
        description: 'Description'
      }
    };
  }
};
</script>
```

#### 3. 使用计算属性缓存
```vue
<template>
  <div>
    <p>Filtered Items: {{ filteredItems.length }}</p>
    <p>Total: {{ total }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [1, 2, 3, 4, 5],
      threshold: 3
    };
  },
  computed: {
    filteredItems() {
      // 只有 items 或 threshold 变化时才重新计算
      return this.items.filter(item => item > this.threshold);
    },
    total() {
      return this.items.reduce((sum, item) => sum + item, 0);
    }
  }
};
</script>
```

### 二、列表渲染优化

#### 4. 使用 key 优化 diff 算法
```vue
<template>
  <ul>
    <!-- 不好的做法：使用 index 作为 key -->
    <li v-for="(item, index) in items" :key="index">
      {{ item.name }}
    </li>
    
    <!-- 好的做法：使用唯一 ID -->
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

#### 5. 虚拟滚动长列表
```vue
<template>
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="item">
      {{ item.name }}
    </div>
  </RecycleScroller>
</template>

<script>
import { RecycleScroller } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

export default {
  components: { RecycleScroller },
  data() {
    return {
      items: Array(10000).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i}`
      }))
    };
  }
};
</script>
```

#### 6. 使用 v-for 优化
```vue
<template>
  <div>
    <!-- 避免在 v-for 中使用复杂表达式 -->
    <div v-for="item in items" :key="item.id">
      {{ computedItemName(item) }}
    </div>
    
    <!-- 使用计算属性预先处理 -->
    <div v-for="item in processedItems" :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: []
    };
  },
  computed: {
    processedItems() {
      return this.items.map(item => ({
        ...item,
        name: this.computedItemName(item)
      }));
    }
  },
  methods: {
    computedItemName(item) {
      // 复杂的计算逻辑
      return `${item.firstName} ${item.lastName}`;
    }
  }
};
</script>
```

### 三、响应式优化

#### 7. 使用 shallowRef 和 shallowReactive
```vue
<template>
  <div>
    <p>{{ deepRef }}</p>
    <p>{{ shallowRef }}</p>
  </div>
</template>

<script>
import { ref, shallowRef, reactive, shallowReactive } from 'vue';

export default {
  setup() {
    // 深度响应式（默认）
    const deepRef = ref({
      nested: { value: 1 }
    });
    
    // 浅层响应式：只有 .value 的变化会触发更新
    const shallowRef = shallowRef({
      nested: { value: 1 }
    });
    
    // 浅层响应式：只有第一层属性的变化会触发更新
    const shallowReactive = shallowReactive({
      nested: { value: 1 }
    });
    
    return { deepRef, shallowRef };
  }
};
</script>
```

#### 8. 使用 markRaw 标记不需要响应式的对象
```vue
<template>
  <div>
    <button @click="addItem">Add Item</button>
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>

<script>
import { ref, markRaw } from 'vue';

export default {
  setup() {
    const items = ref([]);
    
    const addItem = () => {
      // 不需要响应式的对象
      const newItem = markRaw({
        id: Date.now(),
        name: 'New Item',
        // 大量的静态数据
        staticData: Array(1000).fill(0)
      });
      
      items.value.push(newItem);
    };
    
    return { items, addItem };
  }
};
</script>
```

### 四、组件加载优化

#### 9. 使用异步组件
```vue
<template>
  <div>
    <AsyncComponent />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

export default {
  components: {
    AsyncComponent: defineAsyncComponent({
      loader: () => import('./HeavyComponent.vue'),
      loadingComponent: LoadingComponent,
      errorComponent: ErrorComponent,
      delay: 200, // 延迟显示加载组件
      timeout: 3000 // 超时时间
    })
  }
};
</script>
```

#### 10. 使用 Suspense 处理异步组件
```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>

<script>
import { defineAsyncComponent } from 'vue';

const AsyncComponent = defineAsyncComponent(() => import('./AsyncComponent.vue'));

export default {
  components: { AsyncComponent }
};
</script>
```

#### 11. 路由懒加载
```javascript
const routes = [
  {
    path: '/',
    component: () => import('./views/Home.vue')
  },
  {
    path: '/about',
    component: () => import('./views/About.vue')
  },
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue')
  }
];
```

### 五、事件处理优化

#### 12. 使用事件委托
```vue
<template>
  <div @click="handleListClick">
    <div class="item" data-id="1">Item 1</div>
    <div class="item" data-id="2">Item 2</div>
    <div class="item" data-id="3">Item 3</div>
  </div>
</template>

<script>
export default {
  methods: {
    handleListClick(event) {
      const item = event.target.closest('.item');
      if (item) {
        const id = item.dataset.id;
        console.log('Clicked item:', id);
      }
    }
  }
};
</script>
```

#### 13. 防抖和节流
```vue
<template>
  <div>
    <input @input="debouncedSearch" placeholder="Search..." />
    <div @scroll="throttledScroll" class="scroll-container">
      <!-- 内容 -->
    </div>
  </div>
</template>

<script>
import { debounce, throttle } from 'lodash-es';

export default {
  methods: {
    search(query) {
      // 搜索逻辑
    },
    debouncedSearch: debounce(function(event) {
      this.search(event.target.value);
    }, 300),
    
    handleScroll() {
      // 滚动处理逻辑
    },
    throttledScroll: throttle(function(event) {
      this.handleScroll();
    }, 100)
  }
};
</script>
```

### 六、组件通信优化

#### 14. 使用 provide/inject 避免多层 props 传递
```vue
<!-- 祖先组件 -->
<template>
  <ChildComponent />
</template>

<script>
import { provide, ref } from 'vue';

export default {
  setup() {
    const theme = ref('light');
    const toggleTheme = () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light';
    };
    
    provide('theme', {
      theme,
      toggleTheme
    });
  }
};
</script>

<!-- 后代组件 -->
<template>
  <button @click="toggleTheme">
    Current theme: {{ theme }}
  </button>
</template>

<script>
import { inject } from 'vue';

export default {
  setup() {
    const { theme, toggleTheme } = inject('theme');
    return { theme, toggleTheme };
  }
};
</script>
```

### 七、使用 Composition API 优化

#### 15. 组合式函数复用逻辑
```javascript
// composables/useCounter.js
import { ref, computed } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  
  const doubled = computed(() => count.value * 2);
  
  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => count.value = initialValue;
  
  return {
    count,
    doubled,
    increment,
    decrement,
    reset
  };
}

// 在组件中使用
<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="reset">Reset</button>
  </div>
</template>

<script>
import { useCounter } from './composables/useCounter';

export default {
  setup() {
    const { count, doubled, increment, decrement, reset } = useCounter(0);
    
    return { count, doubled, increment, decrement, reset };
  }
};
</script>
```

### 八、渲染优化

#### 16. 使用 v-show 替代 v-if（频繁切换）
```vue
<template>
  <div>
    <!-- 频繁切换的情况使用 v-show -->
    <div v-show="isVisible">
      This content toggles frequently
    </div>
    
    <!-- 不频繁切换或初始为 false 的情况使用 v-if -->
    <div v-if="shouldRender">
      This content is rarely shown
    </div>
  </div>
</template>
```

#### 17. 使用函数式组件
```vue
<template functional>
  <div class="static-component">
    <slot />
  </div>
</template>
```

#### 18. 使用 keep-alive 缓存组件
```vue
<template>
  <keep-alive :include="['Home', 'Dashboard']" :exclude="['About']">
    <component :is="currentComponent" />
  </keep-alive>
</template>

<script>
export default {
  data() {
    return {
      currentComponent: 'Home'
    };
  }
};
</script>
```

### 九、Vite 特定优化

#### 19. 使用动态导入
```vue
<template>
  <button @click="loadModal">Show Modal</button>
  <component v-if="showModal" :is="modalComponent" />
</template>

<script>
export default {
  data() {
    return {
      showModal: false,
      modalComponent: null
    };
  },
  methods: {
    async loadModal() {
      if (!this.modalComponent) {
        const module = await import('./Modal.vue');
        this.modalComponent = module.default;
      }
      this.showModal = true;
    }
  }
};
</script>
```

#### 20. 配置预构建
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios'],
    exclude: ['your-local-package']
  }
});
```

### 十、性能监控

#### 21. 使用 Vue DevTools 性能分析
```javascript
// 在开发环境中使用
if (import.meta.env.DEV) {
  const { onMounted } = await import('vue');
  const { setupPerformanceTracking } = await import('@vue/devtools-api');
  
  onMounted(() => {
    setupPerformanceTracking();
  });
}
```

#### 22. 使用 Performance API
```vue
<script>
export default {
  mounted() {
    const start = performance.now();
    
    // 执行某些操作
    
    const end = performance.now();
    console.log(`Operation took ${end - start}ms`);
  }
};
</script>
```

### 总结

Vue 性能优化的关键点：
1. **利用 Vue 的自动优化**：Vue 3 的编译时优化已经做了很多工作
2. **合理使用 v-once 和 v-memo**：避免不必要的重新渲染
3. **计算属性缓存**：减少重复计算
4. **正确的 key 使用**：优化列表 diff
5. **异步加载**：按需加载组件和路由
6. **响应式优化**：使用 shallowRef/markRaw 减少响应式开销
7. **事件委托**：减少事件监听器数量
8. **Composition API**：更好的代码组织和复用

Vue 相比 React 的优势在于：
- 编译时优化更彻底（静态提升、Block Tree）
- 响应式系统自动追踪依赖，减少手动优化
- 模板语法更直观，不容易写出性能差的代码
- 运行时性能更优，特别是在大型应用中

## 11、性能监控平台的数据采集和清洗，你是怎样操作的？

性能监控平台的数据采集和清洗是前端性能优化的关键环节，以下详细介绍整个流程：

### 一、数据采集

#### 1. 自动化性能指标采集

**核心 Web Vitals 采集**
```javascript
// 使用 web-vitals 库采集
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

class PerformanceMonitor {
  constructor(reportUrl) {
    this.reportUrl = reportUrl;
    this.metrics = {};
  }

  start() {
    // 采集 CLS
    getCLS((metric) => {
      this.metrics.CLS = metric.value;
      this.report('CLS', metric);
    }, true);

    // 采集 FID
    getFID((metric) => {
      this.metrics.FID = metric.value;
      this.report('FID', metric);
    });

    // 采集 LCP
    getLCP((metric) => {
      this.metrics.LCP = metric.value;
      this.report('LCP', metric);
    });

    // 采集 FCP
    getFCP((metric) => {
      this.metrics.FCP = metric.value;
      this.report('FCP', metric);
    });

    // 采集 TTFB
    getTTFB((metric) => {
      this.metrics.TTFB = metric.value;
      this.report('TTFB', metric);
    });
  }

  report(metricName, metric) {
    const data = {
      metricName,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId() // 业务用户ID
    };

    this.sendToServer(data);
  }

  sendToServer(data) {
    // 使用 sendBeacon 确保数据可靠发送
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.reportUrl, JSON.stringify(data));
    } else {
      // 降级使用 fetch
      fetch(this.reportUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true
      });
    }
  }

  getUserId() {
    // 获取或生成用户ID
    let userId = localStorage.getItem('perf_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('perf_user_id', userId);
    }
    return userId;
  }
}

// 初始化监控
const monitor = new PerformanceMonitor('/api/performance/report');
monitor.start();
```

**自定义业务指标采集**
```javascript
class CustomPerformanceMonitor {
  constructor() {
    this.timings = new Map();
  }

  // 标记时间点
  mark(name) {
    this.timings.set(name, performance.now());
  }

  // 测量两个时间点之间的耗时
  measure(name, startMark, endMark) {
    const start = this.timings.get(startMark);
    const end = this.timings.get(endMark);
    
    if (start !== undefined && end !== undefined) {
      const duration = end - start;
      this.report({
        metricName: name,
        duration,
        start,
        end
      });
    }
  }

  // 监控 API 请求
  monitorApi(apiName) {
    const start = performance.now();
    
    return {
      start,
      end: () => {
        const duration = performance.now() - start;
        this.report({
          metricName: `api_${apiName}`,
          duration,
          type: 'api'
        });
      }
    };
  }

  // 监控组件渲染时间
  monitorComponent(componentName) {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.report({
        metricName: `component_${componentName}`,
        duration,
        type: 'component'
      });
    };
  }

  report(data) {
    // 上报到服务器
    fetch('/api/performance/custom', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        timestamp: Date.now(),
        url: window.location.href
      })
    });
  }
}

// 使用示例
const customMonitor = new CustomPerformanceMonitor();

// 监控 API
const apiMonitor = customMonitor.monitorApi('getUserData');
fetch('/api/user')
  .then(response => {
    apiMonitor.end();
    return response.json();
  });

// 监控组件渲染
const renderEnd = customMonitor.monitorComponent('UserList');
// ... 渲染组件
renderEnd();
```

#### 2. 错误数据采集

```javascript
class ErrorMonitor {
  constructor(reportUrl) {
    this.reportUrl = reportUrl;
    this.setupErrorHandlers();
  }

  setupErrorHandlers() {
    // 捕获 JavaScript 错误
    window.onerror = (message, source, lineno, colno, error) => {
      this.report({
        type: 'js_error',
        message,
        source,
        lineno,
        colno,
        stack: error?.stack,
        timestamp: Date.now()
      });
    };

    // 捕获 Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.report({
        type: 'promise_rejection',
        reason: event.reason,
        timestamp: Date.now()
      });
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.report({
          type: 'resource_error',
          tagName: event.target.tagName,
          src: event.target.src || event.target.href,
          timestamp: Date.now()
        });
      }
    }, true);

    // 捕获 Vue 错误
    if (window.Vue) {
      app.config.errorHandler = (err, vm, info) => {
        this.report({
          type: 'vue_error',
          err,
          info,
          component: vm?.$options?.name,
          timestamp: Date.now()
        });
      };
    }

    // 捕获 React 错误
    class ErrorBoundary extends React.Component {
      componentDidCatch(error, errorInfo) {
        this.report({
          type: 'react_error',
          error,
          errorInfo,
          component: this.props.componentName,
          timestamp: Date.now()
        });
      }
      render() {
        return this.props.children;
      }
    }
  }

  report(data) {
    fetch(this.reportUrl, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    });
  }
}
```

#### 3. 用户行为数据采集

```javascript
class UserBehaviorMonitor {
  constructor() {
    this.events = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 监听点击事件
    document.addEventListener('click', (e) => {
      this.recordEvent({
        type: 'click',
        target: e.target.tagName,
        className: e.target.className,
        id: e.target.id,
        xpath: this.getXPath(e.target),
        timestamp: Date.now()
      });
    }, true);

    // 监听页面停留时间
    this.startPageTiming();

    // 监听滚动行为
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      if (scrollTop !== lastScrollTop) {
        this.recordEvent({
          type: 'scroll',
          scrollTop,
          scrollPercent: scrollTop / (document.body.scrollHeight - window.innerHeight),
          timestamp: Date.now()
        });
        lastScrollTop = scrollTop;
      }
    }, { passive: true });
  }

  startPageTiming() {
    this.pageStartTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
      const duration = Date.now() - this.pageStartTime;
      this.report({
        type: 'page_stay',
        duration,
        url: window.location.href
      });
    });
  }

  getXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    if (element === document.body) {
      return '/html/body';
    }
    
    const ix = Array.from(element.parentNode.children)
      .indexOf(element) + 1;
    
    return `${this.getXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${ix}]`;
  }

  recordEvent(event) {
    this.events.push(event);
    
    // 批量上报，每10条或每10秒上报一次
    if (this.events.length >= 10) {
      this.flush();
    }
  }

  flush() {
    if (this.events.length === 0) return;
    
    fetch('/api/behavior/track', {
      method: 'POST',
      body: JSON.stringify({
        events: this.events,
        url: window.location.href
      })
    });
    
    this.events = [];
  }
}
```

### 二、数据清洗

#### 1. 数据去重和过滤

```javascript
class PerformanceDataCleaner {
  constructor() {
    this.deduplicationCache = new Map();
  }

  // 去重处理
  deduplicate(data) {
    const key = this.generateKey(data);
    
    if (this.deduplicationCache.has(key)) {
      return null; // 重复数据，丢弃
    }
    
    this.deduplicationCache.set(key, data);
    return data;
  }

  generateKey(data) {
    // 根据数据类型生成唯一键
    if (data.type === 'js_error') {
      return `${data.type}_${data.message}_${data.lino}`;
    } else if (data.type === 'api') {
      return `${data.type}_${data.url}_${data.method}`;
    } else {
      return `${data.type}_${data.timestamp}_${data.userId}`;
    }
  }

  // 数据过滤
  filter(data) {
    // 过滤无效数据
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 过滤爬虫和机器人
    if (this.isBot(data.userAgent)) {
      return false;
    }

    // 过滤测试环境数据
    if (this.isTestEnvironment(data.url)) {
      return false;
    }

    // 过滤异常值
    if (data.value !== undefined && (data.value < 0 || data.value > 999999)) {
      return false;
    }

    return true;
  }

  isBot(userAgent) {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i
    ];
    
    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  isTestEnvironment(url) {
    const testPatterns = [
      /localhost/i, /127\.0\.0\.1/, /test\.example\.com/,
      /staging\./i, /dev\./i
    ];
    
    return testPatterns.some(pattern => pattern.test(url));
  }

  // 数据标准化
  normalize(data) {
    const normalized = { ...data };

    // 时间戳标准化（毫秒）
    if (normalized.timestamp) {
      normalized.timestamp = Math.floor(normalized.timestamp / 1000) * 1000;
    }

    // 数值标准化（保留两位小数）
    if (normalized.value !== undefined) {
      normalized.value = Math.round(normalized.value * 100) / 100;
    }

    // URL 标准化（移除查询参数和 hash）
    if (normalized.url) {
      normalized.url = normalized.url.split('?')[0].split('#')[0];
    }

    // 用户ID标准化（去除敏感信息）
    if (normalized.userId) {
      normalized.userId = this.hashUserId(normalized.userId);
    }

    return normalized;
  }

  hashUserId(userId) {
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return `user_${Math.abs(hash)}`;
  }
}
```

#### 2. 数据聚合和统计

```javascript
class PerformanceDataAggregator {
  constructor() {
    this.timeWindows = new Map(); // 时间窗口聚合
  }

  // 聚合性能指标
  aggregateMetrics(data) {
    const timeWindow = this.getTimeWindow(data.timestamp);
    
    if (!this.timeWindows.has(timeWindow)) {
      this.timeWindows.set(timeWindow, {
        timestamp: timeWindow,
        metrics: new Map(),
        count: 0
      });
    }

    const windowData = this.timeWindows.get(timeWindow);
    windowData.count++;

    const metricName = data.metricName;
    if (!windowData.metrics.has(metricName)) {
      windowData.metrics.set(metricName, {
        values: [],
        sum: 0,
        min: Infinity,
        max: -Infinity,
        count: 0
      });
    }

    const metric = windowData.metrics.get(metricName);
    metric.values.push(data.value);
    metric.sum += data.value;
    metric.min = Math.min(metric.min, data.value);
    metric.max = Math.max(metric.max, data.value);
    metric.count++;

    return windowData;
  }

  getTimeWindow(timestamp) {
    // 5分钟时间窗口
    const windowSize = 5 * 60 * 1000;
    return Math.floor(timestamp / windowSize) * windowSize;
  }

  // 计算统计指标
  calculateStatistics(metric) {
    const { values, sum, min, max, count } = metric;
    
    // 排序后计算分位数
    const sorted = [...values].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(count * 0.5)];
    const p90 = sorted[Math.floor(count * 0.9)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];
    
    // 计算平均值
    const mean = sum / count;
    
    // 计算标准差
    const variance = values.reduce((acc, val) => {
      return acc + Math.pow(val - mean, 2);
    }, 0) / count;
    const stdDev = Math.sqrt(variance);

    return {
      count,
      min,
      max,
      mean,
      median: p50,
      p50,
      p90,
      p95,
      p99,
      stdDev
    };
  }

  // 生成聚合报告
  generateReport() {
    const report = {
      timeWindows: [],
      summary: {
        totalMetrics: 0,
        uniqueMetrics: new Set(),
        timeRange: { start: Infinity, end: -Infinity }
      }
    };

    for (const [timestamp, windowData] of this.timeWindows) {
      const windowReport = {
        timestamp,
        count: windowData.count,
        metrics: {}
      };

      for (const [metricName, metric] of windowData.metrics) {
        windowReport.metrics[metricName] = this.calculateStatistics(metric);
        report.summary.uniqueMetrics.add(metricName);
        report.summary.totalMetrics += metric.count;
      }

      report.timeWindows.push(windowReport);
      report.summary.timeRange.start = Math.min(
        report.summary.timeRange.start,
        timestamp
      );
      report.summary.timeRange.end = Math.max(
        report.summary.timeRange.end,
        timestamp
      );
    }

    report.summary.uniqueMetrics = Array.from(report.summary.uniqueMetrics);
    return report;
  }
}
```

#### 3. 异常检测

```javascript
class PerformanceAnomalyDetector {
  constructor() {
    this.baseline = new Map(); // 基线数据
    this.thresholds = {
      deviationMultiplier: 2, // 标准差倍数
      minSampleSize: 30 // 最小样本数
    };
  }

  // 更新基线
  updateBaseline(metricName, value) {
    if (!this.baseline.has(metricName)) {
      this.baseline.set(metricName, {
        values: [],
        mean: 0,
        stdDev: 0,
        count: 0
      });
    }

    const baseline = this.baseline.get(metricName);
    baseline.values.push(value);
    baseline.count++;

    // 重新计算统计值
    if (baseline.count > 0) {
      baseline.mean = baseline.values.reduce((sum, v) => sum + v, 0) / baseline.count;
      
      const variance = baseline.values.reduce((acc, v) => {
        return acc + Math.pow(v - baseline.mean, 2);
      }, 0) / baseline.count;
      
      baseline.stdDev = Math.sqrt(variance);
    }

    return baseline;
  }

  // 检测异常
  detectAnomaly(metricName, value) {
    const baseline = this.baseline.get(metricName);
    
    if (!baseline || baseline.count < this.thresholds.minSampleSize) {
      return { isAnomaly: false, reason: 'Insufficient baseline data' };
    }

    const upperThreshold = baseline.mean + this.thresholds.deviationMultiplier * baseline.stdDev;
    const lowerThreshold = baseline.mean - this.thresholds.deviationMultiplier * baseline.stdDev;

    if (value > upperThreshold) {
      return {
        isAnomaly: true,
        type: 'high',
        value,
        threshold: upperThreshold,
        baseline: baseline.mean,
        deviation: (value - baseline.mean) / baseline.stdDev
      };
    }

    if (value < lowerThreshold) {
      return {
        isAnomaly: true,
        type: 'low',
        value,
        threshold: lowerThreshold,
        baseline: baseline.mean,
        deviation: (baseline.mean - value) / baseline.stdDev
      };
    }

    return { isAnomaly: false, value, baseline: baseline.mean };
  }

  // 批量检测
  detectAnomaliesBatch(metrics) {
    const anomalies = [];

    for (const metric of metrics) {
      const result = this.detectAnomaly(metric.name, metric.value);
      
      if (result.isAnomaly) {
        anomalies.push({
          metricName: metric.name,
          ...result,
          timestamp: metric.timestamp
        });
      }

      // 更新基线（排除异常值）
      if (!result.isAnomaly) {
        this.updateBaseline(metric.name, metric.value);
      }
    }

    return anomalies;
  }
}
```

### 三、数据存储和查询

```javascript
// MongoDB 存储方案示例
const mongoose = require('mongoose');

const PerformanceMetricSchema = new mongoose.Schema({
  metricName: { type: String, required: true, index: true },
  value: { type: Number, required: true },
  rating: { type: String, enum: ['good', 'needs-improvement', 'poor'] },
  timestamp: { type: Date, required: true, index: true },
  url: { type: String, index: true },
  userId: { type: String, index: true },
  userAgent: { type: String },
  environment: { type: String, enum: ['production', 'staging', 'development'] },
  metadata: { type: Object }
}, {
  timestamps: true
});

// 创建复合索引
PerformanceMetricSchema.index({ metricName: 1, timestamp: -1 });
PerformanceMetricSchema.index({ userId: 1, timestamp: -1 });

const PerformanceMetric = mongoose.model('PerformanceMetric', PerformanceMetricSchema);

// 数据查询和分析
class PerformanceDataService {
  // 查询指定时间段的指标
  async getMetricsByTimeRange(metricName, startTime, endTime) {
    return PerformanceMetric.find({
      metricName,
      timestamp: { $gte: startTime, $lte: endTime }
    }).sort({ timestamp: 1 });
  }

  // 计算百分位数
  async getPercentiles(metricName, startTime, endTime, percentiles = [50, 90, 95, 99]) {
    const metrics = await this.getMetricsByTimeRange(metricName, startTime, endTime);
    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    
    const result = {};
    for (const p of percentiles) {
      const index = Math.floor(values.length * p / 100);
      result[`p${p}`] = values[index];
    }
    
    return result;
  }

  // 趋势分析
  async getTrend(metricName, interval = '1h', limit = 24) {
    const pipeline = [
      {
        $match: {
          metricName,
          timestamp: { $gte: new Date(Date.now() - limit * this.getIntervalMs(interval)) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d %H:%M',
              date: '$timestamp',
              timezone: 'Asia/Shanghai'
            }
          },
          avgValue: { $avg: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    return PerformanceMetric.aggregate(pipeline);
  }

  getIntervalMs(interval) {
    const intervals = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return intervals[interval] || intervals['1h'];
  }
}
```

### 四、完整的数据处理流程

```javascript
class PerformanceMonitoringPipeline {
  constructor(config) {
    this.collector = new PerformanceMonitor(config.reportUrl);
    this.cleaner = new PerformanceDataCleaner();
    this.aggregator = new PerformanceDataAggregator();
    this.anomalyDetector = new PerformanceAnomalyDetector();
    this.dataService = new PerformanceDataService();
  }

  async processIncomingData(rawData) {
    try {
      // 1. 去重
      const deduplicated = this.cleaner.deduplicate(rawData);
      if (!deduplicated) return;

      // 2. 过滤
      if (!this.cleaner.filter(deduplicated)) return;

      // 3. 标准化
      const normalized = this.cleaner.normalize(deduplicated);

      // 4. 检测异常
      const anomaly = this.anomalyDetector.detectAnomaly(
        normalized.metricName,
        normalized.value
      );

      // 5. 标记异常
      if (anomaly.isAnomaly) {
        normalized.isAnomaly = true;
        normalized.anomalyType = anomaly.type;
        normalized.anomalyDeviation = anomaly.deviation;
      }

      // 6. 存储到数据库
      await this.dataService.saveMetric(normalized);

      // 7. 聚合到时间窗口
      this.aggregator.aggregateMetrics(normalized);

      // 8. 如果是异常，发送告警
      if (anomaly.isAnomaly) {
        await this.sendAlert(normalized, anomaly);
      }

      console.log('Data processed successfully:', normalized.metricName);
    } catch (error) {
      console.error('Error processing data:', error);
      // 错误数据存到死信队列
      await this.dataService.saveToDeadLetterQueue(rawData, error);
    }
  }

  async sendAlert(data, anomaly) {
    // 发送告警通知
    const alert = {
      type: 'performance_anomaly',
      metricName: data.metricName,
      anomalyType: anomaly.type,
      value: data.value,
      baseline: anomaly.baseline,
      deviation: anomaly.deviation,
      url: data.url,
      timestamp: data.timestamp
    };

    await fetch('/api/alerts/send', {
      method: 'POST',
      body: JSON.stringify(alert)
    });
  }

  // 定期生成报告
  async generateDailyReport() {
    const report = this.aggregator.generateReport();
    await this.dataService.saveDailyReport(report);
    return report;
  }
}
```

### 五、最佳实践

1. **采样策略**
```javascript
// 根据用户采样，减少数据量
const shouldSample = () => {
  const sampleRate = 0.1; // 10% 采样率
  return Math.random() < sampleRate;
};

if (shouldSample()) {
  monitor.collect();
}
```

2. **批量上报**
```javascript
// 累积一批数据后一次性上报
class BatchReporter {
  constructor(reportUrl, batchSize = 10, flushInterval = 5000) {
    this.reportUrl = reportUrl;
    this.batch = [];
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startFlushTimer();
  }

  add(data) {
    this.batch.push(data);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  flush() {
    if (this.batch.length === 0) return;
    
    fetch(this.reportUrl, {
      method: 'POST',
      body: JSON.stringify(this.batch),
      keepalive: true
    });
    
    this.batch = [];
  }

  startFlushTimer() {
    setInterval(() => this.flush(), this.flushInterval);
  }
}
```

3. **数据压缩**
```javascript
// 使用 gzip 压缩数据
const compressedData = pako.gzip(JSON.stringify(data));
fetch('/api/performance', {
  method: 'POST',
  body: compressedData,
  headers: {
    'Content-Encoding': 'gzip',
    'Content-Type': 'application/json'
  }
});
```

---

## 12、React useTransition 在实际工程中能起到优化的作用么？你怎么落地的？

**useTransition 的作用和原理**

useTransition 是 React 18 引入的并发特性，用于标记低优先级更新，让 React 优先处理高优先级更新（如用户输入）。

### 一、useTransition 的核心价值

#### 1. 区分优先级更新
```javascript
import { useState, useTransition } from 'react';

function SearchComponent({ items }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    // 高优先级更新：立即响应用户输入
    const value = e.target.value;
    setQuery(value);

    // 低优先级更新：搜索和过滤操作
    startTransition(() => {
      const filtered = items.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      {isPending && <div className="loading">Searching...</div>}
      <ul>
        {results.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### 2. 保持响应性
```javascript
// 没有 useTransition：输入卡顿
function BadSearch({ items }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // 每次输入都执行耗时的过滤操作
    const filtered = items.filter(item =>
      item.toLowerCase().includes(value.toLowerCase())
    );
    setResults(filtered);
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      <ResultsList items={results} />
    </div>
  );
}

// 使用 useTransition：输入流畅
function GoodSearch({ items }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value); // 高优先级，立即更新

    startTransition(() => {
      const filtered = items.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered); // 低优先级，可中断
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultsList items={results} />
    </div>
  );
}
```

### 二、实际工程落地案例

#### 案例1：搜索和列表过滤

```javascript
import { useState, useTransition, useMemo } from 'react';

function ProductSearch({ products }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [isPending, startTransition] = useTransition();

  // 高优先级更新
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value); // 立即更新输入框
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value); // 立即更新下拉框
  };

  const handlePriceChange = (range) => {
    setPriceRange(range); // 立即更新滑块
  };

  // 低优先级更新：过滤产品
  const filterProducts = () => {
    startTransition(() => {
      // 这些计算可能耗时，放在 transition 中
      const filtered = products.filter(product => {
        const matchesQuery = product.name
          .toLowerCase()
          .includes(query.toLowerCase());
        
        const matchesCategory = category === 'all' 
          || product.category === category;
        
        const matchesPrice = product.price >= priceRange[0] 
          && product.price <= priceRange[1];
        
        return matchesQuery && matchesCategory && matchesPrice;
      });

      setFilteredProducts(filtered);
    });
  };

  // 使用防抖减少 transition 触发次数
  const debouncedFilter = useMemo(
    () => debounce(filterProducts, 300),
    [query, category, priceRange, products]
  );

  // 当查询条件变化时触发过滤
  useEffect(() => {
    debouncedFilter();
    return () => debouncedFilter.cancel();
  }, [debouncedFilter]);

  return (
    <div className="product-search">
      <input
        type="text"
        value={query}
        onChange={handleQueryChange}
        placeholder="Search products..."
      />

      <select value={category} onChange={handleCategoryChange}>
        <option value="all">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>

      <PriceSlider
        value={priceRange}
        onChange={handlePriceChange}
      />

      {isPending && <LoadingSpinner />}
      
      <ProductList products={filteredProducts} />
    </div>
  );
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    executedFunction.cancel = () => clearTimeout(timeout);
  };
}
```

#### 案例2：数据表格排序和分页

```javascript
import { useState, useTransition, useMemo } from 'react';

function DataTable({ data, columns }) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const pageSize = 20;

  // 高优先级：点击排序按钮立即反馈
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc'
      ? 'desc'
      : 'asc';
    
    setSortConfig({ key, direction }); // 立即更新排序状态

    // 低优先级：实际排序操作
    startTransition(() => {
      setCurrentPage(1); // 重置到第一页
    });
  };

  // 高优先级：点击页码立即反馈
  const handlePageChange = (page) => {
    setCurrentPage(page); // 立即更新页码
  };

  // 低优先级：数据排序和分页
  const { sortedData, totalPages } = useMemo(() => {
    let sorted = [...data];
    
    // 排序
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 分页
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = sorted.slice(startIndex, endIndex);
    const totalPages = Math.ceil(sorted.length / pageSize);

    return { sortedData: paginatedData, totalPages };
  }, [data, sortConfig, currentPage, pageSize]);

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                onClick={() => handleSort(column.key)}
                className={sortConfig.key === column.key ? 'sorted' : ''}
              >
                {column.label}
                {sortConfig.key === column.key && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map(column => (
                <td key={column.key}>
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {isPending && <LoadingOverlay />}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
```

#### 案例3：表单实时验证

```javascript
import { useState, useTransition, useEffect } from 'react';

function AsyncValidationForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isPending, startTransition] = useTransition();

  // 高优先级：立即更新表单值
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 低优先级：异步验证
  const validateField = async (field, value) => {
    startTransition(async () => {
      try {
        // 模拟 API 调用
        const response = await fetch(`/api/validate/${field}`, {
          method: 'POST',
          body: JSON.stringify({ [field]: value })
        });
        
        const result = await response.json();
        
        setErrors(prev => ({
          ...prev,
          [field]: result.valid ? null : result.message
        }));
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          [field]: 'Validation failed'
        }));
      }
    });
  };

  // 防抖验证
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username) {
        validateField('username', formData.username);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        validateField('email', formData.email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // 提交逻辑
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          value={formData.username}
          onChange={handleChange('username')}
          className={errors.username ? 'error' : ''}
        />
        {errors.username && (
          <span className="error-message">{errors.username}</span>
        )}
        {isPending && <span className="validating">Validating...</span>}
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && (
          <span className="error-message">{errors.email}</span>
        )}
        {isPending && <span className="validating">Validating...</span>}
      </div>

      <button type="submit" disabled={Object.keys(errors).some(key => errors[key])}>
        Submit
      </button>
    </form>
  );
}
```

#### 案例4：图表数据更新

```javascript
import { useState, useTransition, useEffect } from 'react';

function DashboardCharts() {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState(null);
  const [isPending, startTransition] = useTransition();

  // 高优先级：立即更新时间选择器
  const handleTimeRangeChange = (range) => {
    setTimeRange(range); // 立即更新 UI
  };

  // 低优先级：获取图表数据
  useEffect(() => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/charts?range=${timeRange}`);
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    });
  }, [timeRange]);

  return (
    <div className="dashboard">
      <TimeRangeSelector
        value={timeRange}
        onChange={handleTimeRangeChange}
      />

      {isPending && <LoadingOverlay />}

      {chartData && (
        <div className="charts">
          <LineChart data={chartData.sales} title="Sales Trend" />
          <BarChart data={chartData.users} title="User Growth" />
          <PieChart data={chartData.categories} title="Categories" />
        </div>
      )}
    </div>
  );
}
```

### 三、useDeferredValue 配合使用

```javascript
import { useState, useTransition, useDeferredValue, useMemo } from 'react';

function AdvancedSearch({ items }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // 延迟更新查询值
  const deferredQuery = useDeferredValue(query);

  // 使用延迟的值进行过滤
  const filteredItems = useMemo(() => {
    console.log('Filtering items...');
    return items.filter(item =>
      item.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [items, deferredQuery]);

  const handleChange = (e) => {
    const value = e.target.value;
    
    // 高优先级：立即更新输入框
    setQuery(value);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
        style={{
          borderColor: isPending ? 'orange' : 'green'
        }}
      />
      
      <p>Filtered: {filteredItems.length} / {items.length}</p>
      
      <ul>
        {filteredItems.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 四、最佳实践和注意事项

#### 1. 识别适用场景
```javascript
// ✅ 适合使用 useTransition 的场景
- 搜索过滤
- 数据排序
- 分页加载
- 表单验证
- 图表数据更新
- 列表渲染

// ❌ 不适合使用 useTransition 的场景
- 按钮点击事件（需要立即响应）
- 表单提交（需要立即处理）
- 模态框打开/关闭
- 导航跳转
```

#### 2. 与 Suspense 配合
```javascript
import { Suspense, useState, useTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    startTransition(() => {
      // 这里会触发 Suspense
      setSearchResults(fetchSearchResults(value));
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      <Suspense fallback={<div>Loading results...</div>}>
        <Results />
      </Suspense>
    </div>
  );
}
```

#### 3. 性能监控
```javascript
import { Profiler, useState, useTransition } from 'react';

function MonitoredComponent({ items }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    startTransition(() => {
      // 监控 transition 的性能
    });
  };

  return (
    <Profiler id="search-component" onRender={(id, phase, actualDuration) => {
      console.log(`Search ${phase}: ${actualDuration}ms`);
    }}>
      <SearchInput value={query} onChange={handleChange} />
      {isPending && <LoadingSpinner />}
      <ResultsList items={items} query={query} />
    </Profiler>
  );
}
```

### 五、总结

**useTransition 的优化效果：**
1. **提升输入响应性**：用户输入不再卡顿
2. **改善用户体验**：立即反馈，延迟渲染结果
3. **降低 FID**：减少首次输入延迟
4. **提高可中断性**：长时间计算可被用户输入中断

**落地要点：**
1. 识别高优先级更新（用户交互）和低优先级更新（数据处理）
2. 只在确实需要的地方使用，避免过度使用
3. 配合防抖、节流使用，减少不必要的更新
4. 使用 isPending 状态提供视觉反馈
5. 考虑使用 useDeferredValue 进一步优化
6. 监控性能，验证优化效果

---

## 13、如何监控一个接口的返回时间与是否出错？

接口监控是确保系统稳定性和性能的重要手段。以下是完整的监控方案：

### 一、基础 API 监控实现

#### 1. 使用 Fetch API 监控

```javascript
class ApiMonitor {
  constructor(reportUrl) {
    this.reportUrl = reportUrl;
    this.metrics = new Map();
  }

  // 包装 fetch 方法
  async monitoredFetch(url, options = {}) {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    
    try {
      const response = await fetch(url, options);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 记录成功指标
      this.recordMetric({
        requestId,
        url,
        method: options.method || 'GET',
        duration,
        status: response.status,
        success: response.ok,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 记录错误指标
      this.recordError({
        requestId,
        url,
        method: options.method || 'GET',
        duration,
        error: error.message,
        errorType: error.name,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  recordMetric(metric) {
    this.metrics.set(metric.requestId, metric);
    
    // 上报到监控平台
    this.sendToServer({
      type: 'api_metric',
      ...metric
    });
  }

  recordError(error) {
    this.metrics.set(error.requestId, error);
    
    // 上报到监控平台
    this.sendToServer({
      type: 'api_error',
      ...error
    });
  }

  sendToServer(data) {
    // 使用 sendBeacon 确保数据可靠发送
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.reportUrl, JSON.stringify(data));
    } else {
      fetch(this.reportUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true
      });
    }
  }

  // 获取接口统计信息
  getStats(url) {
    const urlMetrics = Array.from(this.metrics.values())
      .filter(m => m.url === url);

    const successful = urlMetrics.filter(m => m.success);
    const failed = urlMetrics.filter(m => !m.success);

    if (successful.length === 0) {
      return null;
    }

    const durations = successful.map(m => m.duration);
    durations.sort((a, b) => a - b);

    return {
      totalRequests: urlMetrics.length,
      successRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / urlMetrics.length * 100).toFixed(2),
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p50: durations[Math.floor(durations.length * 0.5)],
      p90: durations[Math.floor(durations.length * 0.9)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)]
    };
  }
}

// 使用示例
const monitor = new ApiMonitor('/api/monitor/report');

// 监控所有 fetch 请求
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  return monitor.monitoredFetch(url, options);
};

// 使用
fetch('/api/users')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

#### 2. 使用 Axios 拦截器监控

```javascript
import axios from 'axios';

class AxiosApiMonitor {
  constructor(reportUrl) {
    this.reportUrl = reportUrl;
    this.setupInterceptors();
  }

  setupInterceptors() {
    // 请求拦截器
    axios.interceptors.request.use(
      (config) => {
        // 添加开始时间戳
        config.metadata = { startTime: performance.now() };
        return config;
      },
      (error) => {
        this.reportError({
          type: 'request_error',
          error: error.message,
          config: error.config,
          timestamp: Date.now()
        });
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    axios.interceptors.response.use(
      (response) => {
        const duration = performance.now() - response.config.metadata.startTime;
        
        this.reportMetric({
          type: 'api_metric',
          url: response.config.url,
          method: response.config.method,
          duration,
          status: response.status,
          success: response.status >= 200 && response.status < 300,
          timestamp: Date.now()
        });

        return response;
      },
      (error) => {
        const duration = performance.now() - error.config.metadata.startTime;
        
        this.reportError({
          type: 'api_error',
          url: error.config?.url,
          method: error.config?.method,
          duration,
          status: error.response?.status,
          error: error.message,
          errorType: error.code,
          timestamp: Date.now()
        });

        return Promise.reject(error);
      }
    );
  }

  reportMetric(metric) {
    this.sendToServer(metric);
  }

  reportError(error) {
    this.sendToServer(error);
  }

  sendToServer(data) {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.reportUrl, JSON.stringify(data));
    } else {
      fetch(this.reportUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true
      });
    }
  }
}

// 使用示例
const axiosMonitor = new AxiosApiMonitor('/api/monitor/report');

// 正常使用 axios
axios.get('/api/users')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

### 二、高级监控功能

#### 1. 接口性能阈值告警

```javascript
class ApiPerformanceMonitor {
  constructor(reportUrl) {
    this.reportUrl = reportUrl;
    this.thresholds = {
      warning: 1000,  // 1秒
      critical: 3000  // 3秒
    };
    this.alertHistory = new Map();
  }

  async monitoredFetch(url, options = {}) {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    
    try {
      const response = await fetch(url, options);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 检查性能阈值
      this.checkPerformanceThreshold(url, duration);

      this.recordMetric({
        requestId,
        url,
        method: options.method || 'GET',
        duration,
        status: response.status,
        success: response.ok,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordError({
        requestId,
        url,
        method: options.method || 'GET',
        duration,
        error: error.message,
        errorType: error.name,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  checkPerformanceThreshold(url, duration) {
    let level = 'normal';
    
    if (duration > this.thresholds.critical) {
      level = 'critical';
    } else if (duration > this.thresholds.warning) {
      level = 'warning';
    }

    if (level !== 'normal') {
      this.sendAlert({
        type: 'performance',
        level,
        url,
        duration,
        threshold: level === 'critical' ? this.thresholds.critical : this.thresholds.warning,
        timestamp: Date.now()
      });
    }
  }

  sendAlert(alert) {
    // 防止告警泛滥
    const alertKey = `${alert.type}_${alert.url}_${alert.level}`;
    const now = Date.now();
    const lastAlert = this.alertHistory.get(alertKey);

    if (lastAlert && (now - lastAlert < 60000)) {
      // 1分钟内不重复告警
      return;
    }

    this.alertHistory.set(alertKey, now);

    // 发送告警
    fetch('/api/alerts/send', {
      method: 'POST',
      body: JSON.stringify(alert)
    });
  }
}
```

#### 2. 接口错误率监控

```javascript
class ApiErrorRateMonitor {
  constructor(reportUrl) {
    this.reportUrl = reportUrl;
    this.errorCounts = new Map();
    this.totalCounts = new Map();
    this.errorRateThreshold = 0.05; // 5% 错误率
  }

  recordRequest(url, success) {
    const normalizedUrl = this.normalizeUrl(url);
    
    // 更新总数
    const totalCount = (this.totalCounts.get(normalizedUrl) || 0) + 1;
    this.totalCounts.set(normalizedUrl, totalCount);

    // 更新错误数
    if (!success) {
      const errorCount = (this.errorCounts.get(normalizedUrl) || 0) + 1;
      this.errorCounts.set(normalizedUrl, errorCount);

      // 检查错误率
      this.checkErrorRate(normalizedUrl, errorCount, totalCount);
    }
  }

  checkErrorRate(url, errorCount, totalCount) {
    const errorRate = errorCount / totalCount;

    if (errorRate > this.errorRateThreshold) {
      this.sendAlert({
        type: 'high_error_rate',
        url,
        errorRate: (errorRate * 100).toFixed(2),
        errorCount,
        totalCount,
        threshold: (this.errorRateThreshold * 100).toFixed(2),
        timestamp: Date.now()
      });
    }
  }

  normalizeUrl(url) {
    // 移除 URL 中的动态参数
    return url.replace(/\/\d+/g, '/{id}')
              .replace(/\?.*/, '');
  }

  getErrorRate(url) {
    const normalizedUrl = this.normalizeUrl(url);
    const errorCount = this.errorCounts.get(normalizedUrl) || 0;
    const totalCount = this.totalCounts.get(normalizedUrl) || 0;

    if (totalCount === 0) return 0;

    return errorCount / totalCount;
  }

  reset(url) {
    const normalizedUrl = this.normalizeUrl(url);
    this.errorCounts.delete(normalizedUrl);
    this.totalCounts.delete(normalizedUrl);
  }
}
```

#### 3. 接口依赖关系监控

```javascript
class ApiDependencyMonitor {
  constructor() {
    this.dependencies = new Map();
    this.callGraph = new Map();
  }

  recordCall(caller, callee, duration, success) {
    // 记录调用关系
    const key = `${caller} -> ${callee}`;
    if (!this.callGraph.has(key)) {
      this.callGraph.set(key, {
        calls: 0,
        totalDuration: 0,
        errors: 0,
        lastCalled: null
      });
    }

    const relation = this.callGraph.get(key);
    relation.calls++;
    relation.totalDuration += duration;
    if (!success) relation.errors++;
    relation.lastCalled = Date.now();

    // 构建依赖图
    this.buildDependencyGraph(caller, callee);
  }

  buildDependencyGraph(caller, callee) {
    if (!this.dependencies.has(caller)) {
      this.dependencies.set(caller, new Set());
    }
    this.dependencies.get(caller).add(callee);
  }

  // 检测循环依赖
  detectCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (node, path = []) => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = this.dependencies.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, path);
        } else if (recursionStack.has(neighbor)) {
          // 找到循环
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart);
          cycles.push([...cycle, neighbor]);
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const node of this.dependencies.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  // 分析关键路径
  analyzeCriticalPath() {
    const analysis = [];

    for (const [key, relation] of this.callGraph) {
      const [caller, callee] = key.split(' -> ');
      const avgDuration = relation.totalDuration / relation.calls;
      const errorRate = relation.errors / relation.calls;

      analysis.push({
        caller,
        callee,
        calls: relation.calls,
        avgDuration: avgDuration.toFixed(2),
        errorRate: (errorRate * 100).toFixed(2),
        lastCalled: relation.lastCalled
      });
    }

    // 按平均耗时排序
    return analysis.sort((a, b) => b.avgDuration - a.avgDuration);
  }
}
```

### 三、可视化仪表盘

#### 1. 实时监控仪表盘组件

```javascript
import React, { useState, useEffect } from 'react';

function ApiMonitorDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedApi, setSelectedApi] = useState(null);

  useEffect(() => {
    // 轮询获取最新数据
    const interval = setInterval(() => {
      fetchMetrics();
      fetchAlerts();
    }, 5000);

    fetchMetrics();
    fetchAlerts();

    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitor/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/monitor/alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  return (
    <div className="api-monitor-dashboard">
      <h1>API Monitor Dashboard</h1>
      
      {/* 概览卡片 */}
      <div className="overview-cards">
        <div className="card">
          <h3>Total Requests</h3>
          <p className="value">{metrics.reduce((sum, m) => sum + m.totalRequests, 0)}</p>
        </div>
        <div className="card">
          <h3>Success Rate</h3>
          <p className="value">
            {metrics.length > 0 
              ? (metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length).toFixed(2)
              : '0'}%
          </p>
        </div>
        <div className="card">
          <h3>Avg Duration</h3>
          <p className="value">
            {metrics.length > 0
              ? (metrics.reduce((sum, m) => sum + parseFloat(m.avgDuration), 0) / metrics.length).toFixed(2)
              : '0'}ms
          </p>
        </div>
        <div className="card">
          <h3>Active Alerts</h3>
          <p className="value">{alerts.length}</p>
        </div>
      </div>

      {/* 告警列表 */}
      <div className="alerts-section">
        <h2>Recent Alerts</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Level</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(alert => (
              <tr key={alert.id}>
                <td>{new Date(alert.timestamp).toLocaleString()}</td>
                <td>{alert.type}</td>
                <td className={alert.level}>{alert.level}</td>
                <td>{alert.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* API 详情 */}
      <div className="api-details-section">
        <h2>API Performance</h2>
        <table>
          <thead>
            <tr>
              <th>API</th>
              <th>Total</th>
              <th>Success</th>
              <th>Error</th>
              <th>Avg (ms)</th>
              <th>P50 (ms)</th>
              <th>P90 (ms)</th>
              <th>P95 (ms)</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(metric => (
              <tr 
                key={metric.url}
                onClick={() => setSelectedApi(metric)}
                className={selectedApi?.url === metric.url ? 'selected' : ''}
              >
                <td>{metric.url}</td>
                <td>{metric.totalRequests}</td>
                <td>{metric.successRequests}</td>
                <td>{metric.failedRequests}</td>
                <td>{metric.avgDuration.toFixed(2)}</td>
                <td>{metric.p50.toFixed(2)}</td>
                <td>{metric.p90.toFixed(2)}</td>
                <td>{metric.p95.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 选中 API 的详情 */}
      {selectedApi && (
        <div className="api-detail-panel">
          <h3>{selectedApi.url}</h3>
          <div className="charts">
            <ResponseTimeChart url={selectedApi.url} />
            <ErrorRateChart url={selectedApi.url} />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 四、最佳实践

1. **采样策略**：对于高频接口，使用采样减少数据量
2. **异常检测**：使用统计方法自动检测异常
3. **告警阈值**：设置合理的告警阈值，避免告警泛滥
4. **数据保留**：合理设置数据保留策略，平衡存储成本和历史分析
5. **可视化**：提供直观的可视化界面，便于快速定位问题

---

## 14、监控 React 原理有个库叫 @Welldone-software/why-did-you-reander,他的原理是什么？

**why-did-you-render 的工作原理**

`@welldone-software/why-did-you-render` 是一个用于监控 React 组件重新渲染原因的工具，帮助开发者识别不必要的渲染。

### 一、核心原理

#### 1. React 的渲染机制

React 使用虚拟 DOM 和协调算法（Reconciliation）来决定何时更新真实 DOM：

```javascript
// React 的更新流程
1. 状态改变（setState）
2. 创建新的虚拟 DOM 树
3. 与旧的虚拟 DOM 树比较（Diff 算法）
4. 计算最小变更
5. 更新真实 DOM
```

**why-did-you-render 的工作原理：**

```javascript
// 简化的实现原理
class WhyDidYouRender {
  constructor() {
    this.renderLog = new Map();
    this.patches = new WeakMap();
  }

  // Hook 到 React 的协调过程
  patchReact() {
    // 1. 拦截 React 的 reconcile 函数
    const originalReconciler = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;

    // 2. 记录渲染前的 props 和 state
    const originalRender = React.Component.prototype.render;
    React.Component.prototype.render = function() {
      const instance = this;
      const componentName = instance.constructor.name;

      // 记录本次渲染的 props 和 state
      this.renderLog.set(componentName, {
        prevProps: instance.props,
        prevState: instance.state,
        renderCount: (this.renderLog.get(componentName)?.renderCount || 0) + 1
      });

      // 调用原始 render
      const result = originalRender.call(instance);

      // 3. 记录渲染后的 props 和 state
      const afterRender = {
        nextProps: instance.props,
        nextState: instance.state,
        renderTime: performance.now()
      };

      // 4. 比较前后差异
      this.comparePropsAndState(componentName, afterRender);

      return result;
    };
  }

  // 比较 props 和 state 的变化
  comparePropsAndState(componentName, { nextProps, prevState }) {
    const log = this.renderLog.get(componentName);
    
    // 比较 props
    const propsDiff = this.compare(log.prevProps, nextProps);
    
    // 比较 state
    const stateDiff = this.compare(log.prevState, prevState);

    // 如果没有实质性变化，记录警告
    if (!propsDiff.hasChanges && !stateDiff.hasChanges) {
      console.warn(`Why did ${componentName} re-render?`, {
        reason: 'No props or state changes detected',
        prevProps: log.prevProps,
        nextProps: nextProps,
        prevState: log.prevState,
        nextState: prevState
      });
    }
  }

  // 深度比较两个对象
  compare(obj1, obj2) {
    const hasChanges = false;
    const changes = [];

    if (obj1 === obj2) {
      return { hasChanges, changes };
    }

    // 处理 null/undefined
    if (obj1 == null || obj2 == null) {
      return { 
        hasChanges: obj1 !== obj2, 
        changes: [{ path: 'root', from: obj1, to: obj2 }]
      };
    }

    // 处理基本类型
    if (typeof obj1 !== 'object') {
      return { 
        hasChanges: obj1 !== obj2, 
        changes: [{ path: 'root', from: obj1, to: obj2 }]
      };
    }

    // 处理数组
    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return { 
        hasChanges: true, 
        changes: [{ path: 'root', from: obj1, to: obj2 }]
      };
    }

    // 递归比较对象属性
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const value1 = obj1[key];
      const value2 = obj2[key];

      if (value1 === value2) continue;

      // 深度比较
      if (typeof value1 === 'object' && typeof value2 === 'object') {
        const nestedDiff = this.compare(value1, value2);
        if (nestedDiff.hasChanges) {
          hasChanges = true;
          changes.push({
            path: key,
            ...nestedDiff
          });
        }
      } else {
        hasChanges = true;
        changes.push({
          path: key,
          from: value1,
          to: value2
        });
      }
    }

    return { hasChanges, changes };
  }
}
```

### 二、实际使用示例

```javascript
// 安装
npm install @welldone-software/why-did-you-render

// 在项目入口文件中配置
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackExtraHooks: [[require('react-redux/lib/hooks/connect'), 'useSelector']],
    logOnDifferentValues: true,
    customName: (name) => {
      // 自定义组件名称
      return name.replace('Connect(', 'Redux-');
    }
  });
}

// 组件使用示例
class MyComponent extends React.Component {
  shouldComponentUpdate(nextProps) {
    // 手动优化
    return this.props.id !== nextProps.id;
  }

  render() {
    return <div>{this.props.name}</div>;
  }
}

// 标记需要监控的组件
MyComponent.whyDidYouRender = true;

// 函数组件示例
const FunctionalComponent = React.memo(function FunctionalComponent({ data }) {
  return <div>{data.name}</div>;
});

FunctionalComponent.whyDidYouRender = true;
```

### 三、常见问题和解决方案

#### 1. Props 引用变化导致的重新渲染

```javascript
// ❌ 问题：每次渲染都创建新的对象/函数
function ParentComponent() {
  return (
    <ChildComponent 
      data={{ id: 1, name: 'Test' }}
      onClick={() => console.log('clicked')}
    />
  );
}

// ✅ 解决方案1：使用 useMemo 和 useCallback
function ParentComponent() {
  const data = useMemo(() => ({ id: 1, name: 'Test' }), []);
  const handleClick = useCallback(() => console.log('clicked'), []);

  return (
    <ChildComponent data={data} onClick={handleClick} />
  );
}

// ✅ 解决方案2：提取到组件外部
const DEFAULT_DATA = { id: 1, name: 'Test' };

function ParentComponent() {
  return <ChildComponent data={DEFAULT_DATA} />;
}
```

#### 2. Context 变化导致所有消费者重新渲染

```javascript
// ❌ 问题：Context 变化导致所有消费者重新渲染
const MyContext = React.createContext();

function ParentComponent() {
  const [state, setState] = useState({ count: 0 });
  
  return (
    <MyContext.Provider value={state}>
      <Child1 />
      <Child2 />
      <Child3 />
    </MyContext.Provider>
  );
}

// ✅ 解决方案：拆分 Context 或使用选择器
const CountContext = React.createContext();
const NameContext = React.createContext();

function ParentComponent() {
  const [state, setState] = useState({ count: 0, name: 'Test' });
  
  return (
    <CountContext.Provider value={state.count}>
      <NameContext.Provider value={state.name}>
        <Child1 /> {/* 只订阅 count */}
        <Child2 /> {/* 只订阅 name */}
      </NameContext.Provider>
    </CountContext.Provider>
  );
}
```

#### 3. 列表渲染中使用 index 作为 key

```javascript
// ❌ 问题：使用 index 作为 key 导致不必要的重新渲染
function ListComponent({ items }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          <ItemComponent data={item} />
        </li>
      ))}
    </ul>
  );
}

// ✅ 解决方案：使用唯一 ID
function ListComponent({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          <ItemComponent data={item} />
        </li>
      ))}
    </ul>
  );
}
```

### 四、高级用法

#### 1. 自定义比较逻辑

```javascript
// 为特定组件配置自定义比较
MyComponent.whyDidYouRender = {
  customName: 'MyCustomName',
  trackHooks: true,
  trackExtraHooks: [
    [useCustomHook, 'customHookValue']
  ]
};
```

#### 2. 集成到测试中

```javascript
// 使用 Jest 监控组件渲染
import renderer from 'react-test-renderer';
import whyDidYouRender from '@welldone-software/why-did-you-render';

beforeAll(() => {
  whyDidYouRender(React, {
    trackAllPureComponents: true
  });
});

test('component should not re-render unnecessarily', () => {
  const component = renderer.create(<MyComponent />);
  const instance = component.getInstance();
  
  // 更新不会引起重新渲染的 props
  component.update(<MyComponent id={1} />);
  
  // why-did-you-render 会记录警告
});
```

### 五、最佳实践

1. **只在开发环境使用**：生产环境不应启用
2. **合理配置**：根据项目需求配置监控选项
3. **定期检查**：定期查看渲染日志，优化性能
4. **结合 React DevTools**：使用 Profiler 进行更深入的分析
5. **优先解决高频组件**：优先优化渲染次数多的组件

---

## 15、我们可以通过 preformance.timing 获得非常多的性能指标，你了解多少呢？

**Performance Timing API 详解**

Performance Timing API 提供了页面加载各个阶段的详细时间信息，以下是完整的指标说明：

### 一、Performance Timing 时间线

```
navigationStart
  ↓
unloadEventStart → unloadEventEnd (前一个页面卸载)
  ↓
redirectStart → redirectEnd (重定向)
  ↓
fetchStart (开始获取文档)
  ↓
domainLookupStart → domainLookupEnd (DNS 查询)
  ↓
connectStart → connectEnd (TCP 连接)
  ↓
requestStart (发送请求)
  ↓
responseStart → responseEnd (接收响应)
  ↓
domLoading → domComplete (DOM 加载和解析)
  ↓
domContentLoadedEventStart → domContentLoadedEventEnd (DOMContentLoaded 事件)
  ↓
loadEventStart → loadEventEnd (load 事件)
```

### 二、详细指标说明

#### 1. 导航相关指标

```javascript
const timing = performance.timing;

// 导航开始时间
console.log('navigationStart:', timing.navigationStart);
// 页面开始导航的时间戳

// 重定向时间
console.log('redirectCount:', performance.navigation.redirectCount);
console.log('redirectTime:', timing.redirectEnd - timing.redirectStart);
// 页面重定向的次数和耗时
```

#### 2. 网络相关指标

```javascript
// DNS 查询时间
const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
console.log('DNS Time:', dnsTime);

// TCP 连接时间
const tcpTime = timing.connectEnd - timing.connectStart;
console.log('TCP Time:', tcpTime);

// SSL/TLS 握手时间（HTTPS）
const sslTime = timing.connectEnd - timing.secureConnectionStart;
console.log('SSL Time:', sslTime);

// 请求响应时间（TTFB - Time To First Byte）
const ttfb = timing.responseStart - timing.requestStart;
console.log('TTFB:', ttfb);

// 下载时间
const downloadTime = timing.responseEnd - timing.responseStart;
console.log('Download Time:', downloadTime);
```

#### 3. DOM 相关指标

```javascript
// DOM 解析时间
const domParseTime = timing.domInteractive - timing.responseEnd;
console.log('DOM Parse Time:', domParseTime);

// DOM 完成时间（DOM 树构建完成）
console.log('domInteractive:', timing.domInteractive);

// DOMContentLoaded 时间
const domContentLoadedTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
console.log('DOMContentLoaded Time:', domContentLoadedTime);

// DOM 完全加载时间
console.log('domComplete:', timing.domComplete);

// 资源加载时间
const resourceLoadTime = timing.loadEventStart - timing.domContentLoadedEventEnd;
console.log('Resource Load Time:', resourceLoadTime);
```

#### 4. 完整加载时间

```javascript
// 页面完全加载时间
const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
console.log('Page Load Time:', pageLoadTime);

// 白屏时间（First Paint）
const whiteScreenTime = timing.responseStart - timing.navigationStart;
console.log('White Screen Time:', whiteScreenTime);

// 首屏时间（估算）
const firstScreenTime = timing.domInteractive - timing.navigationStart;
console.log('First Screen Time:', firstScreenTime);
```

### 三、完整的性能指标计算

```javascript
class PerformanceMetrics {
  constructor() {
    this.timing = performance.timing;
    this.navigation = performance.navigation;
  }

  // 获取所有性能指标
  getAllMetrics() {
    const t = this.timing;
    const n = this.navigation;

    return {
      // 导航指标
      navigation: {
        type: n.type, // 0: 正常导航, 1: 重定向, 2: 前进/后退
        redirectCount: n.redirectCount,
        redirectTime: t.redirectEnd - t.redirectStart,
        totalTime: t.loadEventEnd - t.navigationStart
      },

      // 网络指标
      network: {
        dns: t.domainLookupEnd - t.domainLookupStart,
        tcp: t.connectEnd - t.connectStart,
        ssl: t.connectEnd - t.secureConnectionStart,
        ttfb: t.responseStart - t.requestStart,
        download: t.responseEnd - t.responseStart,
        request: t.responseStart - t.fetchStart
      },

      // DOM 指标
      dom: {
        parse: t.domInteractive - t.responseEnd,
        interactive: t.domInteractive - t.navigationStart,
        contentLoaded: t.domContentLoadedEventEnd - t.domContentLoadedEventStart,
        complete: t.domComplete - t.navigationStart
      },

      // 渲染指标
      rendering: {
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint(),
        loadEvent: t.loadEventEnd - t.loadEventStart
      }
    };
  }

  // 获取首次绘制时间（需要 PerformanceObserver）
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  // 获取首次内容绘制时间
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  // 获取资源加载时间
  getResourceMetrics() {
    const resourceEntries = performance.getEntriesByType('resource');
    
    return resourceEntries.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      startTime: entry.startTime,
      type: this.getResourceType(entry.name),
      cached: entry.transferSize === 0
    }));
  }

  getResourceType(url) {
    if (url.match(/\.(js)$/i)) return 'script';
    if (url.match(/\.(css)$/i)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
    return 'other';
  }

  // 生成性能报告
  generateReport() {
    const metrics = this.getAllMetrics();
    const resources = this.getResourceMetrics();

    // 计算关键指标
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      metrics,
      resources: {
        total: resources.length,
        byType: this.groupResourcesByType(resources),
        slowResources: this.getSlowResources(resources)
      },
      scores: this.calculateScores(metrics)
    };

    return report;
  }

  // 按类型分组资源
  groupResourcesByType(resources) {
    return resources.reduce((acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = [];
      }
      acc[resource.type].push(resource);
      return acc;
    }, {});
  }

  // 获取慢速资源
  getSlowResources(resources, threshold = 1000) {
    return resources.filter(r => r.duration > threshold);
  }

  // 计算性能分数
  calculateScores(metrics) {
    const scores = {};

    // 网络评分
    if (metrics.network.ttfb < 600) {
      scores.network = 'good';
    } else if (metrics.network.ttfb < 1800) {
      scores.network = 'needs-improvement';
    } else {
      scores.network = 'poor';
    }

    // DOM 解析评分
    if (metrics.dom.parse < 1000) {
      scores.dom = 'good';
    } else if (metrics.dom.parse < 3000) {
      scores.dom = 'needs-improvement';
    } else {
      scores.dom = 'poor';
    }

    // 总体评分
    const overallGood = Object.values(scores).every(s => s === 'good');
    const overallPoor = Object.values(scores).some(s => s === 'poor');
    scores.overall = overallGood ? 'good' : overallPoor ? 'poor' : 'needs-improvement';

    return scores;
  }
}
```

### 四、现代 Performance API

#### 1. PerformanceObserver

```javascript
// 监控 FCP、LCP、FID、CLS
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    switch (entry.entryType) {
      case 'paint':
        console.log(`${entry.name}: ${entry.startTime}ms`);
        break;
      case 'layout-shift':
        console.log(`Layout Shift: ${entry.value}`);
        break;
      case 'largest-contentful-paint':
        console.log(`LCP: ${entry.startTime}ms`);
        break;
      case 'first-input':
        console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
        break;
    }
  }
});

observer.observe({ type: 'paint', buffered: true });
observer.observe({ type: 'layout-shift', buffered: true });
observer.observe({ type: 'largest-contentful-paint', buffered: true });
observer.observe({ type: 'first-input', buffered: true });
```

#### 2. Navigation Timing Level 2

```javascript
// 使用 PerformanceNavigationTiming
const navigationEntries = performance.getEntriesByType('navigation');
const navigation = navigationEntries[0];

console.log('Navigation Metrics:', {
  startTime: navigation.startTime,
  duration: navigation.duration,
  domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
  loadEventEnd: navigation.loadEventEnd,
  transferSize: navigation.transferSize,
  encodedBodySize: navigation.encodedBodySize,
  decodedBodySize: navigation.decodedBodySize
});
```

#### 3. Resource Timing

```javascript
// 资源加载详情
const resourceEntries = performance.getEntriesByType('resource');

resourceEntries.forEach(entry => {
  console.log('Resource:', entry.name);
  console.log('Duration:', entry.duration);
  console.log('Size:', entry.transferSize);
  console.log('DNS:', entry.domainLookupEnd - entry.domainLookupStart);
  console.log('TCP:', entry.connectEnd - entry.connectStart);
  console.log('TTFB:', entry.responseStart - entry.requestStart);
  console.log('Download:', entry.responseEnd - entry.responseStart);
});
```

### 五、最佳实践

1. **在生产环境采样**：避免收集过多数据影响性能
2. **结合 Core Web Vitals**：关注关键用户体验指标
3. **设置合理的阈值**：根据业务需求设置告警阈值
4. **定期分析**：定期分析性能数据，持续优化
5. **可视化展示**：使用图表直观展示性能趋势

---

以上是完整的性能优化和监控方案，涵盖了从前端性能指标获取到实际工程落地的各个方面。
