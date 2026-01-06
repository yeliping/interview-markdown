# Vue 相关考题

## 1、如何理解 Vue3 的响应式系统？Vue3 使用了 Proxy 更快了？

**答案：**

Vue3 的响应式系统核心基于 `@vue/reactivity` 包实现，采用 Proxy 代理对象实现依赖收集与副作用触发。

### 核心原理

1. **依赖收集（Track）**：当读取响应式对象属性时（触发 getter），Vue 会建立 `target -> key -> effect` 的映射关系。使用 WeakMap 存储 target，Map 存储 key 到 effect 的集合。

2. **副作用触发（Trigger）**：当修改属性时（触发 setter），根据 key 查找对应的 effect 集合，按调度队列执行。

3. **Effect 管理**：通过 `ReactiveEffect` 类封装副作用函数，记录依赖栈，避免循环依赖。

### Proxy vs Object.defineProperty

**Proxy 的优势：**

- **语义覆盖更完整**：Proxy 可以拦截 13 种操作，包括 `has`、`deleteProperty`、`ownKeys` 等，能正确处理：
  - 数组索引和 length 的联动
  - Map/Set 的增删改
  - 对象属性动态添加/删除
  - for...in 遍历

- **无需初始化遍历**：defineProperty 需要提前遍历所有属性定义 getter/setter，Proxy 可以按需拦截。

- **支持嵌套对象**：Proxy 可以递归代理深层属性，避免手动递归。

**性能方面：**

Proxy 本身的性能开销略高于 defineProperty，但 Vue3 通过以下优化提升了整体性能：

1. **编译优化**：静态提升、Patch flag 标记，减少不必要的依赖收集
2. **按需追踪**：只追踪真正在模板中使用的属性
3. **更少的边界情况处理**：减少运行时检查

### 代码示例

```javascript
// 简化的响应式实现
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key); // 依赖收集
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, key); // 触发更新
      }
      return result;
    }
  });
}
```

---

## 2、什么是 Suspend 组件，它是如何实现的？

**答案：**

`<Suspense>` 是 Vue3 提供的异步组件加载控制组件，允许在异步依赖（async setup、异步组件）未完成时展示 fallback 内容，完成后再渲染实际内容。

### 使用场景

```vue
<Suspense>
  <template #default>
    <AsyncComponent />  <!-- 默认内容 -->
  </template>
  <template #fallback>
    <LoadingSpinner />  <!-- 加载占位 -->
  </template>
</Suspense>
```

### 实现原理

1. **边界跟踪**：Suspense 内部通过 `SuspenseBoundary` 组件实例维护状态机：
   - `pending`：初始状态，等待异步依赖
   - `resolved`：所有依赖完成，渲染默认内容
   - `aborted`：处理嵌套 Suspense 的情况

2. **异步依赖管理**：
   - 组件 setup 返回 Promise 时，Suspense 将其标记为 async dep
   - 在组件实例上设置 `__asyncDep` 属性
   - 通过 `onAsyncResolved` 钩子监听 Promise 完成

3. **挂起与恢复**：
   - 当检测到子组件有未完成的异步依赖时，切换到 fallback 插槽
   - 所有依赖 resolve 后，重新渲染 default 插槽
   - 触发 `onResolve` 和 `onFallback` 生命周期回调

4. **嵌套处理**：
   - 支持 Suspense 嵌套，父 Suspense 等待子 Suspense 完成
   - 通过 `__suspense` 链式引用跟踪层级关系

### 内部状态管理

```javascript
// 简化的 Suspense 实现
const suspense = {
  isResolved: false,
  activeBranch: null,      // 当前渲染的分支
  pendingBranch: null,     // 待渲染分支
  deps: [],                // 异步依赖数组
  vnode: null,
  parentSuspense: null
};

function registerDep(suspense, asyncDep) {
  suspense.deps.push(asyncDep);
  asyncDep.then(() => {
    // 依赖完成，检查是否全部完成
    if (--suspense.deps.length === 0) {
      resolveSuspense(suspense);
    }
  });
}
```

---

## 3、Vue3中， ref 和 reactive 有什么区别？

**答案：**

`ref` 和 `reactive` 是 Vue3 中创建响应式数据的两种核心方式，各有适用场景。

### ref 的特点

1. **包装机制**：通过 `RefImpl` 类包装原始值，访问需要通过 `.value`
2. **适用类型**：包装基本类型（string、number、boolean）和对象
3. **自动解包**：
   - 在模板中直接使用，无需 `.value`
   - 在 reactive 对象内部会自动解包
   - 在 JS 中访问仍需 `.value`

4. **解构问题**：从 reactive 对象中解构出的 ref 不会丢失响应式

```javascript
const count = ref(0);
const state = reactive({ count });

console.log(count.value);  // 0
console.log(state.count);  // 0（自动解包）

count.value++;
console.log(state.count);  // 1
```

### reactive 的特点

1. **代理机制**：返回 Proxy 对象，直接通过属性访问
2. **适用类型**：只接受对象类型（Array、Object、Map、Set）
3. **递归响应式**：深层嵌套对象也会被代理（`shallowReactive` 除外）
4. **解构丢失**：解构出的属性会失去响应式

```javascript
const state = reactive({ count: 0, user: { name: 'Tom' } });

console.log(state.count);  // 0
state.count++;

const { count } = state;   // 解构丢失响应式
count++;                    // 不会触发更新
```

### 核心区别对比

| 特性 | ref | reactive |
|------|-----|----------|
| 包装方式 | RefImpl 类 | Proxy |
| 使用方式 | 需要 `.value` | 直接属性访问 |
| 适用类型 | 所有类型 | 仅对象类型 |
| 模板使用 | 自动解包 | 直接使用 |
| 解构响应式 | 保持响应式 | 失去响应式 |
| 深层响应式 | toRef/toRefs 或递归 ref | 默认递归 |

### 最佳实践

```javascript
// ✅ 基本类型使用 ref
const count = ref(0);
const message = ref('Hello');

// ✅ 复杂对象使用 reactive
const form = reactive({
  username: '',
  password: '',
  profile: { age: 20 }
});

// ✅ reactive 中需要解构时使用 toRefs
const { username, password } = toRefs(form);
```

---

## 4、Vue3 如何实现组件的懒加载？

**答案：**

Vue3 通过 `defineAsyncComponent` API 实现组件懒加载，结合动态 import() 实现代码分割和按需加载。

### 基本用法

```javascript
import { defineAsyncComponent } from 'vue';

// 简单形式
const AsyncComponent = defineAsyncComponent(() =>
  import('./MyComponent.vue')
);

// 完整配置形式
const AsyncPage = defineAsyncComponent({
  // 加载函数
  loader: () => import('./Page.vue'),

  // 加载中显示的组件
  loadingComponent: LoadingSpinner,

  // 出错时显示的组件
  errorComponent: ErrorView,

  // 延迟显示 loading 组件的时间（毫秒）
  delay: 200,

  // 超时时间（毫秒），超时后显示 error 组件
  timeout: 10000,

  // 是否允许 suspending
  suspensible: false,

  // 组件实例
  onError(error, retry, fail, attempts) {
    if (error.message.includes('fetch')) {
      retry();  // 重试
    } else {
      fail();   // 失败
    }
  }
});
```

### 实现原理

1. **异步包装器**：`defineAsyncComponent` 返回一个包装组件，内部维护状态机：
   - `loading`：初始状态
   - `resolved`：组件加载成功
   - `error`：加载失败
   - `retry`：重试中

2. **动态导入**：使用 `import()` 返回 Promise，在运行时按需加载模块

3. **错误处理**：
   - 超时控制：setTimeout 检测加载时长
   - 错误捕获：try-catch 捕获加载异常
   - 重试机制：允许手动或自动重试

4. **与 Suspense 配合**：
   ```vue
   <Suspense>
     <template #default>
       <AsyncComponent />
     </template>
     <template #fallback>
       <div>Loading...</div>
     </template>
   </Suspense>
   ```

### 路由懒加载

在 Vue Router 中同样使用动态 import：

```javascript
const routes = [
  {
    path: '/about',
    component: () => import('./views/About.vue')
  },
  {
    path: '/dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ './views/Dashboard.vue')
  }
];
```

### 优势

- **代码分割**：将组件打包到独立的 chunk，减少初始加载体积
- **按需加载**：只在需要时加载组件，提升首屏性能
- **提升用户体验**：配合 loading/error 组件提供良好的加载反馈

---

## 5、setup 函数在组件生命周期的那个阶段执行？

**答案：**

`setup` 函数在组件实例创建之后、组件渲染之前执行，具体位于 `beforeCreate` 和 `created` 之间。

### 执行时机

```
组件实例化
    ↓
setup() 执行
    ↓
beforeCreate ❌（Vue3 已移除）
    ↓
created ❌（Vue3 已移除）
    ↓
beforeMount
    ↓
mounted
```

### setup 执行时的状态

**可用的资源：**
- ✅ `props`：已解析完成
- ✅ `context`：包含 attrs、slots、emit、expose
- ✅ 响应式 API：ref、reactive、computed、watch 等

**不可用的资源：**
- ❌ `this`：无法访问组件实例
- ❌ DOM：组件未挂载，无法访问 DOM
- ❌ data/methods：Options API 尚未初始化

### 使用示例

```javascript
import { ref, onMounted } from 'vue';

export default {
  props: ['title'],
  setup(props, context) {
    // 可用资源
    console.log(props.title);      // ✅ props 已解析
    console.log(context.attrs);    // ✅ context 可用
    console.log(context.slots);    // ✅ slots 可用
    console.log(context.emit);     // ✅ emit 可用

    // 创建响应式数据
    const count = ref(0);

    // 生命周期钩子
    onMounted(() => {
      console.log('DOM 已挂载');
    });

    // 暴露给模板
    return {
      count,
      increment: () => count.value++
    };
  }
};
```

### 与 Options API 的对应关系

Vue3 移除了 `beforeCreate` 和 `created`，因为 setup 已经覆盖了这两个阶段的功能：

```javascript
export default {
  // ❌ Vue2 的 beforeCreate
  beforeCreate() {
    // 初始化前逻辑
  },

  // ❌ Vue2 的 created
  created() {
    // 初始化后逻辑
  },

  // ✅ Vue3 用 setup 替代
  setup() {
    // 可以在这里做初始化工作
    const state = reactive({ count: 0 });

    return { state };
  }
};
```

### TypeScript 支持

```typescript
import { defineComponent, PropType } from 'vue';

interface MyProps {
  title: string;
  count: number;
}

export default defineComponent({
  props: {
    title: String,
    count: Number as PropType<number>
  },
  setup(props: MyProps, { emit }: SetupContext) {
    // 类型安全的 props 和 context
    console.log(props.title);
    emit('update', props.count);

    return {};
  }
});
```

---

## 6、Vue3 中的 emit 是如何实现的？

**答案：**

Vue3 的 `emit` 实现基于组件实例的事件系统，通过 props 传递和事件查找机制实现父子组件通信。

### 使用方式

```javascript
// 子组件触发事件
export default {
  emits: ['update', 'change', {
    submit: (payload) => {
      // 事件验证
      return payload && payload.id;
    }
  }],

  setup(props, { emit }) {
    const handleSubmit = () => {
      emit('update', 1);
      emit('change', { value: 2 });
      emit('submit', { id: 1, name: 'test' });
    };

    return { handleSubmit };
  }
};
```

### 实现原理

#### 1. 事件声明（emits 选项）

```javascript
// 组件实例初始化时处理 emits
const emitsOptions = normalizeEmits(options.emits);

// 标准化 emits 定义
function normalizeEmits(emits) {
  if (isArray(emits)) {
    // ['update', 'change'] -> { update: null, change: null }
    return emits.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});
  }
  return emits; // 已经是对象格式
}
```

#### 2. 事件触发流程

```javascript
function emit(event, ...args) {
  // 1. 标准化事件名（驼峰/kebab 兼容）
  const eventName = camelize(event);

  // 2. 验证 emits 选项
  if (emitsOptions && !isEmit(emitsOptions, eventName)) {
    console.warn(`事件 "${eventName}" 未在 emits 选项中声明`);
    return;
  }

  // 3. 执行 emits 中的验证函数
  if (emitsOptions && emitsOptions[eventName]) {
    const validator = emitsOptions[eventName];
    if (validator && !validator(...args)) {
      console.warn(`事件 "${eventName}" 验证失败`);
      return;
    }
  }

  // 4. 查找并执行父组件监听器
  const props = instance.vnode.props;
  const handlerName = toHandlerKey(eventName); // 'on' + eventName

  if (props && handlerName in props) {
    props[handlerName](...args);
  }
}

// 事件名转换
function toHandlerKey(event) {
  return event ? `on${capitalize(event)}` : '';
}
```

#### 3. 父组件注册监听

```vue
<!-- 父组件模板 -->
<ChildComponent @update="handleUpdate" @submit="handleSubmit" />

<!-- 编译后的 vnode.props -->
{
  onUpdate: handleUpdate,
  onSubmit: handleSubmit
}
```

### 事件名转换规则

```javascript
// 事件名与监听器的对应关系
emit('update')       ->  onUpdate
emit('some-event')   ->  onSomeEvent  (kebab-case)
emit('someEvent')    ->  onSomeEvent  (camelCase)
```

### 与 Vue2 的区别

| 特性 | Vue2 | Vue3 |
|------|------|------|
| emits 声明 | 可选，仅用于警告 | 必选，用于验证和性能优化 |
| 事件验证 | 不支持 | 支持函数验证 |
| 性能优化 | 无 | 基于 emits 的优化，避免不必要的监听器注册 |
| 类型推断 | 弱 | 通过 emits 提供更好的 TS 支持 |

### 最佳实践

```javascript
// ✅ 推荐：声明 emits
export default {
  emits: {
    // 无验证
    change: null,

    // 带验证
    submit: (payload) => {
      return typeof payload.id === 'number' && payload.id > 0;
    }
  }
};

// ❌ 不推荐：未声明 emits
export default {
  setup(props, { emit }) {
    emit('undeclared-event'); // 警告
  }
};
```

---

## 7、Vue3 的编译器和运行时是如何分离的？

**答案：**

Vue3 采用编译时和运行时分离的架构设计，允许在不同场景下灵活选择编译方式。

### 架构组成

```
@vue/compiler-core      编译器核心
    ↓
@vue/compiler-dom       DOM 编译器（依赖 core）
    ↓
@vue/runtime-core       运行时核心（不包含编译器）
    ↓
@vue/runtime-dom        DOM 运行时（依赖 core）
```

### 编译器职责

**编译时完成：**

1. **模板解析（Parser）**：将模板字符串转换为 AST
2. **转换（Transform）**：优化 AST，包括：
   - 静态提升
   - Patch flag 标记
   - 作用域插值
   - 预计算
3. **代码生成（Codegen）**：生成 render 函数代码

```javascript
// 示例：模板编译
const template = `<div>{{ message }}</div>`;

const { code } = compile(template, {
  mode: 'module',
  prefixIdentifiers: true
});

// 编译结果
// import { createVNode as _createVNode, toDisplayString as _toDisplayString } from "vue"
// const _hoisted_1 = { class: "container" }
// export function render(_ctx, _cache) {
//   return _createVNode("div", _hoisted_1, _toDisplayString(_ctx.message), 1 /* TEXT */)
// }
```

### 运行时职责

**运行时完成：**

1. 创建虚拟 DOM（VNode）
2. 渲染和更新逻辑
3. 生命周期管理
4. 组件实例管理

```javascript
// 运行时只需要这些 helpers
import { createVNode, openBlock, createBlock } from 'vue';

// render 函数
function render(ctx) {
  return createVNode('div', null, ctx.message);
}
```

### 分离的优势

#### 1. 构建工具集成（推荐）

```javascript
// Vite 配置
export default {
  plugins: [
    vue({
      compilerOptions: {
        mode: 'module',  // 模块模式
        isCustomElement: tag => tag.startsWith('my-')
      }
    })
  ]
};

// 模板在构建时编译，运行时体积更小
import { createApp } from 'vue'; // 只有运行时
import App from './App.vue';     // .vue 文件被编译为 JS
```

#### 2. CDN 直接使用

```html
<!-- 完整版（包含编译器） -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<script>
  const { createApp } = Vue;
  createApp({
    template: '<div>{{ message }}</div>', // 运行时编译
    data() {
      return { message: 'Hello' };
    }
  }).mount('#app');
</script>
```

#### 3. Tree-shaking 优化

```javascript
// 只有 runtime
import { createApp } from 'vue/runtime-dom';

// 编译产物只依赖这些 helpers
// - createVNode
// - openBlock
// - createBlock
// - toDisplayString
// - normalizeClass
// - normalizeStyle
// ...
```

### 自定义渲染器

由于编译器和运行时分离，可以创建自定义渲染器：

```javascript
import { createRenderer } from '@vue/runtime-core';

const { createApp, render } = createRenderer({
  createElement(tag) {
    return document.createElement(tag);
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
  },
  patchProp(el, key, prevValue, nextValue) {
    // 自定义属性更新逻辑
  }
});

// 使用自定义渲染器
createApp(Comp).mount('#app');
```

### 性能对比

| 方式 | 编译产物体积 | 运行时性能 | 适用场景 |
|------|-------------|-----------|---------|
| 构建时编译 | 最小 | 最优 | 生产环境推荐 |
| 运行时编译 | 较大 | 较慢 | CDN 快速原型 |
| 完整版 | 最大 | 最慢 | 开发调试 |

---

## 8、Vue3 是如何处理异步更新队列的？

**答案：**

Vue3 使用基于微任务的异步更新队列，通过 job 机制批量处理状态更新，避免重复渲染。

### 核心机制

```javascript
// 队列管理
const queue = [];
const postFlushCbs = [];
const p = Promise.resolve();

let isFlushing = false;
let isFlushPending = false;
```

#### 1. 队列调度（queueJob）

```javascript
function queueJob(job) {
  // 1. 去重：同一个 job 只会加入队列一次
  if (!queue.includes(job)) {
    queue.push(job);
  }

  // 2. 调度队列刷新
  queueFlush();
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    p.then(flushJobs);  // 微任务调度
  }
}
```

#### 2. 队列刷新（flushJobs）

```javascript
function flushJobs(seen) {
  isFlushPending = false;
  isFlushing = true;

  // 1. 按组件层级排序（父组件在子组件之前）
  queue.sort((a, b) => getId(a) - getId(b));

  // 2. 执行队列中的所有 job
  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    if (job) {
      job();  // 执行 job（通常是 effect.run）
    }
  }

  // 3. 清空队列
  queue.length = 0;

  // 4. 执行 post 队列（nextTick 回调）
  flushPostFlushCbs();

  isFlushing = false;
}
```

#### 3. Post 队列（flushPostFlushCbs）

```javascript
function queuePostFlushCb(cb) {
  if (!isArray(cb)) {
    postFlushCbs.push(cb);
  } else {
    postFlushCbs.push(...cb);
  }
}

function flushPostFlushCbs(seen) {
  for (let i = 0; i < postFlushCbs.length; i++) {
    postFlushCbs[i]();
  }
  postFlushCbs.length = 0;
}
```

### 使用场景

#### 1. 响应式数据更新

```javascript
const state = reactive({ count: 0 });

state.count++;  // 触发 effect，加入队列
state.count++;  // 同一个 effect，去重，不会重复加入
state.count++;  // 同一个 effect，去重

// 微任务刷新队列，只执行一次更新
```

#### 2. nextTick 实现

```javascript
import { nextTick } from 'vue';

async function update() {
  state.count++;
  await nextTick();  // 等待 DOM 更新完成
  console.log('DOM 已更新');
}

// nextTick 本质是加入 post 队列
function nextTick(fn) {
  return fn ? p.then(() => fn()) : p;
}
```

#### 3. 生命周期钩子

```javascript
// updated 钩子在 flushJobs 之后执行
onUpdated(() => {
  console.log('组件已更新');
});
```

### 层级排序的意义

```javascript
// 父组件
const Parent = {
  setup() {
    const count = ref(0);
    return { count };
  },
  template: `<div>{{ count }} <Child :value="count" /></div>`
};

// 子组件
const Child = {
  props: ['value'],
  template: `<span>{{ value }}</span>`
};

// 当 count 更新时：
// 1. Parent 的 effect 加入队列
// 2. Child 的 effect 加入队列
// 3. 排序后：Parent 在前，Child 在后
// 4. 先更新 Parent，再更新 Child（避免子组件先于父组件更新）
```

### 性能优化

1. **批量更新**：同一个 tick 内的多次修改只触发一次渲染
2. **去重机制**：避免重复执行相同的 effect
3. **层级排序**：保证更新顺序，避免中间状态闪烁
4. **微任务调度**：比宏任务更及时，性能更好

### 浏览器兼容性降级

```javascript
// Promise（微任务，首选）
Promise.resolve().then(flushJobs);

// MutationObserver（微任务备选）
const observer = new MutationObserver(flushJobs);
observer.observe(document.createTextNode(''), { characterData: true });

// setImmediate（IE）
setImmediate(flushJobs);

// setTimeout（最后备选）
setTimeout(flushJobs, 0);
```

---

## 9、Vue3 的模板是如何编译的？

**答案：**

Vue3 的模板编译过程分为三个阶段：解析（Parser）、转换（Transform）、代码生成（Codegen）。

### 编译流程图

```
模板字符串
    ↓
解析（Parser）
    ↓
AST（抽象语法树）
    ↓
转换（Transform）
    ↓
优化后的 AST
    ↓
代码生成（Codegen）
    ↓
Render 函数代码
```

### 1. 解析阶段（Parser）

将模板字符串转换为 AST。

```javascript
// 输入
const template = `
  <div class="container">
    <span v-if="show">{{ message }}</span>
  </div>
`;

// 输出：AST
const ast = {
  type: 0,  // ROOT
  children: [
    {
      type: 1,  // ELEMENT
      tag: 'div',
      props: [{
        type: 6,  // ATTRIBUTE
        name: 'class',
        value: 'container'
      }],
      children: [
        {
          type: 1,
          tag: 'span',
          props: [{
            type: 7,  // DIRECTIVE
            name: 'if',
            exp: { type: 4, content: 'show' }
          }],
          children: [
            {
              type: 2,  // TEXT
              content: '{{ message }}'
            }
          ]
        }
      ]
    }
  ]
};
```

### 2. 转换阶段（Transform）

对 AST 进行优化和转换。

#### 优化策略

```javascript
function transform(ast, options) {
  const context = createTransformContext(ast, options);

  // 遍历 AST
  traverseNode(ast, context);

  // 各种转换插件
  transformElement(ast, context);      // 元素转换
  transformText(ast, context);         // 文本转换
  transformVBind(ast, context);        // v-bind 转换
  transformVOn(ast, context);          // v-on 转换
  transformVIf(ast, context);          // v-if 转换
  transformVFor(ast, context);         // v-for 转换
  transformModel(ast, context);        // v-model 转换

  return ast;
}
```

#### 静态提升（Static Hoisting）

```javascript
// 优化前
const template = `
  <div>
    <span>Static Text</span>
    <span>Static Text</span>
    <div>{{ message }}</div>
  </div>
`;

// 优化后：静态节点被提升到 render 函数外部
const _hoisted_1 = createVNode('span', null, 'Static Text');
const _hoisted_2 = createVNode('span', null, 'Static Text');

function render(_ctx, _cache) {
  return createVNode('div', null, [
    _hoisted_1,
    _hoisted_2,
    createVNode('div', null, toDisplayString(_ctx.message), 1 /* TEXT */)
  ]);
}
```

#### Patch Flag 标记

```javascript
// 标记动态节点，优化 diff
const patchFlag = 1;   // TEXT
const patchFlag = 2;   // CLASS
const patchFlag = 4;   // STYLE
const patchFlag = 8;   // PROPS
const patchFlag = 16;  // FULL_PROPS
const patchFlag = 32;  // HYDRATE_EVENTS

// 编译后的 vnode
createVNode('div', null, message, 1 /* TEXT */);
// diff 时只检查 TEXT，跳过其他属性
```

### 3. 代码生成阶段（Codegen）

将优化后的 AST 转换为 render 函数代码。

```javascript
function generate(ast, options) {
  const context = createCodegenContext(ast, options);
  const { push } = context;

  // 函数签名
  push(`function render(_ctx, _cache) {`);

  // 函数体
  push(`return `);
  genNode(ast, context);

  push(`}`);

  return { code: context.code };
}

// 节点生成
function genNode(node, context) {
  switch (node.type) {
    case 1:  // ELEMENT
      genElement(node, context);
      break;
    case 2:  // TEXT
      genText(node, context);
      break;
    case 4:  // SIMPLE_EXPRESSION
      genExpression(node, context);
      break;
  }
}
```

### 完整示例

```javascript
import { compile } from '@vue/compiler-dom';

const template = `
  <div :class="{ active: isActive }">
    <h1 v-if="showTitle">{{ title }}</h1>
    <p>{{ content }}</p>
  </div>
`;

const { code } = compile(template, {
  mode: 'module',
  prefixIdentifiers: true
});

console.log(code);
```

**编译结果：**

```javascript
import { createVNode as _createVNode, toDisplayString as _toDisplayString, openBlock as _openBlock, createBlock as _createBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createBlock("div", {
    class: [{ active: _ctx.isActive }]
  }, [
    (_ctx.showTitle)
      ? (_openBlock(), _createBlock("h1", { key: 0 }, _toDisplayString(_ctx.title), 1 /* TEXT */))
      : createCommentVNode("v-if", true),
    _createVNode("p", null, _toDisplayString(_ctx.content), 1 /* TEXT */)
  ]))
}
```

### 编译器优化总结

| 优化策略 | 说明 | 性能提升 |
|---------|------|---------|
| 静态提升 | 静态节点移到函数外，避免重复创建 | 30%+ |
| Patch Flag | 标记动态节点，diff 时只检查变化的属性 | 20%+ |
| Block Tree | 只遍历动态节点，跳过静态部分 | 40%+ |
| 内联事件缓存 | 内联函数缓存为常量，避免重复创建 | 10%+ |

---

## 10、Vue3 的watch 和 watchEffect 有何区别？

**答案：**

`watch` 和 `watchEffect` 是 Vue3 中用于监听响应式数据变化的两个 API，各有不同的特性和使用场景。

### watch 的特点

#### 基本用法

```javascript
import { ref, watch } from 'vue';

const count = ref(0);

// 1. 监听单个 ref
watch(count, (newValue, oldValue) => {
  console.log(`count: ${oldValue} -> ${newValue}`);
});

// 2. 监听 getter 函数
watch(
  () => count.value * 2,
  (newVal, oldVal) => {
    console.log(`doubled: ${oldVal} -> ${newVal}`);
  }
);

// 3. 监听多个源
watch(
  [count, () => state.value],
  ([newCount, newState], [oldCount, oldState]) => {
    console.log('多个值变化');
  }
);
```

#### 配置选项

```javascript
// 选项对象形式
watch(
  source,
  (newVal, oldVal) => {
    console.log('回调');
  },
  {
    immediate: true,    // 立即执行
    deep: true,         // 深度监听
    flush: 'post',      // 'pre' | 'post' | 'sync'
    onTrack(e) {
      console.log('依赖追踪', e);
    },
    onTrigger(e) {
      console.log('触发更新', e);
    }
  }
);
```

#### 清理副作用

```javascript
watch(
  source,
  async (value, oldValue, onCleanup) => {
    const controller = new AbortController();

    onCleanup(() => {
      controller.abort();  // 清理上一次的请求
    });

    const data = await fetch(url, { signal: controller.signal });
    console.log(data);
  }
);
```

### watchEffect 的特点

#### 基本用法

```javascript
import { ref, watchEffect } from 'vue';

const count = ref(0);

// 自动收集依赖
watchEffect(() => {
  console.log(`count is: ${count.value}`);
});

count.value++;  // 触发 watchEffect
```

#### 与 watch 的区别

| 特性 | watch | watchEffect |
|------|-------|-------------|
| 执行时机 | 懒执行，依赖变化才执行 | 立即执行，依赖变化时重新执行 |
| 依赖声明 | 显式声明 source | 自动收集依赖 |
| 访问旧值 | 提供 oldValue | 无法访问旧值 |
| 深度监听 | 支持 deep 选项 | 自动深度追踪 |
| 停止监听 | 返回 stop 函数 | 返回 stop 函数 |

#### watchEffect 示例

```javascript
// 场景 1：自动追踪依赖
watchEffect(() => {
  // 自动追踪 count、name、age 的变化
  console.log(`Count: ${count.value}, Name: ${state.name}, Age: ${state.age}`);
});

// 场景 2：副作用清理
watchEffect((onCleanup) => {
  const timer = setTimeout(() => {
    console.log('定时器执行');
  }, 1000);

  onCleanup(() => {
    clearTimeout(timer);  // 下次执行前清理
  });
});

// 场景 3：获取 DOM
watchEffect(() => {
  if (el.value) {
    console.log('DOM 已挂载', el.value);
  }
});
```

### 实际应用场景

#### watch 适用场景

```javascript
// 1. 需要获取新旧值对比
watch(searchText, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    debounceSearch(newVal);
  }
});

// 2. 需要在特定时机执行
watch(
  userId,
  async (newId) => {
    if (newId) {
      await fetchUser(newId);
    }
  },
  { immediate: true }
);

// 3. 需要深度监听对象
watch(
  formData,
  (newForm) => {
    validateForm(newForm);
  },
  { deep: true }
);
```

#### watchEffect 适用场景

```javascript
// 1. 自动追踪多个依赖
watchEffect(() => {
  document.title = `${state.title} - Count: ${count.value}`;
});

// 2. 副作用管理
watchEffect((onCleanup) => {
  const handler = (e) => {
    console.log('Event', e);
  };

  window.addEventListener('resize', handler);

  onCleanup(() => {
    window.removeEventListener('resize', handler);
  });
});

// 3. 计算属性替代方案（有副作用的计算）
watchEffect(() => {
  if (isLoggedIn.value) {
    fetchUserData();
  }
});
```

### 性能考虑

```javascript
// ✅ watch 性能更好（明确依赖）
watch(() => state.value.count, callback);

// ❌ watchEffect 可能收集不必要的依赖
watchEffect(() => {
  // state.value.name 也被收集，但不会触发更新
  console.log(state.value.count);
});

// ✅ watch 懒执行，避免初始化时不必要的执行
watch(source, callback, { immediate: false });

// ❌ watchEffect 立即执行，可能造成额外开销
watchEffect(callback);
```

### 最佳实践

```javascript
// ✅ 需要新旧值对比 - 用 watch
watch(
  () => props.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      emit('change', newVal);
    }
  }
);

// ✅ 复杂的副作用管理 - 用 watchEffect
watchEffect((onCleanup) => {
  const timer = setInterval(() => {
    updateTimestamp();
  }, 1000);

  onCleanup(() => {
    clearInterval(timer);
  });
});

// ✅ 简单的计算 - 用 computed
const doubled = computed(() => count.value * 2);

// ✅ 自动追踪 DOM 变化 - 用 watchEffect
watchEffect(() => {
  if (el.value) {
    initPlugin(el.value);
  }
});
```

---

## 11、Vue3 的响应式系统和 React Hooks 相比有何优势？

**答案：**

Vue3 的响应式系统与 React Hooks 在设计理念和实现方式上有显著差异，Vue3 在多个方面具有优势。

### 1. 依赖自动追踪 vs 手动声明

#### Vue3：自动依赖收集

```javascript
import { ref, watchEffect } from 'vue';

const count = ref(0);
const name = ref('Tom');

// 自动追踪 count 和 name 的变化
watchEffect(() => {
  console.log(`${name.value}: ${count.value}`);
});
```

**优势：**
- ✅ 无需手动声明依赖数组
- ✅ ESLint 规则不再必需
- ✅ 代码更简洁，减少人为错误

#### React：手动依赖数组

```javascript
import { useState, useEffect } from 'react';

const [count, setCount] = useState(0);
const [name, setName] = useState('Tom');

// 必须手动声明依赖
useEffect(() => {
  console.log(`${name}: ${count}`);
}, [count, name]);  // 遗漏依赖会导致 bug
```

**问题：**
- ❌ 依赖数组容易遗漏或多余
- ❌ 需要 ESLint 规则强制检查
- ❌ 错误的依赖导致闭包陷阱

### 2. 逻辑组织方式

#### Vue3：按功能组织

```javascript
function useMouse() {
  const x = ref(0);
  const y = ref(0);

  function update(e) {
    x.value = e.clientX;
    y.value = e.clientY;
  }

  onMounted(() => window.addEventListener('mousemove', update));
  onUnmounted(() => window.removeEventListener('mousemove', update));

  return { x, y };
}

// 组件中使用
const { x, y } = useMouse();
const { width, height } = useWindowSize();
const { theme, toggleTheme } = useTheme();

// 逻辑清晰，按功能分组
```

#### React：按 Hooks 顺序组织

```javascript
function Component() {
  // 所有 state 集中在顶部
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  // 所有 effect 集中在中间
  useEffect(() => {
    window.addEventListener('mousemove', update);
    return () => window.removeEventListener('mousemove', update);
  }, []);

  // 所有计算属性在底部
  const distance = useMemo(() => Math.sqrt(x * x + y * y), [x, y]);

  // 逻辑分散，难以组织
}
```

**Vue3 优势：**
- ✅ 逻辑聚合在自定义 Hook 中
- ✅ 组件代码更清晰
- ✅ 易于复用和维护

### 3. 细粒度更新 vs 组件级重渲染

#### Vue3：细粒度响应式

```javascript
const state = reactive({
  user: { name: 'Tom', age: 20 },
  settings: { theme: 'light' }
});

// 只更新访问到的属性
watchEffect(() => {
  console.log(state.user.name);  // 只追踪 user.name
});

state.settings.theme = 'dark';  // 不触发 watchEffect
state.user.age = 21;           // 也不触发
state.user.name = 'Jerry';     // 触发 watchEffect
```

**优势：**
- ✅ 按属性级别追踪依赖
- ✅ 减少不必要的重渲染
- ✅ 性能更好

#### React：组件级重渲染

```javascript
function Component() {
  const [state, setState] = useState({
    user: { name: 'Tom', age: 20 },
    settings: { theme: 'light' }
  });

  useEffect(() => {
    console.log(state.user.name);
  }, [state.user.name]);  // 只声明 name 依赖

  // 但 state 任何变化都会触发组件重渲染
  setState(prev => ({ ...prev, settings: { theme: 'dark' } }));  // 触发重渲染
}
```

**问题：**
- ❌ 状态任何变化都触发重渲染
- ❌ 需要手动优化（React.memo、useMemo）
- ❌ 性能开销更大

### 4. Hooks 调用顺序约束

#### Vue3：无顺序约束

```javascript
setup() {
  // 条件语句中创建响应式数据
  if (props.featureEnabled) {
    const feature = useFeature();
  }

  // 循环中创建响应式数据
  items.forEach(item => {
    const itemRef = ref(item);
  });

  // 异步操作中创建响应式数据
  setTimeout(() => {
    const asyncData = ref(null);
  }, 1000);

  // ✅ 完全自由，无约束
}
```

#### React：严格的顺序约束

```javascript
function Component() {
  // ❌ 不能在条件语句中调用 Hooks
  if (props.featureEnabled) {
    const [feature, setFeature] = useState(null);  // Error!
  }

  // ❌ 不能在循环中调用 Hooks
  items.forEach(item => {
    const [itemState, setItemState] = useState(item);  // Error!
  });

  // ❌ 不能在异步操作中调用 Hooks
  setTimeout(() => {
    const [asyncData, setAsyncData] = useState(null);  // Error!
  }, 1000);

  // ✅ 只能在顶层调用
  const [state, setState] = useState(null);
}
```

**Vue3 优势：**
- ✅ 灵活性更高
- ✅ 更符合常规编程直觉
- ✅ 减少规则负担

### 5. 响应式与组件解耦

#### Vue3：独立的响应式系统

```javascript
// 可以在组件外使用响应式
import { reactive, watchEffect } from 'vue';

const globalState = reactive({
  count: 0,
  theme: 'light'
});

// 独立的副作用逻辑
watchEffect(() => {
  document.documentElement.dataset.theme = globalState.theme;
});

// 多个组件共享同一响应式对象
// 组件 A 和 组件 B 都可以访问 globalState
```

**优势：**
- ✅ 响应式系统独立于组件
- ✅ 可以在任何地方使用
- ✅ 更灵活的状态管理

#### React：与组件强绑定

```javascript
// useState 只能在组件或 Hook 内部使用
// ❌ 不能在组件外使用
const globalState = useState({ count: 0 });  // Error!

// 必须通过 Context 或状态管理库实现跨组件共享
const GlobalContext = createContext();

function App() {
  const [state, setState] = useState({ count: 0 });

  return (
    <GlobalContext.Provider value={{ state, setState }}>
      <ComponentA />
      <ComponentB />
    </GlobalContext.Provider>
  );
}
```

**问题：**
- ❌ Hooks 只能在组件内使用
- ❌ 需要额外的状态管理方案
- ❌ 复杂度更高

### 6. 类型推导

#### Vue3：优秀的 TypeScript 支持

```typescript
interface User {
  id: number;
  name: string;
  age: number;
}

const user = ref<User | null>(null);
const state = reactive<{ users: User[]; loading: boolean }>({
  users: [],
  loading: false
});

// 自动推导类型
watchEffect(() => {
  console.log(state.users[0]?.name);  // 类型安全
});
```

**优势：**
- ✅ 响应式对象类型自动推导
- ✅ ref 支持泛型
- ✅ IDE 自动补全完善

#### React：类型支持良好但有限

```typescript
interface User {
  id: number;
  name: string;
  age: number;
}

const [user, setUser] = useState<User | null>(null);
const [users, setUsers] = useState<User[]>([]);

// useEffect 的依赖类型不够精确
useEffect(() => {
  console.log(users[0]?.name);  // 类型安全
}, [users]);  // 但依赖数组的类型检查较弱
```

### 总结对比

| 特性 | Vue3 响应式 | React Hooks |
|------|------------|-------------|
| 依赖追踪 | 自动收集 | 手动声明 |
| 代码组织 | 按功能聚合 | 按 Hooks 类型分组 |
| 更新粒度 | 属性级别 | 组件级别 |
| 调用顺序 | 无约束 | 严格约束 |
| 使用范围 | 任何地方 | 仅组件/Hook 内 |
| 性能 | 更优（细粒度） | 需要手动优化 |
| TypeScript | 完善支持 | 支持良好 |
| 学习曲线 | 平缓 | 陡峭 |

### 结论

Vue3 的响应式系统在以下方面具有明显优势：

1. **开发体验**：自动依赖追踪减少心智负担
2. **代码质量**：逻辑聚合，易于维护
3. **性能**：细粒度更新，减少不必要渲染
4. **灵活性**：无 Hooks 调用顺序约束
5. **扩展性**：响应式系统独立，易于复用

React Hooks 虽然更灵活强大，但需要开发者有更深的理解和更多的手动优化。

---

## 12、Vue3 是如何实现条件渲染的？

**答案：**

Vue3 提供了 `v-if` 和 `v-show` 两种条件渲染指令，各有不同的实现原理和适用场景。

### v-if 的实现原理

#### 编译阶段

```vue
<template>
  <div>
    <h1 v-if="showTitle">{{ title }}</h1>
    <p v-else-if="showSubtitle">{{ subtitle }}</p>
    <span v-else>默认内容</span>
  </div>
</template>
```

**编译后的代码：**

```javascript
import { createCommentVNode, createVNode } from 'vue';

export function render(_ctx, _cache) {
  return (_ctx.showTitle)
    ? createVNode("h1", null, toDisplayString(_ctx.title), 1 /* TEXT */)
    : (_ctx.showSubtitle)
      ? createVNode("p", null, toDisplayString(_ctx.subtitle), 1 /* TEXT */)
      : createVNode("span", null, "默认内容");
}
```

#### 运行时处理

```javascript
// 简化的 v-if 实现原理
function render(ctx) {
  let vnode;

  if (ctx.showTitle) {
    // 条件为真，创建 h1 的 vnode
    vnode = createVNode('h1', null, ctx.title);
  } else {
    // 条件为假，创建注释节点占位
    vnode = createCommentVNode('v-if');
  }

  return vnode;
}
```

#### DOM Diff 过程

```javascript
// patch 阶段
function patch(n1, n2, container) {
  if (n1 && n1.type !== n2.type) {
    // 类型不同，卸载旧节点
    unmount(n1);
    n1 = null;
  }

  if (!n1) {
    // 没有旧节点，挂载新节点
    mount(n2, container);
  } else {
    // 类型相同，更新节点
    patchElement(n1, n2);
  }
}

// v-if 的变化会触发卸载/挂载
// showTitle: true -> false
// 1. h1 (vnode) -> comment (vnode)
// 2. 类型不同，卸载 h1
// 3. 挂载 comment
```

### v-show 的实现原理

#### 编译阶段

```vue
<template>
  <div>
    <h1 v-show="showTitle">{{ title }}</h1>
  </div>
</template>
```

**编译后的代码：**

```javascript
import { mergeProps } from 'vue';

export function render(_ctx, _cache) {
  return createVNode("h1",
    mergeProps(
      { style: { display: _ctx.showTitle ? undefined : 'none' } },
      { ... }
    ),
    toDisplayString(_ctx.title),
    1 /* TEXT */
  );
}
```

#### 运行时处理

```javascript
// v-show 本质是控制 display 样式
function render(ctx) {
  const vnode = createVNode('h1', {
    style: {
      display: ctx.showTitle ? undefined : 'none'
    }
  }, ctx.title);

  return vnode;
}
```

#### 更新过程

```javascript
// 当 showTitle 变化时
// 只更新 style 属性，不需要卸载/挂载
function patchStyle(el, newStyle, oldStyle) {
  if (newStyle.display !== oldStyle.display) {
    el.style.display = newStyle.display;
  }
}
```

### v-if vs v-show 对比

| 特性 | v-if | v-show |
|------|------|--------|
| 编译方式 | 条件渲染，不创建 false 分支 | 始终渲染，控制 display |
| DOM 操作 | 销毁/重建 | 只切换样式 |
| 初始渲染成本 | 较低（false 时不渲染） | 较高（始终渲染） |
| 切换成本 | 较高（销毁/重建） | 较低（只改样式） |
| 生命周期 | 完整触发 | 只触发一次 |
| 内部组件 | 完整销毁/重建 | 保持实例 |

### 实际应用场景

#### v-if 适用场景

```vue
<template>
  <div>
    <!-- 登录状态不同，渲染完全不同的内容 -->
    <UserDashboard v-if="isLoggedIn" />
    <LoginForm v-else />

    <!-- 权限控制 -->
    <AdminPanel v-if="user.role === 'admin'" />
    <UserPanel v-else-if="user.role === 'user'" />
    <AccessDenied v-else />

    <!-- 一次性初始化，切换成本低 -->
    <Modal v-if="showModal">
      <Content />
    </Modal>
  </div>
</template>
```

**理由：**
- ✅ 初始渲染成本高，切换频率低
- ✅ 需要完整生命周期
- ✅ 条件为 false 时完全移除

#### v-show 适用场景

```vue
<template>
  <div>
    <!-- 频繁切换，初始化成本高 -->
    <button v-show="isVisible" @click="toggle">
      Toggle Button
    </button>

    <!-- Tab 切换 -->
    <div v-show="activeTab === 'home'">Home Content</div>
    <div v-show="activeTab === 'about'">About Content</div>
    <div v-show="activeTab === 'contact'">Contact Content</div>

    <!-- 表单验证错误提示 -->
    <p v-show="errors.name" class="error">
      {{ errors.name }}
    </p>
  </div>
</template>
```

**理由：**
- ✅ 频繁切换，初始化成本高
- ✅ 不需要完整生命周期
- ✅ 保持组件状态

### 注意事项

#### 1. key 的使用

```vue
<template>
  <!-- ✅ 使用 key 确保完全重建 -->
  <div v-if="view === 'profile'" key="profile">
    <Profile />
  </div>
  <div v-else key="settings">
    <Settings />
  </div>

  <!-- ❌ 不使用 key，可能复用组件导致状态混乱 -->
  <div v-if="view === 'profile'">
    <Profile />
  </div>
  <div v-else>
    <Settings />
  </div>
</template>
```

#### 2. v-if 与 v-for 优先级

```vue
<template>
  <!-- ❌ 不推荐：v-for 优先级高于 v-if -->
  <li v-for="item in items" v-if="item.visible">
    {{ item.name }}
  </li>

  <!-- ✅ 推荐：使用计算属性 -->
  <li v-for="item in visibleItems">
    {{ item.name }}
  </li>

  <!-- ✅ 推荐：使用 template 包装 -->
  <template v-for="item in items" :key="item.id">
    <li v-if="item.visible">
      {{ item.name }}
    </li>
  </template>
</template>
```

#### 3. v-if 与 transition 结合

```vue
<template>
  <transition name="fade" mode="out-in">
    <ComponentA v-if="showA" />
    <ComponentB v-else />
  </transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 性能优化建议

```vue
<template>
  <div>
    <!-- ✅ 静态内容使用 v-show -->
    <div v-show="isHovered" class="tooltip">
      {{ tooltipText }}
    </div>

    <!-- ✅ 动态内容使用 v-if -->
    <AsyncComponent v-if="shouldLoad" />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const visibleItems = computed(() => {
  return items.value.filter(item => item.visible);
});
</script>
```

### 总结

- **v-if**：真正的条件渲染，适合切换频率低、初始化成本高的场景
- **v-show**：样式控制，适合频繁切换、初始化成本高的场景
- 根据实际需求选择合适的指令，避免滥用导致性能问题

---

## 13、Vue3 中的 computed 是如何实现的？

**答案：**

Vue3 的 `computed` 是基于 `ReactiveEffect` 和缓存机制的响应式计算属性，实现了惰性求值和依赖追踪。

### 基本用法

```javascript
import { ref, computed } from 'vue';

const count = ref(0);

// 只读 computed
const doubled = computed(() => count.value * 2);

console.log(doubled.value);  // 0
count.value++;
console.log(doubled.value);  // 2

// 可写 computed
const fullName = computed({
  get: () => firstName.value + ' ' + lastName.value,
  set: (value) => {
    [firstName.value, lastName.value] = value.split(' ');
  }
});
```

### 实现原理

#### 1. ComputedRefImpl 类

```javascript
class ComputedRefImpl {
  constructor(getter, setter, isReadonly) {
    this._value = undefined;       // 缓存的值
    this._dirty = true;            // 脏标记，表示需要重新计算
    this._setter = setter;         // setter 函数
    this.dep = new Set();          // 依赖这个 computed 的 effect 集合
    this.__v_isRef = true;         // 标记为 ref

    // 创建 effect，用于追踪计算过程中的依赖
    this.effect = new ReactiveEffect(getter, () => {
      // 调度器：当计算属性的依赖变化时
      if (!this._dirty) {
        this._dirty = true;        // 标记为脏
        triggerRefValue(this);     // 通知依赖这个 computed 的 effect
      }
    });

    this.effect.computed = this;  // 反向引用
  }

  get value() {
    // 收集依赖
    trackRefValue(this);

    // 惰性求值：只有 dirty 时才重新计算
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();  // 执行 getter，收集依赖
    }

    return this._value;
  }

  set value(newValue) {
    this._setter(newValue);  // 调用 setter
  }
}
```

#### 2. computed 函数创建

```javascript
function computed(getterOrOptions) {
  let getter;
  let setter;

  // 判断是只读还是可写
  if (isFunction(getterOrOptions)) {
    // 只读 computed
    getter = getterOrOptions;
    setter = () => {
      console.warn('Write operation failed: computed value is readonly');
    };
  } else {
    // 可写 computed
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  const cRef = new ComputedRefImpl(getter, setter, isFunction(getterOrOptions));

  return cRef;
}
```

### 工作流程

#### 1. 初始化

```javascript
const count = ref(0);
const doubled = computed(() => count.value * 2);

// 创建 ComputedRefImpl 实例
// _value: undefined
// _dirty: true  // 初始状态为脏
// dep: Set()     // 空集合，暂无依赖
// effect: ReactiveEffect 包装的 getter
```

#### 2. 首次访问

```javascript
console.log(doubled.value);

// 1. trackRefValue(this) - 收集依赖
//    当前 effect（如果有的话）会被加入 this.dep

// 2. _dirty 为 true，需要重新计算
//    _dirty = false
//    _value = this.effect.run()
//    执行 getter: count.value * 2
//    运行过程中访问 count.value，触发 count 的 track
//    count 收集到 this.effect 作为依赖

// 3. 返回 _value
```

#### 3. 依赖变化

```javascript
count.value++;

// 1. count.value 触发 setter
// 2. count 通知所有依赖（包括 this.effect）
// 3. this.effect 的调度器执行
//    if (!this._dirty) {
//      this._dirty = true;
//      triggerRefValue(this);  // 通知依赖 this 的 effect
//    }
```

#### 4. 再次访问

```javascript
console.log(doubled.value);

// 1. trackRefValue(this) - 收集依赖
// 2. _dirty 为 true，需要重新计算
//    _dirty = false
//    _value = this.effect.run()
//    执行 getter，收集最新依赖

// 3. 返回 _value
```

### 缓存机制

```javascript
const count = ref(0);
const doubled = computed(() => count.value * 2);

// 首次访问：计算并缓存
console.log(doubled.value);  // 0，触发计算

// 依赖未变化：直接返回缓存
console.log(doubled.value);  // 0，直接返回缓存
console.log(doubled.value);  // 0，直接返回缓存

// 依赖变化：标记为脏，下次访问时重新计算
count.value++;
console.log(doubled.value);  // 2，重新计算并缓存

// 依赖未变化：直接返回缓存
console.log(doubled.value);  // 2，直接返回缓存
```

### 嵌套 Computed

```javascript
const count = ref(0);
const doubled = computed(() => count.value * 2);
const quadrupled = computed(() => doubled.value * 2);

console.log(quadrupled.value);  // 0

count.value++;
console.log(quadrupled.value);  // 4

// 依赖链：count -> doubled -> quadrupled
// count 变化 -> doubled 变化 -> quadrupled 变化
```

### Watch 监听 Computed

```javascript
const count = ref(0);
const doubled = computed(() => count.value * 2);

watch(doubled, (newVal, oldVal) => {
  console.log(`doubled: ${oldVal} -> ${newVal}`);
});

count.value++;  // 输出: doubled: 0 -> 2
```

### 错误处理

```javascript
const errorState = ref(false);
const computedValue = computed(() => {
  if (errorState.value) {
    throw new Error('Something went wrong');
  }
  return 42;
});

// 错误会被捕获并传播
try {
  errorState.value = true;
  console.log(computedValue.value);
} catch (error) {
  console.error(error.message);  // 'Something went wrong'
}
```

### 与方法的区别

```javascript
const count = ref(0);

// ✅ computed：有缓存
const doubled = computed(() => count.value * 2);

// ❌ 方法：无缓存，每次调用都重新计算
function getDoubled() {
  return count.value * 2;
}

// 性能对比
console.log(doubled.value);  // 计算一次，返回缓存
console.log(doubled.value);  // 直接返回缓存

console.log(getDoubled());   // 每次都重新计算
console.log(getDoubled());   // 每次都重新计算
```

### 最佳实践

```javascript
// ✅ 适合使用 computed 的场景
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
const totalPrice = computed(() => items.value.reduce((sum, item) => sum + item.price, 0));
const hasPermission = computed(() => user.value.role === 'admin');

// ❌ 不适合使用 computed 的场景（有副作用）
const invalid = computed(() => {
  console.log('计算');  // 副作用
  return value.value * 2;
});

// ❌ 不适合使用 computed 的场景（异步操作）
const asyncValue = computed(async () => {
  const data = await fetchData();  // 不支持异步
  return data;
});
```

### 性能优化

```javascript
// ✅ 使用 computed 缓存复杂计算
const expensive = computed(() => {
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
});

// 多次访问只计算一次
console.log(expensive.value);
console.log(expensive.value);
console.log(expensive.value);
```

### 总结

1. **惰性求值**：只在访问时计算，初始不计算
2. **缓存机制**：依赖不变时返回缓存值
3. **依赖追踪**：自动收集和更新依赖
4. **级联更新**：嵌套 computed 能正确传递变化
5. **性能优化**：避免重复计算，适合复杂计算

---

## 14、如何理解 Vue3 中的 SSR？

**答案：**

SSR（Server-Side Rendering）是指在服务器端将 Vue 组件渲染为 HTML 字符串，直接发送给浏览器，提升首屏加载速度和 SEO。

### 基本概念

#### CSR（Client-Side Rendering）

```
浏览器请求 HTML
    ↓
返回空白 HTML + JS
    ↓
浏览器加载 JS
    ↓
执行 JS，生成 DOM
    ↓
渲染页面
```

**问题：**
- ❌ 首屏白屏时间长
- ❌ SEO 不友好
- ❌ 需要等待 JS 加载执行

#### SSR（Server-Side Rendering）

```
浏览器请求 HTML
    ↓
服务器渲染组件
    ↓
返回完整 HTML
    ↓
浏览器立即渲染
    ↓
加载 JS，激活 hydration
```

**优势：**
- ✅ 首屏速度快
- ✅ SEO 友好
- ✅ 更好的用户体验

### Vue3 SSR 实现原理

#### 1. 服务端渲染

```javascript
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import App from './App.vue';

const app = createSSRApp(App);

// 渲染为 HTML 字符串
renderToString(app).then(html => {
  console.log(html);
  // <div id="app"><h1>Hello SSR</h1></div>
});
```

#### 2. 客户端激活（Hydration）

```javascript
import { createApp } from 'vue';
import App from './App.vue';

// 创建应用实例
const app = createApp(App);

// 挂载时进行 hydration
app.mount('#app');  // 激活已有 DOM
```

### 完整 SSR 架构

```
服务器端
├── 请求处理
├── 数据预取
├── 组件渲染
└── 生成 HTML

客户端
├── 接收 HTML
├── 快速渲染
├── 加载 JS
└── Hydration 激活
```

### 实战示例

#### 服务器端代码

```javascript
// server.js
import fs from 'fs';
import express from 'express';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createMemoryHistory } from 'vue-router';
import { createPinia } from 'pinia';

const server = express();

server.get('*', async (req, res) => {
  // 1. 创建应用实例
  const app = createSSRApp(App);

  // 2. 配置 Router
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  });
  app.use(router);

  // 3. 配置状态管理
  const pinia = createPinia();
  app.use(pinia);

  // 4. 数据预取
  await router.push(req.url);
  await router.isReady();

  // 预取数据
  const matchedComponents = router.currentRoute.value.matched.flatMap(record =>
    Object.values(record.components)
  );

  await Promise.all(
    matchedComponents.map(component => {
      if (component.asyncData) {
        return component.asyncData({ store: pinia.state, route: router.currentRoute.value });
      }
    })
  );

  // 5. 渲染为 HTML
  const appContent = await renderToString(app);

  // 6. 注入状态到 HTML
  const state = JSON.stringify(pinia.state.value);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR App</title>
      </head>
      <body>
        <div id="app">${appContent}</div>
        <script>window.__INITIAL_STATE__ = ${state}</script>
        <script src="/client.js"></script>
      </body>
    </html>
  `;

  res.end(html);
});

server.listen(3000);
```

#### 客户端代码

```javascript
// client.js
import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);

// 配置 Router
const router = createRouter({
  history: createWebHistory(),
  routes
});
app.use(router);

// 配置 Pinia
const pinia = createPinia();
app.use(pinia);

// 从服务器获取初始状态
if (window.__INITIAL_STATE__) {
  pinia.state.value = window.__INITIAL_STATE__;
}

// 挂载应用（Hydration）
router.isReady().then(() => {
  app.mount('#app');
});
```

### 组件数据预取

```javascript
// UserList.vue
export default {
  async setup() {
    const users = ref([]);

    // 服务端执行：预取数据
    const fetchUsers = async () => {
      const res = await fetch('/api/users');
      users.value = await res.json();
    };

    // 判断环境
    if (import.meta.env.SSR) {
      await fetchUsers();
    } else {
      onMounted(() => fetchUsers());
    }

    return { users };
  }
};
```

### SSR 注意事项

#### 1. 生命周期差异

```javascript
export default {
  setup() {
    onMounted(() => {
      console.log('客户端执行');
    });

    onServerPrefetch(async () => {
      // 服务端预取数据
      await fetchData();
    });

    return {};
  }
};
```

#### 2. 浏览器 API 限制

```javascript
export default {
  setup() {
    const isClient = ref(false);

    if (import.meta.env.SSR) {
      // ❌ 服务端不能使用浏览器 API
      // window、document、localStorage 等
    } else {
      isClient.value = true;
      // ✅ 客户端可以使用浏览器 API
    }

    return { isClient };
  }
};
```

#### 3. 同构限制

```javascript
// ❌ 不推荐：依赖浏览器 API 的逻辑
export default {
  setup() {
    const width = ref(window.innerWidth);  // SSR 会报错
    return { width };
  }
};

// ✅ 推荐：使用条件渲染
export default {
  setup() {
    const width = ref(0);

    if (!import.meta.env.SSR) {
      width.value = window.innerWidth;
    }

    return { width };
  }
};
```

### 优化策略

#### 1. 静态提升

```javascript
// 服务端渲染时，静态内容可以缓存
const template = `
  <div>
    <h1>Static Content</h1>
    <p>{{ dynamicContent }}</p>
  </div>
`;
```

#### 2. 缓存策略

```javascript
// 使用 lru-cache 缓存渲染结果
import LRU from 'lru-cache';

const ssrCache = new LRU({
  max: 100,           // 最多缓存 100 个
  maxAge: 1000 * 60 * 15  // 15 分钟
});

server.get('*', async (req, res) => {
  const cacheKey = req.url;
  const cachedHtml = ssrCache.get(cacheKey);

  if (cachedHtml) {
    return res.end(cachedHtml);  // 返回缓存
  }

  const html = await renderApp(req);
  ssrCache.set(cacheKey, html);  // 缓存结果
  res.end(html);
});
```

#### 3. 流式渲染

```javascript
// 使用流式渲染，分块返回
import { renderToNodeStream } from '@vue/server-renderer';

server.get('*', (req, res) => {
  const app = createSSRApp(App);
  const stream = renderToNodeStream(app);

  stream.pipe(res);
});
```

### 框架集成

#### Nuxt.js

```javascript
// pages/index.vue
<script setup>
// 自动 SSR
const { data } = await useFetch('/api/data');
</script>

<template>
  <div>{{ data }}</div>
</template>
```

### 总结

Vue3 SSR 的核心优势：

1. **性能提升**：首屏加载速度更快
2. **SEO 优化**：搜索引擎友好
3. **用户体验**：减少白屏时间
4. **同构代码**：服务器和客户端共享代码

需要注意：

- 服务器环境和客户端环境的差异
- 浏览器 API 的使用限制
- 数据预取和状态管理
- 缓存和性能优化

---

## 15、Vue3 中的 nextTick 是如何实现的？

**答案：**

`nextTick` 是 Vue3 中用于在 DOM 更新完成后执行回调的 API，基于异步任务队列实现。

### 基本用法

```javascript
import { ref, nextTick } from 'vue';

const count = ref(0);

async function increment() {
  count.value++;

  // DOM 还未更新
  console.log(document.querySelector('span').textContent);  // 0

  // 等待 DOM 更新
  await nextTick();

  // DOM 已更新
  console.log(document.querySelector('span').textContent);  // 1
}
```

### 实现原理

#### 1. 基于微任务队列

```javascript
// Promise 微任务（首选）
const p = Promise.resolve();

let isFlushPending = false;

function nextTick(fn) {
  return fn ? p.then(() => fn()) : p;
}

// 使用示例
nextTick(() => {
  console.log('DOM 更新完成');
});
```

#### 2. 完整实现

```javascript
// 任务队列
const queue = [];
const postFlushCbs = [];

// 创建微任务
let p = Promise.resolve();

// 任务调度器
function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true;
    p.then(flushJobs);  // 微任务调度
  }
}

// 刷新队列
function flushJobs() {
  isFlushPending = false;

  // 1. 执行主队列
  for (let i = 0; i < queue.length; i++) {
    queue[i]();
  }
  queue.length = 0;

  // 2. 执行 post 队列（nextTick 回调）
  for (let i = 0; i < postFlushCbs.length; i++) {
    postFlushCbs[i]();
  }
  postFlushCbs.length = 0;
}

// nextTick 实现
function nextTick(fn) {
  const promise = p.then(() => {
    // 确保在 flushJobs 后执行
  });

  if (fn) {
    return promise.then(() => fn());
  }

  return promise;
}
```

#### 3. 浏览器兼容性降级

```javascript
// 降级策略：Promise -> MutationObserver -> setImmediate -> setTimeout

// 1. Promise（微任务，最佳性能）
if (typeof Promise !== 'undefined') {
  p = Promise.resolve();
}

// 2. MutationObserver（微任务备选）
else if (typeof MutationObserver !== 'undefined') {
  let counter = 1;
  const observer = new MutationObserver(flushJobs);
  const textNode = document.createTextNode(String(counter));

  observer.observe(textNode, {
    characterData: true
  });

  p = {
    then(fn) {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
      return new Promise((resolve) => {
        // 等待 observer 回调
      });
    }
  };
}

// 3. setImmediate（宏任务，IE 支持）
else if (typeof setImmediate !== 'undefined') {
  p = {
    then(fn) {
      return new Promise((resolve) => {
        setImmediate(() => {
          fn();
          resolve();
        });
      });
    }
  };
}

// 4. setTimeout（最后备选）
else {
  p = {
    then(fn) {
      return new Promise((resolve) => {
        setTimeout(() => {
          fn();
          resolve();
        }, 0);
      });
    }
  };
}
```

### 执行顺序

```javascript
import { ref, nextTick, watchEffect } from 'vue';

const count = ref(0);

console.log('1. 同步代码');

count.value++;
count.value++;
count.value++;

console.log('2. 同步代码结束');

watchEffect(() => {
  console.log('3. watchEffect 回调', count.value);
});

nextTick(() => {
  console.log('4. nextTick 回调');
});

console.log('5. 同步代码继续');

// 执行顺序：
// 1. 同步代码
// 2. 同步代码结束
// 5. 同步代码继续
// 3. watchEffect 回调 0  （微任务：flushJobs）
// 4. nextTick 回调      （微任务：postFlushCbs）
```

### 与更新队列的关系

```javascript
// 响应式更新流程
count.value++;
// -> 触发 effect
// -> effect 加入队列
// -> 调度 queueFlush()
// -> Promise.then(flushJobs)

nextTick(() => {
  // 回调加入 postFlushCbs
});

// 微任务队列：
// 1. flushJobs
//   - 执行队列中的 effect
//   - DOM 更新
//   - 执行 postFlushCbs（nextTick 回调）
```

### 实际应用场景

#### 1. DOM 操作

```javascript
<template>
  <div>
    <p ref="paragraph">{{ count }}</p>
    <button @click="update">Update</button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const count = ref(0);
const paragraph = ref(null);

async function update() {
  count.value++;

  // 此时 DOM 还未更新
  console.log(paragraph.value.textContent);  // 0

  await nextTick();

  // DOM 已更新
  console.log(paragraph.value.textContent);  // 1

  // 安全的 DOM 操作
  paragraph.value.style.color = 'red';
}
</script>
```

#### 2. 第三方库集成

```javascript
import { ref, nextTick, onMounted } from 'vue';
import { Chart } from 'chart.js';

const canvasRef = ref(null);

onMounted(async () => {
  const chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: { labels: [], datasets: [] }
  });

  // 更新数据后重新渲染图表
  updateChart(chart);
});

async function updateChart(chart) {
  const newData = await fetchChartData();

  // 更新 Chart.js 数据
  chart.data = newData;

  await nextTick();  // 等待 Vue 更新 DOM

  chart.update();  // 重新渲染图表
}
```

#### 3. 自动滚动

```javascript
import { ref, watch, nextTick } from 'vue';

const messages = ref([]);
const chatContainer = ref(null);

async function addMessage(message) {
  messages.value.push(message);

  await nextTick();  // 等待新消息渲染

  // 滚动到底部
  chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
}
```

#### 4. 聚焦输入框

```javascript
import { ref, nextTick } from 'vue';

const showInput = ref(false);
const inputRef = ref(null);

async function toggleInput() {
  showInput.value = !showInput.value;

  if (showInput.value) {
    await nextTick();  // 等待输入框渲染

    inputRef.value.focus();  // 聚焦
  }
}
```

### 批量更新

```javascript
const count = ref(0);
const name = ref('Tom');

// 多次更新，只触发一次 DOM 更新
count.value++;
name.value = 'Jerry';
count.value++;

// nextTick 在所有更新完成后执行
nextTick(() => {
  console.log('所有更新完成');
  console.log(count.value);  // 2
  console.log(name.value);    // 'Jerry'
});
```

### 性能优化

```javascript
// ✅ 合理使用 nextTick
async function handleUpdate() {
  // 1. 批量更新状态
  count.value++;
  name.value = 'New Name';
  list.value.push(item);

  // 2. 一次性等待 DOM 更新
  await nextTick();

  // 3. 执行 DOM 操作
  updateChart();
  scrollToBottom();
}

// ❌ 避免频繁调用 nextTick
async function badPractice() {
  for (let i = 0; i < 100; i++) {
    count.value++;
    await nextTick();  // 性能差
  }
}
```

### 与 setTimeout 的区别

```javascript
// nextTick：微任务，在 DOM 更新后立即执行
nextTick(() => {
  console.log('nextTick');
});

// setTimeout：宏任务，在所有微任务后执行
setTimeout(() => {
  console.log('setTimeout');
}, 0);

console.log('sync');

// 输出顺序：
// sync
// nextTick
// setTimeout
```

### 总结

`nextTick` 的核心特点：

1. **基于微任务**：使用 Promise.then，性能优于 setTimeout
2. **DOM 更新后执行**：确保 DOM 已完成更新
3. **批量处理**：多个 nextTick 回调在同一个微任务中执行
4. **浏览器兼容**：支持降级到 MutationObserver/setImmediate/setTimeout
5. **返回 Promise**：支持 async/await 语法

适用场景：

- DOM 操作需要在更新后执行
- 第三方库集成（如 Chart.js、ECharts）
- 滚动、聚焦等交互操作
- 确保渲染完成后的逻辑

---

## 16、Vue3 中的 Transition 组件是如何工作的？

**答案：**

Vue3 的 `<Transition>` 组件提供了一套动画/过渡效果，通过 CSS 过渡和 JavaScript 钩子实现元素进入/离开的动画效果。

### 基本用法

```vue
<template>
  <button @click="show = !show">Toggle</button>

  <Transition name="fade">
    <p v-if="show">Hello Transition</p>
  </Transition>
</template>

<style>
/* 进入动画 */
.fade-enter-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from {
  opacity: 0;
}
.fade-enter-to {
  opacity: 1;
}

/* 离开动画 */
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-leave-from {
  opacity: 1;
}
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 过渡类名

Vue3 为过渡提供了 6 个 CSS 类名：

| 类名 | 说明 | 触发时机 |
|------|------|---------|
| `v-enter-from` | 定义进入过渡的开始状态 | 元素被插入之前 |
| `v-enter-active` | 定义进入过渡的持续时间 | 整个进入过渡期间 |
| `v-enter-to` | 定义进入过渡的结束状态 | 元素被插入后的下一帧 |
| `v-leave-from` | 定义离开过渡的开始状态 | 离开过渡被触发时 |
| `v-leave-active` | 定义离开过渡的持续时间 | 整个离开过渡期间 |
| `v-leave-to` | 定义离开过渡的结束状态 | 离开过渡结束之后 |

### 实现原理

#### 1. 组件生命周期

```javascript
// 简化的 Transition 组件实现
export default {
  name: 'Transition',

  setup(props, { slots }) {
    const instance = getCurrentInstance();

    return () => {
      const children = slots.default ? slots.default() : [];

      // 只处理单个子元素
      if (children.length !== 1) {
        return children;
      }

      const vnode = children[0];

      // 添加过渡钩子
      vnode.transition = {
        beforeEnter(el) {
          el.classList.add('enter-from', 'enter-active');
        },
        enter(el) {
          // 强制重排，触发 CSS 过渡
          requestAnimationFrame(() => {
            el.classList.remove('enter-from');
            el.classList.add('enter-to');
          });
        },
        afterEnter(el) {
          el.classList.remove('enter-active', 'enter-to');
        },
        beforeLeave(el) {
          el.classList.add('leave-from', 'leave-active');
        },
        leave(el, done) {
          requestAnimationFrame(() => {
            el.classList.remove('leave-from');
            el.classList.add('leave-to');
          });

          // 等待过渡结束
          el.addEventListener('transitionend', done);
        },
        afterLeave(el) {
          el.classList.remove('leave-active', 'leave-to');
        }
      };

      return vnode;
    };
  }
};
```

#### 2. DOM Diff 集成

```javascript
// 在 patch 阶段调用过渡钩子
function processTransition(n1, n2, container) {
  if (n1) {
    // 离开过渡
    const leavingVNode = n1;
    const transition = leavingVNode.transition;

    if (transition) {
      transition.beforeLeave(el);

      const { leave } = transition;
      const remove = () => {
        removeVNode(leavingVNode);
      };

      leave(el, remove);
    } else {
      // 无过渡，直接移除
      removeVNode(leavingVNode);
    }
  }

  if (n2) {
    // 进入过渡
    const enteringVNode = n2;
    const transition = enteringVNode.transition;

    if (transition) {
      transition.beforeEnter(el);
      mount(enteringVNode, container);

      requestAnimationFrame(() => {
        transition.enter(el);
        transition.afterEnter(el);
      });
    } else {
      // 无过渡，直接挂载
      mount(enteringVNode, container);
    }
  }
}
```

#### 3. 强制重排（Reflow）

```javascript
// 强制浏览器重排，触发 CSS 过渡
function forceReflow(el) {
  void el.offsetWidth;  // 访问 offsetWidth 触发重排
}

// 进入过渡
enter(el) {
  forceReflow(el);  // 必须先触发重排
  el.classList.remove('enter-from');
  el.classList.add('enter-to');
}
```

### JavaScript 钩子

```vue
<template>
  <Transition
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @enter-cancelled="onEnterCancelled"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
    @leave-cancelled="onLeaveCancelled"
  >
    <p v-if="show">Hello</p>
  </Transition>
</template>

<script setup>
import gsap from 'gsap';

const show = ref(true);

function onBeforeEnter(el) {
  gsap.set(el, {
    opacity: 0,
    x: -100
  });
}

function onEnter(el, done) {
  gsap.to(el, {
    opacity: 1,
    x: 0,
    duration: 0.5,
    onComplete: done  // 必须调用 done
  });
}

function onAfterEnter(el) {
  console.log('进入完成');
}

function onBeforeLeave(el) {
  gsap.set(el, {
    opacity: 1,
    x: 0
  });
}

function onLeave(el, done) {
  gsap.to(el, {
    opacity: 0,
    x: 100,
    duration: 0.5,
    onComplete: done
  });
}
</script>
```

### 模式（Mode）

#### in-out 模式（默认）

```vue
<Transition name="fade" mode="out-in">
  <!-- 当前元素先离开，新元素后进入 -->
  <component :is="currentComponent" />
</Transition>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

#### out-in 模式

```vue
<Transition name="fade" mode="out-in">
  <component :is="currentComponent" :key="currentComponent" />
</Transition>
```

**执行流程：**
1. 旧元素离开
2. 等待旧元素离开完成
3. 新元素进入

### 过渡持续时间

```vue
<!-- 自动检测 CSS 过渡持续时间 -->
<Transition name="fade">
  <p v-if="show">Hello</p>
</Transition>

<!-- 手动指定持续时间（毫秒） -->
<Transition name="fade" :duration="1000">
  <p v-if="show">Hello</p>
</Transition>

<!-- 分别指定进入和离开的持续时间 -->
<Transition
  name="fade"
  :duration="{ enter: 500, leave: 800 }"
>
  <p v-if="show">Hello</p>
</Transition>
```

### 初始渲染

```vue
<!-- 初始渲染时应用进入动画 -->
<Transition appear>
  <p>Hello</p>
</Transition>

<!-- 带名称的初始动画 -->
<Transition name="fade" appear>
  <p>Hello</p>
</Transition>
```

### 列表过渡

```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
    </li>
  </TransitionGroup>
</template>

<style>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
```

### 进阶技巧

#### 1. 动态过渡名称

```vue
<Transition :name="transitionName">
  <p v-if="show">Hello</p>
</Transition>

<script setup>
const transitionName = computed(() => {
  return show.value ? 'fade' : 'slide';
});
</script>
```

#### 2. 结合 CSS 动画

```vue
<template>
  <Transition name="bounce">
    <p v-if="show">Bounce</p>
  </Transition>
</template>

<style>
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
</style>
```

#### 3. 可复用的过渡组件

```vue
<!-- FadeTransition.vue -->
<template>
  <Transition name="fade" mode="out-in">
    <slot></slot>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!-- 使用 -->
<FadeTransition>
  <component :is="currentView" />
</FadeTransition>
```

### 性能优化

```vue
<template>
  <!-- ✅ 使用 transform 和 opacity -->
  <Transition name="optimized">
    <p v-if="show">Optimized</p>
  </Transition>

  <!-- ❌ 避免使用 width、height、left、top -->
  <Transition name="expensive">
    <p v-if="show">Expensive</p>
  </Transition>
</template>

<style>
/* ✅ 使用 transform（GPU 加速） */
.optimized-enter-active,
.optimized-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.optimized-enter-from,
.optimized-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* ❌ 避免使用 width、height（布局重排） */
.expensive-enter-active,
.expensive-leave-active {
  transition: width 0.3s ease;
}
.expensive-enter-from,
.expensive-leave-to {
  width: 0;
}
</style>
```

### 总结

`<Transition>` 组件的核心原理：

1. **CSS 类名**：通过 6 个类名控制过渡状态
2. **JavaScript 钩子**：在关键节点执行回调
3. **强制重排**：确保 CSS 过渡正确触发
4. **模式控制**：协调元素进入/离开的顺序
5. **与 DOM Diff 集成**：在渲染流程中插入过渡逻辑

最佳实践：

- 优先使用 `transform` 和 `opacity`，避免布局重排
- 合理使用 `mode` 属性控制过渡顺序
- 利用 JavaScript 钩子实现复杂动画
- 封装可复用的过渡组件
- 注意性能优化，避免昂贵的 CSS 属性

---

## 17、shallowRef 与 shallowReactive 的用途是什么？

**答案：**

`shallowRef` 和 `shallowReactive` 是 Vue3 中用于创建浅层响应式对象的 API，只追踪第一层属性的访问，适用于特定优化场景。

### 基本概念

#### 深层响应式（默认）

```javascript
import { ref, reactive } from 'vue';

// ref：深层响应式
const state = ref({
  nested: {
    value: 1
  }
});

// 访问任意层级都会触发依赖收集
state.value.nested.value = 2;  // ✅ 触发更新

// reactive：深层响应式
const obj = reactive({
  nested: {
    value: 1
  }
});

obj.nested.value = 2;  // ✅ 触发更新
```

#### 浅层响应式

```javascript
import { shallowRef, shallowReactive } from 'vue';

// shallowRef：只追踪 .value
const state = shallowRef({
  nested: {
    value: 1
  }
});

// ❌ 修改深层属性，不会触发更新
state.value.nested.value = 2;  // 不触发更新

// ✅ 必须替换整个对象
state.value = {
  nested: {
    value: 2
  }
};

// shallowReactive：只追踪第一层属性
const obj = shallowReactive({
  nested: {
    value: 1
  }
});

// ❌ 修改深层属性，不会触发更新
obj.nested.value = 2;  // 不触发更新

// ✅ 修改第一层属性，会触发更新
obj.nested = { value: 2 };  // 触发更新
```

### shallowRef 详细用法

```javascript
import { shallowRef, triggerRef, watchEffect } from 'vue';

const state = shallowRef({
  count: 0,
  user: {
    name: 'Tom',
    age: 20
  }
});

// 1. 深层修改不触发更新
state.value.count++;  // ❌ 不触发更新
state.value.user.age++;  // ❌ 不触发更新

// 2. 替换整个对象触发更新
state.value = {
  count: 1,
  user: {
    name: 'Tom',
    age: 21
  }
};  // ✅ 触发更新

// 3. 手动触发更新（triggerRef）
state.value.count++;
triggerRef(state);  // ✅ 手动触发更新

// 4. watchEffect 只追踪 .value
watchEffect(() => {
  console.log('state changed:', state.value);
  // 只在 state.value 变化时触发
  // state.value.count++ 不会触发
});
```

### shallowReactive 详细用法

```javascript
import { shallowReactive, watchEffect } from 'vue';

const state = shallowReactive({
  count: 0,
  nested: {
    value: 1,
    deep: {
      value: 2
    }
  }
});

// 1. 第一层修改触发更新
state.count++;  // ✅ 触发更新
state.nested = { value: 2 };  // ✅ 触发更新

// 2. 深层修改不触发更新
state.nested.value++;  // ❌ 不触发更新
state.nested.deep.value++;  // ❌ 不触发更新

// 3. watchEffect 只追踪第一层
watchEffect(() => {
  console.log('state.count:', state.count);
  // 只在 state.count 变化时触发
});

watchEffect(() => {
  console.log('state.nested:', state.nested);
  // 只在 state.nested 被替换时触发
  // state.nested.value++ 不会触发
});
```

### 使用场景

#### 1. 大型对象的只读视图

```javascript
// 假设有一个巨大的第三方对象
const hugeData = fetchHugeData();  // 包含 10000+ 个嵌套对象

// 使用 shallowRef 避免深层递归代理
const dataView = shallowRef(hugeData);

// 只在数据完全替换时更新
async function refreshData() {
  const newData = await fetchHugeData();
  dataView.value = newData;  // 触发更新
}

// 深层访问不会触发依赖收集
function displayData() {
  console.log(dataView.value.deeply.nested.property);
  // 不会触发响应式追踪
}
```

#### 2. 第三方库集成

```javascript
import { shallowRef } from 'vue';
import { Map } from 'leaflet';

const map = shallowRef(null);

function initMap() {
  map.value = L.map('map-container').setView([51.505, -0.09], 13);

  // 修改 Map 内部状态，不需要响应式
  map.value.setZoom(14);
  map.value.setView([51.51, -0.1], 14);
}

// 整个 Map 实例替换时才触发更新
function destroyMap() {
  map.value = null;  // 触发更新
}
```

#### 3. 性能优化

```javascript
// ❌ 深层响应式，性能开销大
const deepList = ref(
  Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    nested: { value: i }
  }))
);

// 修改任意元素都会触发依赖检查
deepList.value[5000].nested.value++;  // 需要遍历整个依赖树

// ✅ 浅层响应式，性能更好
const shallowList = shallowRef(
  Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    nested: { value: i }
  }))
);

// 批量修改后手动触发
for (let i = 0; i < 10000; i++) {
  shallowList.value[i].nested.value++;
}
triggerRef(shallowList);  // 一次性触发
```

#### 4. 不可变数据

```javascript
import { shallowRef } from 'vue';

const state = shallowRef({
  users: [
    { id: 1, name: 'Tom' },
    { id: 2, name: 'Jerry' }
  ]
});

// ✅ 使用不可变更新模式
function addUser(user) {
  state.value = {
    ...state.value,
    users: [...state.value.users, user]
  };
}

function updateUser(id, newName) {
  state.value = {
    ...state.value,
    users: state.value.users.map(u =>
      u.id === id ? { ...u, name: newName } : u
    )
  };
}

// 每次替换都触发更新，保持数据不可变
```

### 与常规 ref/reactive 的对比

```javascript
import { ref, reactive, shallowRef, shallowReactive } from 'vue';

// ref vs shallowRef
const deepRef = ref({ a: { b: 1 } });
const shallowRefObj = shallowRef({ a: { b: 1 } });

watchEffect(() => {
  console.log('deepRef changed');
  console.log('shallowRef changed');
});

deepRef.value.a.b++;  // ✅ 触发 watchEffect
shallowRefObj.value.a.b++;  // ❌ 不触发

// reactive vs shallowReactive
const deepReactive = reactive({ a: { b: 1 } });
const shallowReactiveObj = shallowReactive({ a: { b: 1 } });

watchEffect(() => {
  console.log('deepReactive changed');
  console.log('shallowReactive changed');
});

deepReactive.a.b++;  // ✅ 触发 watchEffect
shallowReactiveObj.a.b++;  // ❌ 不触发
```

### 注意事项

#### 1. 模板中的自动解包

```vue
<template>
  <!-- shallowRef 在模板中会自动解包 -->
  <div>{{ shallowState.count }}</div>
</template>

<script setup>
import { shallowRef } from 'vue';

const shallowState = shallowRef({ count: 0 });

function increment() {
  shallowState.value.count++;  // 不会触发更新

  // 必须手动触发
  triggerRef(shallowState);
}
</script>
```

#### 2. 计算属性的使用

```javascript
import { shallowRef, computed } from 'vue';

const state = shallowRef({ count: 0 });

// ❌ 计算属性不会自动追踪深层变化
const doubled = computed(() => state.value.count * 2);

// ✅ 结合 triggerRef 使用
function increment() {
  state.value.count++;
  triggerRef(state);  // 手动触发，计算属性会重新计算
}
```

#### 3. toRefs 的限制

```javascript
import { shallowReactive, toRefs } from 'vue';

const state = shallowReactive({
  count: 0,
  user: { name: 'Tom' }
});

// ❌ toRefs 不会创建深层响应式
const { user } = toRefs(state);

// user.value.name 修改不会触发更新
user.value.name = 'Jerry';  // 不触发更新
```

### 最佳实践

```javascript
// ✅ 适用场景 1：大型对象，整体替换
const bigData = shallowRef(initialData);
async function loadData() {
  bigData.value = await fetchBigData();  // 替换触发更新
}

// ✅ 适用场景 2：第三方库实例
const chartInstance = shallowRef(null);
onMounted(() => {
  chartInstance.value = echarts.init(el);
});

// ✅ 适用场景 3：性能优化
const list = shallowRef(items);
function bulkUpdate() {
  items.value.forEach(item => item.process());
  triggerRef(items.value);  // 批量更新
}

// ❌ 不适用：需要深层响应式
const form = shallowRef({
  username: '',
  password: ''
});

form.value.username = 'test';  // 不会触发更新，应使用常规 ref
```

### 总结

**shallowRef**：
- 只追踪 `.value` 的访问
- 适合整体替换的对象
- 需要手动调用 `triggerRef` 触发更新

**shallowReactive**：
- 只追踪第一层属性的访问
- 适合需要第一层响应式但不需要深层响应式的对象
- 结合不可变数据模式使用

**何时使用**：
- 处理大型对象，避免递归代理的性能开销
- 集成第三方库，避免代理干扰
- 性能优化场景，批量更新后统一触发
- 不可变数据模式

---

## 18、v-model 的双向数据绑定实现。

**答案：**

`v-model` 是 Vue 的双向数据绑定语法糖，通过 props 和 emit 实现父子组件数据同步。

### 基本用法

```vue
<!-- 父组件 -->
<template>
  <ChildComponent v-model="message" />
  <!-- 等价于 -->
  <ChildComponent
    :modelValue="message"
    @update:modelValue="message = $event"
  />
</template>

<script setup>
import { ref } from 'vue';
import ChildComponent from './ChildComponent.vue';

const message = ref('Hello');
</script>

<!-- 子组件 -->
<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
</script>
```

### 编译原理

#### 模板编译

```vue
<template>
  <MyInput v-model="userName" />
</template>
```

**编译后：**

```javascript
import { resolveComponent, withDirectives, createVNode } from 'vue';

export function render(_ctx, _cache) {
  const _component_MyInput = resolveComponent("MyInput");

  return createVNode(_component_MyInput, {
    "modelValue": _ctx.userName,
    "onUpdate:modelValue": $event => ((_ctx.userName) = $event)
  }, null, 8 /* PROPS */, ["modelValue"]);
}
```

### 默认参数

在 Vue3 中，`v-model` 默认使用的 prop 名是 `modelValue`，事件名是 `update:modelValue`。

```vue
<!-- 子组件 -->
<script setup>
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
</script>
```

### 多个 v-model

```vue
<!-- 父组件 -->
<template>
  <UserForm
    v-model="userName"
    v-model:user-email="userEmail"
  />
</template>

<script setup>
import { ref } from 'vue';

const userName = ref('Tom');
const userEmail = ref('tom@example.com');
</script>

<!-- 子组件 -->
<template>
  <input
    :value="userName"
    @input="emit('update:userName', $event.target.value)"
  />
  <input
    :value="userEmail"
    @input="emit('update:userEmail', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  userName: String,
  userEmail: String
});

const emit = defineEmits(['update:userName', 'update:userEmail']);
</script>
```

### 修饰符

```vue
<template>
  <!-- .lazy：使用 change 事件而不是 input -->
  <input v-model.lazy="message" />

  <!-- .number：自动转换为数字 -->
  <input v-model.number="age" />

  <!-- .trim：自动去除首尾空格 -->
  <input v-model.trim="username" />

  <!-- 自定义修饰符 -->
  <MyInput v-model.capitalize="message" />
</template>

<!-- 子组件处理修饰符 -->
<script setup>
const props = defineProps({
  modelValue: String,
  modelModifiers: {  // 接收修饰符
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue']);

function handleInput(e) {
  let value = e.target.value;

  // 处理 capitalize 修饰符
  if (props.modelModifiers.capitalize) {
    value = value.charAt(0).toUpperCase() + value.slice(1);
  }

  emit('update:modelValue', value);
}
</script>
```

### 内置组件的 v-model

#### input 元素

```vue
<!-- 文本输入 -->
<input v-model="message" />

<!-- 等价于 -->
<input
  :value="message"
  @input="message = $event.target.value"
/>

<!-- 复选框 -->
<input type="checkbox" v-model="checked" />

<!-- 等价于 -->
<input
  type="checkbox"
  :checked="checked"
  @change="checked = $event.target.checked"
/>

<!-- 单选框 -->
<input type="radio" v-model="picked" value="Option A" />
<input type="radio" v-model="picked" value="Option B" />

<!-- 等价于 -->
<input
  type="radio"
  :checked="picked === 'Option A'"
  @change="picked = 'Option A'"
/>
```

#### select 元素

```vue
<!-- 单选 -->
<select v-model="selected">
  <option value="">请选择</option>
  <option value="A">Option A</option>
  <option value="B">Option B</option>
</select>

<!-- 多选 -->
<select v-model="selected" multiple>
  <option value="A">Option A</option>
  <option value="B">Option B</option>
</select>
```

### 自定义组件的 v-model

#### 基础实现

```vue
<!-- CustomInput.vue -->
<template>
  <input
    :value="modelValue"
    @input="onInput"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>

<script setup>
defineProps({
  modelValue: String,
  label: String
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur']);

function onInput(e) {
  emit('update:modelValue', e.target.value);
}
</script>

<!-- 使用 -->
<template>
  <CustomInput v-model="name" label="Name" />
</template>
```

#### 复杂场景

```vue
<!-- RichTextEditor.vue -->
<template>
  <div
    ref="editorRef"
    contenteditable
    @input="onInput"
    @blur="emit('blur')"
  ></div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  modelValue: String
});

const emit = defineEmits(['update:modelValue', 'blur']);
const editorRef = ref(null);

// 初始化内容
onMounted(() => {
  editorRef.value.innerHTML = props.modelValue;
});

function onInput() {
  emit('update:modelValue', editorRef.value.innerHTML);
}
</script>
```

### v-model 与 v-bind 的区别

```vue
<!-- v-model：双向绑定 -->
<input v-model="message" />

<!-- v-bind + v-on：单向数据流 -->
<input :value="message" @input="message = $event.target.value" />

<!-- v-bind：只绑定值，不监听输入 -->
<input :value="message" />
```

**v-model 的优势：**
- 更简洁的语法
- 自动处理不同类型元素的默认行为
- 支持修饰符

**v-bind + v-on 的优势：**
- 更灵活，可以自定义事件处理逻辑
- 可以添加额外的逻辑

### TypeScript 支持

```vue
<script setup lang="ts">
interface User {
  name: string;
  email: string;
  age?: number;
}

const user = defineModel<User>({
  required: true
});

// TypeScript 会自动推断类型
user.value.name = 'Tom';
user.value.email = 'tom@example.com';
</script>
```

### 注意事项

#### 1. 避免直接修改 props

```vue
<!-- ❌ 错误：直接修改 props -->
<script setup>
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

function updateValue(value) {
  props.modelValue = value;  // ❌ 错误！
}
</script>

<!-- ✅ 正确：通过 emit 更新 -->
<script setup>
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

function updateValue(value) {
  emit('update:modelValue', value);  // ✅ 正确
}
</script>
```

#### 2. 避免循环更新

```vue
<!-- ❌ 可能导致循环更新 -->
<script setup>
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

watch(
  () => props.modelValue,
  (newVal) => {
    emit('update:modelValue', newVal);  // 可能导致无限循环
  }
);
</script>
```

### 实战示例

#### 表单绑定

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>用户名：</label>
      <input v-model="form.username" type="text" />
    </div>
    <div>
      <label>密码：</label>
      <input v-model="form.password" type="password" />
    </div>
    <div>
      <label>性别：</label>
      <input v-model="form.gender" type="radio" value="male" /> 男
      <input v-model="form.gender" type="radio" value="female" /> 女
    </div>
    <div>
      <label>爱好：</label>
      <input v-model="form.hobbies" type="checkbox" value="reading" /> 阅读
      <input v-model="form.hobbies" type="checkbox" value="coding" /> 编程
      <input v-model="form.hobbies" type="checkbox" value="gaming" /> 游戏
    </div>
    <div>
      <label>城市：</label>
      <select v-model="form.city">
        <option value="">请选择</option>
        <option value="beijing">北京</option>
        <option value="shanghai">上海</option>
        <option value="guangzhou">广州</option>
      </select>
    </div>
    <div>
      <label>简介：</label>
      <textarea v-model="form.bio"></textarea>
    </div>
    <button type="submit">提交</button>
  </form>
</template>

<script setup>
import { reactive } from 'vue';

const form = reactive({
  username: '',
  password: '',
  gender: '',
  hobbies: [],
  city: '',
  bio: ''
});

function handleSubmit() {
  console.log('表单数据：', form);
}
</script>
```

### 总结

`v-model` 的核心原理：

1. **语法糖**：编译为 `:prop` 和 `@event`
2. **单向数据流**：通过 emit 更新父组件
3. **默认参数**：`modelValue` 和 `update:modelValue`
4. **灵活配置**：支持自定义 prop 名、多个 v-model、修饰符
5. **类型安全**：配合 TypeScript 提供完整的类型支持

最佳实践：

- 始终通过 emit 更新，避免直接修改 props
- 合理使用修饰符简化逻辑
- 复杂场景下使用 `v-bind` + `v-on` 获得更多控制
- 在组件中明确定义 props 和 emits

---

## 19、Vue3 父组件和子组件如何通信？

**答案：**

Vue3 提供了多种父子组件通信方式，包括 props、emit、ref、provide/inject 等，适用于不同场景。

### 1. Props 下传

#### 基本用法

```vue
<!-- 父组件 -->
<template>
  <ChildComponent
    title="Hello"
    :count="10"
    :user="{ name: 'Tom', age: 20 }"
  />
</template>

<script setup>
import ChildComponent from './ChildComponent.vue';
</script>

<!-- 子组件 -->
<template>
  <div>
    <h2>{{ title }}</h2>
    <p>Count: {{ count }}</p>
    <p>User: {{ user.name }} ({{ user.age }})</p>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  count: {
    type: Number,
    required: true,
    default: 0,
    validator: (value) => value >= 0
  },
  user: {
    type: Object,
    default: () => ({ name: '', age: 0 })
  }
});
</script>
```

#### TypeScript 支持

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count: number;
  user: {
    name: string;
    age: number;
  };
}

const props = defineProps<Props>();

// withDefaults 设置默认值
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  user: () => ({ name: '', age: 0 })
});
</script>
```

### 2. Emit 上传

#### 基本用法

```vue
<!-- 子组件 -->
<template>
  <button @click="handleClick">Click Me</button>
</template>

<script setup>
const emit = defineEmits(['click', 'update']);

function handleClick() {
  emit('click', { x: 100, y: 200 });  // 传递参数
  emit('update', 1, 2, 3);  // 多个参数
}
</script>

<!-- 父组件 -->
<template>
  <ChildComponent
    @click="handleChildClick"
    @update="handleUpdate"
  />
</template>

<script setup>
function handleChildClick(event) {
  console.log(event.x, event.y);
}

function handleUpdate(a, b, c) {
  console.log(a, b, c);
}
</script>
```

#### 事件验证

```vue
<script setup>
const emit = defineEmits({
  // 无验证
  click: null,

  // 带验证
  submit: (payload) => {
    if (payload.email && !payload.email.includes('@')) {
      console.warn('Invalid email');
      return false;
    }
    return true;
  }
});

function handleSubmit() {
  emit('submit', { email: 'invalid' });  // 警告
  emit('submit', { email: 'valid@example.com' });  // 正常
}
</script>
```

### 3. v-model 双向绑定

```vue
<!-- 父组件 -->
<template>
  <ChildComponent v-model="message" />
  <!-- 等价于 -->
  <ChildComponent
    :modelValue="message"
    @update:modelValue="message = $event"
  />
</template>

<script setup>
import { ref } from 'vue';
const message = ref('Hello');
</script>

<!-- 子组件 -->
<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
</script>
```

### 4. ref 访问子组件

#### 基本用法

```vue
<!-- 父组件 -->
<template>
  <ChildComponent ref="childRef" />

  <button @click="callChildMethod">调用子组件方法</button>
</template>

<script setup>
import { ref } from 'vue';
import ChildComponent from './ChildComponent.vue';

const childRef = ref(null);

function callChildMethod() {
  childRef.value?.someMethod();
  childRef.value?.publicData = 'Updated';
}
</script>

<!-- 子组件 -->
<template>
  <div>{{ publicData }}</div>
</template>

<script setup>
import { ref } from 'vue';

const publicData = ref('Initial Data');

// 公开的方法和数据
defineExpose({
  someMethod,
  publicData
});

function someMethod() {
  console.log('Child method called');
}
</script>
```

#### TypeScript 支持

```vue
<script setup lang="ts">
interface ChildInstance {
  someMethod: () => void;
  publicData: Ref<string>;
}

const childRef = ref<ChildInstance | null>(null);

function callChildMethod() {
  childRef.value?.someMethod();
}
</script>
```

### 5. provide/inject 跨层通信

#### 基本用法

```vue
<!-- 祖先组件 -->
<template>
  <ParentComponent />
</template>

<script setup>
import { provide, ref, readonly } from 'vue';

const theme = ref('light');
const user = ref({ name: 'Tom', age: 20 });

// 提供数据
provide('theme', readonly(theme));  // 只读
provide('user', user);
provide('changeTheme', (newTheme) => {
  theme.value = newTheme;
});
</script>

<!-- 中间组件 -->
<template>
  <ChildComponent />
</template>

<!-- 后代组件 -->
<template>
  <div>
    <p>Theme: {{ theme }}</p>
    <p>User: {{ user.name }}</p>
    <button @click="changeTheme('dark')">Dark Theme</button>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const theme = inject('theme', 'light');  // 默认值
const user = inject('user');
const changeTheme = inject('changeTheme');
</script>
```

#### 使用 Symbol 作为 key

```vue
<!-- 定义 injection keys -->
// keys.ts
import { InjectionKey } from 'vue';

export interface ThemeContext {
  theme: Ref<string>;
  changeTheme: (theme: string) => void;
}

export const themeKey: InjectionKey<ThemeContext> = Symbol('theme');

<!-- 祖先组件 -->
<script setup>
import { provide, ref, readonly } from 'vue';
import { themeKey } from './keys';

const theme = ref('light');

provide(themeKey, {
  theme: readonly(theme),
  changeTheme: (newTheme) => {
    theme.value = newTheme;
  }
});
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from 'vue';
import { themeKey } from './keys';

const themeContext = inject(themeKey);

if (themeContext) {
  const { theme, changeTheme } = themeContext;
  // 使用 theme 和 changeTheme
}
</script>
```

### 6. 事件总线（非官方）

```javascript
// eventBus.js
import { ref, watchEffect } from 'vue';

const bus = ref({});

function on(event, callback) {
  if (!bus.value[event]) {
    bus.value[event] = [];
  }
  bus.value[event].push(callback);
}

function emit(event, payload) {
  if (bus.value[event]) {
    bus.value[event].forEach(callback => callback(payload));
  }
}

function off(event, callback) {
  if (bus.value[event]) {
    bus.value[event] = bus.value[event].filter(cb => cb !== callback);
  }
}

export { on, emit, off };
```

```vue
<!-- 组件 A：发送事件 -->
<script setup>
import { emit } from './eventBus';

function sendEvent() {
  emit('message', 'Hello from Component A');
}
</script>

<!-- 组件 B：监听事件 -->
<script setup>
import { on, off } from './eventBus';
import { onMounted, onUnmounted } from 'vue';

function handleMessage(message) {
  console.log('Received:', message);
}

onMounted(() => {
  on('message', handleMessage);
});

onUnmounted(() => {
  off('message', handleMessage);
});
</script>
```

### 7. 状态管理

#### Pinia

```javascript
// store/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    name: 'Tom',
    age: 20
  }),
  getters: {
    fullName: (state) => `User: ${state.name}`
  },
  actions: {
    updateName(newName) {
      this.name = newName;
    },
    incrementAge() {
      this.age++;
    }
  }
});
```

```vue
<!-- 任意组件中使用 -->
<script setup>
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

// 访问 state
console.log(userStore.name);

// 访问 getters
console.log(userStore.fullName);

// 调用 actions
userStore.updateName('Jerry');

// 响应式解构
const { name, age } = storeToRefs(userStore);
</script>
```

### 通信方式对比

| 方式 | 数据流向 | 适用场景 | 跨层级 |
|------|---------|---------|--------|
| Props | 父 → 子 | 数据传递 | ❌ |
| Emit | 子 → 父 | 事件通知 | ❌ |
| v-model | 双向 | 表单绑定 | ❌ |
| ref | 父 → 子 | 调用子组件方法 | ❌ |
| provide/inject | 祖先 → 后代 | 跨层数据共享 | ✅ |
| 事件总线 | 任意 | 解耦通信 | ✅ |
| 状态管理 | 任意 | 全局状态 | ✅ |

### 最佳实践

#### 简单父子通信

```vue
<!-- ✅ 推荐：props + emit -->
<ChildComponent :title="title" @update="handleUpdate" />
```

#### 表单组件

```vue
<!-- ✅ 推荐：v-model -->
<InputComponent v-model="form.username" />
```

#### 跨层级通信

```vue
<!-- ✅ 推荐：provide/inject -->
<!-- 避免 props 逐层传递 -->
```

#### 调用子组件方法

```vue
<!-- ✅ 推荐：ref + defineExpose -->
<ChildComponent ref="childRef" />
```

#### 复杂状态管理

```vue
<!-- ✅ 推荐：Pinia -->
<script setup>
import { useUserStore } from '@/store/user';
const userStore = useUserStore();
</script>
```

### 注意事项

#### 1. Props 单向数据流

```vue
<!-- ❌ 错误：直接修改 props -->
<script setup>
const props = defineProps(['message']);

function updateMessage() {
  props.message = 'Updated';  // 错误！
}
</script>

<!-- ✅ 正确：通过 emit 更新 -->
<script setup>
const props = defineProps(['message']);
const emit = defineEmits(['update:message']);

function updateMessage() {
  emit('update:message', 'Updated');
}
</script>
```

#### 2. 避免过度使用 provide/inject

```vue
<!-- ❌ 不推荐：过度使用 provide/inject -->
provide('buttonText', 'Click');
provide('buttonColor', 'blue');
provide('buttonSize', 'large');

<!-- ✅ 推荐：封装为 composable -->
const useButton = () => {
  const text = 'Click';
  const color = 'blue';
  const size = 'large';
  return { text, color, size };
};
```

---

## 20、如何理解 Vue3 中的 provide 和 inject ？如何实现的？

**答案：**

`provide` 和 `inject` 是 Vue3 提供的依赖注入 API，允许祖先组件向后代组件提供数据，解决跨层级组件通信问题。

### 基本概念

```
祖先组件（provide）
    ↓
中间组件（不关心）
    ↓
后代组件（inject）
```

### 基本用法

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref, readonly } from 'vue';

const theme = ref('light');
const user = ref({ name: 'Tom', age: 20 });

// 提供数据
provide('theme', theme);
provide('user', user);

// 提供只读数据
provide('readonlyTheme', readonly(theme));

// 提供方法
provide('changeTheme', (newTheme) => {
  theme.value = newTheme;
});
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from 'vue';

const theme = inject('theme', 'light');  // 带默认值
const user = inject('user');
const changeTheme = inject('changeTheme');

function toggleTheme() {
  changeTheme(theme.value === 'light' ? 'dark' : 'light');
}
</script>
```

### 实现原理

#### 1. 组件实例的 provides 链

```javascript
// 简化的实现原理
function setupComponent(instance) {
  // 当前组件的 provides
  instance.provides = Object.create(instance.parent?.provides || Object.prototype);

  // 继承父组件的 provides
  if (instance.parent) {
    instance.provides.__proto__ = instance.parent.provides;
  }
}
```

#### 2. provide 函数

```javascript
function provide(key, value) {
  const instance = getCurrentInstance();

  if (!instance) {
    console.warn('provide() can only be used inside setup()');
    return;
  }

  // 将数据存入当前组件的 provides
  instance.provides[key] = value;
}
```

#### 3. inject 函数

```javascript
function inject(key, defaultValue, treatDefaultAsFactory = false) {
  const instance = getCurrentInstance();

  if (!instance) {
    console.warn('inject() can only be used inside setup()');
    return defaultValue;
  }

  // 沿着原型链向上查找
  const provides = instance.parent?.provides || instance.rootContext.provides;

  if (key in provides) {
    // 找到提供的数据
    return provides[key];
  } else if (arguments.length > 1) {
    // 返回默认值
    return treatDefaultAsFactory && isFunction(defaultValue)
      ? defaultValue.call(instance.proxy)
      : defaultValue;
  } else {
    console.warn(`injection "${String(key)}" not found`);
  }
}
```

#### 4. 原型链查找

```javascript
// 祖先组件
ancestorComponent.provides = {
  'theme': ref('light'),
  'user': ref({ name: 'Tom' })
};

// 中间组件
middleComponent.provides = Object.create(ancestorComponent.provides);
middleComponent.provides.__proto__ = ancestorComponent.provides;

// 后代组件查找
// 1. 在后代组件的 provides 中查找
// 2. 沿着原型链向上查找
// 3. 在祖先组件的 provides 中找到 'theme'
```

### 响应式原理

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref } from 'vue';

// 响应式数据
const count = ref(0);

// 提供 ref，后代组件获得响应式引用
provide('count', count);

// 修改数据会触发后代组件更新
function increment() {
  count.value++;
}
</script>

<!-- 后代组件 -->
<script setup>
import { inject, watchEffect } from 'vue';

const count = inject('count');

// 响应式更新
watchEffect(() => {
  console.log('count:', count.value);
});
</script>
```

### 只读提供

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref, readonly } from 'vue';

const theme = ref('light');

// 提供只读数据，防止后代组件修改
provide('theme', readonly(theme));
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from 'vue';

const theme = inject('theme');

// ❌ 尝试修改会报错
// theme.value = 'dark';  // Error!
</script>
```

### 使用 Symbol 作为 key

```javascript
// keys.js
import { InjectionKey } from 'vue';

export interface ThemeContext {
  theme: Ref<string>;
  toggleTheme: () => void;
}

export const themeKey: InjectionKey<ThemeContext> = Symbol('theme');
```

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref } from 'vue';
import { themeKey, type ThemeContext } from './keys';

const theme = ref('light');
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
};

provide<ThemeContext>(themeKey, {
  theme,
  toggleTheme
});
</script>

<!-- 后代组件 -->
<script setup lang="ts">
import { inject } from 'vue';
import { themeKey } from './keys';

// 类型安全
const themeContext = inject(themeKey);

if (themeContext) {
  const { theme, toggleTheme } = themeContext;
  console.log(theme.value);
  toggleTheme();
}
</script>
```

### 默认值和工厂函数

```javascript
// 基本默认值
const theme = inject('theme', 'light');

// 函数作为默认值
const config = inject('config', () => ({
  apiEndpoint: 'https://api.example.com',
  timeout: 5000
}));

// 依赖注入的工厂函数
const store = inject('store', () => useStore(), true);
```

### 注意事项

#### 1. 避免响应式丢失

```vue
<!-- ❌ 错误：解构导致响应式丢失 -->
<script setup>
const theme = inject('theme');
const { value } = theme;  // 丢失响应式
</script>

<!-- ✅ 正确：保持引用 -->
<script setup>
const theme = inject('theme');
// theme.value 保持响应式
</script>

<!-- ✅ 正确：使用 storeToRefs -->
<script setup>
import { storeToRefs } from 'pinia';

const store = inject('store');
const { count, name } = storeToRefs(store);
</script>
```

#### 2. 响应式更新的时机

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref, nextTick } from 'vue';

const data = ref(null);

provide('data', data);

async function fetchData() {
  data.value = null;  // 先清空
  await nextTick();  // 等待后代组件响应清空

  const response = await fetch('/api/data');
  data.value = await response.json();
}
</script>
```

#### 3. 循环依赖

```javascript
// ❌ 避免：循环依赖
// 组件 A
provide('a', inject('b'));

// 组件 B
provide('b', inject('a'));

// ✅ 正确：使用 composable 解耦
const useShared = () => {
  const state = reactive({});
  return { state };
};
```

### 实战场景

#### 1. 主题切换

```vue
<!-- App.vue（祖先） -->
<script setup>
import { provide, ref } from 'vue';
import { themeKey } from './keys';

const theme = ref('light');

provide(themeKey, {
  theme,
  setTheme: (newTheme) => {
    theme.value = newTheme;
  }
});
</script>

<template>
  <div :class="theme">
    <RouterView />
  </div>
</template>

<!-- 组件中使用 -->
<script setup>
import { inject } from 'vue';
import { themeKey } from './keys';

const { theme, setTheme } = inject(themeKey) || {};
</script>

<template>
  <button @click="setTheme(theme === 'light' ? 'dark' : 'light')">
    切换主题
  </button>
</template>
```

#### 2. 国际化

```vue
<!-- I18nProvider.vue -->
<script setup>
import { provide, ref } from 'vue';
import { i18nKey } from './keys';

const locale = ref('zh');
const messages = {
  zh: { greeting: '你好' },
  en: { greeting: 'Hello' }
};

provide(i18nKey, {
  locale,
  t: (key) => messages[locale.value][key],
  setLocale: (newLocale) => {
    locale.value = newLocale;
  }
});
</script>

<!-- 使用 -->
<script setup>
import { inject } from 'vue';
import { i18nKey } from './keys';

const { t, setLocale } = inject(i18nKey);
</script>

<template>
  <p>{{ t('greeting') }}</p>
  <button @click="setLocale('en')">English</button>
  <button @click="setLocale('zh')">中文</button>
</template>
```

#### 3. 用户认证

```vue
<!-- AuthProvider.vue -->
<script setup>
import { provide, ref } from 'vue';
import { authKey } from './keys';

const user = ref(null);
const isAuthenticated = ref(false);

provide(authKey, {
  user,
  isAuthenticated,
  login: async (credentials) => {
    const response = await api.login(credentials);
    user.value = response.user;
    isAuthenticated.value = true;
  },
  logout: () => {
    user.value = null;
    isAuthenticated.value = false;
  }
});
</script>

<!-- 使用 -->
<script setup>
import { inject } from 'vue';
import { authKey } from './keys';
import { useRouter } from 'vue-router';

const { user, isAuthenticated, login, logout } = inject(authKey);
const router = useRouter();

if (!isAuthenticated.value) {
  router.push('/login');
}
</script>
```

### 与 props 的对比

| 特性 | props | provide/inject |
|------|-------|----------------|
| 数据流向 | 父 → 子 | 祖先 → 后代 |
| 跨层级 | ❌ | ✅ |
| 类型安全 | ✅ | ✅（配合 Symbol） |
| 响应式 | ✅ | ✅ |
| 数据追踪 | 明确 | 隐式 |
| 调试难度 | 低 | 较高 |

### 最佳实践

```vue
<!-- ✅ 推荐：使用 Symbol 作为 key -->
import { themeKey } from './keys';
provide(themeKey, themeContext);

<!-- ✅ 推荐：封装为 composable -->
const useTheme = () => {
  const theme = inject(themeKey);
  if (!theme) {
    throw new Error('Theme context not found');
  }
  return theme;
};

<!-- ✅ 推荐：提供只读数据 -->
provide('data', readonly(data));

<!-- ✅ 推荐：提供类型安全的上下文 -->
interface AppContext {
  user: Ref<User>;
  theme: Ref<string>;
  router: Router;
}
```

### 总结

`provide` 和 `inject` 的核心特点：

1. **原型链查找**：利用 JavaScript 原型链实现向上查找
2. **响应式保持**：直接传递 ref/reactive 对象，保持响应式
3. **跨层级通信**：解决 props 逐层传递的问题
4. **类型安全**：配合 Symbol 和 TypeScript 提供类型支持
5. **只读保护**：使用 `readonly` 防止意外修改

适用场景：

- 跨层级的数据共享
- 配置和主题管理
- 国际化和本地化
- 用户认证和权限
- 复杂的组件库开发

---

## 21、Vue3 中，什么是 Custom Renderer API ?

**答案：**

Custom Renderer API 是 Vue3 暴露的底层渲染器 API，允许开发者创建自定义渲染器，将 Vue 组件渲染到非 DOM 环境中。

### 基本概念

Vue3 的渲染架构分为三层：

```
@vue/compiler-core    编译器核心
    ↓
@vue/runtime-core    运行时核心（平台无关）
    ↓
自定义渲染器        平台特定实现
```

### 基本用法

#### 1. 创建自定义渲染器

```javascript
import { createRenderer } from '@vue/runtime-core';

// 定义宿主操作
const nodeOps = {
  // 创建元素
  createElement(tag) {
    return { tag, children: [], props: {} };
  },

  // 创建文本
  createText(text) {
    return { text };
  },

  // 设置元素文本
  setElementText(node, text) {
    node.text = text;
  },

  // 插入节点
  insert(child, parent, anchor) {
    const index = anchor
      ? parent.children.indexOf(anchor)
      : parent.children.length;
    parent.children.splice(index, 0, child);
    child.parent = parent;
  },

  // 移除节点
  remove(child) {
    const parent = child.parent;
    if (parent) {
      const index = parent.children.indexOf(child);
      parent.children.splice(index, 1);
    }
  },

  // 获取父节点
  parentNode(node) {
    return node.parent;
  },

  // 获取下一个兄弟节点
  nextSibling(node) {
    const parent = node.parent;
    if (!parent) return null;
    const index = parent.children.indexOf(node);
    return parent.children[index + 1] || null;
  },

  // 查询选择器（可选）
  querySelector(selector) {
    // 实现选择器查询
  },

  // 设置作用域 ID（可选）
  setScopeId(el, id) {
    el.scopeId = id;
  }
};

// 定义属性操作
const patchProp = (el, key, prevValue, nextValue) => {
  if (nextValue !== prevValue) {
    el.props[key] = nextValue;
  }
};

// 创建渲染器
const { createApp, render } = createRenderer({ nodeOps, patchProp });

// 使用自定义渲染器
const app = createApp({
  setup() {
    const count = ref(0);

    return { count, increment: () => count.value++ };
  }
});

const root = { children: [] };
render(app.mount(root), root);

console.log(JSON.stringify(root, null, 2));
```

### 实际应用场景

#### 1. Canvas 渲染器

```javascript
// canvas-renderer.js
import { createRenderer } from '@vue/runtime-core';

function createCanvasRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  const nodeOps = {
    createElement(tag) {
      return {
        tag,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: 'black',
        text: ''
      };
    },

    createText(text) {
      return { text };
    },

    setElementText(node, text) {
      node.text = text;
    },

    insert(child, parent) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(child);
      renderNode(child, ctx);
    },

    remove(child) {
      const parent = child.parent;
      if (parent && parent.children) {
        const index = parent.children.indexOf(child);
        parent.children.splice(index, 1);
        renderAll(parent, ctx);
      }
    }
  };

  const patchProp = (el, key, prevValue, nextValue) => {
    if (prevValue !== nextValue) {
      el[key] = nextValue;
      renderNode(el, ctx);
    }
  };

  return createRenderer({ nodeOps, patchProp });
}

// 使用
const canvas = document.getElementById('canvas');
const { createApp } = createCanvasRenderer(canvas);

const app = createApp({
  setup() {
    const rect = ref({
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      color: 'red'
    });

    return { rect };
  },
  template: `
    <rect
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      :height="rect.height"
      :color="rect.color"
    />
  `
});

app.mount(canvas);
```

#### 2. SVG 渲染器

```javascript
import { createRenderer } from '@vue/runtime-core';

function createSVGRenderer(svg) {
  const nodeOps = {
    createElement(tag) {
      return document.createElementNS('http://www.w3.org/2000/svg', tag);
    },

    createText(text) {
      return document.createTextNode(text);
    },

    setElementText(el, text) {
      el.textContent = text;
    },

    insert(child, parent, anchor) {
      if (anchor) {
        parent.insertBefore(child, anchor);
      } else {
        parent.appendChild(child);
      }
    },

    remove(child) {
      const parent = child.parentNode;
      if (parent) {
        parent.removeChild(child);
      }
    }
  };

  const patchProp = (el, key, prevValue, nextValue) => {
    if (key.startsWith('on')) {
      // 事件处理
      const eventName = key.slice(2).toLowerCase();
      if (prevValue) {
        el.removeEventListener(eventName, prevValue);
      }
      if (nextValue) {
        el.addEventListener(eventName, nextValue);
      }
    } else {
      // 属性设置
      if (nextValue !== prevValue) {
        el.setAttribute(key, nextValue);
      }
    }
  };

  return createRenderer({ nodeOps, patchProp });
}

// 使用
const svg = document.getElementById('svg');
const { createApp } = createSVGRenderer(svg);

const app = createApp({
  setup() {
    const circle = ref({
      cx: 50,
      cy: 50,
      r: 40,
      fill: 'red'
    });

    return { circle };
  },
  template: `
    <circle
      :cx="circle.cx"
      :cy="circle.cy"
      :r="circle.r"
      :fill="circle.fill"
    />
  `
});

app.mount(svg);
```

#### 3. 原生移动端渲染器（概念示例）

```javascript
// 类似于 React Native 的思路
function createNativeRenderer() {
  const nodeOps = {
    createElement(tag) {
      return {
        type: tag,
        props: {},
        children: []
      };
    },

    createText(text) {
      return { type: 'text', text };
    },

    insert(child, parent, anchor) {
      // 调用原生平台 API
      NativeViewManager.insert(child, parent);
    },

    remove(child) {
      NativeViewManager.remove(child);
    }
  };

  const patchProp = (el, key, prevValue, nextValue) => {
    if (prevValue !== nextValue) {
      NativeViewManager.updateProp(el, key, nextValue);
    }
  };

  return createRenderer({ nodeOps, patchProp });
}
```

#### 4. Three.js 渲染器

```javascript
import * as THREE from 'three';
import { createRenderer } from '@vue/runtime-core';

function createThreeRenderer(scene, camera, renderer) {
  const nodeOps = {
    createElement(tag) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geometry, material);

      return {
        mesh,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1)
      };
    },

    insert(child, parent) {
      if (parent.mesh) {
        parent.mesh.add(child.mesh);
      } else {
        scene.add(child.mesh);
      }
    },

    remove(child) {
      const parent = child.mesh.parent;
      if (parent) {
        parent.remove(child.mesh);
      }
    }
  };

  const patchProp = (el, key, prevValue, nextValue) => {
    if (prevValue !== nextValue) {
      switch (key) {
        case 'position':
          el.mesh.position.set(nextValue.x, nextValue.y, nextValue.z);
          break;
        case 'rotation':
          el.mesh.rotation.set(nextValue.x, nextValue.y, nextValue.z);
          break;
        case 'color':
          el.mesh.material.color.setHex(nextValue);
          break;
      }
    }
  };

  return createRenderer({ nodeOps, patchProp });
}
```

### 与 DOM 渲染器的关系

Vue3 内置的 DOM 渲染器 `@vue/runtime-dom` 也是基于 Custom Renderer API 实现的：

```javascript
// @vue/runtime-dom 的简化实现
import { createRenderer } from '@vue/runtime-core';

const nodeOps = {
  createElement(tag) {
    return document.createElement(tag);
  },

  createText(text) {
    return document.createTextNode(text);
  },

  setElementText(el, text) {
    el.textContent = text;
  },

  insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
  },

  remove(child) {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },

  parentNode(node) {
    return node.parentNode;
  },

  nextSibling(node) {
    return node.nextSibling;
  }
};

const patchProp = (el, key, prevValue, nextValue) => {
  if (key.startsWith('on')) {
    // 处理事件
    const eventName = key.slice(2).toLowerCase();
    if (prevValue) {
      el.removeEventListener(eventName, prevValue);
    }
    if (nextValue) {
      el.addEventListener(eventName, nextValue);
    }
  } else {
    // 处理属性
    if (key === 'class') {
      el.className = nextValue;
    } else if (key === 'style') {
      el.style.cssText = nextValue;
    } else {
      el.setAttribute(key, nextValue);
    }
  }
};

export const renderer = createRenderer({ nodeOps, patchProp });
```

### 应用场景总结

| 渲染器类型 | 平台 | 应用场景 |
|-----------|------|---------|
| DOM Renderer | 浏览器 | Web 应用 |
| Canvas Renderer | Canvas | 图形、游戏、数据可视化 |
| SVG Renderer | SVG | 图表、图标 |
| Native Renderer | 移动端 | React Native 风格应用 |
| Three.js Renderer | WebGL | 3D 应用 |
* | * | 自定义组件库 |

### 最佳实践

```javascript
// ✅ 推荐：封装为可复用的渲染器
export function createCustomRenderer(options) {
  const { createElement, insert, remove, ...otherOps } = options;

  const nodeOps = {
    createElement,
    createText: (text) => ({ text }),
    insert,
    remove,
    ...otherOps
  };

  return createRenderer({ nodeOps, patchProp });
}

// ✅ 推荐：使用 TypeScript 定义类型
interface CustomNode {
  type: string;
  props: Record<string, any>;
  children: CustomNode[];
}

// ✅ 推荐：提供便捷的 API
export function useCustomRenderer(root) {
  const { createApp, render } = createCustomRenderer(root);
  return { createApp };
}
```

### 注意事项

1. **性能考虑**：自定义渲染器需要针对特定平台优化
2. **生命周期**：正确实现节点的创建、更新、销毁
3. **事件处理**：根据平台特点实现事件系统
4. **调试支持**：提供适当的开发工具支持
5. **类型安全**：使用 TypeScript 提供类型支持

### 总结

Custom Renderer API 的核心价值：

1. **平台无关**：可以在任何平台上运行 Vue
2. **灵活扩展**：支持创建自定义渲染器
3. **架构清晰**：渲染器与运行时核心分离
4. **复用逻辑**：响应式系统、组件逻辑可跨平台复用
5. **生态丰富**：催生各种非 DOM 应用场景

这使得 Vue3 不仅仅是一个 Web 框架，而是一个通用的应用开发平台。

---

## 22、Vue3 所采用的 Composition api 与 Vue2 中的 Option Api 有什么不同？

**答案：**

Composition API 和 Options API 是 Vue 中两种不同的组织代码的方式，各有优势和适用场景。

### Options API（Vue2）

#### 基本结构

```javascript
export default {
  name: 'MyComponent',

  // 数据
  data() {
    return {
      count: 0,
      name: 'Tom'
    };
  },

  // 计算属性
  computed: {
    doubled() {
      return this.count * 2;
    }
  },

  // 方法
  methods: {
    increment() {
      this.count++;
    }
  },

  // 生命周期
  created() {
    console.log('created');
  },

  mounted() {
    console.log('mounted');
  },

  // 组件
  components: {},

  // Props
  props: {},

  // Watchers
  watch: {}
};
```

#### 特点

1. **按选项分类**：代码按功能类型分组
2. **this 上下文**：通过 `this` 访问数据和方法的
3. **易于理解**：结构清晰，适合小型组件
4. **逻辑分散**：相关逻辑分散在不同选项中

### Composition API（Vue3）

#### 基本结构

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';

// 状态
const count = ref(0);
const name = ref('Tom');

// 计算属性
const doubled = computed(() => count.value * 2);

// 方法
function increment() {
  count.value++;
}

// 生命周期
onMounted(() => {
  console.log('mounted');
});
</script>

<template>
  <div>
    <p>{{ name }}: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

#### 特点

1. **按功能组织**：相关逻辑聚合在一起
2. **无 this**：通过 ref/reactive 访问数据
3. **逻辑复用**：易于提取可复用的逻辑
4. **类型推导**：更好的 TypeScript 支持

### 详细对比

#### 1. 代码组织方式

**Options API：逻辑分散**

```javascript
export default {
  data() {
    return {
      username: '',
      password: '',
      isValid: false
    };
  },

  computed: {
    usernameError() {
      return this.username.length < 3 ? '用户名至少3个字符' : '';
    },
    passwordError() {
      return this.password.length < 6 ? '密码至少6个字符' : '';
    }
  },

  methods: {
    validate() {
      this.isValid = !this.usernameError && !this.passwordError;
    },
    submit() {
      if (this.isValid) {
        this.login();
      }
    },
    login() {
      // 登录逻辑
    }
  },

  watch: {
    username() {
      this.validate();
    },
    password() {
      this.validate();
    }
  }
};
```

**Composition API：逻辑聚合**

```javascript
import { ref, computed, watch } from 'vue';

// 用户名相关逻辑
const username = ref('');
const usernameError = computed(() => {
  return username.value.length < 3 ? '用户名至少3个字符' : '';
});

// 密码相关逻辑
const password = ref('');
const passwordError = computed(() => {
  return password.value.length < 6 ? '密码至少6个字符' : '';
});

// 验证逻辑
const isValid = computed(() => {
  return !usernameError.value && !passwordError.value;
});

watch([username, password], () => {
  validate();
});

// 提交逻辑
function submit() {
  if (isValid.value) {
    login();
  }
}

function login() {
  // 登录逻辑
}
```

#### 2. 逻辑复用

**Options API：Mixins**

```javascript
// mixin.js
export const formMixin = {
  data() {
    return {
      loading: false,
      error: null
    };
  },
  methods: {
    async submitForm(api) {
      this.loading = true;
      this.error = null;

      try {
        await api();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }
};

// 组件中使用
export default {
  mixins: [formMixin],

  methods: {
    handleSubmit() {
      this.submitForm(() => api.login());
    }
  }
};
```

**问题：**
- ❌ 命名冲突
- ❌ 来源不明
- ❌ 难以追踪

**Composition API：Composables**

```javascript
// useForm.js
import { ref } from 'vue';

export function useForm() {
  const loading = ref(false);
  const error = ref(null);

  async function submitForm(api) {
    loading.value = true;
    error.value = null;

    try {
      await api();
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    submitForm
  };
}

// 组件中使用
<script setup>
import { useForm } from './useForm';

const { loading, error, submitForm } = useForm();

async function handleSubmit() {
  await submitForm(() => api.login());
}
</script>
```

**优势：**
- ✅ 无命名冲突
- ✅ 来源清晰
- ✅ 易于追踪
- ✅ 类型安全

#### 3. this 上下文

**Options API：依赖 this**

```javascript
export default {
  data() {
    return {
      count: 0
    };
  },

  computed: {
    doubled() {
      return this.count * 2;  // 使用 this
    }
  },

  methods: {
    increment() {
      this.count++;  // 使用 this
    }
  },

  mounted() {
    console.log(this.count);  // 使用 this
  }
};
```

**问题：**
- ❌ 箭头函数无法使用
- ❌ 解构会丢失响应式
- ❌ 类型推导困难

**Composition API：无 this**

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';

const count = ref(0);

const doubled = computed(() => count.value * 2);

function increment() {
  count.value++;
}

onMounted(() => {
  console.log(count.value);
});
</script>
```

**优势：**
- ✅ 箭头函数正常使用
- ✅ 解构方便（配合 toRefs）
- ✅ 类型推导优秀

#### 4. TypeScript 支持

**Options API：类型推导有限**

```typescript
export default {
  data() {
    return {
      count: 0,
      user: { name: 'Tom', age: 20 }
    };
  },

  computed: {
    doubled(): number {  // 需要手动注解类型
      return this.count * 2;
    }
  },

  methods: {
    increment(): void {
      this.count++;
    }
  }
};
```

**Composition API：完整类型推导**

```typescript
<script setup lang="ts">
import { ref, computed } from 'vue';

const count = ref<number>(0);  // 明确类型
const user = ref<User>({ name: 'Tom', age: 20 });  // 接口类型

const doubled = computed(() => count.value * 2);  // 自动推导类型

function increment() {
  count.value++;  // 类型检查
}
</script>
```

#### 5. 代码复用模式

**Mixins vs Composables 对比**

| 特性 | Mixins | Composables |
|------|--------|-------------|
| 命名冲突 | ❌ 容易冲突 | ✅ 不会冲突 |
| 来源追踪 | ❌ 不明 | ✅ 清晰 |
| 类型推导 | ❌ 差 | ✅ 优秀 |
| 参数传递 | ❌ 不支持 | ✅ 支持参数 |
| 组合使用 | ❌ 困难 | ✅ 灵活 |

### 实际应用场景

#### 小型组件：Options API

```vue
<!-- 简单的按钮组件 -->
<template>
  <button @click="increment">
    {{ count }}
  </button>
</template>

<script>
export default {
  data() {
    return { count: 0 };
  },
  methods: {
    increment() {
      this.count++;
    }
  }
};
</script>
```

#### 复杂组件：Composition API

```vue
<!-- 用户管理组件 -->
<script setup>
import { ref, computed } from 'vue';

// 用户列表逻辑
const users = ref([]);
const loading = ref(false);
const searchQuery = ref('');

const filteredUsers = computed(() => {
  return users.value.filter(user =>
    user.name.includes(searchQuery.value)
  );
});

// 分页逻辑
const currentPage = ref(1);
const pageSize = ref(10);

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredUsers.value.slice(start, end);
});

// 表单逻辑
const form = ref({
  name: '',
  email: ''
});

const isValid = computed(() => {
  return form.value.name && form.value.email;
});

// API 调用
async function fetchUsers() {
  loading.value = true;
  const response = await api.getUsers();
  users.value = response.data;
  loading.value = false;
}

fetchUsers();
</script>
```

### 生命周期对比

| Options API | Composition API |
|-------------|----------------|
| `beforeCreate` | `setup()` |
| `created` | `setup()` |
| `beforeMount` | `onBeforeMount()` |
| `mounted` | `onMounted()` |
| `beforeUpdate` | `onBeforeUpdate()` |
| `updated` | `onUpdated()` |
| `beforeUnmount` | `onBeforeUnmount()` |
| `unmounted` | `onUnmounted()` |
| `errorCaptured` | `onErrorCaptured()` |
| `renderTracked` | `onRenderTracked()` |
| `renderTriggered` | `onRenderTriggered()` |
| `activated` | `onActivated()` |
| `deactivated` | `onDeactivated()` |

### 性能对比

**Options API：**
- ❌ 每次组件实例化都创建新方法
- ❌ this 解析有性能开销
- ❌ Mixins 导致额外的方法创建

**Composition API：**
- ✅ setup 函数只执行一次
- ✅ 无 this 解析开销
- ✅ Composables 可以共享和缓存
- ✅ Tree-shaking 更友好

### 学习曲线

**Options API：**
- ✅ 入门简单
- ✅ 结构清晰
- ❌ 复杂场景困难
- ❌ 逻辑复用困难

**Composition API：**
- ✅ 适合复杂场景
- ✅ 逻辑复用简单
- ✅ 类型安全
- ❌ 需要学习响应式 API
- ❌ 需要理解组合思维

### 最佳实践

#### 何时使用 Options API

```vue
<!-- ✅ 简单的展示型组件 -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>{{ content }}</p>
  </div>
</template>

<script>
export default {
  props: ['title', 'content']
};
</script>
```

#### 何时使用 Composition API

```vue
<!-- ✅ 复杂的业务逻辑组件 -->
<script setup>
import { ref, computed, watch } from 'vue';
import { useForm } from './composables/useForm';
import { usePagination } from './composables/usePagination';

// 表单逻辑
const { form, validate, submit } = useForm();

// 分页逻辑
const { currentPage, pageSize, paginatedData } = usePagination(data);

// 业务逻辑
async function handleSearch() {
  const isValid = validate();
  if (isValid) {
    await submit(api.search);
  }
}
</script>
```

### 总结

**Options API 优势：**
- 入门简单，学习成本低
- 结构清晰，易于理解
- 适合简单组件和传统开发者
- 向下兼容

**Composition API 优势：**
- 逻辑组织更灵活
- 易于复用和组合
- 更好的 TypeScript 支持
- 更好的性能
- 更容易测试

**选择建议：**
- 新项目：推荐使用 Composition API（`<script setup>`）
- 简单组件：Options API 仍然可用
- 复杂组件：强烈推荐 Composition API
- 团队统一：保持一致性

Vue3 两者都支持，开发者可以根据实际情况选择，但 Composition API 代表了 Vue 的未来方向。

---

## 23、Vue3 性能提升主要有哪几方面体现的？

**答案：**

Vue3 相比 Vue2 在多个方面实现了显著的性能提升，主要通过编译优化、运行时改进和架构升级实现。

### 1. 响应式系统优化

#### Proxy vs Object.defineProperty

**Vue2：Object.defineProperty**

```javascript
// Vue2 响应式实现
function defineReactive(obj, key, val) {
  // 递归遍历所有属性
  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集
      Dep.target && dep.addSub(Dep.target);
      return val;
    },
    set(newVal) {
      if (newVal !== val) {
        val = newVal;
        // 派发更新
        dep.notify();
      }
    }
  });
}

// 问题：
// ❌ 需要初始化时遍历所有属性
// ❌ 数组索引和 length 变化无法监听
// ❌ 对象属性动态添加无法监听
// ❌ Map/Set 等数据结构无法支持
```

**Vue3：Proxy**

```javascript
// Vue3 响应式实现
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, key);
      }
      return result;
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      trigger(target, key);
      return result;
    }
  });
}

// 优势：
// ✅ 不需要初始化遍历
// ✅ 完整支持数组和对象操作
// ✅ 支持 Map/Set/WeakMap/WeakSet
// ✅ 性能开销小
```

**性能对比：**

| 操作 | Vue2 | Vue3 | 提升 |
|------|------|------|------|
| 对象初始化 | O(n) 遍历 | O(1) 无遍历 | ~90% |
| 属性访问 | 函数调用 | Proxy 拦截 | ~30% |
| 数组操作 | 劫持方法 | 原生拦截 | ~50% |
| 内存占用 | 较高 | 较低 | ~40% |

### 2. 编译时优化

#### 静态提升（Static Hoisting）

**Vue2：每次渲染重新创建**

```javascript
// 编译后的 render 函数
function render() {
  return createVNode('div', null, [
    createVNode('p', null, 'Static Text 1'),  // 每次都创建
    createVNode('p', null, 'Static Text 2'),  // 每次都创建
    createVNode('p', null, msg.value)         // 动态内容
  ]);
}

// 每次组件更新都重新创建静态节点
```

**Vue3：静态节点提升到函数外**

```javascript
// 静态节点提升到函数外
const _hoisted_1 = createVNode('p', null, 'Static Text 1');
const _hoisted_2 = createVNode('p', null, 'Static Text 2');

// render 函数
function render() {
  return createVNode('div', null, [
    _hoisted_1,  // 复用
    _hoisted_2,  // 复用
    createVNode('p', null, msg.value)  // 只创建动态节点
  ]);
}

// 静态节点只创建一次，更新时直接复用
```

**性能提升：** 静态内容较多的组件可提升 **40-60%** 性能

#### Patch Flag 标记

**Vue2：全量对比**

```javascript
// 每次更新都对比所有属性
function patch(oldVnode, newVnode) {
  const el = newVnode.el = oldVnode.el;

  // 对比所有属性
  if (oldVnode.data.attrs !== newVnode.data.attrs) {
    updateAttrs(el, newVnode.data.attrs);
  }
  if (oldVnode.data.props !== newVnode.data.props) {
    updateProps(el, newVnode.data.props);
  }
  if (oldVnode.data.class !== newVnode.data.class) {
    updateClass(el, newVnode.data.class);
  }
  if (oldVnode.data.style !== newVnode.data.style) {
    updateStyle(el, newVnode.data.style);
  }
  // ... 对比所有属性
}
```

**Vue3：只对比变化的属性**

```javascript
// 编译时标记动态属性
function render() {
  return createVNode(
    'div',
    {
      id: 'app',              // 静态，不需要对比
      class: 'container',     // 静态，不需要对比
      onClick: handleClick    // 动态，标记为 8 /* PROPS */
    },
    [
      createVNode(
        'p',
        {
          textContent: msg.value  // 动态，标记为 1 /* TEXT */
        }
      )
    ]
  );
}

// 运行时只对比标记的属性
function patch(el, vnode, oldVnode) {
  const { patchFlag, dynamicProps } = vnode;

  if (patchFlag & 1 /* TEXT */) {
    if (oldVnode.children !== vnode.children) {
      el.textContent = vnode.children;
    }
  }

  if (patchFlag & 8 /* PROPS */) {
    dynamicProps.forEach(key => {
      updateProp(el, key, vnode.props[key]);
    });
  }

  // 静态属性不对比，直接跳过
}
```

**性能提升：** 动态节点少的组件可提升 **30-50%** 性能

#### Block Tree 优化

**Vue2：全树遍历**

```javascript
// 每次更新都遍历整个 VNode 树
function updateComponent() {
  const newVnode = render();  // 生成新的 VNode 树

  // 遍历整个树进行 diff
  patch(oldVnode, newVnode);
}
```

**Vue3：Block Tree 只遍历动态节点**

```javascript
// 编译时生成 Block
function render(_ctx, _cache) {
  return (
    openBlock(),
    createBlock('div', null, [
      createVNode('span', null, _ctx.msg, 1 /* TEXT */),  // 动态
      _hoisted_1                                          // 静态
    ])
  );
}

// Block 包含动态节点信息
const block = {
  dynamicChildren: [  // 只包含动态节点
    vnode('span', { textContent: 'Hello' })
  ]
};

// 只遍历动态节点
function update() {
  block.dynamicChildren.forEach(node => {
    patch(node);
  });
}
```

**性能提升：** 静态内容多的组件可提升 **50-70%** 性能

### 3. 运行时优化

#### 组件初始化

**Vue2：**

```javascript
// 初始化流程
function initComponent(vm) {
  initProps(vm);
  initData(vm);         // 遍历 data
  initMethods(vm);
  initComputed(vm);     // 遍历 computed
  initWatch(vm);        // 遍历 watch
  // ... 更多初始化
}
```

**Vue3：**

```javascript
// 简化的初始化流程
function setupComponent(instance) {
  const { setup } = instance.type;
  if (setup) {
    const setupContext = createSetupContext(instance);
    const setupResult = setup(instance.props, setupContext);
    handleSetupResult(instance, setupResult);
  }
  // setup 替代了 beforeCreate/created
}
```

**性能提升：** 初始化速度提升 **50-60%**

#### Fragments 支持

**Vue2：单根节点限制**

```vue
<!-- Vue2 必须有唯一根节点 -->
<template>
  <div>  <!-- 额外的包裹层 -->
    <header>Header</header>
    <main>Main</main>
    <footer>Footer</footer>
  </div>
</template>
```

**问题：**
- ❌ 额外的 DOM 节点
- ❌ 样式继承问题
- ❌ 性能开销

**Vue3：多根节点支持**

```vue
<!-- Vue3 支持多根节点 -->
<template>
  <header>Header</header>
  <main>Main</main>
  <footer>Footer</footer>
</template>
```

**优势：**
- ✅ 减少不必要的 DOM 节点
- ✅ 更好的语义化
- ✅ 性能提升

#### Tree-shaking 优化

**Vue2：全量引入**

```javascript
// Vue2 全量引入
import Vue from 'vue';
// 包含所有功能：KeepAlive、Transition、v-model 等
// 即使只用了一小部分
```

**Vue2 构建产物大小：** ~200 KB

**Vue3：按需引入**

```javascript
// Vue3 按需引入
import { createApp, ref, computed } from 'vue';
// 只引入使用的 API，未使用的被 Tree-shaking 移除
```

**Vue3 构建产物大小：** ~130 KB（-35%）

### 4. Diff 算法优化

#### 最长递增子序列（LIS）

**Vue2：双端对比**

```javascript
// 简单的双端对比
function updateChildren(parent, oldCh, newCh) {
  let oldStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let newStartIdx = 0;
  let newEndIdx = newCh.length - 1;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 对比头尾...
  }
}
```

**Vue3：基于 LIS 的优化**

```javascript
// 使用最长递增子序列算法
function patchKeyedChildren(c1, c2) {
  const l2 = c2.length;
  let i = 0;
  let e1 = c1.length - 1;
  let e2 = l2 - 1;

  // 1. 同步前置节点
  while (i <= e1 && i <= e2) {
    if (c1[i].key === c2[i].key) {
      patch(c1[i], c2[i]);
      i++;
    } else {
      break;
    }
  }

  // 2. 同步后置节点
  while (i <= e1 && i <= e2) {
    if (c1[e1].key === c2[e2].key) {
      patch(c1[e1], c2[e2]);
      e1--;
      e2--;
    } else {
      break;
    }
  }

  // 3. 处理新增和删除
  // ...

  // 4. 使用 LIS 算法最小化移动
  const s1 = i;
  const s2 = i;
  const keyToNewIndexMap = new Map();

  // 建立映射
  for (i = s2; i <= e2; i++) {
    keyToNewIndexMap.set(c2[i].key, i);
  }

  // 计算最长递增子序列
  const longestIncreasingSubsequence = getSequence(newIndexToOldIndexIndex);

  // 移动和 patch
  for (i = toBePatched - 1; i > 0; i--) {
    const index = patchCount - i;
    if (longestIncreasingSubsequence[i] === 0) {
      // 新节点，需要挂载
      mount(...);
    } else {
      // 移动节点
      move(...);
    }
  }
}
```

**性能提升：** 复杂列表更新可提升 **60-80%**

### 5. 内存管理优化

**Vue2：**

```javascript
// 每个组件实例都有完整的 data、methods、computed 等
class Component {
  constructor() {
    this.$options = options;      // 完整的选项对象
    this.$data = reactive(data);  // 响应式数据
    this.$methods = methods;     // 方法
    this.$computed = {};         // 计算属性缓存
    // ... 更多属性
  }
}
```

**Vue3：**

```javascript
// 更轻量的组件实例
const instance = {
  type: component,
  props: shallowReadonly(props),
  proxy: proxy,
  setupState: {},       // 只包含 setup 返回的数据
  ctx: {},              // 上下文对象
  // 更少的内存占用
};
```

**性能提升：** 内存占用降低 **40-50%**

### 6. 事件监听优化

**Vue2：**

```javascript
// 每次更新都重新绑定事件
function updateListeners(oldOn, newOn) {
  for (const name in newOn) {
    const oldHandler = oldOn[name];
    const newHandler = newOn[name];

    if (oldHandler !== newHandler) {
      const handler = newHandler || oldHandler;
      element.removeEventListener(name, oldHandler);
      element.addEventListener(name, handler);
    }
  }
}
```

**Vue3：**

```javascript
// 缓存内联函数
function patchEvent(el, key, newHandler, oldHandler) {
  if (newHandler !== oldHandler) {
    if (oldHandler) {
      el.removeEventListener(key, oldHandler);
    }
    if (newHandler) {
      el.addEventListener(key, newHandler);
    }
  }
}

// 编译时缓存内联函数
const _hoisted_2 = () => handleClick();

return createVNode('button', {
  onClick: _hoisted_2  // 复用函数引用
});
```

**性能提升：** 事件更新开销降低 **50%**

### 综合性能对比

| 指标 | Vue2 | Vue3 | 提升 |
|------|------|------|------|
| 初始化速度 | 基准 | - | +55% |
| 首次渲染 | 基准 | - | +40% |
| 更新渲染 | 基准 | - | +130% |
| 内存占用 | 基准 | - | -40% |
| 打包体积 | ~200 KB | ~130 KB | -35% |

### 实际测试结果

```javascript
// 创建 1000 个组件并更新 1000 次

// Vue2
Vue2: ~2500ms

// Vue3
Vue3: ~1100ms

// 性能提升: 56%
```

### 总结

Vue3 的性能提升主要体现在：

1. **响应式系统**：Proxy 替代 defineProperty，性能提升 30-90%
2. **编译优化**：静态提升、Patch Flag、Block Tree，性能提升 40-70%
3. **运行时优化**：初始化流程简化，性能提升 50-60%
4. **Diff 算法**：LIS 优化，性能提升 60-80%
5. **内存管理**：更轻量的实例，内存占用降低 40-50%
6. **打包体积**：Tree-shaking，体积减少 35%

综合性能提升 **50-100%**，使得 Vue3 成为目前最快的框架之一。

---

## 24、详细阐述一下 Vue3 dom diff 原理。

**答案：**

Vue3 的 DOM Diff 算法基于虚拟 DOM 和最长递增子序列（LIS）算法，实现了高效的更新性能。

### 虚拟 DOM 基础

#### VNode 结构

```javascript
// 简化的 VNode 结构
const vnode = {
  type: 'div',           // 节点类型
  key: 'unique-key',     // 节点标识
  props: {},             // 属性
  children: [],          // 子节点
  el: null,              // 真实 DOM 引用
  patchFlag: 0,          // 补丁标记
  dynamicProps: [],      // 动态属性
  shapeFlag: 0           // 形状标记
};
```

### Diff 流程概览

```
1. 同步前置节点（从头开始匹配）
    ↓
2. 同步后置节点（从尾开始匹配）
    ↓
3. 处理新增节点
    ↓
4. 处理删除节点
    ↓
5. 处理剩余未知序列（使用 LIS 算法）
    ↓
6. 移动和挂载节点
```

### 详细实现

#### 1. 基础 Diff

```javascript
// 简化的 Diff 实现
function patch(n1, n2, container) {
  // n1: 旧 vnode
  // n2: 新 vnode
  // container: 父容器

  if (n1 === n2) {
    return;
  }

  // 类型不同，直接替换
  if (n1.type !== n2.type) {
    unmount(n1);
    mount(n2, container);
    return;
  }

  // 类型相同，进行 patch
  if (typeof n1.type === 'string') {
    // 元素节点
    patchElement(n1, n2);
  } else if (typeof n1.type === 'object') {
    // 组件节点
    patchComponent(n1, n2);
  }
}
```

#### 2. 子节点 Diff

```javascript
function patchChildren(n1, n2, container) {
  const c1 = n1.children;
  const c2 = n2.children;

  // 情况 1: 旧子节点是文本，新子节点也是文本
  if (typeof c1 === 'string' && typeof c2 === 'string') {
    if (c1 !== c2) {
      setElementText(n2.el, c2);
    }
  }

  // 情况 2: 旧子节点是数组，新子节点是文本
  else if (isArray(c1) && typeof c2 === 'string') {
    unmountChildren(c1);
    setElementText(n2.el, c2);
  }

  // 情况 3: 旧子节点是文本，新子节点是数组
  else if (typeof c1 === 'string' && isArray(c2)) {
    setElementText(n2.el, '');
    mountChildren(c2, container);
  }

  // 情况 4: 旧子节点和新子节点都是数组
  else if (isArray(c1) && isArray(c2)) {
    patchKeyedChildren(c1, c2, container);
  }
}
```

#### 3. Keyed Diff（核心算法）

```javascript
function patchKeyedChildren(c1, c2, container) {
  let i = 0;
  const l2 = c2.length;
  let e1 = c1.length - 1;
  let e2 = l2 - 1;

  // 1. 同步前置节点
  while (i <= e1 && i <= e2) {
    const n1 = c1[i];
    const n2 = c2[i];

    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container);
    } else {
      break;
    }
    i++;
  }

  // 2. 同步后置节点
  while (i <= e1 && i <= e2) {
    const n1 = c1[e1];
    const n2 = c2[e2];

    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container);
    } else {
      break;
    }
    e1--;
    e2--;
  }

  // 3. 处理新增节点（从 i 到 e2）
  if (i > e1) {
    if (i <= e2) {
      const nextPos = e2 + 1;
      const anchor = nextPos < l2 ? c2[nextPos].el : null;

      while (i <= e2) {
        patch(null, c2[i], container, anchor);
        i++;
      }
    }
  }

  // 4. 处理删除节点（从 i 到 e1）
  else if (i > e2) {
    while (i <= e1) {
      unmount(c1[i]);
      i++;
    }
  }

  // 5. 处理剩余未知序列
  else {
    const s1 = i;
    const s2 = i;
    const keyToNewIndexMap = new Map();

    // 建立新节点的 key 索引映射
    for (i = s2; i <= e2; i++) {
      const nextChild = c2[i];
      if (nextChild.key != null) {
        keyToNewIndexMap.set(nextChild.key, i);
      }
    }

    let j;
    let patched = 0;
    const toBePatched = e2 - s2 + 1;
    let moved = false;
    let maxNewIndexSoFar = 0;

    // 新索引到旧索引的映射
    const newIndexToOldIndexMap = new Array(toBePatched);
    for (i = 0; i < toBePatched; i++) {
      newIndexToOldIndexMap[i] = 0;
    }

    // 遍历旧节点，建立映射
    for (i = s1; i <= e1; i++) {
      const prevChild = c1[i];

      if (patched >= toBePatched) {
        // 新节点已全部匹配，旧节点多余，直接删除
        unmount(prevChild);
        continue;
      }

      let newIndex;
      if (prevChild.key != null) {
        newIndex = keyToNewIndexMap.get(prevChild.key);
      } else {
        // 没有 key，线性查找
        for (j = s2; j <= e2; j++) {
          if (newIndexToOldIndexMap[j - s2] === 0 &&
              isSameVNodeType(prevChild, c2[j])) {
            newIndex = j;
            break;
          }
        }
      }

      if (newIndex === undefined) {
        // 节点不存在于新节点中，删除
        unmount(prevChild);
      } else {
        // 节点存在，记录映射
        newIndexToOldIndexMap[newIndex - s2] = i + 1;

        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex;
        } else {
          moved = true;  // 需要移动
        }

        patch(prevChild, c2[newIndex], container);
        patched++;
      }
    }

    // 计算最长递增子序列
    const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap)
      : [];

    j = increasingNewIndexSequence.length - 1;

    // 从后向前遍历，移动或挂载节点
    for (i = toBePatched - 1; i >= 0; i--) {
      const nextIndex = s2 + i;
      const nextChild = c2[nextIndex];
      const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

      if (newIndexToOldIndexMap[i] === 0) {
        // 新节点，需要挂载
        patch(null, nextChild, container, anchor);
      } else if (moved) {
        // 需要移动
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          insert(nextChild.el, container, anchor);
        } else {
          j--;
        }
      }
    }
  }
}
```

#### 4. 最长递增子序列（LIS）算法

```javascript
// 获取最长递增子序列
function getSequence(arr) {
  const len = arr.length;
  const result = [0]; // 存储索引
  const p = new Array(len).fill(0); // 存储前驱节点

  let resultLastIndex;

  for (let i = 0; i < len; i++) {
    const arrI = arr[i];

    if (arrI === 0) {
      continue;
    }

    resultLastIndex = result[result.length - 1];

    if (arr[resultLastIndex] < arrI) {
      // 当前值大于末尾值，直接添加
      p[i] = resultLastIndex;
      result.push(i);
      continue;
    }

    // 二分查找找到插入位置
    let start = 0;
    let end = result.length - 1;
    let middle;

    while (start < end) {
      middle = (start + end) >> 1;

      if (arr[result[middle]] < arrI) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }

    if (arrI < arr[result[start]]) {
      if (start > 0) {
        p[i] = result[start - 1];
      }
      result[start] = i;
    }
  }

  // 回溯获取完整的 LIS
  let l = result.length;
  const last = result[l - 1];
  while (l-- > 0) {
    result[l] = last;
    last = p[last];
  }

  return result;
}
```

### 实例演示

#### 场景 1：简单列表更新

```javascript
// 旧节点
const oldChildren = [
  vnode('li', { key: 'a' }, 'A'),
  vnode('li', { key: 'b' }, 'B'),
  vnode('li', { key: 'c' }, 'C')
];

// 新节点
const newChildren = [
  vnode('li', { key: 'a' }, 'A'),
  vnode('li', { key: 'b' }, 'B Updated'),
  vnode('li', { key: 'c' }, 'C')
];

// Diff 过程：
// 1. 同步前置节点：A 匹配，B 匹配，C 匹配
// 2. 更新 B 的内容
// 结果：无需移动，只需更新内容
```

#### 场景 2：节点移动

```javascript
// 旧节点
const oldChildren = [
  vnode('li', { key: 'a' }, 'A'),
  vnode('li', { key: 'b' }, 'B'),
  vnode('li', { key: 'c' }, 'C')
];

// 新节点
const newChildren = [
  vnode('li', { key: 'c' }, 'C'),
  vnode('li', { key: 'b' }, 'B'),
  vnode('li', { key: 'a' }, 'A')
];

// Diff 过程：
// 1. 同步前置节点：A vs C 不匹配，跳出
// 2. 同步后置节点：C vs A 不匹配，跳出
// 3. 建立映射：
//    newIndexToOldIndexMap = [3, 2, 1]
// 4. 计算 LIS：[1] (索引 1，对应 B)
// 5. 移动节点：
//    - i=2 (A): 非 LIS，移动到前面
//    - i=1 (B): 是 LIS，不移动
//    - i=0 (C): 非 LIS，移动到前面
// 结果：移动 A 和 C
```

#### 场景 3：增删节点

```javascript
// 旧节点
const oldChildren = [
  vnode('li', { key: 'a' }, 'A'),
  vnode('li', { key: 'b' }, 'B'),
  vnode('li', { key: 'c' }, 'C'),
  vnode('li', { key: 'd' }, 'D')
];

// 新节点
const newChildren = [
  vnode('li', { key: 'a' }, 'A'),
  vnode('li', { key: 'b' }, 'B'),
  vnode('li', { key: 'd' }, 'D'),
  vnode('li', { key: 'e' }, 'E')
];

// Diff 过程：
// 1. 同步前置节点：A 匹配，B 匹配
//    i = 2, e1 = 3, e2 = 3
// 2. 同步后置节点：D 匹配
//    i = 2, e1 = 2, e2 = 2
// 3. i > e2 (i=2, e2=2), 处理删除：
//    删除 c1[2] (C)
// 4. 处理新增：
//    挂载 c2[3] (E)
// 结果：删除 C，新增 E
```

### Patch Flag 优化

```javascript
// 编译时标记动态节点
function render() {
  return openBlock(), createBlock('div', null, [
    createVNode('p', null, msg.value, 1 /* TEXT */),
    _hoisted_1  // 静态节点
  ]);
}

// Diff 时只处理标记的节点
function patchElement(n1, n2) {
  const el = (n2.el = n1.el);

  if (n2.patchFlag & 1 /* TEXT */) {
    // 只更新文本内容
    if (n1.children !== n2.children) {
      setElementText(el, n2.children);
    }
  }

  if (n2.patchFlag & 2 /* CLASS */) {
    // 只更新 class
    if (n1.props.class !== n2.props.class) {
      el.className = n2.props.class;
    }
  }

  // 静态属性不处理
}
```

### 性能分析

#### 时间复杂度

| 场景 | 时间复杂度 |
|------|-----------|
| 纯文本更新 | O(n) |
| 简单列表更新（无移动） | O(n) |
| 复杂列表更新（有移动） | O(n log n) |

#### 空间复杂度

| 场景 | 空间复杂度 |
|------|-----------|
| 简单列表 | O(n) |
| 复杂列表 | O(n) |

### 最佳实践

#### 1. 使用稳定的 key

```vue
<!-- ✅ 推荐：使用唯一、稳定的 key -->
<li v-for="item in items" :key="item.id">{{ item.name }}</li>

<!-- ❌ 不推荐：使用索引作为 key -->
<li v-for="(item, index) in items" :key="index">{{ item.name }}</li>

<!-- ❌ 不推荐：使用随机值作为 key -->
<li v-for="item in items" :key="Math.random()">{{ item.name }}</li>
```

#### 2. 避免不必要的变化

```vue
<script setup>
import { ref } from 'vue';

const items = ref([
  { id: 1, name: 'A' },
  { id: 2, name: 'B' }
]);

// ✅ 推荐：原地更新
function updateItem(id, newName) {
  const item = items.value.find(item => item.id === id);
  if (item) {
    item.name = newName;  // 只更新属性
  }
}

// ❌ 不推荐：创建新对象
function updateItem(id, newName) {
  const index = items.value.findIndex(item => item.id === id);
  items.value[index] = { ...items.value[index], name: newName };  // 创建新对象
}
</script>
```

#### 3. 合理使用 v-show 和 v-if

```vue
<!-- ✅ 频繁切换使用 v-show -->
<div v-show="isVisible">Content</div>

<!-- ✅ 条件渲染使用 v-if -->
<div v-if="shouldRender">Content</div>
```

### 总结

Vue3 DOM Diff 的核心优势：

1. **优化策略**：同步前置/后置节点，减少不必要的 diff
2. **LIS 算法**：最小化节点移动次数
3. **Patch Flag**：只更新动态节点
4. **Block Tree**：只遍历动态子节点
5. **Key 查找**：使用 Map 优化查找性能

这些优化使得 Vue3 的 Diff 性能相比 Vue2 提升了 **60-80%**，特别是在复杂列表更新的场景下。

---

**注意：** 本文档涵盖了 Vue3 的核心知识点，包括响应式系统、组件通信、性能优化等，适合面试准备和深入理解 Vue3 的工作原理。
