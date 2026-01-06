# React 30问 - 详细解答

## 1、高阶组件(HOC)是什么？你在业务中使用过解决了什么问题。

**高阶组件(Higher-Order Component)** 是一个函数，它接收一个组件并返回一个新的组件。HOC本质上是一种装饰器模式，用于组件逻辑的复用。

```javascript
// HOC 基本结构
function withHigherOrderComponent(WrappedComponent) {
  return class EnhancedComponent extends React.Component {
    // 可以在这里添加逻辑
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

// 使用
const EnhancedComponent = withHigherOrderComponent(MyComponent);
```

**在业务中的实际应用场景：**

1. **权限控制**
```javascript
function withAuth(WrappedComponent) {
  return function(props) {
    const isAuthenticated = useAuth();
    if (!isAuthenticated) {
      return <Redirect to="/login" />;
    }
    return <WrappedComponent {...props} />;
  };
}

// 使用
const ProtectedPage = withAuth(Dashboard);
```

2. **日志监控**
```javascript
function withLogger(WrappedComponent) {
  return function(props) {
    useEffect(() => {
      console.log(`Component ${WrappedComponent.name} mounted`);
      return () => {
        console.log(`Component ${WrappedComponent.name} unmounted`);
      };
    }, []);
    return <WrappedComponent {...props} />;
  };
}
```

3. **Loading状态处理**
```javascript
function withLoading(WrappedComponent) {
  return function(props) {
    const [loading, setLoading] = useState(false);
    
    const fetchData = async () => {
      setLoading(true);
      try {
        await props.onFetch();
      } finally {
        setLoading(false);
      }
    };

    return loading ? <LoadingSpinner /> : <WrappedComponent {...props} fetchData={fetchData} />;
  };
}
```

4. **数据获取**
```javascript
function withData(WrappedComponent, dataSource) {
  return function(props) {
    const [data, setData] = useState(null);
    
    useEffect(() => {
      dataSource().then(setData);
    }, []);
    
    return data ? <WrappedComponent {...props} data={data} /> : null;
  };
}
```

**解决的问题：**
- 代码复用：将通用逻辑抽离，避免重复代码
- 关注点分离：将业务逻辑与UI展示分离
- 跨组件逻辑共享：多个组件可以共享相同的行为

**注意事项：**
- 不要修改原组件，而是组合
- 不要在render方法中使用HOC
- 传递所有props给被包裹组件
- displayName命名规范

---

## 2、什么时候应该使用类组件而不是函数组件？React组件错误捕获怎么做？

**何时使用类组件：**

1. **需要使用生命周期方法**（但大多数场景可以用useEffect替代）
2. **需要使用错误边界**（Error Boundary目前必须用类组件）
3. **遗留代码维护**
4. **团队或项目规范要求**

但随着React Hooks的成熟，**绝大多数场景都应该使用函数组件**，因为：
- 代码更简洁
- 逻辑复用更容易（Hooks）
- 更好的性能优化（React.memo）
- 更小的打包体积
- 更符合函数式编程思想

**React组件错误捕获：**

1. **错误边界**
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 更新state使下一次渲染能够显示降级后的UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级UI
      return (
        <div className="error-fallback">
          <h1>Something went wrong.</h1>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

2. **全局错误监听**
```javascript
// 捕获未处理的Promise rejection
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  logErrorToService(event.reason);
});

// 捕获全局JavaScript错误
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  logErrorToService(event.error);
});
```

3. **异步错误处理**
```javascript
function useAsyncError() {
  const [error, setError] = useState(null);
  
  return useCallback((err) => {
    setError(err);
    throw err;
  }, []);
}

// 使用
function MyComponent() {
  const setError = useAsyncError();
  
  useEffect(() => {
    fetchData().catch(setError);
  }, []);
  
  return <div>...</div>;
}
```

**注意点：**
- 错误边界无法捕获以下错误：
  - 事件处理器中的错误
  - 异步代码中的错误
  - 服务端渲染的错误
  - 错误边界本身的错误
- React 18+ 攻击性加载时，多个错误边界可以协同工作

---

## 3、如何在 React 中对 props 应用验证？

React 提供了 `prop-types` 库来进行 props 类型验证。

**1. 安装 prop-types**
```bash
npm install prop-types
# or
yarn add prop-types
```

**2. 基本类型验证**
```javascript
import PropTypes from 'prop-types';

function MyComponent(props) {
  return (
    <div>
      <h1>{props.title}</h1>
      <p>{props.count}</p>
    </div>
  );
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  isActive: PropTypes.bool,
  user: PropTypes.object,
  items: PropTypes.array,
  callback: PropTypes.func,
  node: PropTypes.node,
  element: PropTypes.element,
};

// 默认值
MyComponent.defaultProps = {
  count: 0,
  isActive: true,
  items: [],
};
```

**3. 高级类型验证**
```javascript
function UserList(props) {
  return <ul>{props.users.map(user => <li key={user.id}>{user.name}</li>)}</ul>;
}

UserList.propTypes = {
  // 特定形状的对象
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
  }).isRequired,
  
  // 对象数组
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  
  // 枚举类型
  status: PropTypes.oneOf(['active', 'inactive', 'pending']),
  
  // 多种类型之一
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  
  // 特定类的实例
  element: PropTypes.instanceOf(HTMLElement),
  
  // 自定义验证函数
  customProp: function(props, propName, componentName) {
    if (!/matchme/.test(props[propName])) {
      return new Error(
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`. ` +
        `Validation failed.`
      );
    }
  },
  
  // 必须提供至少一个属性
  requiredEither: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
};
```

**4. TypeScript 验证（推荐）**
```typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

interface MyComponentProps {
  title: string;
  count?: number;
  user: User;
  users: User[];
  onButtonClick: (event: React.MouseEvent) => void;
  children?: React.ReactNode;
}

function MyComponent({ 
  title, 
  count = 0, 
  user, 
  users,
  onButtonClick,
  children 
}: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={onButtonClick}>Click me</button>
      {children}
    </div>
  );
}
```

**5. 使用验证库（Zod）**
```javascript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().optional(),
});

function MyComponent(props) {
  try {
    const user = UserSchema.parse(props.user);
    // 使用验证后的数据
  } catch (error) {
    console.error('Validation error:', error);
  }
  
  return <div>...</div>;
}
```

**最佳实践：**
- 生产环境移除propTypes以减小打包体积（使用babel-plugin-transform-react-remove-prop-types）
- TypeScript项目优先使用类型系统
- 关键业务逻辑使用运行时验证
- 为可选props提供合理的默认值

---

## 4、React 中如何创建Refs？创建Refs的方式有什么区别？

React 提供了三种创建Refs的主要方式：

### 1. String Refs（已废弃，不推荐）
```javascript
// 旧写法，不推荐
class MyComponent extends React.Component {
  componentDidMount() {
    this.refs.myInput.focus();
  }
  
  render() {
    return <input ref="myInput" />;
  }
}
```

### 2. Callback Refs
```javascript
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.textInput = null;
    this.setTextInputRef = element => {
      this.textInput = element;
    };
  }

  focusTextInput = () => {
    if (this.textInput) this.textInput.focus();
  };

  render() {
    return (
      <div>
        <input
          type="text"
          ref={this.setTextInputRef}
        />
        <button onClick={this.focusTextInput}>Focus the text input</button>
      </div>
    );
  }
}
```

**函数组件中使用Callback Refs：**
```javascript
function FormComponent() {
  let inputRef;
  
  const setRef = (element) => {
    inputRef = element;
  };
  
  const handleSubmit = () => {
    inputRef?.focus();
  };
  
  return (
    <div>
      <input ref={setRef} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

### 3. React.createRef（类组件推荐）
```javascript
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  focusInput = () => {
    this.inputRef.current?.focus();
  };

  render() {
    return (
      <div>
        <input ref={this.inputRef} />
        <button onClick={this.focusInput}>Focus</button>
      </div>
    );
  }
}
```

### 4. useRef Hook（函数组件推荐）
```javascript
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef(null);
  const previousValueRef = useRef('');

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </div>
  );
}
```

### 5. useImperativeHandle Hook（暴露子组件方法）
```javascript
import { useRef, useImperativeHandle, forwardRef } from 'react';

const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    reset: () => {
      inputRef.current.value = '';
    },
  }));

  return <input ref={inputRef} {...props} />;
});

// 使用
function ParentComponent() {
  const fancyInputRef = useRef();

  const handleClick = () => {
    fancyInputRef.current?.focus();
    fancyInputRef.current?.reset();
  };

  return (
    <>
      <FancyInput ref={fancyInputRef} />
      <button onClick={handleClick}>Parent Button</button>
    </>
  );
}
```

**各种方式的区别：**

| 方式 | 推荐度 | 适用场景 | 特点 |
|------|--------|----------|------|
| String Refs | ❌ 不推荐 | 遗留代码 | 即将移除，性能差 |
| Callback Refs | ✅ 推荐某些场景 | 动态创建/销毁 | 实时更新，可控制 |
| createRef | ✅ 类组件 | 类组件 | 每次渲染返回相同引用 |
| useRef | ⭐ 函数组件首选 | 函数组件 | 返回可变ref对象 |

**Callback Refs vs createRef/useRef：**

1. **createRef/useRef：**
   - 在组件生命周期内保持不变
   - 每次渲染返回相同的ref对象
   - 适合静态引用

2. **Callback Refs：**
   - 每次渲染都可能被调用
   - 当DOM节点改变时自动更新
   - 适合动态场景和需要精细控制的场景

**实际应用场景：**

```javascript
// 1. 聚焦输入框
function SearchInput() {
  const searchRef = useRef(null);
  
  useEffect(() => {
    searchRef.current?.focus();
  }, []);
  
  return <input ref={searchRef} placeholder="Search..." />;
}

// 2. 播放视频
function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  
  const play = () => videoRef.current?.play();
  const pause = () => videoRef.current?.pause();
  
  return (
    <video ref={videoRef} src={src}>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </video>
  );
}

// 3. 滚动到指定位置
function ScrollToBottom() {
  const endRef = useRef(null);
  
  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <div>
      <button onClick={scrollToBottom}>Scroll to Bottom</button>
      <div style={{ height: '1000px' }}>Content</div>
      <div ref={endRef}>Bottom</div>
    </div>
  );
}

// 4. 存储定时器
function Timer() {
  const timerRef = useRef(null);
  
  useEffect(() => {
    timerRef.current = setInterval(() => {
      console.log('Tick');
    }, 1000);
    
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);
  
  return <div>Timer running...</div>;
}
```

---

## 5、createContext解决了什么问题？React父组件如何与子组件通信？子组件如何改变父组件的状态？

### createContext 解决的问题

**问题：** 在React中，如果不使用Context，需要通过props逐层传递数据，这种"prop drilling"在组件层级较深时会导致：
- 代码冗余
- 难以维护
- 组件耦合度高

**解决方案：** createContext 提供了一种跨组件层级共享数据的方式，避免了props逐层传递。

### createContext 基本用法

```javascript
// 1. 创建Context
const ThemeContext = React.createContext('light');

// 2. 创建Provider组件
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. 使用Context
function ThemedButton() {
  const { theme, setTheme } = useContext(ThemeContext);
  
  return (
    <button 
      style={{ background: theme === 'dark' ? '#333' : '#fff' }}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      Toggle Theme
    </button>
  );
}

// 4. 包裹应用
function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}
```

### Context 的实际应用

```javascript
// 1. 用户认证Context
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const login = async (credentials) => {
    const user = await api.login(credentials);
    setUser(user);
  };
  
  const logout = () => {
    setUser(null);
  };
  
  useEffect(() => {
    // 检查用户登录状态
    api.checkAuth().then(setUser).finally(() => setLoading(false));
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 2. 国际化Context
const I18nContext = createContext();

function I18nProvider({ children }) {
  const [locale, setLocale] = useState('zh');
  const [translations, setTranslations] = useState({});
  
  const changeLocale = (newLocale) => {
    setLocale(newLocale);
    import(`./locales/${newLocale}.json`).then(setTranslations);
  };
  
  const t = (key) => translations[key] || key;
  
  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
```

### 父组件与子组件通信

**1. 父传子（Props）：**
```javascript
// 父组件
function Parent() {
  const message = "Hello from parent";
  
  return <Child message={message} />;
}

// 子组件
function Child({ message }) {
  return <div>{message}</div>;
}
```

**2. 子传父（回调函数）：**
```javascript
// 父组件
function Parent() {
  const [count, setCount] = useState(0);
  
  const handleIncrement = () => {
    setCount(c => c + 1);
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <Child onIncrement={handleIncrement} />
    </div>
  );
}

// 子组件
function Child({ onIncrement }) {
  return <button onClick={onIncrement}>Increment</button>;
}
```

**3. 子组件改变父组件状态（通过回调）：**
```javascript
// 父组件
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: false },
  ]);
  
  const addTodo = (text) => {
    setTodos([...todos, { id: Date.now(), text, completed: false }]);
  };
  
  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  return (
    <div>
      <TodoForm onAdd={addTodo} />
      <TodoList items={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
    </div>
  );
}

// 子组件1: 添加表单
function TodoForm({ onAdd }) {
  const [text, setText] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add todo"
      />
      <button type="submit">Add</button>
    </form>
  );
}

// 子组件2: 列表项
function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.text}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
}

function TodoList({ items, onToggle, onDelete }) {
  return (
    <ul>
      {items.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
```

### 通信方式总结

| 场景 | 方式 | 示例 |
|------|------|------|
| 父传子 | Props | `<Child data={value} />` |
| 子传父 | 回调函数 | `<Child onChange={handleChange} />` |
| 跨层级 | Context | `useContext(MyContext)` |
| 深层通信 | Context + useReducer | Context + dispatch |
| 复杂状态 | Redux/Zustand | 状态管理库 |

### Context 性能优化

```javascript
// 问题：任何Context值改变都会导致所有消费者重新渲染
const MyContext = createContext();

function MyProvider({ children }) {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('React');
  
  return (
    <MyContext.Provider value={{ count, setCount, name, setName }}>
      {children}
    </MyContext.Provider>
  );
}

// 优化方案1：拆分Context
const CountContext = createContext();
const NameContext = createContext();

function App() {
  return (
    <CountProvider>
      <NameProvider>
        <ChildComponent />
      </NameProvider>
    </CountProvider>
  );
}

// 优化方案2：使用useMemo
function MyProvider({ children }) {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('React');
  
  const countValue = useMemo(() => ({ count, setCount }), [count]);
  const nameValue = useMemo(() => ({ name, setName }), [name]);
  
  return (
    <CountContext.Provider value={countValue}>
      <NameContext.Provider value={nameValue}>
        {children}
      </NameContext.Provider>
    </CountContext.Provider>
  );
}
```

---

## 6、memo有什么用途，useMemo和memo区别是什么？useCallback和useMemo有什么区别？

### React.memo 的用途

`React.memo` 是一个高阶组件，用于对函数组件进行性能优化，避免不必要的重新渲染。

**基本用法：**
```javascript
const MyComponent = React.memo(function MyComponent(props) {
  /* render using props */
});

// 或使用箭头函数
const MyComponent = React.memo((props) => {
  /* render using props */
});
```

**工作原理：**
- React.memo 会对 props 进行浅比较
- 如果 props 没有变化，则跳过渲染，复用上次的渲染结果
- 类似于类组件的 `shouldComponentUpdate`

```javascript
// 示例：避免不必要的渲染
const ExpensiveComponent = React.memo(({ data, onClick }) => {
  console.log('ExpensiveComponent rendered');
  
  // 昂贵的计算或渲染
  const result = heavyCalculation(data);
  
  return (
    <div>
      {result}
      <button onClick={onClick}>Click me</button>
    </div>
  );
});

function Parent() {
  const [data, setData] = useState([1, 2, 3]);
  const [count, setCount] = useState(0);
  
  // 注意：这里每次都会创建新的函数
  const handleClick = () => {
    console.log('clicked');
  };
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ExpensiveComponent data={data} onClick={handleClick} />
    </div>
  );
}
```

**自定义比较函数：**
```javascript
const MyComponent = React.memo(
  function MyComponent(props) {
    /* render */
  },
  (prevProps, nextProps) => {
    // 返回 true 表示 props 相等，不需要重新渲染
    // 返回 false 表示 props 不等，需要重新渲染
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### useMemo vs React.memo

| 特性 | React.memo | useMemo |
|------|------------|---------|
| 作用 | 组件级别的优化 | 值级别的优化 |
| 优化对象 | 组件渲染 | 计算结果 |
| 比较内容 | props 之间 | 依赖项之间 |
| 适用场景 | 避免组件不必要的重渲染 | 避免昂贵的计算 |

```javascript
// useMemo 示例
function ExpensiveCalculation({ numbers }) {
  // 只在 numbers 变化时重新计算
  const sum = useMemo(() => {
    console.log('Calculating sum...');
    return numbers.reduce((acc, num) => acc + num, 0);
  }, [numbers]);
  
  return <div>Sum: {sum}</div>;
}

// React.memo 示例
const MemoizedComponent = React.memo(function MemoizedComponent({ value }) {
  console.log('Component rendered');
  return <div>Value: {value}</div>;
});

function Parent() {
  const [value, setValue] = useState(1);
  const [other, setOther] = useState(2);
  
  return (
    <div>
      <button onClick={() => setValue(v => v + 1)}>Change value</button>
      <button onClick={() => setOther(o => o + 1)}>Change other</button>
      {/* 只有 value 变化时才会重新渲染 */}
      <MemoizedComponent value={value} />
    </div>
  );
}
```

### useCallback vs useMemo

| 特性 | useCallback | useMemo |
|------|-------------|---------|
| 返回值 | 函数 | 计算结果（任意值） |
| 用途 | 缓存函数引用 | 缓存计算结果 |
| 实质 | useMemo 的语法糖 | `useMemo(() => fn, deps)` |

```javascript
// useCallback
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// 等价于
const memoizedCallback = useMemo(() => () => {
  doSomething(a, b);
}, [a, b]);
```

**useCallback 使用场景：**

1. **传递给优化的子组件**
```javascript
function Parent() {
  const [count, setCount] = useState(0);
  
  // 不使用 useCallback：每次渲染都会创建新函数
  const handleClickBad = () => {
    console.log('clicked');
  };
  
  // 使用 useCallback：函数引用保持不变
  const handleClickGood = useCallback(() => {
    console.log('clicked');
  }, []); // 空依赖数组
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedChild onClick={handleClickGood} />
    </div>
  );
}

const MemoizedChild = React.memo(({ onClick }) => {
  console.log('Child rendered');
  return <button onClick={onClick}>Child Button</button>;
});
```

2. **作为其他 Hook 的依赖**
```javascript
function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');
  
  const sendMessage = useCallback((text) => {
    api.sendMessage(roomId, text);
  }, [roomId]); // roomId 改变时才创建新函数
  
  useEffect(() => {
    const handler = (event) => {
      sendMessage(event.data);
    };
    
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendMessage]); // 依赖 sendMessage 函数
  
  return (
    <div>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={() => sendMessage(message)}>Send</button>
    </div>
  );
}
```

**useMemo 使用场景：**

1. **昂贵的计算**
```javascript
function Fibonacci({ n }) {
  const result = useMemo(() => {
    console.log('Computing Fibonacci...');
    return fibonacci(n); // 假设这是昂贵的计算
  }, [n]);
  
  return <div>Fibonacci({n}) = {result}</div>;
}
```

2. **对象引用**
```javascript
function Parent() {
  const [count, setCount] = useState(0);
  
  // 使用 useMemo 缓存对象
  const config = useMemo(() => ({
    theme: 'dark',
    color: 'red'
  }), []); // 依赖项为空，对象只创建一次
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child config={config} />
    </div>
  );
}

const Child = React.memo(({ config }) => {
  console.log('Child rendered');
  return <div>{config.theme}</div>;
});
```

3. **避免依赖循环**
```javascript
function DataFetcher({ id }) {
  const [data, setData] = useState(null);
  
  const fetchData = useCallback(async () => {
    const result = await api.getData(id);
    setData(result);
  }, [id]);
  
  // 使用 useMemo 避免循环依赖
  const memoizedData = useMemo(() => data, [data]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData 稳定，不会导致循环
  
  return <div>{JSON.stringify(memoizedData)}</div>;
}
```

### 性能优化最佳实践

```javascript
// ❌ 过度优化
function BadExample() {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  const value = useMemo(() => count, [count]);
  
  return (
    <div>
      <button onClick={handleClick}>Count: {value}</button>
    </div>
  );
}

// ✅ 合理优化
function GoodExample() {
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState('');
  const [items] = useState(Array(10000).fill(0).map((_, i) => i));
  
  // 只优化昂贵的计算
  const filteredItems = useMemo(() => {
    return items.filter(item => item % 2 === 0);
  }, [items]);
  
  // 只优化传递给 memo 组件的回调
  const handleItemClick = useCallback((item) => {
    console.log('Clicked:', item);
  }, []);
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filteredItems.map(item => (
        <MemoizedItem key={item} item={item} onClick={handleItemClick} />
      ))}
    </div>
  );
}

const MemoizedItem = React.memo(({ item, onClick }) => {
  return <div onClick={() => onClick(item)}>{item}</div>;
});
```

**关键点：**
- 先测量，再优化
- 不要过早优化
- 只有在确实存在性能问题时才使用
- 使用 React DevTools Profiler 分析性能

---

## 7、React新老生命周期的区别是什么？合并老生命周期的理由是什么？

### 老生命周期（React 16.3 之前）

```javascript
class OldLifecycleComponent extends React.Component {
  // 1. 初始化
  constructor(props) {
    super(props);
    this.state = {};
  }
  
  // 2. 挂载阶段
  componentWillMount() {
    // ⚠️ 已废弃
    console.log('componentWillMount');
  }
  
  componentDidMount() {
    // 可以进行DOM操作、网络请求、订阅
    console.log('componentDidMount');
  }
  
  // 3. 更新阶段
  componentWillReceiveProps(nextProps) {
    // ⚠️ 已废弃
    console.log('componentWillReceiveProps');
  }
  
  shouldComponentUpdate(nextProps, nextState) {
    // 控制是否更新，返回 true/false
    return true;
  }
  
  componentWillUpdate(nextProps, nextState) {
    // ⚠️ 已废弃
    console.log('componentWillUpdate');
  }
  
  componentDidUpdate(prevProps, prevState) {
    // 可以进行DOM操作、网络请求
    console.log('componentDidUpdate');
  }
  
  // 4. 卸载阶段
  componentWillUnmount() {
    // 清理工作：定时器、订阅、取消请求
    console.log('componentWillUnmount');
  }
  
  // 5. 错误处理
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error);
  }
  
  render() {
    return <div>Old Lifecycle</div>;
  }
}
```

### 新生命周期（React 16.3+）

```javascript
class NewLifecycleComponent extends React.Component {
  // 1. 初始化
  constructor(props) {
    super(props);
    this.state = {};
  }
  
  // 2. 静态方法（新增）
  static getDerivedStateFromProps(props, state) {
    // 根据props派生state，返回null或新的state对象
    console.log('getDerivedStateFromProps');
    return null;
  }
  
  // 3. 挂载阶段
  componentDidMount() {
    console.log('componentDidMount');
  }
  
  // 4. 更新阶段
  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }
  
  // 5. 获取快照（新增）
  getSnapshotBeforeUpdate(prevProps, prevState) {
    // 在DOM更新前获取信息（如滚动位置）
    console.log('getSnapshotBeforeUpdate');
    return null;
  }
  
  componentDidUpdate(prevProps, prevState, snapshot) {
    // snapshot 是 getSnapshotBeforeUpdate 的返回值
    console.log('componentDidUpdate');
  }
  
  // 6. 卸载阶段
  componentWillUnmount() {
    console.log('componentWillUnmount');
  }
  
  // 7. 错误处理
  static getDerivedStateFromError(error) {
    // 派生错误状态
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    // 记录错误
    console.error('Error:', error, errorInfo);
  }
  
  render() {
    return <div>New Lifecycle</div>;
  }
}
```

### 生命周期对比图

```
老生命周期：
Mounting:
  constructor() → componentWillMount() → render() → componentDidMount()

Updating:
  componentWillReceiveProps() → shouldComponentUpdate() → 
  componentWillUpdate() → render() → componentDidUpdate()

Unmounting:
  componentWillUnmount()

新生命周期：
Mounting:
  constructor() → getDerivedStateFromProps() → render() → componentDidMount()

Updating:
  getDerivedStateFromProps() → shouldComponentUpdate() → 
  render() → getSnapshotBeforeUpdate() → componentDidUpdate()

Unmounting:
  componentWillUnmount()

Error Handling:
  static getDerivedStateFromError() → componentDidCatch()
```

### 废弃的生命周期

| 废弃的方法 | 新方法（如需替代） | 废弃原因 |
|-----------|------------------|---------|
| componentWillMount | componentDidMount / constructor | 可能被多次调用，不安全 |
| componentWillReceiveProps | getDerivedStateFromProps | 异步渲染会导致问题 |
| componentWillUpdate | getSnapshotBeforeUpdate | 异步渲染会导致问题 |

### 合并老生命周期的理由

**1. 异步渲染的兼容性问题**

React 16 引入了 Fiber 架构，支持异步渲染（可中断的渲染）。老的生命周期方法在异步渲染中会导致问题：

```javascript
// 问题场景：componentWillReceiveProps
class ProblematicComponent extends React.Component {
  componentWillReceiveProps(nextProps) {
    // ❌ 在异步渲染中，这个方法可能被多次调用
    if (nextProps.id !== this.props.id) {
      this.fetchData(nextProps.id);
    }
  }
  
  async fetchData(id) {
    // 可能会发起多个请求
    const data = await api.getData(id);
    this.setState({ data });
  }
}

// ✅ 使用新的生命周期
class FixedComponent extends React.Component {
  state = { data: null };
  
  static getDerivedStateFromProps(nextProps, prevState) {
    // 同步执行，安全
    if (nextProps.id !== prevState.prevId) {
      return { prevId: nextProps.id, data: null };
    }
    return null;
  }
  
  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id) {
      this.fetchData(this.props.id);
    }
  }
  
  async fetchData(id) {
    const data = await api.getData(id);
    this.setState({ data });
  }
}
```

**2. 避免重复的网络请求**

```javascript
// ❌ 旧方式可能导致重复请求
class OldWay extends React.Component {
  componentWillReceiveProps(nextProps) {
    if (nextProps.userId !== this.props.userId) {
      // 异步渲染时可能被多次调用
      this.fetchUser(nextProps.userId);
    }
  }
}

// ✅ 新方式避免重复请求
class NewWay extends React.Component {
  state = { user: null };
  
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.userId !== prevState.userId) {
      return { userId: nextProps.userId, user: null };
    }
    return null;
  }
  
  componentDidUpdate(prevProps, prevState) {
    if (this.state.userId !== prevState.userId) {
      this.fetchUser(this.state.userId);
    }
  }
}
```

**3. getSnapshotBeforeUpdate 的优势**

```javascript
// 典型应用：保持滚动位置
class ChatRoom extends React.Component {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
  }
  
  getSnapshotBeforeUpdate(prevProps) {
    // 在DOM更新前获取滚动位置
    if (this.listRef.current) {
      return {
        scrollTop: this.listRef.current.scrollTop,
        scrollHeight: this.listRef.current.scrollHeight
      };
    }
    return null;
  }
  
  componentDidUpdate(prevProps, prevState, snapshot) {
    // DOM更新后恢复滚动位置
    if (snapshot !== null && this.listRef.current) {
      const newScrollHeight = this.listRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - snapshot.scrollHeight;
      
      // 如果新消息在底部，保持滚动
      if (snapshot.scrollTop + this.listRef.current.clientHeight >= snapshot.scrollHeight - 50) {
        this.listRef.current.scrollTop = newScrollHeight - this.listRef.current.clientHeight;
      }
    }
  }
  
  render() {
    return (
      <div 
        ref={this.listRef} 
        style={{ height: '300px', overflow: 'auto' }}
      >
        {this.props.messages.map(msg => (
          <div key={msg.id}>{msg.text}</div>
        ))}
      </div>
    );
  }
}
```

**4. getDerivedStateFromError 的优势**

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  // 同步执行，可以立即更新UI
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    // 异步上报错误
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 函数组件对应的生命周期

```javascript
import { useEffect, useState, useRef, useLayoutEffect } from 'react';

function FunctionComponent({ userId }) {
  const [data, setData] = useState(null);
  const listRef = useRef(null);
  
  // ✅ componentDidMount + componentDidUpdate
  useEffect(() => {
    fetchData(userId);
  }, [userId]);
  
  // ✅ componentWillUnmount
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick');
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // ✅ getSnapshotBeforeUpdate + componentDidUpdate
  const prevScrollHeight = useRef();
  
  useEffect(() => {
    if (prevScrollHeight.current !== undefined) {
      const newScrollHeight = listRef.current?.scrollHeight;
      // 处理滚动位置
    }
    prevScrollHeight.current = listRef.current?.scrollHeight;
  });
  
  // ✅ constructor 初始化
  const [state, setState] = useState(() => {
    // 复杂的初始化逻辑
    return computeInitialState();
  });
  
  // ✅ getDerivedStateFromProps
  useEffect(() => {
    if (userId !== prevUserId) {
      setState({ userId, data: null });
    }
  }, [userId]);
  
  return <div ref={listRef}>{/* ... */}</div>;
}
```

### 最佳实践建议

1. **优先使用函数组件 + Hooks**
2. **避免使用 getDerivedStateFromProps** - 大多数场景可以直接使用 props
3. **componentDidMount** - 适合副作用操作（网络请求、订阅）
4. **componentDidUpdate** - 适合响应props/state变化
5. **componentWillUnmount** - 必须清理副作用
6. **componentDidCatch** - 错误边界必须用类组件

---

## 8、React中的状态管理库你如何选择？什么是状态撕裂？useState同步还是异步？

### 状态管理库选择指南

#### 选择决策树

```
应用需求
├── 简单应用（组件通信）
│   └── Props + Context
├── 中等应用（状态共享）
│   ├── Zustand（简单、现代）
│   ├── Jotai（原子化状态）
│   └── Recoil（Facebook 出品）
├── 大型应用（复杂状态）
│   ├── Redux Toolkit（标准化、生态完善）
│   ├── MobX（响应式、简单）
│   └── XState（状态机）
└── 服务端渲染（SSR）
    ├── Zustand
    └── Redux Toolkit
```

#### 各库对比

| 特性 | Redux | Zustand | MobX | Jotai | Recoil |
|------|-------|---------|------|-------|--------|
| 学习曲线 | 陡峭 | 平缓 | 中等 | 平缓 | 中等 |
| Bundle Size | 大 | 小 | 中 | 小 | 中 |
| 性能 | 好 | 优秀 | 优秀 | 优秀 | 好 |
| TypeScript支持 | 优秀 | 优秀 | 良好 | 优秀 | 优秀 |
| DevTools | 完善 | 简单 | 较少 | 简单 | 良好 |
| 适用场景 | 大型应用 | 大多数场景 | 复杂状态 | 原子状态 | 原子状态 |

#### 1. Context API（简单应用）

```javascript
// 适合：小型应用、跨组件共享状态
const UserContext = createContext();

function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const login = async (credentials) => {
    const user = await api.login(credentials);
    setUser(user);
  };
  
  const logout = () => setUser(null);
  
  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// 使用
function App() {
  return (
    <UserProvider>
      <Profile />
    </UserProvider>
  );
}
```

#### 2. Zustand（推荐大多数场景）

```javascript
import create from 'zustand';

// 简单的使用
const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

// 使用
function BearCounter() {
  const bears = useStore((state) => state.bears);
  return <h1>{bears} around here...</h1>;
}

// 组合多个 store
const useAuthStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

const useTodoStore = create((set) => ({
  todos: [],
  addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
}));

// 中间件：持久化
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage', // localStorage key
    }
  )
);
```

#### 3. Redux Toolkit（大型应用）

```javascript
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

// 创建 slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

// 创建 store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

// 组件中使用
function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>
        +
      </button>
      <button onClick={() => dispatch(counterSlice.actions.decrement())}>
        -
      </button>
      <button onClick={() => dispatch(counterSlice.actions.incrementByAmount(5))}>
        +5
      </button>
    </div>
  );
}

// 包装应用
function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}
```

#### 4. Jotai（原子化状态）

```javascript
import { atom, useAtom } from 'jotai';

// 创建原子
const countAtom = atom(0);
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// 使用
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const [doubleCount] = useAtom(doubleCountAtom);
  
  return (
    <div>
      <div>Count: {count}</div>
      <div>Double: {doubleCount}</div>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}

// 可写派生原子
const fontSizeAtom = atom(14);
const textAtom = atom('hello');
const textSizeAtom = atom(
  (get) => {
    const text = get(textAtom);
    const fontSize = get(fontSizeAtom);
    return `${text} (size: ${fontSize})`;
  },
  (get, set, arg) => {
    set(fontSizeAtom, arg);
  }
);
```

### 状态撕裂

**定义：** 状态撕裂是指在并发渲染过程中，不同部分的UI使用了不同版本的状态，导致UI显示不一致。

```javascript
// 场景示例
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    async function fetchData() {
      const [userData, userPosts] = await Promise.all([
        api.getUser(userId),
        api.getUserPosts(userId)
      ]);
      
      // ⚠️ 可能发生状态撕裂：
      // user 更新了但 posts 没有更新，或反之
      setUser(userData);
      setPosts(userPosts);
    }
    
    fetchData();
  }, [userId]);
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <ul>
        {posts.map(post => <li key={post.id}>{post.title}</li>)}
      </ul>
    </div>
  );
}

// ✅ 解决方案1：批量更新
function UserProfile({ userId }) {
  const [state, setState] = useState({ user: null, posts: [] });
  
  useEffect(() => {
    async function fetchData() {
      const [userData, userPosts] = await Promise.all([
        api.getUser(userId),
        api.getUserPosts(userId)
      ]);
      
      // 一次性更新所有状态
      setState({ user: userData, posts: userPosts });
    }
    
    fetchData();
  }, [userId]);
  
  return (
    <div>
      <h1>{state.user?.name}</h1>
      <ul>
        {state.posts.map(post => <li key={post.id}>{post.title}</li>)</ul>
      </div>
    );
  }
}

// ✅ 解决方案2：使用 useTransition
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  useEffect(() => {
    startTransition(async () => {
      const [userData, userPosts] = await Promise.all([
        api.getUser(userId),
        api.getUserPosts(userId)
      ]);
      
      // 在过渡中更新状态，避免撕裂
      setUser(userData);
      setPosts(userPosts);
    });
  }, [userId]);
  
  if (isPending) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <ul>
        {posts.map(post => <li key={post.id}>{post.title}</li>)</ul>
      </ul>
    </div>
  );
}
```

### useState 同步还是异步？

**结论：useState 在事件处理函数中是批量更新（类似异步），在其他地方是同步的。**

```javascript
function Counter() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);
  
  // 场景1：事件处理中（批量更新）
  const handleClick = () => {
    setCount1(count1 + 1);
    setCount2(count2 + 1);
    setCount3(count3 + 1);
    
    console.log(count1, count2, count3); // 0 0 0 - 不会立即更新
  };
  
  // 场景2：异步函数中
  useEffect(() => {
    const timer = setTimeout(() => {
      setCount1(count1 + 1);
      console.log(count1); // 0 - 仍然使用闭包的旧值
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // ✅ 解决方案：使用函数式更新
  const handleCorrectClick = () => {
    setCount1(c => c + 1);
    setCount2(c => c + 1);
    setCount3(c => c + 1);
  };
  
  // 场景3：原生事件、setTimeout、Promise中（自动批处理 - React 18）
  useEffect(() => {
    setTimeout(() => {
      setCount1(c => c + 1);
      setCount2(c => c + 1);
      // React 18 中这两个更新会被批处理
    }, 0);
    
    promise.then(() => {
      setCount1(c => c + 1);
      setCount2(c => c + 1);
      // 也会被批处理
    });
  }, []);
  
  // 场景4：手动触发批处理（React 18 之前需要）
  const handleManualBatch = () => {
    ReactDOM.unstable_batchedUpdates(() => {
      setCount1(c => c + 1);
      setCount2(c => c + 1);
      setCount3(c => c + 1);
    });
  };
  
  return (
    <div>
      <p>Counts: {count1}, {count2}, {count3}</p>
      <button onClick={handleClick}>Click Me</button>
      <button onClick={handleCorrectClick}>Click Me Correct</button>
    </div>
  );
}
```

**批量更新详解：**

```javascript
// React 18 之前
function OldReactComponent() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  const handleClick = () => {
    // 事件处理中：自动批处理
    setCount(count + 1);
    setFlag(!flag); // 只触发一次渲染
  };
  
  useEffect(() => {
    setTimeout(() => {
      // 异步中：不会批处理（React 17及之前）
      setCount(count + 1); // 触发渲染1
      setFlag(!flag); // 触发渲染2
    }, 0);
  }, []);
  
  return <div>{count} {flag ? 'true' : 'false'}</div>;
}

// React 18+
function NewReactComponent() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  useEffect(() => {
    setTimeout(() => {
      // React 18: 自动批处理所有状态更新
      setCount(c => c + 1);
      setFlag(f => !f); // 只触发一次渲染
    }, 0);
    
    fetch('/api').then(() => {
      // Promise中也会被批处理
      setCount(c => c + 1);
      setFlag(f => !f);
    });
  }, []);
  
  // 如果需要立即更新，可以使用 flushSync
  const handleImmediateUpdate = () => {
    flushSync(() => {
      setCount(c => c + 1);
    });
    // 在这里可以获取到最新的 count
    console.log(count);
    flushSync(() => {
      setFlag(f => !f);
    });
  };
  
  return <div>{count} {flag ? 'true' : 'false'}</div>;
}
```

**最佳实践：**
1. 优先使用函数式更新：`setCount(c => c + 1)`
2. 相关状态合并为一个对象
3. 使用 useEffect 处理基于状态的副作用
4. 理解批量更新机制，避免依赖立即更新的值

---

## 9、在 React 中什么是 Portal?

**Portal** 是 React 16 引入的一种机制，允许将子组件渲染到父组件 DOM 层级之外的位置。

### 基本用法

```javascript
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    // 阻止背景滚动
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 渲染到 document.body 下，而不是当前组件的父元素
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// 使用
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="app">
      <button onClick={() => setIsModalOpen(true)}>Open Modal</button>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Modal Title</h2>
        <p>This is rendered outside the app container!</p>
        <button onClick={() => setIsModalOpen(false)}>Close</button>
      </Modal>
    </div>
  );
}
```

### Portal 的应用场景

**1. 模态框/对话框**
```javascript
function Dialog({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="dialog">
        <div className="dialog-header">
          <h2>{title}</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="dialog-body">{children}</div>
      </div>
    </>,
    document.body
  );
}
```

**2. Tooltip**
```javascript
function Tooltip({ children, content }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);
  const containerRef = useRef(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 50,
        left: rect.left + window.scrollX
      });
      setShow(true);
    }
  };

  return (
    <>
      <span ref={containerRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)}>
        {children}
      </span>
      {show && createPortal(
        <div className="tooltip" style={{ position: 'absolute', top: position.top, left: position.left }}>
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
```

**3. Toast/通知**
```javascript
let toastId = 0;

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = toastId++;
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return createPortal(
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}

// 全局使用
const { addToast } = useContext(ToastContext);
addToast('Operation successful!', 'success');
```

**4. 下拉菜单**
```javascript
function Dropdown({ trigger, menu }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && createPortal(
        <div className="dropdown-menu">
          {menu}
        </div>,
        document.body
      )}
    </div>
  );
}
```

### Portal 的事件冒泡

**Portal 的事件仍然遵循 React 的虚拟 DOM 树，而不是实际 DOM 树：**

```javascript
function Parent() {
  const handleClick = () => {
    console.log('Parent clicked - Portal events bubble here!');
  };

  return (
    <div onClick={handleClick}>
      <h2>Parent Component</h2>
      <Modal>
        <p>Clicking here will trigger Parent's onClick</p>
      </Modal>
    </div>
  );
}

function Modal({ children }) {
  return createPortal(
    <div className="modal">
      {children}
    </div>,
    document.body
  );
}
```

### Portal 的优势

1. **打破 DOM 层级限制**
2. **避免 CSS 冲突**（如 z-index、overflow: hidden）
3. **更好的可访问性**（使用正确的 ARIA 属性）
4. **样式隔离**
5. **性能优化**（某些情况下）

### Portal 的注意事项

```javascript
// ✅ 好的做法：处理事件冒泡
function Modal({ isOpen, onClose, children }) {
  const handleContentClick = (e) => {
    e.stopPropagation(); // 阻止点击内容时触发 overlay 的点击事件
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleContentClick}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ✅ 好的做法：处理键盘事件
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };

  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);

// ✅ 好的做法：处理焦点陷阱
function useFocusTrap(isActive) {
  const focusableRef = useRef(null);

  useEffect(() => {
    if (!isActive || !focusableRef.current) return;

    const focusableElements = focusableRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTab);
    };
  }, [isActive]);

  return focusableRef;
}
```

---

## 10、自己实现一个Hooks的关键点在哪里？

实现自定义 Hooks 的关键点：

### 1. 遵循 Hooks 规则

```javascript
// ❌ 错误：在条件语句中使用 Hook
function BadComponent({ condition }) {
  if (condition) {
    const [value, setValue] = useState(0); // 违反规则
  }
  return <div>...</div>;
}

// ✅ 正确：始终在顶层调用
function GoodComponent({ condition }) {
  const [value, setValue] = useState(0);
  const displayValue = condition ? value : 0;
  return <div>{displayValue}</div>;
}
```

### 2. 封装可复用逻辑

**示例：useLocalStorage Hook**

```javascript
function useLocalStorage(key, initialValue) {
  // 从 localStorage 读取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 更新 localStorage 和 state
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// 使用
function App() {
  const [name, setName] = useLocalStorage('name', 'Guest');
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

### 3. 处理清理逻辑

```javascript
// 使用 useEffect 进行清理
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}

// 使用
function Component() {
  const { width, height } = useWindowSize();
  return <div>Window: {width} x {height}</div>;
}
```

### 4. 提供配置选项

```javascript
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(response.statusText);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}
```

### 5. 组合多个 Hooks

```javascript
// useOnlineStatus - 检测网络状态
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// useInterval - 优雅的定时器
function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
```

### 6. 处理异步状态

```javascript
function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction(...args);
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
}

// 使用
function UserProfile({ userId }) {
  const { execute, status, data, error } = useAsync(
    () => api.getUser(userId),
    false // 不立即执行
  );

  useEffect(() => {
    execute();
  }, [userId]);

  if (status === 'pending') return <Spinner />;
  if (status === 'error') return <Error message={error.message} />;
  if (status === 'success') return <Profile data={data} />;
  return null;
}
```

### 7. 表单处理 Hook

```javascript
function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validate) {
      const fieldErrors = validate(values);
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    }
  };

  const handleSubmit = (callback) => (e) => {
    e.preventDefault();
    
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }
    
    callback(values);
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}

// 使用
function LoginForm() {
  const { values, errors, handleChange, handleSubmit } = useForm(
    { email: '', password: '' },
    (values) => {
      const errors = {};
      if (!values.email) errors.email = 'Email is required';
      if (!values.password) errors.password = 'Password is required';
      return errors;
    }
  );

  const onSubmit = (formData) => {
    console.log('Submitting:', formData);
    api.login(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        placeholder="Email"
      />
      {errors.email && <span className="error">{errors.email}</span>}
      
      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        placeholder="Password"
      />
      {errors.password && <span className="error">{errors.password}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### 实现自定义 Hook 的关键要点总结

| 要点 | 说明 | 示例 |
|------|------|------|
| 命名规范 | 以 `use` 开头 | `useLocalStorage` |
| 参数设计 | 提供合理的默认值 | `useDebounce(value, delay = 500)` |
| 返回值 | 返回需要的值和函数 | `[value, setValue]` |
| 清理逻辑 | 在 useEffect 返回清理函数 | 事件监听器清理 |
| 类型安全 | 使用 TypeScript | 泛型支持 |
| 文档 | 提供清晰的使用说明 | JSDoc 注释 |
| 测试 | 编写单元测试 | @testing-library/react-hooks |

---

## 11、你去实现React的具体业务的时候TS类型不知道怎么设置你会怎么办？

在实现 React 业务时遇到 TypeScript 类型问题的解决方案：

### 1. 使用 any 作为临时方案

```typescript
// 开发初期，先用 any 快速实现
function MyComponent(props: any) {
  return <div>{props.data}</div>;
}

// 之后再逐步完善类型
interface MyComponentProps {
  data: unknown; // 或 any，逐步完善
}

function MyComponent(props: MyComponentProps) {
  return <div>{JSON.stringify(props.data)}</div>;
}
```

### 2. 使用 unknown 比 any 更安全

```typescript
// unknown 更安全，使用前必须进行类型检查
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  if (typeof data === 'number') {
    return data * 2;
  }
  throw new Error('Unsupported data type');
}
```

### 3. 使用类型断言（谨慎）

```typescript
// 场景1：从 API 获取的数据
const response = await fetch('/api/users');
const users = (await response.json()) as User[];

// 场景2：第三方库没有类型定义
const data = (window as any).myAppData;

// 场景3：DOM 元素
const inputElement = document.getElementById('myInput') as HTMLInputElement;
inputElement.focus();
```

### 4. 使用类型守卫

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as User).id === 'number' &&
    typeof (value as User).name === 'string'
  );
}

function handleData(data: unknown) {
  if (isUser(data)) {
    console.log(data.name); // TypeScript 知道这是 User
  }
}
```

### 5. 使用工具类型

```typescript
// Partial - 所有属性可选
function updateUser(user: User, updates: Partial<User>): User {
  return { ...user, ...updates };
}

// Required - 所有属性必需
type RequiredUser = Required<Partial<User>>;

// Pick - 选择部分属性
type UserPreview = Pick<User, 'id' | 'name'>;

// Omit - 排除部分属性
type CreateUserInput = Omit<User, 'id' | 'createdAt'>;

// Record - 创建对象类型
type UserMap = Record<string, User>;

// 使用
const update: Partial<User> = { name: 'New Name' };
const preview: UserPreview = { id: 1, name: 'John' };
```

### 6. 使用泛型

```typescript
function useFetch<T>(url: string): { data: T | null; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then((result: T) => setData(result))
      .catch(setError);
  }, [url]);

  return { data, error };
}

// 使用
interface User {
  id: number;
  name: string;
}

function UserProfile({ userId }: { userId: number }) {
  const { data: user } = useFetch<User>(`/api/users/${userId}`);
  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}
```

### 7. 使用联合类型

```typescript
// 定义多种可能的状态
type DataState<T> = 
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function useAsyncData<T>(url: string): DataState<T> {
  // 实现
  return { status: 'loading' };
}

// 使用
const state = useAsyncData<User>('/api/user/1');
if (state.status === 'success') {
  console.log(state.data.name); // TypeScript 知道这里有 data
}
```

### 8. 使用类型推断

```typescript
// 从初始值推断类型
function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState(initialValues);
  
  // TypeScript 自动推断 values 的类型
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({
      ...values,
      [e.target.name]: e.target.value
    });
  };
  
  return { values, handleChange, setValues };
}

// 使用 - 自动推断类型
const form = useForm({ name: '', age: 0 });
form.values.name; // string
form.values.age; // number
```

### 9. 使用 React 的内置类型

```typescript
import { ChangeEvent, FormEvent, MouseEvent } from 'react';

// 事件处理
function handleChange(e: ChangeEvent<HTMLInputElement>) {
  console.log(e.target.value);
}

function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
}

function handleClick(e: MouseEvent<HTMLButtonElement>) {
  console.log('clicked');
}

// Ref 类型
const inputRef = useRef<HTMLInputElement>(null);

// Props 类型
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

function PrimaryButton({ variant = 'primary', ...props }: ButtonProps) {
  return <button className={`btn btn-${variant}`} {...props} />;
}
```

### 10. 使用类型断言库（zod）

```typescript
import { z } from 'zod';

// 定义 schema
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

// 推断类型
type User = z.infer<typeof UserSchema>;

// 使用
function validateUserData(data: unknown): User {
  return UserSchema.parse(data);
}

// API 响应验证
async function getUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return validateUserData(data);
}
```

### 11. 处理第三方库的类型

```typescript
// 方法1：使用 declare module 扩展
declare module 'some-library' {
  export interface SomeType {
    id: number;
    name: string;
  }
}

// 方法2：创建类型定义文件
// types/some-library.d.ts
declare module 'some-library' {
  export function someFunction(): void;
}

// 方法3：使用 @types 包
npm install @types/some-library

// 方法4：手动创建类型文件
// src/types/custom.d.ts
interface Window {
  myCustomData: {
    user: User;
  };
}
```

### 12. 实用的调试技巧

```typescript
// 类型提取
type UserProps = UserComponentProps extends infer T ? T : never;

// 条件类型
type NonNullable<T> = T extends null | undefined ? never : T;

// 映射类型
type ReadonlyUser = {
  readonly [K in keyof User]: User[K];
};

// keyof 操作符
type UserKeys = keyof User; // "id" | "name" | "email"

// typeof
const userConfig = { maxAge: 100, theme: 'dark' };
type UserConfig = typeof userConfig;

// 实用场景：从数组元素提取类型
const users = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
type User = typeof users[number];
```

### 13. 常见问题解决方案

```typescript
// 问题1：如何处理动态属性
type DynamicProps<T extends Record<string, any>> = {
  [K in keyof T]?: T[K];
} & {
  [key: string]: any;
};

// 问题2：如何处理 children
type CardProps = {
  title: string;
  children: React.ReactNode; // 或 React.ReactElement | React.ReactElement[]
};

// 问题3：如何处理 forwardRef
const MyInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});
MyInput.displayName = 'MyInput';

// 问题4：如何处理事件类型
const MyComponent = () => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };
  
  return <button onClick={handleClick}>Click</button>;
};
```

### 14. TypeScript 配置技巧

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true, // 加速编译
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### 15. 学习资源和工作流

**学习路径：**
1. 从 any/unknown 开始，逐步完善类型
2. 使用 TypeScript 的类型推断
3. 学习常用的工具类型
4. 使用类型守卫和断言
5. 研究优秀开源项目的类型定义

**实用工具：**
- VS Code 的 TypeScript 插件
- `dts-gen` - 生成类型定义文件
- `tsd` - 测试类型定义
- `@tsd/typecheck` - 类型检查

---

## 12、React和其他框架对比优缺点是什么？你们团队选择React的理由是什么？

### React vs Vue vs Angular vs Svelte 对比

| 特性 | React | Vue 3 | Angular | Svelte |
|------|-------|-------|---------|--------|
| **学习曲线** | 中等 | 平缓 | 陡峭 | 平缓 |
| **核心思想** | 单向数据流 | MVVM | 完整框架 | 编译时优化 |
| **状态管理** | Context/Redux/Zustand | Pinia/Vuex | NgRx/Services | Stores |
| **TypeScript** | 原生支持 | 良好支持 | 原生支持 | 良好支持 |
| **性能** | 优秀 | 优秀 | 良好 | 优秀 |
| **生态** | 最丰富 | 丰富 | 官方完善 | 成长中 |
| **企业支持** | Meta | 尤雨溪/社区 | Google | 社区 |
| **包大小** | 中等（+Router等） | 较小 | 大 | 最小 |
| **SSR** | Next.js | Nuxt.js | Angular Universal | SvelteKit |

### React 的优点

**1. 组件化思维清晰**
```javascript
// React: 函数式组件 + Hooks
function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

**2. 虚拟DOM 性能优秀**
- 跨平台能力（React Native, React Three Fiber）
- 细粒度的更新控制
- 时间切片、并发渲染

**3. 生态系统成熟**
```javascript
// 丰富的第三方库
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from 'zustand';
import { motion } from 'framer-motion';
```

**4. Hooks 带来的优势**
- 逻辑复用更简单
- 副作用处理清晰
- 避免类组件的复杂性

**5. TypeScript 支持优秀**
```typescript
interface Props {
  title: string;
  count: number;
}

function Component({ title, count }: Props) {
  return <div>{title}: {count}</div>;
}
```

**6. 跨平台能力**
```javascript
// React Native
import { View, Text, Button } from 'react-native';

function App() {
  return (
    <View>
      <Text>Hello React Native</Text>
    </View>
  );
}
```

### React 的缺点

**1. 学习曲线中等**
- 需要理解虚拟DOM、渲染机制
- Hooks 需要深入理解依赖项
- 状态管理方案多样，选择困难

**2. 配置复杂性**
```javascript
// 需要配置的工具链
- Create React App / Vite / Next.js
- ESLint + Prettier
- TypeScript 配置
- 测试框架 (Jest + RTL)
```

**3. 状态管理方案不统一**
```javascript
// 多种选择，初学者困惑
- Redux Toolkit
- Zustand
- Jotai
- Recoil
- MobX
- Context API
```

**4. 过度设计倾向**
```javascript
// 简单的计数器可能过度工程化
function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();
  // 实际上 useState 就足够了
}
```

### Vue 的优点

**1. 学习曲线平缓**
```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">+</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)
const increment = () => count.value++
</script>
```

**2. 双向数据绑定**
```vue
<input v-model="message" />
<!-- 等价于 -->
<input :value="message" @input="message = $event.target.value" />
```

**3. 官方工具完善**
- Vue Router
- Pinia（状态管理）
- Vite（构建工具）

**4. 模板语法直观**

### Angular 的优点

**1. 完整的框架**
```typescript
// Angular 提供开箱即用的解决方案
import { Component } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <button (click)="increment()">+</button>
    </div>
  `
})
export class CounterComponent {
  count = 0;
  increment() { this.count++; }
}
```

**2. TypeScript 原生支持**
- 严格的类型检查
- 完整的装饰器系统

**3. 企业级特性完善**
- 依赖注入
- 路由守卫
- HTTP 客户端
- 表单验证

### 团队选择 React 的理由

**1. 技术团队熟悉度**
```javascript
// 团队已有经验
- 70% 的开发人员熟悉 React
- 有多个 React 项目经验
- 内部有 React 组件库
```

**2. 人才招聘优势**
```javascript
// React 开发者市场
- 招聘池最大
- 学习资源丰富
- 社区活跃
```

**3. 技术栈匹配度**
```javascript
// 与现有技术栈集成
- Node.js 后端
- GraphQL API
- Next.js SSR
- TypeScript 全栈
```

**4. 业务需求匹配**
```javascript
// 具体业务场景
- 需要复杂的交互逻辑
- 需要跨平台（Web + Mobile）
- 需要高度定制化的 UI
- 需要优秀的性能表现
```

**5. 长期维护考虑**
```javascript
// 生态成熟度
- Meta 长期维护
- 版本升级路径清晰
- 向后兼容性好
- 企业级应用案例多
```

### 选择框架的决策矩阵

| 评估维度 | React | Vue | Angular | 权重 |
|---------|-------|-----|---------|------|
| 学习成本 | 7/10 | 9/10 | 5/10 | 20% |
| 生态成熟度 | 10/10 | 8/10 | 8/10 | 25% |
| 性能表现 | 9/10 | 9/10 | 7/10 | 20% |
| 团队熟悉度 | 9/10 | 5/10 | 4/10 | 20% |
| 长期维护性 | 9/10 | 8/10 | 8/10 | 15% |
| **总分** | **8.9** | **7.1** | **6.4** | **100%** |

### 实际项目案例分析

**案例1：大型电商项目**
- 选择：React + Redux Toolkit + Next.js
- 理由：
  - 复杂的状态管理需求
  - SEO 优化需求
  - 团队有 React 经验
  - 需要服务端渲染

**案例2：内部管理系统**
- 选择：Vue 3 + Element Plus
- 理由：
  - 快速开发需求
  - UI 组件库完善
  - 学习成本低
  - 双向绑定减少代码

**案例3：金融类应用**
- 选择：Angular
- 理由：
  - 严格的类型检查
  - 完整的框架支持
  - 企业级特性
  - 长期维护性

### 总结

**React 最适合的场景：**
- 大型复杂应用
- 需要高度定制化
- 团队有 JavaScript/TypeScript 经验
- 需要跨平台能力
- 有丰富的前端资源

**选择框架的关键因素：**
1. 团队技术栈和经验
2. 项目规模和复杂度
3. 开发时间要求
4. 长期维护需求
5. 招聘和团队扩展考虑

---

## 13、React16/17/18都有哪些新变化？useTransition是啥解决了什么？

### React 16 主要变化

**1. Fiber 架构（核心）**
```javascript
// Fiber 实现了时间切片
// 可以中断渲染，优先处理高优先级任务
// 提升了应用的响应性
```

**2. 新的生命周期**
```javascript
// 废弃
- componentWillMount
- componentWillReceiveProps  
- componentWillUpdate

// 新增
- getDerivedStateFromProps
- getSnapshotBeforeUpdate
- getDerivedStateFromError
```

**3. Context API 重构**
```javascript
// 旧的 Context
const OldContext = React.createClass({
  childContextTypes: { ... },
  getChildContext() { ... }
});

// 新的 Context API
const NewContext = React.createContext();
```

**4. React.memo**
```javascript
// 组件记忆化
const MemoizedComponent = React.memo(function MyComponent(props) {
  return <div>{props.value}</div>;
});
```

**5. Fragment**
```javascript
// 不再需要额外的 DOM 节点
return (
  <>
    <Header />
    <Main />
    <Footer />
  </>
);
```

**6. Portals**
```javascript
// 渲染到 DOM 树的其他位置
return createPortal(
  <Modal />,
  document.body
);
```

**7. Error Boundaries**
```javascript
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    logError(error, info);
  }
}
```

### React 17 主要变化

**1. 事件委托机制改变**
```javascript
// React 16: 事件监听器附加到 document
// React 17: 事件监听器附加到根容器

const root = document.getElementById('root');
ReactDOM.createRoot(root).render(<App />);
```

**2. JSX Transform**
```javascript
// 不再需要 import React
// 旧写法
import React from 'react';

// 新写法（React 17+）
// 不需要 import React
function App() {
  return <div>Hello</div>;
}
```

**3. 移除一些 API**
```javascript
// 移除
- UNSAFE_componentWillMount
- UNSAFE_componentWillReceiveProps
- UNSAFE_componentWillUpdate
- ReactDOM.render (推荐使用 createRoot)
```

**4. useEffect 清理函数改进**
```javascript
// React 17: 清理函数是异步的
// React 16: 清理函数是同步的
useEffect(() => {
  const subscription = props.source.subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, [props.source]);
```

### React 18 主要变化

**1. 并发渲染**
```javascript
// 自动批处理
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  const handleClick = () => {
    setCount(c => c + 1);
    setFlag(f => !f);
    // 只触发一次渲染（React 18）
  };
  
  return (
    <>
      <span>{count}</span>
      <span>{flag ? 'true' : 'false'}</span>
      <button onClick={handleClick}>Click</button>
    </>
  );
}
```

**2. Suspense 改进**
```javascript
// 支持服务端渲染
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>

// SuspenseList
<SuspenseList revealOrder="forwards">
  <Suspense fallback={<Loading />}>
    <Post id={1} />
  </Suspense>
  <Suspense fallback={<Loading />}>
    <Post id={2} />
  </Suspense>
</SuspenseList>
```

**3. 新的 Hooks**

**useTransition - 优先处理更新**
```javascript
import { useTransition } from 'react';

function SearchResults() {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    
    // 高优先级更新：立即
    setFilter(value);
    
    // 低优先级更新：可中断
    startTransition(() => {
      setResults(search(value));
    });
  };

  return (
    <div>
      <input value={filter} onChange={handleChange} />
      {isPending && <span>Searching...</span>}
      <List items={results} />
    </div>
  );
}
```

**useDeferredValue - 延迟更新值**
```javascript
import { useDeferredValue } from 'react';

function SearchPage({ query }) {
  // 延迟更新，避免频繁渲染
  const deferredQuery = useDeferredValue(query);
  
  const results = useMemo(() => {
    return search(deferredQuery);
  }, [deferredQuery]);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <Results results={results} />
    </div>
  );
}
```

**useId - 生成唯一 ID**
```javascript
import { useId } from 'react';

function Checkbox({ label }) {
  const id = useId();
  
  return (
    <div>
      <input id={id} type="checkbox" />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
```

**useSyncExternalStore - 外部存储同步**
```javascript
import { useSyncExternalStore } from 'react';

function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true // 服务端默认值
  );
  
  return isOnline;
}

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}
```

**useInsertionEffect - CSS-in-JS 支持**
```javascript
import { useInsertionEffect } from 'react';

function Component() {
  useInsertionEffect(() => {
    // 在 DOM 更新前同步执行
    // 用于注入 CSS 样式
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return <div>...</div>;
}
```

**4. 严格模式改进**
```javascript
// React 18 严格模式会双重调用
useEffect(() => {
  console.log('Effect ran');
  
  return () => {
    console.log('Cleanup ran');
  };
}, []);

// 开发模式下会看到：
// Effect ran
// Cleanup ran
// Effect ran
```

**5. 新的客户端 API**
```javascript
// hydrateRoot - 替代 hydrate
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document.getElementById('root'), <App />);

// createRoot - 新的渲染 API
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### useTransition 详细说明

**解决的核心问题：**

1. **UI 卡顿问题**
```javascript
// 问题场景：大量数据渲染导致 UI 卡顿
function LargeList({ items }) {
  const [filter, setFilter] = useState('');
  
  // 每次输入都会触发大量计算和渲染
  const filtered = items.filter(item => 
    item.name.includes(filter)
  );
  
  return (
    <>
      <input 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <List items={filtered} />
    </>
  );
}
```

2. **用户体验问题**
```javascript
// 使用 useTransition 解决
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  const handleSearch = (value) => {
    // 立即更新输入框（高优先级）
    setQuery(value);
    
    // 延迟搜索结果（低优先级，可中断）
    startTransition(() => {
      setResults(performSearch(value));
    });
  };

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending && <Spinner />}
      <Results items={results} />
    </div>
  );
}
```

**useTransition 的优势：**

```javascript
// 1. 保持 UI 响应性
function App() {
  const [isPending, startTransition] = useTransition();
  
  const handleClick = () => {
    startTransition(() => {
      // 耗时的操作不会阻塞 UI
      heavyComputation();
    });
  };
  
  return (
    <button onClick={handleClick}>
      {isPending ? 'Processing...' : 'Start'}
    </button>
  );
}

// 2. 可中断的渲染
function SearchResults() {
  const [isPending, startTransition] = useTransition();
  
  const handleChange = (e) => {
    startTransition(() => {
      // 如果用户快速输入，之前的渲染会被中断
      filterResults(e.target.value);
    });
  };
}

// 3. 自动批处理
function Component() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState([]);
  
  const handleClick = () => {
    setCount(c => c + 1); // 高优先级
    startTransition(() => {
      setData(largeData); // 低优先级
    });
  };
}
```

**实际应用场景：**

```javascript
// 场景1：搜索功能
function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value) => {
    setQuery(value);
    startTransition(() => {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
    });
  };

  return (
    <div>
      <SearchInput 
        value={query}
        onChange={handleSearch}
        isLoading={isPending}
      />
      <ProductList items={results} />
    </div>
  );
}

// 场景2：分页加载
function PaginatedList() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [isPending, startTransition] = useTransition();

  const loadPage = (newPage) => {
    setPage(newPage);
    startTransition(async () => {
      const data = await fetchPage(newPage);
      setItems(data);
    });
  };

  return (
    <div>
      <Pagination 
        currentPage={page}
        onPageChange={loadPage}
      />
      {isPending && <LoadingSkeleton />}
      <List items={items} />
    </div>
  );
}

// 场景3：过滤和排序
function DataTable() {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [data, setData] = useState(originalData);
  const [isPending, startTransition] = useTransition();

  const updateData = () => {
    startTransition(() => {
      let filtered = originalData.filter(item =>
        item.name.includes(filter)
      );
      
      const sorted = [...filtered].sort((a, b) => 
        a[sortBy].localeCompare(b[sortBy])
      );
      
      setData(sorted);
    });
  };

  useEffect(() => {
    updateData();
  }, [filter, sortBy]);

  return (
    <div>
      <FilterInput value={filter} onChange={setFilter} />
      <SortSelect value={sortBy} onChange={setSortBy} />
      {isPending ? <Skeleton /> : <Table data={data} />}
    </div>
  );
}
```

### React 版本升级建议

**从 React 16 升级到 18：**

```javascript
// 1. 更新渲染 API
// 旧版
ReactDOM.render(<App />, document.getElementById('root'));

// 新版
const root = createRoot(document.getElementById('root'));
root.render(<App />);

// 2. 移除废弃的生命周期
// 替换 componentWillReceiveProps 为 useEffect

// 3. 使用新的批处理机制
// 自动批处理，无需手动调用

// 4. 测试严格模式
// 双重调用 useEffect 确保清理逻辑正确
```

**注意事项：**
- 渐进式升级，可以混用版本
- 测试所有组件在严格模式下的行为
- 检查第三方库的兼容性
- 利用 useTransition 优化性能关键路径

---

## 14、React整体渲染流程请描述一下？嗯，你描述的蛮好。那你能说下双缓存是在哪个阶段设置的么？优缺点是什么？

### React 整体渲染流程

**完整流程图：**

```
1. Initial Render / State Update
   ↓
2. Schedule Update (Scheduler)
   ↓
3. Begin Work (Reconciler)
   - Create/Update Fiber Nodes
   - Diff Algorithm
   - Mark Effects
   ↓
4. Complete Work (Reconciler)
   - Create DOM Nodes (Initial Render)
   - Create Effect List
   ↓
5. Commit Phase
   - Before Mutation (getSnapshotBeforeUpdate)
   - Mutation (DOM Updates)
   - Layout (useLayoutEffect, componentDidMount, componentDidUpdate)
   ↓
6. Browser Paint
```

### 详细流程说明

**阶段1：触发更新**

```javascript
function App() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}

// 点击按钮触发更新流程
// 1. setState 创建更新对象
// 2. 调度更新到 Scheduler
```

**阶段2：调度**

```javascript
// Scheduler 负责任务调度
// 根据任务优先级决定执行顺序
function scheduleUpdateOnFiber(fiber, lane) {
  // 计算优先级
  const root = markRootUpdated(root, lane);
  
  // 根据优先级调度
  ensureRootIsScheduled(root);
}
```

**阶段3：Reconciler 协调（构建 Fiber 树）**

```javascript
// Begin Work - 从根节点开始构建 Fiber 树
function workLoop() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  const next = beginWork(unitOfWork);
  
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

// Complete Work - 完成当前节点
function completeUnitOfWork(unitOfWork) {
  // 创建 DOM 节点（首次渲染）
  // 收集 effect
  // 返回到父节点
}
```

**阶段4：Commit 阶段**

```javascript
// 三个子阶段
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 1. Before Mutation
  commitBeforeMutationEffects(finishedWork);
  
  // 2. Mutation
  commitMutationEffects(finishedWork);
  
  // 3. Layout
  commitLayoutEffects(finishedWork);
  
  // 重置标记，准备下次渲染
  root.current = finishedWork;
}

// Before Mutation
function commitBeforeMutationEffects(root) {
  // 执行 getSnapshotBeforeUpdate
  // 调度 useEffect
}

// Mutation
function commitMutationEffects(root) {
  // 插入 DOM 节点
  // 更新 DOM 节点
  // 删除 DOM 节点
}

// Layout
function commitLayoutEffects(root) {
  // 执行 useLayoutEffect
  // 执行 componentDidMount / componentDidUpdate
}
```

### 双缓存机制

**什么是双缓存？**

React 使用两棵 Fiber 树来实现双缓存：
- **Current Fiber Tree**: 当前屏幕上显示的 Fiber 树
- **WorkInProgress Fiber Tree**: 正在构建中的 Fiber 树

```javascript
// Fiber Root 结构
function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
  this.current = null; // Current Fiber Tree
  this.finishedWork = null; // WorkInProgress Fiber Tree
}
```

**双缓存设置的阶段：**

双缓存主要在 **Reconciler 阶段** 设置和维护：

```javascript
// 1. 创建 WorkInProgress Fiber
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 首次渲染，创建新的 WorkInProgress Fiber
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用已存在的 WorkInProgress Fiber
    workInProgress.pendingProps = pendingProps;
    workInProgress.effectTag = NoEffect;
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }
  
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  
  return workInProgress;
}
```

**双缓存的工作流程：**

```javascript
// 首次渲染
function renderRootSync(root, lanes) {
  // Current Tree 为空
  // 创建 WorkInProgress Tree
  const workInProgress = 
    createWorkInProgress(root.current, null);
  
  // 开始构建 Fiber 树
  workLoopSync();
  
  // 完成后，WorkInProgress 变成 Current
  root.finishedWork = workInProgress;
}

// 更新渲染
function renderRootConcurrent(root, lanes) {
  // 复用之前的 WorkInProgress
  const workInProgress = root.current.alternate;
  
  // 修改 workInProgress，标记为 WIP
  workInProgress.pendingProps = nextProps;
  workInProgress.memoizedProps = nextProps;
  workInProgress.lanes = lanes;
  root.workInProgress = workInProgress;
  
  // 开始 diff 和更新
  workLoopConcurrent();
  
  // 提交时交换
  commitRoot(root);
}

// Commit 阶段交换双缓存
function commitRootImpl(root, renderPriorityLevel) {
  const finishedWork = root.finishedWork;
  
  // Before Mutation 阶段
  // ...
  
  // Mutation 阶段：DOM 操作
  // ...
  
  // Layout 阶段：交换 Current 和 WorkInProgress
  root.current = finishedWork;
  finishedWork.alternate = null;
  
  // 清理
  // ...
}
```

**双缓存的优势：**

1. **性能优化**
```javascript
// 避免页面闪烁
// Current 始终显示，WorkInProgress 在后台构建
// 完成后一次性切换
```

2. **支持并发渲染**
```javascript
// WorkInProgress 可以被中断
// 高优先级任务可以打断低优先级任务
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

// shouldYield 检查时间片
function shouldYield() {
  const currentTime = getCurrentTime();
  return currentTime >= deadline;
}
```

3. **错误恢复**
```javascript
// 如果渲染出错，可以回退到 Current
// 保证 UI 不会显示不完整状态
```

**双缓存的劣势：**

1. **内存占用**
```javascript
// 两棵树同时存在，内存占用约翻倍
function FiberNode() {
  this.alternate = null; // 指向另一个树
  this.child = null;
  this.sibling = null;
  this.return = null;
  // ... 其他属性
}
```

2. **复杂度增加**
```javascript
// 需要维护两棵树的同步
// 切换逻辑复杂
function commitRoot(root) {
  const previousWorkInProgress = root.workInProgress;
  
  // 1. Before Mutation
  commitBeforeMutationEffects(finishedWork);
  
  // 2. Mutation
  commitMutationEffects(finishedWork);
  
  // 3. Layout - 交换
  root.current = finishedWork;
  finishedWork.alternate = null;
  
  // 4. 清理旧的 WorkInProgress
  if (previousWorkInProgress !== null) {
    detachFiberMutation(previousWorkInProgress);
  }
}
```

3. **一致性挑战**
```javascript
// 需要确保两棵树在某些状态下保持一致
// 特别是 ref、state 等共享状态
```

### 双缓存的实际应用

**场景1：时间切片**

```javascript
// 使用双缓存实现可中断的渲染
function renderWithTimeSlicing(root, lanes) {
  const workInProgress = root.current.alternate;
  
  // 构建 Fiber 树，但可以被中断
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
  
  // 如果被中断，保存当前进度
  // 下次继续从 WorkInProgress 继续构建
}
```

**场景2：优先级调度**

```javascript
// 高优先级任务打断低优先级任务
function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const startTime = currentTime;
  
  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime: startTime + timeout,
    sortIndex: -1,
  };
  
  // 根据优先级插入任务队列
  push(taskQueue, newTask);
  
  // 请求调度
  requestHostCallback(flushWork);
}
```

**场景3：错误边界**

```javascript
// 渲染错误时使用双缓存回退
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    // 使用 Current 作为回退状态
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    // 错误处理
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 双缓存总结

| 特性 | 说明 |
|------|------|
| **设置阶段** | Reconciler 阶段（Begin Work） |
| **切换时机** | Commit 阶段（Layout 子阶段） |
| **核心优势** | 支持并发渲染、避免闪烁、错误恢复 |
| **主要劣势** | 内存占用翻倍、实现复杂度高 |
| **适用场景** | 大型应用、复杂交互、需要高性能 |

**最佳实践：**
- 理解双缓存原理有助于性能优化
- 使用 React DevTools 调试 Fiber 树
- 合理使用 useMemo、React.memo 减少不必要的渲染
- 注意内存使用，特别是大型列表

---

## 15、Fiber架构原理你能细致描述下么？

### Fiber 架构概述

**Fiber 是 React 16 引入的核心架构重构，主要目标：**

1. **可中断的渲染** - 支持时间切片，将渲染任务分解
2. **优先级调度** - 高优先级任务可以打断低优先级任务
3. **并发渲染** - 多任务并行处理，提升用户体验
4. **更好的错误边界** - 更精确的错误捕获

### Fiber 的核心概念

**Fiber 节点结构：**

```javascript
// Fiber 节点的伪代码结构
function FiberNode(tag, pendingProps, key, mode) {
  // Instance Info
  this.tag = tag;                    // 组件类型标记
  this.key = key;                    // React key
  this.elementType = null;            // React 元素类型
  this.type = null;                   // 函数或类组件本身
  this.stateNode = null;              // 对应的 DOM 节点或组件实例
  
  // Fiber Tree Structure
  this.return = null;                 // 父 Fiber
  this.child = null;                  // 第一个子 Fiber
  this.sibling = null;                // 下一个兄弟 Fiber
  this.index = 0;                    // 索引位置
  this.ref = null;                    // Ref 引用
  
  // Props 和 State
  this.pendingProps = pendingProps;   // 待处理的 props
  this.memoizedProps = null;          // 上次渲染的 props
  this.updateQueue = null;            // 更新队列
  this.memoizedState = null;          // 上次渲染的 state
  
  // Effects
  this.effectTag = NoEffect;          // 副作用标记
  this.nextEffect = null;             // 下一个有副作用的节点
  this.firstEffect = null;            // 第一个副作用节点
  this.lastEffect = null;             // 最后一个副作用节点
  
  // 双缓存
  this.alternate = null;             // 指向另一棵树的对应节点
  
  // Priority
  this.lanes = NoLanes;              // 优先级车道
  this.childLanes = NoLanes;         // 子节点优先级
}

// 组件类型标记
const FunctionComponent = 0;
const ClassComponent = 1;
const IndeterminateComponent = 2;    // 类型未确定
const HostRoot = 3;                   // 根节点
const HostPortal = 4;                 // Portal
const HostComponent = 5;              // 原生 DOM 元素
const HostText = 6;                   // 文本节点
```

### Fiber 树的结构

**Fiber 树使用链表结构而非递归：**

```javascript
// 传统的虚拟 DOM 树（递归）
{
  type: 'div',
  children: [
    { type: 'span', children: 'Hello' },
    { type: 'span', children: 'World' }
  ]
}

// Fiber 树（链表）
FiberNode {
  type: 'div',
  child: FiberNode {
    type: 'span',
    sibling: FiberNode {
      type: 'span',
      sibling: null
    }
  }
}
```

**Fiber 遍历顺序：**

```javascript
// 深度优先遍历
function performUnitOfWork(unitOfWork) {
  // 1. Begin Work - 处理当前节点
  const next = beginWork(unitOfWork);
  
  if (next !== null) {
    // 如果有子节点，处理子节点
    return next;
  }
  
  // 2. Complete Work - 完成当前节点
  let completedWork = unitOfWork;
  
  while (completedWork !== null) {
    completeUnitOfWork(completedWork);
    
    const sibling = completedWork.sibling;
    
    if (sibling !== null) {
      // 如果有兄弟节点，处理兄弟
      return sibling;
    }
    
    // 返回父节点
    completedWork = completedWork.return;
  }
}
```

### Fiber 工作循环

**同步和异步工作循环：**

```javascript
// 同步工作循环（首次渲染）
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// 异步工作循环（可中断）
function workLoopConcurrent() {
  // 只要有工作要做，且时间片没有用完
  while (workInProgress !== null && !shouldYieldToHost()) {
    performUnitOfWork(workInProgress);
  }
}

// 检查是否应该让出控制权
function shouldYieldToHost() {
  const currentTime = getCurrentTime();
  return currentTime >= deadline;
}
```

**Scheduler 调度器：**

```javascript
// 任务优先级定义
const ImmediatePriority = 1;          // 立即执行
const UserBlockingPriority = 2;       // 用户交互
const NormalPriority = 3;             // 正常优先级
const LowPriority = 4;                // 低优先级
const IdlePriority = 5;                // 空闲时执行

// 调度任务
function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  
  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime: currentTime,
    expirationTime: currentTime + getTimeoutByPriority(priorityLevel),
    sortIndex: -1,
  };
  
  // 根据优先级插入任务队列
  push(taskQueue, newTask);
  
  // 请求调度
  requestHostCallback(flushWork);
}

// 执行任务队列
function flushWork(hasTimeRemaining, initialTime) {
  const currentTime = getCurrentTime();
  
  // 执行所有已到期的任务
  advanceTimers(currentTime);
  
  let currentTask = peek(taskQueue);
  
  while (
    currentTask !== null &&
    !enableSchedulerTracing
  ) {
    if (
      !hasTimeRemaining(currentTime) ||
      shouldYieldToHost()
    ) {
      break;
    }
    
    // 执行任务
    const callback = currentTask.callback;
    const continuationCallback = callback(currentTask.expirationTime);
    
    if (typeof continuationCallback === 'function') {
      currentTask.callback = continuationCallback;
      // 任务未完成，重新入队
    } else {
      // 任务完成，从队列移除
      pop(taskQueue);
    }
    
    currentTask = peek(taskQueue);
    currentTime = getCurrentTime();
  }
  
  // 如果还有任务，继续请求调度
  if (currentTask !== null) {
    return true;
  }
  
  return false;
}
```

### Fiber 的双缓存机制

**Current 和 WorkInProgress 树：**

```javascript
// Fiber Root
const fiberRoot = {
  containerInfo: container,        // 容器 DOM
  current: null,                    // Current Fiber Tree
  finishedWork: null,               // WorkInProgress Fiber Tree
};

// 创建 WorkInProgress Fiber
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 首次渲染，创建新的
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用已有的
    workInProgress.pendingProps = pendingProps;
    workInProgress.effectTag = NoEffect;
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }
  
  // 复制状态
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  
  return workInProgress;
}
```

### Fiber 的副作用系统

**Effect 标记：**

```javascript
// Effect 标记位
const NoFlags = 0b000000000000000000000;
const Placement = 0b000000000000000000010;     // 插入
const Update = 0b000000000000000000100;         // 更新
const PlacementAndUpdate = 0b000000000000000000110; // 插入并更新
const Deletion = 0b000000000000000001000;       // 删除
const Passive = 0b000000100000000000000;        // useEffect

// Effect 列表
function appendAllEffectsToParent(returnFiber, firstChild) {
  let parentLastEffect = returnFiber.lastEffect;
  
  if (parentLastEffect !== null) {
    parentLastEffect.nextEffect = firstChild;
    returnFiber.lastEffect = firstChild.lastEffect;
  } else {
    returnFiber.firstEffect = firstChild;
    returnFiber.lastEffect = firstChild.lastEffect;
  }
}

function commitEffects(root, firstEffect) {
  let effect = firstEffect;
  
  do {
    switch (effect.effectTag) {
      case Placement:
        commitPlacement(effect);
        break;
      case Update:
        commitWork(effect);
        break;
      case Deletion:
        commitDeletion(effect);
        break;
      case Passive:
        // useEffect 在 Layout 阶段后执行
        break;
    }
    effect = effect.nextEffect;
  } while (effect !== null);
}
```

### Fiber 的实际应用

**场景1：时间切片**

```javascript
// 可中断的渲染
function renderWithTimeSlicing() {
  const workInProgress = root.current.alternate;
  
  // 构建过程中可以被打断
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
  
  // 如果被打断，保存进度
  if (workInProgress !== null) {
    // 下次继续从这个节点开始
    root.workInProgress = workInProgress;
  }
}
```

**场景2：优先级调度**

```javascript
// 用户交互优先级高
function handleUserClick() {
  // 立即执行
  ReactDOM.flushSync(() => {
    setCount(c => c + 1);
  });
}

// 数据获取优先级低
function fetchData() {
  // 可中断
  startTransition(async () => {
    const data = await api.getData();
    setData(data);
  });
}
```

**场景3：错误边界**

```javascript
// Fiber 支持精确的错误捕获
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    // 立即捕获错误，停止当前分支的渲染
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    logError(error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Fiber 架构的优缺点

**优点：**

1. **可中断的渲染** - 避免长时间阻塞主线程
2. **优先级调度** - 用户交互优先于后台任务
3. **并发渲染** - 多任务并行处理
4. **更好的性能** - 时间切片和增量更新
5. **错误恢复** - 精确的错误边界支持

**缺点：**

1. **实现复杂** - 代码复杂度大幅增加
2. **内存占用** - 双缓存和额外的链表结构
3. **学习曲线** - 理解 Fiber 需要深入理解
4. **调试难度** - 可中断的渲染增加调试复杂度

### Fiber 总结

| 特性 | 说明 |
|------|------|
| **数据结构** | 链表结构，支持中断 |
| **双缓存** | Current 和 WorkInProgress 两棵树 |
| **工作循环** | 同步/异步两种模式 |
| **优先级** | Lane 模型管理优先级 |
| **副作用** | Effect 标记和列表管理 |
| **时间切片** | 可中断的渲染任务 |

---

## 16、Hooks为什么不能写在条件判断、函数体里。我现在有业务场景就需要在if里写怎么办呢？

### Hooks 规则的原理

**Hooks 必须遵循的两个规则：**

1. **只在顶层调用 Hooks** - 不要在循环、条件或嵌套函数中调用
2. **只在 React 函数中调用 Hooks** - 不要在普通 JavaScript 函数中调用

**为什么需要这些规则？**

```javascript
// React 如何追踪 Hooks 的状态
function Counter() {
  const [count, setCount] = useState(0);  // Hook 0
  const [step, setStep] = useState(1);    // Hook 1
  const doubled = useMemo(() => count * 2, [count]); // Hook 2
  
  return <div>{count}</div>;
}

// React 内部维护一个 Hook 链表
let currentHookIndex = 0;
const hook0 = useState(0);  // hooks[0]
const hook1 = useState(1);  // hooks[1]
const hook2 = useMemo(...); // hooks[2]

// 每次渲染都按相同顺序调用 Hooks
```

**违反规则的后果：**

```javascript
// ❌ 错误示例：在条件语句中使用 Hook
function BadComponent({ condition }) {
  const [value, setValue] = useState(0);
  
  if (condition) {
    const [extra, setExtra] = useState(null); // 位置不固定！
  }
  
  return <div>{value}</div>;
}

// 渲染 1: condition = true
// Hook 0: useState(0)
// Hook 1: useState(null)  ← extra

// 渲染 2: condition = false
// Hook 0: useState(0)
// Hook 1: useState(null)  ← 现在指向了 value 的状态！
```

### 为什么不能在条件判断中使用

**Hook 顺序的依赖：**

```javascript
// React 的 Hook 链表实现
let firstWorkInProgressHook = null;
let workInProgressHook = null;

function useState(initialState) {
  const hook = updateWorkInProgressHook();
  
  if (hook.memoizedState === null) {
    hook.memoizedState = initialState;
  }
  
  return [hook.memoizedState, dispatchAction];
}

function updateWorkInProgressHook() {
  let nextWorkInProgressHook;
  
  if (workInProgressHook === null) {
    // 第一个 Hook
    if (firstWorkInProgressHook === null) {
      nextWorkInProgressHook = createHook();
      firstWorkInProgressHook = nextWorkInProgressHook;
    } else {
      nextWorkInProgressHook = firstWorkInProgressHook;
    }
    workInProgressHook = nextWorkInProgressHook;
  } else {
    // 后续 Hooks，依赖链表的顺序
    nextWorkInProgressHook = workInProgressHook.next;
    workInProgressHook = nextWorkInProgressHook;
  }
  
  return workInProgressHook;
}
```

**条件语句导致的问题：**

```javascript
// 问题场景
function Component({ shouldShow }) {
  const [count, setCount] = useState(0);  // Hook 0
  
  if (shouldShow) {
    const [name, setName] = useState('');   // Hook 1 - 可能有也可能没有
  }
  
  const [data, setData] = useState(null);   // Hook 2 - 但有时变成 Hook 1
  
  return <div>{count}</div>;
}

// shouldShow = true 时的渲染
// Hook 0: count
// Hook 1: name
// Hook 2: data

// shouldShow = false 时的渲染
// Hook 0: count
// Hook 1: data  ← 混淆！使用了 name 的状态来存储 data
```

### 为什么不能在函数体中调用

```javascript
// ❌ 错误示例
function Component() {
  const handleClick = () => {
    const [localState, setLocalState] = useState(0); // 每次调用都创建新 Hook
  };
  
  return <button onClick={handleClick}>Click</button>;
}

// 每次点击都会创建新的 Hook，破坏了 Hook 链表
```

### 业务场景的解决方案

**场景1：条件渲染组件**

```javascript
// ❌ 错误方式
function BadComponent({ condition }) {
  const [data, setData] = useState(null);
  
  if (condition) {
    const [loading, setLoading] = useState(false);
    // ...
  }
  
  return <div>{data}</div>;
}

// ✅ 正确方式 1：始终声明，条件使用
function GoodComponent({ condition }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false); // 始终声明
  
  useEffect(() => {
    if (condition) {
      setLoading(true);
      fetchData().then(result => {
        setData(result);
        setLoading(false);
      });
    }
  }, [condition]);
  
  return <div>{loading ? 'Loading...' : data}</div>;
}

// ✅ 正确方式 2：提取为子组件
function ConditionalComponent({ condition }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (condition) {
      setLoading(true);
      fetchData().then(result => {
        setData(result);
        setLoading(false);
      });
    }
  }, [condition]);
  
  return <div>{loading ? 'Loading...' : data}</div>;
}

function Parent({ condition }) {
  return (
    <div>
      {condition && <ConditionalComponent condition={condition} />}
    </div>
  );
}
```

**场景2：根据条件使用不同的 Hook**

```javascript
// ❌ 错误方式
function BadComponent({ useLocalStorage, key }) {
  if (useLocalStorage) {
    const [value, setValue] = useLocalStorage(key); // 条件 Hook
  } else {
    const [value, setValue] = useState(null); // 条件 Hook
  }
  
  return <div>{value}</div>;
}

// ✅ 正确方式：统一的 Hook 内部处理逻辑
function useStorage(key, useLocalStorage) {
  if (useLocalStorage) {
    return useLocalStorageHook(key);
  } else {
    return useState(null);
  }
}

function GoodComponent({ useLocalStorage, key }) {
  const [value, setValue] = useStorage(key, useLocalStorage);
  
  return <div>{value}</div>;
}
```

**场景3：动态数量的 Hook**

```javascript
// ❌ 错误方式：循环中使用 Hook
function BadComponent({ items }) {
  items.forEach(item => {
    const [value, setValue] = useState(item); // 循环 Hook
  });
  
  return <div>...</div>;
}

// ✅ 正确方式 1：使用数组或对象存储状态
function GoodComponent({ items }) {
  const [values, setValues] = useState({});
  
  const handleChange = (id, newValue) => {
    setValues(prev => ({
      ...prev,
      [id]: newValue
    }));
  };
  
  return (
    <div>
      {items.map(item => (
        <input
          key={item.id}
          value={values[item.id] || ''}
          onChange={(e) => handleChange(item.id, e.target.value)}
        />
      ))}
    </div>
  );
}

// ✅ 正确方式 2：提取为独立的组件
function Item({ item }) {
  const [value, setValue] = useState(item);
  
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}

function GoodComponent2({ items }) {
  return (
    <div>
      {items.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}
```

**场景4：条件性的副作用**

```javascript
// ✅ 正确方式：在 useEffect 内部处理条件
function Component({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (userId) { // 条件在 useEffect 内部
      fetchUser(userId).then(setUser);
    }
  }, [userId]); // 依赖数组控制何时执行
  
  return <div>{user?.name}</div>;
}
```

**场景5：使用自定义 Hook 封装条件逻辑**

```javascript
// 自定义 Hook 处理条件逻辑
function useConditionalEffect(effect, condition, deps) {
  useEffect(() => {
    if (condition) {
      return effect();
    }
  }, [condition, ...deps]);
}

// 使用
function Component({ shouldSubscribe, channel }) {
  const [data, setData] = useState(null);
  
  useConditionalEffect(
    () => {
      const unsubscribe = subscribe(channel, setData);
      return unsubscribe;
    },
    shouldSubscribe,
    [channel]
  );
  
  return <div>{data}</div>;
}
```

### Hooks 规则检查工具

**ESLint 插件：**

```javascript
// .eslintrc.js
{
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  "plugins": ["react-hooks"]
}

// 这些规则会自动检查：
// - Hooks 是否在顶层调用
// - useEffect 的依赖是否完整
```

**手动检查清单：**

```javascript
// ✅ 正确示例
function CorrectComponent() {
  // 1. 所有 Hooks 在最顶层
  const [state, setState] = useState(null);
  const ref = useRef(null);
  
  // 2. 所有 useEffect 在顶层
  useEffect(() => {
    // ...
  }, []);
  
  // 3. 自定义 Hooks 也在顶层
  const customData = useCustomHook();
  
  // 4. 条件逻辑在返回的 JSX 中
  return state ? <A /> : <B />;
}

// ❌ 错误检查
function IncorrectComponent(condition) {
  // 1. Hooks 在条件中 - 错误
  if (condition) {
    const [state, setState] = useState(null);
  }
  
  // 2. Hooks 在循环中 - 错误
  for (let i = 0; i < 5; i++) {
    const [item, setItem] = useState(i);
  }
  
  // 3. Hooks 在嵌套函数中 - 错误
  function handleClick() {
    const [local, setLocal] = useState(0);
  }
  
  return <div>...</div>;
}
```

### 总结

| 场景 | 错误做法 | 正确做法 |
|------|---------|---------|
| 条件渲染 | if 中使用 Hook | 提取组件或始终声明 |
| 条件逻辑 | useEffect 外部判断 | useEffect 内部处理 |
| 动态数量 | 循环中使用 Hook | 使用数组/对象状态或子组件 |
| 事件处理 | 事件函数中使用 Hook | 使用 useState 或自定义 Hook |
| 不同的 Hook | if/else 中调用不同 Hook | 统一的 Hook 内部处理 |

**关键原则：**
- Hooks 的调用顺序必须固定
- 始终在函数组件的顶层调用 Hooks
- 条件逻辑放在 Hook 内部或 JSX 中
- 使用组件拆分来组织代码

---

## 17、Dom Diff细节请详细描述一下？Vue使用了双指针，React为什么没采用呢？

### React 的 Diff 算法

**React 的 Diff 算法基于三个假设：**

1. **不同类型的元素产生不同的树**
2. **开发者可以通过 key 暗示哪些子元素是稳定的**
3. **只对同层级节点进行比较**

**基本 Diff 过程：**

```javascript
// 虚拟 DOM 对比
function reconcileChildren(returnFiber, currentFirstChild, newChildren) {
  let resultingFirstChild = null;
  let previousNewFiber = null;
  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;
  let newIdx = 0;
  let nextOldFiber = null;
  
  // 第一阶段：同步处理可以直接复用的节点
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      // 旧节点的 index 大于新索引，跳过
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    
    const newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx]
    );
    
    if (newFiber === null) {
      // key 不匹配
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }
    
    if (shouldTrackSideEffects) {
      if (oldFiber && newFiber.alternate === null) {
        // 新节点，需要插入
        newFiber.flags |= Placement;
      }
    }
    
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }
  
  // 第二阶段：新节点有剩余
  if (newIdx < newChildren.length) {
    const newChildrenMap = mapRemainingChildren(returnFiber, oldFiber);
    
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        newChildrenMap,
        returnFiber,
        newIdx,
        newChildren[newIdx]
      );
      
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            // 复用节点，可能需要移动
            newFiber.flags |= Placement;
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }
    
    // 剩余的旧节点需要删除
    if (shouldTrackSideEffects) {
      while (oldFiber !== null) {
        oldFiber.flags |= Deletion;
        oldFiber = oldFiber.sibling;
      }
    }
  }
  
  // 第三阶段：旧节点有剩余，全部删除
  if (shouldTrackSideEffects && oldFiber !== null) {
    while (oldFiber !== null) {
      oldFiber.flags |= Deletion;
      oldFiber = oldFiber.sibling;
    }
  }
  
  return resultingFirstChild;
}
```

### Diff 的三种情况

**1. 对比不同类型的元素**

```javascript
// 类型不同，销毁旧树，创建新树
// Before
<div>
  <Counter />
</div>

// After
<span>
  <Counter />
</span>

// React 会：
// 1. 销毁 <div> 及其子节点
// 2. 创建 <span> 及其子节点
// 3. 这会销毁 Counter 的 state
```

**2. 对比相同类型的 DOM 元素**

```javascript
// 相同类型，只更新变化的属性
// Before
<div className="before" title="stuff" />

// After
<div className="after" title="stuff" />

// React 会：
// 1. 保留 DOM 节点
// 2. 更新 className 属性
// 3. 保持 title 不变
```

**3. 对比相同类型的组件**

```javascript
// 相同组件，更新 props
// Before
<Counter value={1} />

// After
<Counter value={2} />

// React 会：
// 1. 保留组件实例
// 2. 调用 componentWillReceiveProps
// 3. 调用 shouldComponentUpdate
// 4. 调用 render
```

### Key 的作用

**没有 Key 的问题：**

```javascript
// Before
<ul>
  <li>First</li>
  <li>Second</li>
</ul>

// After: 在开头插入
<ul>
  <li>Zero</li>
  <li>First</li>
  <li>Second</li>
</ul>

// React 的操作（没有 key）：
// 1. 修改 First -> Zero
// 2. 修改 Second -> First
// 3. 创建 Second
// 这会导致不必要的更新
```

**使用 Key 的优化：**

```javascript
// Before
<ul>
  <li key="1">First</li>
  <li key="2">Second</li>
</ul>

// After
<ul>
  <li key="0">Zero</li>
  <li key="1">First</li>
  <li key="2">Second</li>
</ul>

// React 的操作（有 key）：
// 1. 在开头插入 Zero
// 2. 保持 First 和 Second 不变
// 效率更高
```

**Key 的选择：**

```javascript
// ✅ 好：稳定的、唯一的 ID
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}

// ❌ 差：数组索引（列表会变化时）
{items.map((item, index) => (
  <li key={index}>{item.name}</li>
))}

// ❌ 差：随机值（每次渲染都变）
{items.map(item => (
  <li key={Math.random()}>{item.name}</li>
))}
```

### Vue 的双指针算法

**Vue 的 Diff 算法：**

```javascript
// Vue 使用的双指针算法
function updateChildren(parentElm, oldCh, newCh) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let newEndIdx = newCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx, idxInOld, elmToMove, before;
  
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVnode == null) {
      oldStartVnode = oldCh[++oldStartIdx];
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 头部相同
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 尾部相同
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // 旧头 = 新尾：移动到尾部
      patchVnode(oldStartVnode, newEndVnode);
      insertBefore(parentElm, oldStartVnode.elm, oldEndVnode.elm.nextSibling);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // 旧尾 = 新头：移动到头部
      patchVnode(oldEndVnode, newStartVnode);
      insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // 不在四个端点，使用 key 查找
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      }
      idxInOld = oldKeyToIdx[newStartVnode.key];
      
      if (idxInOld === undefined) {
        // 新节点，创建
        createElm(newStartVnode);
        insertBefore(parentElm, newStartVnode.elm, oldStartVnode.elm);
      } else {
        // 旧节点，移动
        elmToMove = oldCh[idxInOld];
        patchVnode(elmToMove, newStartVnode);
        oldCh[idxInOld] = undefined;
        insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  
  // 处理剩余节点
  if (oldStartIdx > oldEndIdx) {
    // 新节点有剩余，批量创建
    addVnodes(parentElm, newCh[newStartIdx], newEndIdx);
  } else if (newStartIdx > newEndIdx) {
    // 旧节点有剩余，批量删除
    removeVnodes(oldCh, oldStartIdx, oldEndIdx);
  }
}
```

### React 为什么不使用双指针

**原因分析：**

1. **React 的设计目标不同**
```javascript
// React 关注点：
- 支持 Fiber 架构（可中断的渲染）
- 优先级调度
- 并发渲染

// 双指针算法是同步的，难以中断
- 一旦开始 diff，必须完成整个列表
- 不符合 Fiber 的时间切片理念
```

2. **Fiber 架构的限制**
```javascript
// Fiber 使用链表结构
function FiberNode() {
  this.child = null;   // 单向子节点
  this.sibling = null; // 单向兄弟节点
  this.return = null;  // 单向父节点
}

// 双指针算法需要：
- 随机访问数组元素
- 高效的索引查找
- Fiber 的链表结构不支持
```

3. **性能考虑**
```javascript
// 双指针算法
- 理论上更快 O(n)
- 但实现复杂
- 内存占用较高（需要维护索引映射）

// React 的算法
- 平均情况 O(n)
- 最坏情况 O(n²)
- 但实际场景中很少遇到最坏情况
- 实现更简单，代码更易维护
```

4. **可中断性**
```javascript
// React 的 Diff 可以随时中断
function reconcileChildren() {
  while (workInProgress !== null && !shouldYield()) {
    const child = workInProgress.child;
    
    if (child !== null) {
      // 处理当前子节点
      reconcileChildFibers(workInProgress, child);
    }
    
    workInProgress = workInProgress.sibling;
  }
  
  // 如果被中断，下次继续
}

// 双指针算法难以支持
function vueDiff() {
  // 一旦开始，必须完成整个 diff
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // ...
  }
}
```

5. **实际性能差异不大**
```javascript
// 在大多数实际场景中：
- 列表通常有稳定的 key
- 移动操作相对较少
- React 的算法已经足够快

// 只有在以下情况双指针才明显更快：
- 大量无 key 的列表
- 频繁的头部/尾部操作
- 但这种情况可以通过正确使用 key 避免
```

### React 的优化策略

**1. 使用 Key**
```javascript
// 正确使用 key
function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

**2. 避免不必要的渲染**
```javascript
// 使用 React.memo
const Item = React.memo(function Item({ item }) {
  return <li>{item.name}</li>;
});

function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </ul>
  );
}
```

**3. 虚拟化长列表**
```javascript
// 使用 react-window 或 react-virtualized
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Diff 算法对比

| 特性 | React | Vue |
|------|-------|-----|
| 算法类型 | 同层 Diff + Key | 双指针 + Key |
| 时间复杂度 | 平均 O(n)，最坏 O(n²) | O(n) |
| 可中断性 | 支持（Fiber） | 不支持 |
| 适用场景 | 通用 | 列表优化更好 |
| 实现复杂度 | 中等 | 高 |
| 并发支持 | 是 | 否 |

### 总结

**React 不使用双指针的原因：**

1. **Fiber 架构限制** - 链表结构不适合双指针
2. **并发渲染需求** - 需要支持可中断的 diff
3. **实现复杂度** - 双指针在 Fiber 中难以实现
4. **实际性能** - 正确使用 key 时，性能差异不大
5. **设计权衡** - 牺牲一点 diff 性能换取更好的并发支持

**最佳实践：**

- 始终为列表项提供稳定的 key
- 避免使用索引作为 key
- 使用 React.memo 优化组件渲染
- 对于长列表使用虚拟化方案
- 理解 React 的 Diff 策略，合理设计组件

---

## 18、React合成事件系统是什么？它的优势和原理是什么？

### 合成事件系统概述

**合成事件（SyntheticEvent）** 是 React 实现的一套跨浏览器的事件系统，它将原生浏览器事件包装成统一的 API，抹平了不同浏览器之间的差异。

### 合成事件的实现原理

**事件注册和委托：**

```javascript
// React 17 之前：事件委托到 document
// React 17+：事件委托到根容器

// 事件注册流程
function listenToEvent(registrationName, mountAt) {
  const isDocumentOrBody = 
    mountAt === document || mountAt === document.body;
  
  if (!isDocumentOrBody) {
    const target = getEventTarget(mountAt);
    target.addEventListener(
      registrationName,
      dispatchEvent,
      false
    );
  }
}

// 事件委托
ReactDOM.createRoot(root).render(<App />);
// 事件监听器附加到 root 容器，而不是每个元素
```

**事件触发流程：**

```javascript
// 1. 用户点击 DOM 元素
// 2. 捕获阶段
document.body → ... → 父元素 → 目标元素

// 3. 冒泡阶段
目标元素 → 父元素 → ... → document.body

// React 在冒泡阶段处理事件
function dispatchEvent(event) {
  // 1. 创建合成事件对象
  const syntheticEvent = createSyntheticEvent(event);
  
  // 2. 查找对应的 Fiber 节点
  const targetFiber = getFiberFromEventTarget(event.target);
  
  // 3. 收集事件处理函数（从目标到根）
  const listeners = collectListeners(targetFiber);
  
  // 4. 执行捕获阶段事件处理
  executeCaptureListeners(listeners, syntheticEvent);
  
  // 5. 执行冒泡阶段事件处理
  executeBubbleListeners(listeners, syntheticEvent);
}
```

### 合成事件对象

**合成事件的结构：**

```javascript
class SyntheticEvent {
  constructor(nativeEvent) {
    this.nativeEvent = nativeEvent;
    this.type = nativeEvent.type;
    this.target = getEventTarget(nativeEvent);
    this.currentTarget = null;
    
    // 坐标信息
    this.clientX = nativeEvent.clientX;
    this.clientY = nativeEvent.clientY;
    this.pageX = nativeEvent.pageX;
    this.pageY = nativeEvent.pageY;
    
    // 键盘信息
    this.key = nativeEvent.key;
    this.keyCode = nativeEvent.keyCode;
    
    // 时间戳
    this.timeStamp = nativeEvent.timeStamp;
    
    // 事件默认行为和传播
    this.isDefaultPrevented = false;
    this.isPropagationStopped = false;
  }
  
  preventDefault() {
    this.isDefaultPrevented = true;
    this.nativeEvent.preventDefault();
  }
  
  stopPropagation() {
    this.isPropagationStopped = true;
    this.nativeEvent.stopPropagation();
  }
  
  stopImmediatePropagation() {
    this.isPropagationStopped = true;
    this.nativeEvent.stopImmediatePropagation();
  }
  
  // 对象池，复用事件对象
  persist() {
    // React 会将事件对象从池中移除，允许异步访问
  }
}
```

### 合成事件的优势

**1. 跨浏览器兼容性**

```javascript
// 原生事件的问题：
// 不同浏览器的事件实现不一致

// IE 的事件处理
element.attachEvent('onclick', handler);

// 标准浏览器
element.addEventListener('click', handler, false);

// React 统一了这些差异
<button onClick={handleClick}>Click</button>
```

**2. 自动批量更新**

```javascript
// React 事件处理中的更新会被自动批处理
function handleClick() {
  setCount1(c => c + 1);
  setCount2(c => c + 1);
  setCount3(c => c + 1);
  // 只触发一次渲染
}

// 在原生事件中需要手动批处理（React 17 之前）
element.addEventListener('click', () => {
  ReactDOM.unstable_batchedUpdates(() => {
    setCount1(c => c + 1);
    setCount2(c => c + 1);
  });
});
```

**3. 性能优化**

```javascript
// 事件委托减少内存占用
// 只需要为每个事件类型注册一个监听器

// 而不是为每个元素都注册监听器
button1.addEventListener('click', handler1);
button2.addEventListener('click', handler2);
button3.addEventListener('click', handler3);
// ... 可能会有数千个监听器
```

**4. 对象池复用**

```javascript
// 复用事件对象，减少 GC 压力
const eventPool = [];

function getPooledEvent(nativeEvent) {
  if (eventPool.length > 0) {
    const event = eventPool.pop();
    initializeEvent(event, nativeEvent);
    return event;
  }
  return new SyntheticEvent(nativeEvent);
}

function releasePooledEvent(event) {
  eventPool.push(event);
}

// React 17+ 移除了事件池，因为现代浏览器性能已经足够好
```

### 事件优先级

**React 18 引入了事件优先级：**

```javascript
// 事件优先级定义
const DiscreteEventPriority = 1;    // 离散事件：click, keydown
const ContinuousEventPriority = 2;   // 连续事件：mousemove, scroll
const DefaultEventPriority = 3;     // 默认优先级
const IdleEventPriority = 4;         // 空闲优先级

// 事件处理函数的执行顺序
function dispatchEvent(event) {
  // 1. 根据事件类型确定优先级
  const priority = getEventPriority(event.type);
  
  // 2. 创建 Lane
  const lane = priorityToLane(priority);
  
  // 3. 调度更新
  scheduleUpdateOnFiber(fiber, lane);
}
```

### React 17 事件系统的改变

**1. 事件委托位置改变**

```javascript
// React 16: 事件监听器附加到 document
document.addEventListener('click', dispatchEvent);

// React 17: 事件监听器附加到根容器
rootContainer.addEventListener('click', dispatchEvent);

// 原因：
// 1. 多个 React 应用可以共存
// 2. 更容易与其他库集成
// 3. 避免 React 外的代码干扰
```

**2. 移除事件池**

```javascript
// React 16: 需要手动 persist
function handleClick(event) {
  event.persist(); // 否则在异步中访问会报错
  setTimeout(() => {
    console.log(event.type); // 可以访问
  }, 100);
}

// React 17+: 自动持久化
function handleClick(event) {
  setTimeout(() => {
    console.log(event.type); // 可以访问
  }, 100);
}
```

**3. 更好地处理嵌套的 React 应用**

```javascript
// React 17 之前：问题
const root1 = document.getElementById('root1');
const root2 = document.getElementById('root2');

ReactDOM.render(<App1 />, root1);
ReactDOM.render(<App2 />, root2);

// App2 的事件可能会被 App1 捕获

// React 17+：正常工作
const root1 = createRoot(document.getElementById('root1'));
const root2 = createRoot(document.getElementById('root2'));

root1.render(<App1 />);
root2.render(<App2 />);

// 每个应用有自己独立的事件系统
```

### 实际应用示例

**1. 阻止事件冒泡**

```javascript
function Parent() {
  const handleParentClick = () => {
    console.log('Parent clicked');
  };
  
  return (
    <div onClick={handleParentClick}>
      <Child />
    </div>
  );
}

function Child() {
  const handleChildClick = (e) => {
    e.stopPropagation(); // 阻止冒泡到父元素
    console.log('Child clicked');
  };
  
  return <button onClick={handleChildClick}>Click me</button>;
}
```

**2. 阻止默认行为**

```javascript
function Form() {
  const handleSubmit = (e) => {
    e.preventDefault(); // 阻止表单提交
    console.log('Form submitted');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  );
}
```

**3. 自定义事件**

```javascript
// 创建自定义事件发射器
function createEventEmitter() {
  const listeners = new Map();
  
  return {
    on(event, handler) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(handler);
    },
    
    off(event, handler) {
      const handlers = listeners.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    },
    
    emit(event, data) {
      const handlers = listeners.get(event);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    }
  };
}

// 使用
const emitter = createEventEmitter();

function ComponentA() {
  useEffect(() => {
    const handler = (data) => console.log('Received:', data);
    emitter.on('custom-event', handler);
    
    return () => emitter.off('custom-event', handler);
  }, []);
  
  return <div>Component A</div>;
}

function ComponentB() {
  const handleClick = () => {
    emitter.emit('custom-event', { message: 'Hello' });
  };
  
  return <button onClick={handleClick}>Send Event</button>;
}
```

### 合成事件 vs 原生事件

| 特性 | 合成事件 | 原生事件 |
|------|---------|---------|
| **兼容性** | 跨浏览器统一 | 浏览器差异大 |
| **事件委托** | 自动委托到根容器 | 需要手动实现 |
| **性能** | 对象池复用 | 无复用 |
| **优先级** | 支持优先级调度 | 无优先级 |
| **批量更新** | 自动批处理 | 需要手动批处理 |
| **API** | 统一 API | 原生 API |

### 总结

**合成事件系统的核心价值：**

1. **跨浏览器一致性** - 统一的事件 API
2. **性能优化** - 事件委托和对象池
3. **自动批处理** - 减少不必要的渲染
4. **优先级支持** - 高优先级事件优先处理
5. **React 17+ 改进** - 更好的多应用支持和简化的 API

**最佳实践：**

- 优先使用 React 的事件系统
- 理解事件冒泡和捕获机制
- 合理使用 stopPropagation 和 preventDefault
- React 17+ 不再需要调用 persist()
- 对于特殊场景，可以使用原生事件作为补充

---

## 19、React SSR（服务端渲染）的原理是什么？Next.js做了什么？

### SSR 基本原理

**什么是 SSR？**

SSR（Server-Side Rendering）是指在服务器端将 React 组件渲染成 HTML 字符串，然后发送给客户端。客户端接收到的已经是完整的 HTML，可以直接显示。

**SSR vs CSR 对比：**

```javascript
// CSR (Client-Side Rendering)
// 1. 服务器返回空 HTML
<!DOCTYPE html>
<html>
  <head>
    <script src="/bundle.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>

// 2. 客户端下载并执行 JS
// 3. React 渲染组件到 DOM
// 4. 用户看到内容

// SSR (Server-Side Rendering)
// 1. 服务器渲染组件为 HTML
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root">
      <h1>Hello World</h1>
      <p>This content is rendered on server</p>
    </div>
    <script src="/bundle.js"></script>
  </body>
</html>

// 2. 客户端立即显示内容
// 3. JS 加载后进行 hydration
```

### React SSR 实现

**1. 服务端渲染**

```javascript
import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

const app = express();

app.get('*', (req, res) => {
  // 1. 渲染 React 组件为 HTML 字符串
  const html = renderToString(<App />);
  
  // 2. 发送完整的 HTML
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR App</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});

app.listen(3000);
```

**2. 客户端 Hydration**

```javascript
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';

// 将服务端渲染的 HTML "激活"为可交互的 React 组件
hydrateRoot(document.getElementById('root'), <App />);
```

### SSR 的完整流程

```javascript
// 服务端
function handleRequest(req, res) {
  // 1. 获取数据
  const data = await fetchData(req.url);
  
  // 2. 渲染组件
  const appHtml = renderToString(
    <App data={data} />
  );
  
  // 3. 注入初始数据（用于客户端 hydration）
  const stateScript = `
    <script>
      window.__INITIAL_DATA__ = ${JSON.stringify(data)};
    </script>
  `;
  
  // 4. 返回 HTML
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR App</title>
      </head>
      <body>
        <div id="root">${appHtml}</div>
        ${stateScript}
        <script src="/client.js"></script>
      </body>
    </html>
  `);
}

// 客户端
function hydrate() {
  // 1. 读取初始数据
  const initialData = window.__INITIAL_DATA__;
  
  // 2. 使用初始数据渲染
  hydrateRoot(
    document.getElementById('root'),
    <App data={initialData} />
  );
}

hydrate();
```

### Next.js 的 SSR 实现

**Next.js 13+ App Router：**

```javascript
// app/page.js (服务端组件 - 默认)
async function Page() {
  // 数据获取自动在服务端执行
  const data = await fetch('https://api.example.com/data', {
    cache: 'force-cache', // 或 'no-store', 'revalidate'
  });
  
  const posts = await data.json();
  
  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map(post => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}

export default Page;
```

**服务端组件 vs 客户端组件：**

```javascript
// 服务端组件（默认）
// - 在服务端渲染
// - 可以直接访问数据库和文件系统
// - 减小客户端 bundle 大小

async function ServerComponent() {
  const db = await connectDB();
  const users = await db.getUsers();
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

// 客户端组件（需要 'use client' 指令）
'use client';

import { useState } from 'react';

function ClientComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}

// 混合使用
async function Page() {
  const data = await fetchData();
  
  return (
    <div>
      <ServerComponent data={data} />
      <ClientComponent />
    </div>
  );
}
```

**静态生成（SSG）：**

```javascript
// 静态生成页面
async function BlogPage({ params }) {
  const { slug } = params;
  const post = await getPostBySlug(slug);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

// 生成静态页面时获取所有路径
export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  return posts.map(post => ({
    slug: post.slug,
  }));
}

export default BlogPage;
```

**增量静态生成（ISR）：**

```javascript
// 设置重新验证时间
export const revalidate = 3600; // 1小时

async function Page() {
  // 请求会被缓存，并在指定时间后重新生成
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 },
  });
  
  const data = await res.json();
  
  return <div>{/* ... */}</div>;
}
```

### SSR 的优势和挑战

**优势：**

```javascript
// 1. SEO 优化
// 搜索引擎可以直接抓取 HTML 内容
// 不需要等待 JS 执行

// 2. 首屏加载快
// 用户可以立即看到内容
// 减少 TTFB (Time to First Byte)

// 3. 社交媒体分享
// Open Graph 标签可以正确解析
// 分享链接时显示预览图和描述

// 4. 更好的性能
// 减少客户端计算负担
// 特别是在低性能设备上
```

**挑战：**

```javascript
// 1. 服务器负载增加
// 每个请求都需要在服务端渲染

// 2. 开发复杂度
// 需要考虑服务端和客户端环境差异
// 某些 API 只在浏览器可用（window, document）

// 3. 状态管理复杂
// 需要在服务端和客户端之间同步状态

// 4. 数据获取策略
// 需要决定哪些数据在服务端获取
// 哪些数据在客户端获取
```

### 解决环境差异问题

**检查运行环境：**

```javascript
// 方法1：检查 window 对象
function isBrowser() {
  return typeof window !== 'undefined';
}

function Component() {
  if (isBrowser()) {
    // 只在浏览器中执行的代码
    const width = window.innerWidth;
  }
  
  return <div>...</div>;
}

// 方法2：使用 useEffect（只在客户端执行）
function Component() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null; // 或显示加载状态
  }
  
  return <div>{/* 浏览器专属内容 */}</div>;
}
```

**处理 localStorage 等浏览器 API：**

```javascript
// 错误：服务端渲染时会报错
function Component() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );
  
  return <div>...</div>;
}

// 正确：使用 useEffect
function Component() {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    // 只在客户端执行
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  
  return <div>Theme: {theme}</div>;
}
```

### Next.js 的优化特性

**1. 自动代码分割**

```javascript
// 页面级别的代码分割自动进行
// app/page.js → page.js
// app/about/page.js → about/page.js

// 路由懒加载
// 只加载当前页面需要的代码
```

**2. 图片优化**

```javascript
import Image from 'next/image';

function Page() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={800}
      height={600}
      priority // 首屏图片，优先加载
      placeholder="blur" // 模糊占位符
    />
  );
}

// 自动优化：
// - 响应式图片（不同设备大小）
// - 懒加载
// - WebP/AVIF 格式
// - 防止布局偏移
```

**3. 字体优化**

```javascript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

// 自动优化：
// - 自动自托管字体文件
// - 零布局偏移
// - 预加载字体
```

**4. 路由预加载**

```javascript
import Link from 'next/link';

function Navigation() {
  return (
    <nav>
      <Link href="/about" prefetch={true}>
        About Page
      </Link>
      <Link href="/contact" prefetch={true}>
        Contact Page
      </Link>
    </nav>
  );
}

// 自动在浏览器空闲时预加载页面资源
```

### SSR 性能优化

**1. 缓存策略**

```javascript
// 使用 React Cache
import { cache } from 'react';

const getData = cache(async (id) => {
  const res = await fetch(`https://api.example.com/${id}`);
  return res.json();
});

async function Page({ params }) {
  const data = await getData(params.id);
  return <div>{/* ... */}</div>;
}

// 相同的请求会被缓存，避免重复获取
```

**2. 流式渲染（Streaming SSR）**

```javascript
// 使用 Suspense 实现流式渲染
import { Suspense } from 'react';

async function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<Loading />}>
        <SlowComponent />
      </Suspense>
      <Footer />
    </div>
  );
}

// 页面分块发送，用户可以逐步看到内容
// 而不是等待整个页面渲染完成
```

**3. 边缘函数**

```javascript
// next.config.js
module.exports = {
  experimental: {
    // 在边缘节点执行
    runtime: 'edge',
  },
};

// 接近用户的位置处理请求
// 减少延迟
```

### 总结

**SSR 的核心价值：**

1. **SEO 优化** - 搜索引擎友好
2. **首屏性能** - 快速显示内容
3. **用户体验** - 减少白屏时间
4. **社交分享** - 正确的链接预览

**Next.js 的优势：**

1. **零配置** - 开箱即用的 SSR
2. **文件系统路由** - 基于文件的路由
3. **自动优化** - 图片、字体、代码分割
4. **混合渲染** - SSR、SSG、ISR、CSR 灵活选择
5. **开发体验** - 热重载、TypeScript 支持

**选择策略：**

| 场景 | 渲染方式 | Next.js 方案 |
|------|---------|-------------|
| 营销页面 | SSG | generateStaticParams |
| 博客/文档 | ISR | revalidate |
| 电商 | SSR | 服务端组件 |
| 管理后台 | CSR | 客户端组件 |

---

## 20、React中如何做性能优化？从渲染和代码层面分别说明。

### 渲染层面的性能优化

**1. 使用 React.memo 优化组件渲染**

```javascript
// ❌ 没有优化：每次父组件更新都会重新渲染
const ExpensiveComponent = ({ items }) => {
  console.log('ExpensiveComponent rendered');
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};

// ✅ 使用 React.memo：只在 props 变化时重新渲染
const MemoizedExpensiveComponent = React.memo(
  ({ items }) => {
    console.log('MemoizedExpensiveComponent rendered');
    return (
      <ul>
        {items.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数
    return prevProps.items.length === nextProps.items.length &&
           prevProps.items.every((item, i) => 
             item.id === nextProps.items[i].id
           );
  }
);

function Parent() {
  const [count, setCount] = useState(0);
  const [items] = useState([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ]);
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <MemoizedExpensiveComponent items={items} />
    </div>
  );
}
```

**2. 使用 useMemo 缓存计算结果**

```javascript
function ExpensiveCalculation({ numbers }) {
  // ❌ 没有优化：每次渲染都重新计算
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  const sorted = numbers.sort((a, b) => a - b);
  const filtered = numbers.filter(num => num > 10);
  
  // ✅ 使用 useMemo：只在依赖变化时重新计算
  const memoizedSum = useMemo(() => {
    console.log('Computing sum...');
    return numbers.reduce((acc, num) => acc + num, 0);
  }, [numbers]);
  
  const memoizedSorted = useMemo(() => {
    console.log('Sorting...');
    return [...numbers].sort((a, b) => a - b);
  }, [numbers]);
  
  const memoizedFiltered = useMemo(() => {
    console.log('Filtering...');
    return numbers.filter(num => num > 10);
  }, [numbers]);
  
  return (
    <div>
      <p>Sum: {memoizedSum}</p>
      <p>Sorted: {JSON.stringify(memoizedSorted)}</p>
      <p>Filtered: {JSON.stringify(memoizedFiltered)}</p>
    </div>
  );
}
```

**3. 使用 useCallback 缓存函数**

```javascript
function Parent() {
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState('');
  const [items] = useState([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Cherry' },
  ]);
  
  // ❌ 没有优化：每次渲染都创建新函数
  const handleClickBad = () => {
    console.log('clicked');
  };
  
  // ✅ 使用 useCallback：函数引用保持不变
  const handleClickGood = useCallback(() => {
    console.log('clicked');
  }, []); // 空依赖数组
  
  // ✅ 有依赖的情况
  const handleFilter = useCallback((text) => {
    setFilter(text);
  }, []);
  
  // ✅ 传递给 memo 组件
  const MemoizedItem = React.memo(({ item, onClick }) => {
    console.log(`Item ${item.id} rendered`);
    return (
      <li onClick={() => onClick(item.id)}>
        {item.name}
      </li>
    );
  });
  
  const handleItemClick = useCallback((id) => {
    console.log('Item clicked:', id);
  }, []);
  
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <input 
        value={filter}
        onChange={(e) => handleFilter(e.target.value)}
        placeholder="Filter..."
      />
      <ul>
        {filteredItems.map(item => (
          <MemoizedItem 
            key={item.id} 
            item={item} 
            onClick={handleItemClick} 
          />
        ))}
      </ul>
    </div>
  );
}
```

**4. 虚拟化长列表**

```javascript
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  // ❌ 渲染所有项（性能差）
  return (
    <ul style={{ height: '400px', overflow: 'auto' }}>
      {items.map(item => (
        <li key={item.id} style={{ height: '50px' }}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}

// ✅ 使用 react-window 虚拟化
function OptimizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );
  
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// 使用示例
function App() {
  const [items] = useState(
    Array(10000).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }))
  );
  
  return <OptimizedList items={items} />;
}
```

**5. 懒加载组件**

```javascript
import { lazy, Suspense } from 'react';

// ❌ 导入时立即加载
import HeavyComponent from './HeavyComponent';

// ✅ 使用 lazy 懒加载
const LazyHeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  const [showHeavy, setShowHeavy] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>
        Show Heavy Component
      </button>
      
      {showHeavy && (
        <Suspense fallback={<div>Loading...</div>}>
          <LazyHeavyComponent />
        </Suspense>
      )}
    </div>
  );
}

// 懒加载路由
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**6. 使用 useTransition 优化用户体验**

```javascript
import { useTransition } from 'react';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  const handleSearch = (value) => {
    // 高优先级更新：立即执行
    setQuery(value);
    
    // 低优先级更新：可中断，不阻塞 UI
    startTransition(() => {
      const filtered = performExpensiveSearch(value);
      setResults(filtered);
    });
  };
  
  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {isPending && <div>Searching...</div>}
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

**7. 使用 key 优化列表渲染**

```javascript
// ❌ 使用索引作为 key（列表会变化时）
function BadList({ items }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}

// ✅ 使用稳定的唯一 ID
function GoodList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}

// 问题场景：插入新项
// 初始: [A, B, C]
// 插入 D: [D, A, B, C]

// 使用索引 key：
// - A 变成 D
// - B 变成 A
// - C 变成 B
// - 创建 C
// 导致不必要的更新

// 使用 ID key：
// - 只插入 D
// - A, B, C 保持不变
// 性能更好
```

### 代码层面的性能优化

**1. 避免内联函数定义**

```javascript
// ❌ 每次渲染都创建新函数
function BadComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <button 
      onClick={() => setCount(c => c + 1)} // 每次渲染都是新函数
    >
      Click
    </button>
  );
}

// ✅ 使用 useCallback 或类方法
function GoodComponent() {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  return <button onClick={handleClick}>Click</button>;
}

// 或者使用 bind（但不推荐）
class Component extends React.Component {
  handleClick = () => {
    this.setState(prev => ({ count: prev.count + 1 }));
  }
  
  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

**2. 避免在渲染时创建对象**

```javascript
// ❌ 每次渲染都创建新对象
function BadComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <Child 
      config={{ theme: 'dark', color: 'red' }} // 每次渲染都是新对象
      style={{ padding: '10px', margin: '5px' }}
    />
  );
}

// ✅ 使用 useMemo 缓存对象
function GoodComponent() {
  const [count, setCount] = useState(0);
  
  const config = useMemo(() => ({
    theme: 'dark',
    color: 'red'
  }), []);
  
  const style = useMemo(() => ({
    padding: '10px',
    margin: '5px'
  }), []);
  
  return <Child config={config} style={style} />;
}
```

**3. 合理使用 shouldComponentUpdate 和 React.PureComponent**

```javascript
// 类组件中使用 React.PureComponent
class MyComponent extends React.PureComponent {
  // 自动实现 shouldComponentUpdate
  // 对 props 和 state 进行浅比较
  
  render() {
    return <div>{this.props.value}</div>;
  }
}

// 手动实现 shouldComponentUpdate
class MyComponent extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // 只在特定条件时更新
    return nextProps.id !== this.props.id ||
           nextProps.value !== this.props.value;
  }
  
  render() {
    return <div>{this.props.value}</div>;
  }
}
```

**4. 避免不必要的状态**

```javascript
// ❌ 从 props 派生的状态
function BadComponent({ user }) {
  const [fullName, setFullName] = useState('');
  
  useEffect(() => {
    setFullName(`${user.firstName} ${user.lastName}`);
  }, [user]);
  
  return <div>{fullName}</div>;
}

// ✅ 直接使用 props 或 useMemo
function GoodComponent({ user }) {
  const fullName = useMemo(
    () => `${user.firstName} ${user.lastName}`,
    [user.firstName, user.lastName]
  );
  
  return <div>{fullName}</div>;
}

// ❌ 冗余的状态
function BadForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    setIsValid(name.length > 0 && email.includes('@'));
  }, [name, email]);
  
  return (
    <form>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button disabled={!isValid}>Submit</button>
    </form>
  );
}

// ✅ 派生值
function GoodForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const isValid = name.length > 0 && email.includes('@');
  
  return (
    <form>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button disabled={!isValid}>Submit</button>
    </form>
  );
}
```

**5. 优化依赖数组**

```javascript
// ❌ 过大的依赖数组
function BadComponent() {
  const [state, setState] = useState({
    user: null,
    posts: [],
    comments: [],
    likes: [],
    settings: {},
    theme: 'light'
  });
  
  useEffect(() => {
    // 任何状态变化都会触发
    console.log('Effect ran');
  }, [state]);
  
  return <div>...</div>;
}

// ✅ 精确的依赖
function GoodComponent() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    // 只有 user 变化时触发
    console.log('User effect ran');
  }, [user]);
  
  useEffect(() => {
    // 只有 posts 变化时触发
    console.log('Posts effect ran');
  }, [posts]);
  
  return <div>...</div>;
}
```

**6. 使用生产环境构建**

```javascript
// 开发环境 vs 生产环境

// 开发环境：
// - 包含额外的警告
// - 包含 React DevTools 集成
// - 未压缩的代码
// - 较大的 bundle 大小

// 生产环境：
// - 移除警告和调试代码
// - 压缩和优化代码
// - 较小的 bundle 大小
// - 更好的性能

// 构建命令
// 开发
npm run dev

// 生产
npm run build
npm run start

// 或者
NODE_ENV=production npm run build
```

### 使用 React DevTools Profiler

```javascript
// React DevTools Profiler 可以帮助识别性能瓶颈

// 1. 安装 React DevTools 浏览器扩展

// 2. 在开发环境使用 Profiler
import { Profiler } from 'react';

function onRenderCallback(
  id, // 组件的 id
  phase, // 'mount' 或 'update'
  actualDuration, // 组件渲染花费的时间（ms）
  baseDuration, // 未使用 memo 时的渲染时间
  startTime, // 渲染开始的时间
  commitTime, // 提交的时间
  interactions // 本次更新涉及的 interactions
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
    <Profiler id="App" onRender={onRenderCallback}>
      <Navigation />
      <Router />
      <Footer />
    </Profiler>
  );
}

// 3. 分析 Profiler 数据
// - 找出渲染时间长的组件
// - 找出不必要渲染的组件
// - 优化热点组件
```

### 性能优化清单

```javascript
// 渲染优化
✓ 使用 React.memo 避免不必要的重渲染
✓ 使用 useMemo 缓存昂贵的计算
✓ 使用 useCallback 缓存函数
✓ 使用虚拟化处理长列表
✓ 懒加载组件和路由
✓ 使用 useTransition 优化用户体验
✓ 使用正确的 key 优化列表

// 代码优化
✓ 避免内联函数定义
✓ 避免在渲染时创建对象
✓ 合理使用 shouldComponentUpdate
✓ 避免不必要的状态
✓ 优化依赖数组
✓ 使用生产环境构建

// 工具
✓ 使用 React DevTools Profiler
✓ 使用 Lighthouse 进行性能审计
✓ 使用 webpack-bundle-analyzer 分析 bundle
```

### 总结

**性能优化的核心原则：**

1. **先测量，再优化** - 使用 Profiler 识别瓶颈
2. **避免不必要的渲染** - React.memo, useMemo, useCallback
3. **减少渲染工作量** - 虚拟化、懒加载、代码分割
4. **优化关键路径** - useTransition, Suspense
5. **代码层面优化** - 避免重复计算和创建对象

**常见的性能陷阱：**

- 过度优化（先测量！）
- 错误使用 useMemo/useCallback
- 忽略 key 的作用
- 不必要的 props 传递
- 过大的组件状态

**最佳实践：**

- 保持组件小而专注
- 使用组合而非继承
- 合理拆分组件
- 利用 React 的自动优化
- 在必要时手动优化

---

## 21、React Suspense 是什么？它解决了什么问题？

### Suspense 概述

**Suspense** 是 React 提供的一种声明式处理异步操作（如数据获取、代码分割）的机制。它允许组件"等待"某些操作完成，并在等待期间显示 fallback UI。

### Suspense 的基本用法

**1. 代码分割（Code Splitting）**

```javascript
import { lazy, Suspense } from 'react';

// 懒加载组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading component...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}

// 路由级别的代码分割
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**2. 数据获取（React 18+）**

```javascript
// 定义数据获取函数
import { Suspense } from 'react';

let cache = new Map();

function fetchUser(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  
  const promise = fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(user => {
      cache.set(id, user);
      return user;
    });
  
  cache.set(id, promise);
  throw promise; // 抛出 Promise 给 Suspense 捕获
}

function UserProfile({ userId }) {
  const user = fetchUser(userId); // 直接调用，不需要 useEffect
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

### Suspense 的工作原理

**1. 抛出 Promise**

```javascript
// Suspense 通过捕获 Promise 来工作
function AsyncComponent() {
  const data = fetchData(); // 返回 Promise 或数据
  
  return <div>{data}</div>;
}

// fetchData 的实现
function fetchData() {
  if (dataCache) {
    return dataCache; // 已有数据，直接返回
  }
  
  const promise = fetch('/api/data').then(res => res.json());
  throw promise; // 抛出 Promise
}

// Suspense 捕获这个 Promise
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```

**2. 渲染流程**

```javascript
// 第一次渲染：
// 1. 渲染 AsyncComponent
// 2. fetchData() 抛出 Promise
// 3. Suspense 捕获 Promise
// 4. 显示 fallback UI

// Promise resolve 后：
// 1. React 重新渲染
// 2. fetchData() 返回数据
// 3. 渲染实际内容
```

### Suspense 的高级用法

**1. 嵌套 Suspense**

```javascript
function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading page...</div>}>
        <Header />
        <Suspense fallback={<div>Loading posts...</div>}>
          <Posts />
        </Suspense>
        <Suspense fallback={<div>Loading comments...</div>}>
          <Comments />
        </Suspense>
        <Footer />
      </Suspense>
    </div>
  );
}

// 每个 Suspense 独立处理其子组件的异步操作
```

**2. SuspenseList（React 18+）**

```javascript
import { Suspense, SuspenseList } from 'react';

function App() {
  return (
    <SuspenseList revealOrder="forwards" tail="hidden">
      <Suspense fallback={<div>Loading post 1...</div>}>
        <Post id={1} />
      </Suspense>
      <Suspense fallback={<div>Loading post 2...</div>}>
        <Post id={2} />
      </Suspense>
      <Suspense fallback={<div>Loading post 3...</div>}>
        <Post id={3} />
      </Suspense>
    </SuspenseList>
  );
}

// revealOrder 选项：
// - 'forwards': 从前到后显示
// - 'backwards': 从后到前显示
// - 'together': 同时显示所有内容

// tail 选项：
// - 'hidden': 隐藏未加载的内容
// - 'collapsed': 显示占位空间
```

**3. 错误边界 + Suspense**

```javascript
import { Suspense } from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({ error });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Error loading content</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

// 结合使用：
// - Suspense 处理加载状态
// - ErrorBoundary 处理错误状态
```

### 使用 React Query 配合 Suspense

```javascript
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';

// 创建 QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true, // 启用 Suspense 模式
    },
  },
});

function UserProfile({ userId }) {
  // useQuery 自动抛出 Promise
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
  });
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading user...</div>}>
        <UserProfile userId={1} />
      </Suspense>
    </QueryClientProvider>
  );
}
```

### 流式渲染（Streaming）

```javascript
// Next.js 13+ App Router 中的 Suspense
import { Suspense } from 'react';

// 顶层布局
export default function Layout({ children }) {
  return (
    <html>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// 页面组件
async function Page() {
  const data = await fetchData();
  
  return (
    <div>
      <h1>{data.title}</h1>
      
      {/* 流式渲染不同部分 */}
      <Suspense fallback={<div>Loading content...</div>}>
        <Content />
      </Suspense>
      
      <Suspense fallback={<div>Loading comments...</div>}>
        <Comments />
      </Suspense>
    </div>
  );
}

// 优点：
// - 页面分块发送
// - 用户逐步看到内容
// - 减少首屏加载时间
```

### Suspense 解决的问题

**1. 声明式异步处理**

```javascript
// ❌ 命令式：使用 loading state
function OldComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(data => {
      setData(data);
      setLoading(false);
    });
  }, []);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return <div>{data}</div>;
}

// ✅ 声明式：使用 Suspense
function NewComponent() {
  const data = fetchData();
  return <div>{data}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewComponent />
    </Suspense>
  );
}
```

**2. 避免 Waterfall 问题**

```javascript
// ❌ Waterfall：串行获取数据
async function OldComponent() {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id); // 等待 user
  const comments = await fetchComments(posts); // 等待 posts
  
  return <div>{/* ... */}</div>;
}

// ✅ 并行获取
function NewComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserComponent />
      <PostsComponent />
      <CommentsComponent />
    </Suspense>
  );
}

// 每个组件独立获取数据
function UserComponent() {
  const user = fetchUser();
  return <div>{user.name}</div>;
}

function PostsComponent() {
  const posts = fetchPosts();
  return <div>{posts.map(p => p.title)}</div>;
}
```

**3. 更好的代码组织**

```javascript
// ❌ 混合了 UI 和数据逻辑
function OldComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <Loading />;
  if (error) return <Error error={error} />;
  
  return <div>{data}</div>;
}

// ✅ 关注点分离
function NewComponent() {
  const data = fetchData();
  return <div>{data}</div>;
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <NewComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Suspense 的最佳实践

**1. 合理的 fallback**

```javascript
// ❌ 太简单的 fallback
<Suspense fallback={<div>Loading...</div>}>
  <Component />
</Suspense>

// ✅ 提供有意义的反馈
<Suspense fallback={
  <div className="loading-container">
    <Spinner />
    <p>Loading your data...</p>
  </div>
}>
  <Component />
</Suspense>

// ✅ 骨架屏
<Suspense fallback={
  <div className="skeleton">
    <div className="skeleton-header" />
    <div className="skeleton-body" />
  </div>
}>
  <Component />
</Suspense>
```

**2. 错误处理**

```javascript
// 总是配合 ErrorBoundary 使用
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<LoadingFallback />}>
    <AsyncComponent />
  </Suspense>
</ErrorBoundary>
```

**3. 性能考虑**

```javascript
// 避免过深的嵌套 Suspense
<Suspense fallback={<div>Loading outer...</div>}>
  <Outer>
    <Suspense fallback={<div>Loading inner...</div>}>
      <Inner />
    </Suspense>
  </Outer>
</Suspense>

// 考虑合并或调整结构
```

### Suspense 的限制

```javascript
// 1. 不能在事件处理函数中使用 Suspense
function handleClick() {
  // ❌ 事件处理中的 Suspense 不工作
  const data = fetchData();
  console.log(data);
}

// 2. 需要特殊的数据获取库
// 原生 fetch 需要包装才能与 Suspense 配合
// 推荐使用 React Query、SWR、Relay 等

// 3. 服务端渲染需要特殊处理
// 需要等待所有数据获取完成才能发送 HTML
```

### 总结

**Suspense 的核心价值：**

1. **声明式异步处理** - 更简洁的代码
2. **避免 Waterfall** - 并行数据获取
3. **更好的用户体验** - 流式渲染、渐进加载
4. **关注点分离** - UI 和数据逻辑分离

**适用场景：**

- 代码分割和懒加载
- 数据获取（配合 React Query 等）
- 流式渲染
- 复杂的异步 UI

**最佳实践：**

- 配合 ErrorBoundary 使用
- 提供有意义的 fallback
- 合理使用 SuspenseList
- 避免过深的嵌套
- 考虑使用成熟的数据获取库

---

## 22、React中如何实现组件通信？有哪些方式？

### 1. 父子组件通信（Props）

**父传子：**

```javascript
// 父组件
function Parent() {
  const message = "Hello from parent";
  const count = 42;
  
  return (
    <Child message={message} count={count} />
  );
}

// 子组件
function Child({ message, count }) {
  return (
    <div>
      <p>{message}</p>
      <p>Count: {count}</p>
    </div>
  );
}
```

**子传父（回调函数）：**

```javascript
// 父组件
function Parent() {
  const [count, setCount] = useState(0);
  
  const handleIncrement = (amount) => {
    setCount(prev => prev + amount);
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <Child onIncrement={handleIncrement} />
    </div>
  );
}

// 子组件
function Child({ onIncrement }) {
  return (
    <div>
      <button onClick={() => onIncrement(1)}>+1</button>
      <button onClick={() => onIncrement(5)}>+5</button>
    </div>
  );
}
```

**双向绑定（受控组件）：**

```javascript
function Parent() {
  const [value, setValue] = useState('');
  
  const handleChange = (newValue) => {
    setValue(newValue);
  };
  
  return (
    <div>
      <Child value={value} onChange={handleChange} />
      <p>You typed: {value}</p>
    </div>
  );
}

function Child({ value, onChange }) {
  return (
    <input 
      type="text" 
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
```

### 2. Context API（跨层级通信）

**基本用法：**

```javascript
// 创建 Context
const ThemeContext = createContext();

// Provider 组件
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 消费 Context
function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  return (
    <button 
      style={{ 
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333'
      }}
      onClick={toggleTheme}
    >
      Toggle Theme
    </button>
  );
}

// 使用
function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}
```

**多个 Context：**

```javascript
const UserContext = createContext();
const ThemeContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Component />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

function Component() {
  const { user } = useContext(UserContext);
  const { theme } = useContext(ThemeContext);
  
  return <div>User: {user?.name}, Theme: {theme}</div>;
}
```

### 3. Ref 通信

**forwardRef：**

```javascript
import { forwardRef, useRef, useImperativeHandle } from 'react';

const ChildComponent = forwardRef((props, ref) => {
  const inputRef = useRef();
  
  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    getValue: () => {
      return inputRef.current?.value;
    },
    clear: () => {
      inputRef.current.value = '';
    }
  }));
  
  return (
    <input 
      ref={inputRef}
      type="text"
      placeholder="Child component input"
    />
  );
});

// 使用
function ParentComponent() {
  const childRef = useRef();
  
  const handleFocus = () => {
    childRef.current?.focus();
  };
  
  const handleGetValue = () => {
    const value = childRef.current?.getValue();
    console.log('Value:', value);
  };
  
  return (
    <div>
      <ChildComponent ref={childRef} />
      <button onClick={handleFocus}>Focus Child Input</button>
      <button onClick={handleGetValue}>Get Value</button>
    </div>
  );
}
```

### 4. 状态管理库

**Redux Toolkit：**

```javascript
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

// 创建 slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
  },
});

// 创建 store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

// 组件中使用
function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>
        +
      </button>
      <button onClick={() => dispatch(counterSlice.actions.decrement())}>
        -
      </button>
    </div>
  );
}

// 包装应用
function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}
```

**Zustand：**

```javascript
import create from 'zustand';

// 创建 store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// 使用
function Counter() {
  const { count, increment, decrement, reset } = useStore();
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### 5. 自定义事件（Event Bus）

```javascript
// 创建简单的 EventEmitter
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }
  
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(data));
  }
}

const eventBus = new EventEmitter();

// 组件 A - 发送事件
function ComponentA() {
  const handleClick = () => {
    eventBus.emit('user-action', { type: 'click', timestamp: Date.now() });
  };
  
  return <button onClick={handleClick}>Trigger Event</button>;
}

// 组件 B - 监听事件
function ComponentB() {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    const handleUserAction = (data) => {
      setEvents(prev => [...prev, data]);
    };
    
    eventBus.on('user-action', handleUserAction);
    
    return () => {
      eventBus.off('user-action', handleUserAction);
    };
  }, []);
  
  return (
    <div>
      <h3>Event Log:</h3>
      <ul>
        {events.map((event, index) => (
          <li key={index}>
            {event.type} at {new Date(event.timestamp).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  return (
    <div>
      <ComponentA />
      <ComponentB />
    </div>
  );
}
```

### 6. Portal 通信

```javascript
import { createPortal } from 'react-dom';

// Modal 组件
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  );
}

// 使用
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  
  const openModal = (data) => {
    setModalData(data);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };
  
  return (
    <div>
      <button onClick={() => openModal({ message: 'Hello' })}>
        Open Modal
      </button>
      
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalData && <p>{modalData.message}</p>}
      </Modal>
    </div>
  );
}
```

### 7. URL 参数

```javascript
import { useSearchParams, useLocation } from 'react-router-dom';

// 设置 URL 参数
function SetParamsComponent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const setQuery = (key, value) => {
    searchParams.set(key, value);
    navigate({ search: searchParams.toString() });
  };
  
  return (
    <div>
      <input 
        onChange={(e) => setQuery('q', e.target.value)}
        placeholder="Search..."
      />
      <input 
        onChange={(e) => setQuery('page', e.target.value)}
        placeholder="Page..."
      />
    </div>
  );
}

// 读取 URL 参数
function GetParamsComponent() {
  const [searchParams] = useSearchParams();
  
  const query = searchParams.get('q') || '';
  const page = searchParams.get('page') || '1';
  
  return (
    <div>
      <p>Query: {query}</p>
      <p>Page: {page}</p>
    </div>
  );
}

// 监听 URL 变化
function WatchParamsComponent() {
  const location = useLocation();
  
  useEffect(() => {
    console.log('URL changed:', location.search);
  }, [location]);
  
  return <div>Current URL: {location.search}</div>;
}
```

### 8. 通信方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **Props** | 父子组件 | 简单直接 | 层级深时繁琐（prop drilling） |
| **Context** | 跨层级 | 避免层级传递 | 可能导致不必要的重渲染 |
| **Redux/Zustand** | 复杂状态 | 集中管理，易调试 | 学习曲线，增加复杂度 |
| **Ref** | 访问子组件方法 | 直接操作 | 破坏组件封装性 |
| **Event Bus** | 解耦组件 | 松耦合 | 难以追踪事件流 |
| **URL** | 可分享状态 | 可直接链接 | 参数有限，不够灵活 |
| **Portal** | 跨层级渲染 | 避免样式冲突 | 事件冒泡需要注意 |

### 通信方式选择指南

```
场景选择：
├── 父子组件通信
│   ├── 简单数据 → Props
│   └── 子组件需要调用父方法 → 回调函数
├── 跨层级通信
│   ├── 状态共享 → Context / Zustand
│   └── 复杂应用 → Redux Toolkit
├── 不相关组件通信
│   ├── 松耦合需求 → Event Bus
│   └── 需要持久化 → URL / LocalStorage
├── 访问子组件方法
│   └── 直接操作 → Ref
└── 特殊渲染需求
    └── DOM 层级独立 → Portal
```

### 最佳实践

```javascript
// 1. 优先使用 Props 和 Context
// Props 用于直接父子关系
// Context 用于跨层级共享

// 2. 复杂应用使用状态管理库
// 大型应用 → Redux Toolkit
// 中型应用 → Zustand / Jotai

// 3. 避免过度设计
// 简单场景不需要引入 Redux
// Props 和 Context 足够应对大多数情况

// 4. 保持组件的单一职责
// 组件只负责自己的渲染
// 数据逻辑通过 hooks 抽离

// 5. 使用 TypeScript 增强类型安全
// 明确定义 props 和 context 的类型
```

---

## 23、React中如何做错误处理？错误边界的使用场景？

### React 错误处理机制

**错误边界（Error Boundary）** 是 React 组件，可以捕获其子组件树中任何位置的 JavaScript 错误，记录这些错误，并显示备用 UI。

### 错误边界的基本用法

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // 捕获子组件抛出的错误
  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  // 记录错误信息
  componentDidCatch(error, errorInfo) {
    // 可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      return this.props.fallback || (
        <div className="error-fallback">
          <h1>Something went wrong.</h1>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.toString()}</pre>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 函数组件的错误边界

```javascript
import { ComponentType, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// 函数组件风格的错误边界包装器
function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return class ErrorBoundary extends React.Component<ErrorBoundaryProps & P, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps & P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      if (onError) {
        onError(error, errorInfo);
      } else {
        console.error('Error:', error, errorInfo);
      }
    }

    render() {
      if (this.state.hasError) {
        return fallback || <div>Something went wrong</div>;
      }

      const { fallback: _, onError: __, ...props } = this.props;
      return <Component {...(props as P)} />;
    }
  };
}

// 使用
const SafeComponent = withErrorBoundary(
  MyComponent,
  <div>Error occurred</div>,
  (error, errorInfo) => {
    logError(error, errorInfo);
  }
);
```

### 错误边界的使用场景

**1. 组件级别的错误边界**

```javascript
function App() {
  return (
    <div>
      <Header />
      
      <ErrorBoundary fallback={<div>Dashboard unavailable</div>}>
        <Dashboard />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<div>Sidebar unavailable</div>}>
        <Sidebar />
      </ErrorBoundary>
      
      <Footer />
    </div>
  );
}

// 每个关键部分都有自己的错误边界
// 一个组件出错不会影响整个应用
```

**2. 路由级别的错误边界**

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ErrorBoundary fallback={<div>Home error</div>}>
              <HomePage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ErrorBoundary fallback={<div>Dashboard error</div>}>
              <DashboardPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/settings"
          element={
            <ErrorBoundary fallback={<div>Settings error</div>}>
              <SettingsPage />
            </ErrorBoundary>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// 每个路由独立的错误处理
```

**3. 第三方组件的错误边界**

```javascript
function App() {
  return (
    <div>
      <ErrorBoundary fallback={<div>Chart failed to load</div>}>
        <ThirdPartyChart data={chartData} />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<div>Map failed to load</div>}>
        <ThirdPartyMap location={location} />
      </ErrorBoundary>
    </div>
  );
}

// 保护不受信任的第三方组件
```

### 错误边界捕获的限制

**错误边界无法捕获：**

```javascript
// 1. 事件处理器中的错误
function handleClick() {
  try {
    // ❌ Error Boundary 无法捕获
    throw new Error('Handler error');
  } catch (error) {
    console.error(error);
  }
}

// 2. 异步代码中的错误
function Component() {
  useEffect(() => {
    // ❌ Error Boundary 无法捕获
    fetchData().catch(error => {
      console.error('Async error:', error);
    });
  }, []);
}

// 3. 服务端渲染的错误
// SSR 的错误需要在服务端处理

// 4. 错误边界本身的错误
```

### 错误上报

```javascript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    // 上报到错误监控服务
    this.reportError(errorData);
  }
  
  async reportError(errorData) {
    try {
      // 上报到 Sentry
      Sentry.captureException(errorData);
      
      // 或上报到自己的服务器
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      });
      
      // 或上报到其他服务（Bugsnag, LogRocket 等）
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  }
}
```

### 全局错误处理

```javascript
// 1. 未捕获的 Promise rejection
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // 上报错误
  reportError({
    type: 'unhandledrejection',
    reason: event.reason,
  });
});

// 2. 全局 JavaScript 错误
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // 上报错误
  reportError({
    type: 'error',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

// 3. React 错误边界
<ErrorBoundary
  onError={(error, errorInfo) => {
    reportError({
      type: 'react-error',
      error,
      componentStack: errorInfo.componentStack,
    });
  }}
>
  <App />
</ErrorBoundary>
```

### 恢复策略

```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          
          <div className="error-actions">
            <button onClick={this.handleReset}>
              Try Again
            </button>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
            <button onClick={() => window.history.back()}>
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 测试错误边界

```javascript
import { render, screen } from '@testing-library/react';

// 测试错误边界
it('renders fallback UI when child throws error', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  render(
    <ErrorBoundary fallback={<div>Error fallback</div>}>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText('Error fallback')).toBeInTheDocument();
});

it('renders children when no error occurs', () => {
  render(
    <ErrorBoundary fallback={<div>Error fallback</div>}>
      <div>Normal content</div>
    </ErrorBoundary>
  );
  
  expect(screen.getByText('Normal content')).toBeInTheDocument();
});
```

### 错误边界最佳实践

```javascript
// 1. 分层错误边界
// 顶层错误边界 - 整个应用的最后防线
// 模块级错误边界 - 保护关键功能模块
// 组件级错误边界 - 保护不稳定的第三方组件

function App() {
  return (
    <GlobalErrorBoundary>
      <AppLayout />
    </GlobalErrorBoundary>
  );
}

function AppLayout() {
  return (
    <div>
      <Header />
      <main>
        <ModuleErrorBoundary>
          <Dashboard />
        </ModuleErrorBoundary>
        <ModuleErrorBoundary>
          <Sidebar />
        </ModuleErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

// 2. 友好的错误 UI
// 提供清晰的错误信息
// 提供恢复选项
// 保持品牌一致性

// 3. 错误上报
// 记录详细的错误信息
// 包括用户上下文
// 实时监控和告警

// 4. 测试
// 测试错误边界是否正确捕获错误
// 测试 fallback UI 是否正确显示
// 测试恢复功能是否正常
```

### 总结

**错误边界的核心价值：**

1. **防止白屏** - 显示友好的错误 UI
2. **错误隔离** - 一个组件出错不影响整个应用
3. **错误上报** - 集中处理和上报错误
4. **用户体验** - 提供恢复选项

**使用场景：**

- 第三方组件
- 复杂的业务模块
- 不稳定的网络请求
- 关键功能的保护

**限制：**

- 不能捕获事件处理器中的错误
- 不能捕获异步代码中的错误
- 不能用于函数组件（只能类组件）
- SSR 中需要特殊处理

---

## 24、React中如何实现动画？有哪些库可以使用？

### CSS 动画

**1. CSS Transitions**

```javascript
import './App.css';

// App.css
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// 组件使用
function FadeInComponent() {
  const [visible, setVisible] = useState(true);
  
  return (
    <div>
      {visible && <div className="fade-in">Hello World</div>}
      <button onClick={() => setVisible(!visible)}>
        Toggle
      </button>
    </div>
  );
}
```

**2. 条件类名**

```javascript
function AnimatedComponent() {
  const [isActive, setIsActive] = useState(false);
  
  return (
    <div
      className={`box ${isActive ? 'active' : ''}`}
      onClick={() => setIsActive(!isActive)}
    >
      Click me
    </div>
  );
}

// CSS
.box {
  transition: all 0.3s ease;
  background-color: blue;
}

.box.active {
  background-color: red;
  transform: scale(1.1);
}
```

### Framer Motion

**基础动画：**

```javascript
import { motion } from 'framer-motion';

function BasicAnimation() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        Click me
      </motion.button>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          Hello World
        </motion.div>
      )}
    </div>
  );
}
```

**AnimatePresence（动画进入/离开）：**

```javascript
import { motion, AnimatePresence } from 'framer-motion';

function Modal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <h2>Modal Title</h2>
            <p>Modal content</p>
            <button onClick={onClose}>Close</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**列表动画：**

```javascript
import { motion, AnimatePresence } from 'framer-motion';

function TodoList({ items, onDelete }) {
  return (
    <motion.ul layout>
      <AnimatePresence>
        {items.map(item => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {item.text}
            <button onClick={() => onDelete(item.id)}>Delete</button>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
```

**手势动画：**

```javascript
import { motion, useMotionValue, useTransform } from 'framer-motion';

function DraggableCard() {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);
  
  return (
    <motion.div
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: -200, right: 200 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <h3>Drag me</h3>
    </motion.div>
  );
}
```

### React Spring

**基础动画：**

```javascript
import { useSpring, animated } from '@react-spring/web';

function AnimatedComponent() {
  const [isToggled, setToggle] = useState(false);
  
  const styles = useSpring({
    opacity: isToggled ? 1 : 0,
    transform: isToggled ? 'scale(1)' : 'scale(0.5)',
    config: { tension: 300, friction: 10 }
  });
  
  return (
    <div>
      <animated.div style={styles}>
        Hello World
      </animated.div>
      <button onClick={() => setToggle(!isToggled)}>
        Toggle
      </button>
    </div>
  );
}
```

**链式动画：**

```javascript
import { useSpring, animated, useChain, useSpringRef } from '@react-spring/web';

function ChainAnimation() {
  const spring1Ref = useSpringRef();
  const spring2Ref = useSpringRef();
  
  const spring1 = useSpring({
    ref: spring1Ref,
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
  });
  
  const spring2 = useSpring({
    ref: spring2Ref,
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
  });
  
  // 链式执行：spring1 → spring2
  useChain([spring1Ref, spring2Ref]);
  
  return (
    <div>
      <animated.div style={spring1}>First</animated.div>
      <animated.div style={spring2}>Second</animated.div>
    </div>
  );
}
```

### React Transition Group

**基础过渡：**

```javascript
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './App.css';

function AnimatedList({ items }) {
  return (
    <TransitionGroup>
      {items.map(item => (
        <CSSTransition
          key={item.id}
          timeout={300}
          classNames="item"
          unmountOnExit
        >
          <div className="item">{item.text}</div>
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
}

// App.css
.item-enter {
  opacity: 0;
  transform: translateX(-20px);
}

.item-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 300ms;
}

.item-exit {
  opacity: 1;
  transform: translateX(0);
}

.item-exit-active {
  opacity: 0;
  transform: translateX(20px);
  transition: all 300ms;
}
```

### 动画库对比

| 库 | 特点 | 适用场景 | Bundle Size |
|-----|------|---------|-------------|
| **Framer Motion** | API 简单，功能强大 | 复杂动画、手势交互 | ~40KB |
| **React Spring** | 物理动画，性能好 | 流畅的过渡动画 | ~25KB |
| **React Transition Group** | 轻量级，CSS 动画 | 简单的进入/离开动画 | ~5KB |
| **React Motion** | 函数式动画 | 可预测的动画 | ~16KB |
| **GSAP** | 强大的时间轴 | 复杂的序列动画 | ~60KB |

### 最佳实践

```javascript
// 1. 使用 requestAnimationFrame
function smoothAnimation() {
  let startTime = null;
  
  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    const progress = (currentTime - startTime) / duration;
    
    if (progress < 1) {
      const value = ease(progress);
      updateElement(value);
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

// 2. 使用 CSS transform 和 opacity
// 这两个属性不会触发重排，性能最好
function PerformanceOptimized() {
  return (
    <div
      style={{
        transform: 'translateX(100px)',
        opacity: 0.5,
        // 避免：left, top, width, height
      }}
    />
  );
}

// 3. 使用 will-change 提示浏览器
.high-performance-element {
  will-change: transform, opacity;
}

// 4. 减少动画元素数量
// 只对可见元素应用动画
// 使用虚拟化处理长列表
```

### 总结

**选择建议：**

- **简单动画** - CSS Transitions/Animations
- **复杂动画** - Framer Motion
- **物理效果** - React Spring
- **轻量级** - React Transition Group
- **时间轴控制** - GSAP

**性能优化：**

- 使用 transform 和 opacity
- 避免同时动画多个元素
- 使用 requestAnimationFrame
- 减少重排和重绘
- 使用硬件加速

---

## 25、React中如何实现表单处理？受控组件和非受控组件的区别？

### 受控组件

**基本用法：**

```javascript
function ControlledForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // 发送数据到服务器
    submitForm(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Username:</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

**表单验证：**

```javascript
function ValidatedForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (values) => {
    const errors = {};
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 实时验证
    const newErrors = validate({ ...formData, [name]: value });
    setErrors(newErrors);
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 标记所有字段为已触碰
    const newTouched = {};
    Object.keys(formData).forEach(key => {
      newTouched[key] = true;
    });
    setTouched(newTouched);
    
    // 验证所有字段
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    
    // 如果没有错误，提交表单
    if (Object.keys(validationErrors).length === 0) {
      submitForm(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {touched.email && errors.email && (
          <span className="error">{errors.email}</span>
        )}
      </div>
      
      <div>
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {touched.password && errors.password && (
          <span className="error">{errors.password}</span>
        )}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

**使用自定义 Hook：**

```javascript
function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const validationErrors = validate({ ...values, [name]: value });
      setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
    }
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  const handleSubmit = (callback) => (e) => {
    e.preventDefault();
    
    // 标记所有字段为已触碰
    const newTouched = {};
    Object.keys(values).forEach(key => {
      newTouched[key] = true;
    });
    setTouched(newTouched);
    
    // 验证所有字段
    const validationErrors = validate(values);
    setErrors(validationErrors);
    
    // 如果没有错误，执行回调
    if (Object.keys(validationErrors).length === 0) {
      callback(values);
    }
  };
  
  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}

// 使用
function LoginForm() {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    { email: '', password: '' },
    (values) => {
      const errors = {};
      if (!values.email) errors.email = 'Email is required';
      if (!values.password) errors.password = 'Password is required';
      return errors;
    }
  );
  
  const onSubmit = (formData) => {
    console.log('Submitting:', formData);
    api.login(formData);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {touched.email && errors.email && (
        <span className="error">{errors.email}</span>
      )}
      
      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {touched.password && errors.password && (
        <span className="error">{errors.password}</span>
      )}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### 非受控组件

**使用 useRef：**

```javascript
function UncontrolledForm() {
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = {
      username: usernameRef.current.value,
      email: emailRef.current.value,
      password: passwordRef.current.value,
    };
    
    console.log('Form submitted:', formData);
    submitForm(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Username:</label>
        <input
          type="text"
          name="username"
          ref={usernameRef}
          defaultValue=""
        />
      </div>
      
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          ref={emailRef}
          defaultValue=""
        />
      </div>
      
      <div>
        <label>Password:</label>
        <input
          type="password"
          name="password"
          ref={passwordRef}
          defaultValue=""
        />
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

**使用 FormData：**

```javascript
function FormDataForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 使用 FormData API 获取表单数据
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    console.log('Form data:', data);
    submitForm(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="username" />
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 受控 vs 非受控组件

| 特性 | 受控组件 | 非受控组件 |
|------|---------|-----------|
| **数据源** | React state | DOM ref |
| **值控制** | 完全控制 | 默认值 |
| **实时验证** | 容易 | 困难 |
| **代码量** | 较多 | 较少 |
| **适用场景** | 复杂表单、实时验证 | 简单表单、一次性提交 |

### 表单库推荐

**React Hook Form：**

```javascript
import { useForm } from 'react-hook-form';

function ReactHookFormExample() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  
  const onSubmit = (data) => {
    console.log('Form data:', data);
    api.submit(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: 'Email is invalid',
            },
          })}
        />
        {errors.email && (
          <span className="error">{errors.email.message}</span>
        )}
      </div>
      
      <div>
        <label>Password:</label>
        <input
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
        />
        {errors.password && (
          <span className="error">{errors.password.message}</span>
        )}
      </div>
      
      <button type="submit">Submit</button>
      <button type="button" onClick={() => reset()}>
        Reset
      </button>
    </form>
  );
}
```

**Formik：**

```javascript
import { Formik, Form, Field, ErrorMessage } from 'formik';

function FormikExample() {
  const initialValues = {
    email: '',
    password: '',
  };
  
  const validate = (values) => {
    const errors = {};
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!values.password) {
      errors.password = 'Password is required';
    }
    
    return errors;
  };
  
  const handleSubmit = (values, { setSubmitting }) => {
    setTimeout(() => {
      console.log('Form data:', values);
      setSubmitting(false);
    }, 400);
  };
  
  return (
    <Formik
      initialValues={initialValues}
      validate={validate}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
        <Form>
          <div>
            <label>Email:</label>
            <Field type="email" name="email" />
            <ErrorMessage name="email" component="div" className="error" />
          </div>
          
          <div>
            <label>Password:</label>
            <Field type="password" name="password" />
            <ErrorMessage name="password" component="div" className="error" />
          </div>
          
          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

### 最佳实践

```javascript
// 1. 选择合适的方式
// - 简单表单 → 非受控组件
// - 复杂表单 → 受控组件
// - 大型表单 → 使用表单库

// 2. 实时验证
// - 提供即时反馈
// - 使用 debounce 优化性能

// 3. 良好的用户体验
// - 清晰的错误提示
// - 合理的默认值
// - 表单重置功能

// 4. 可访问性
// - 使用 label 关联 input
// - 正确的 type 属性
// - 键盘导航支持

// 5. 安全性
// - 验证用户输入
// - 防止 XSS 攻击
// - HTTPS 提交敏感数据
```

### 总结

**选择指南：**

- **受控组件** - 需要实时验证、复杂表单
- **非受控组件** - 简单表单、一次性提交
- **表单库** - 大型表单、需要高级功能

**最佳实践：**

- 合理使用受控和非受控
- 提供良好的用户反馈
- 注意表单的可访问性
- 考虑安全性问题
- 根据场景选择合适的方案

---

## 26、React中如何做国际化（i18n）？常用的库有哪些？

### 基本的国际化实现

**自定义实现：**

```javascript
// 1. 创建翻译字典
const translations = {
  en: {
    welcome: 'Welcome',
    hello: 'Hello, {name}!',
    login: 'Login',
    logout: 'Logout',
  },
  zh: {
    welcome: '欢迎',
    hello: '你好，{name}！',
    login: '登录',
    logout: '退出',
  },
};

// 2. 创建 Context
const I18nContext = createContext();

function I18nProvider({ children }) {
  const [locale, setLocale] = useState('zh');
  const [translations, setTranslations] = useState(translations[locale]);
  
  const changeLocale = (newLocale) => {
    setLocale(newLocale);
    setTranslations(translations[newLocale]);
  };
  
  const t = (key, params = {}) => {
    let text = translations[key] || key;
    
    // 替换参数
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  };
  
  return (
    <I18nContext.Provider value={{ locale, t, changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

// 3. 使用
function Welcome() {
  const { t } = useContext(I18nContext);
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('hello', { name: 'John' })}</p>
    </div>
  );
}

function LanguageSwitcher() {
  const { locale, changeLocale } = useContext(I18nContext);
  
  return (
    <div>
      <button 
        onClick={() => changeLocale('en')}
        disabled={locale === 'en'}
      >
        English
      </button>
      <button 
        onClick={() => changeLocale('zh')}
        disabled={locale === 'zh'}
      >
        中文
      </button>
    </div>
  );
}
```

### react-i18next

**配置：**

```javascript
// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          welcome: 'Welcome',
          hello: 'Hello, {{name}}!',
        },
      },
      zh: {
        translation: {
          welcome: '欢迎',
          hello: '你好，{{name}}！',
        },
      },
    },
    lng: 'zh',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**使用：**

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('hello', { name: 'John' })}</p>
      
      <div>
        <button onClick={() => changeLanguage('en')}>
          English
        </button>
        <button onClick={() => changeLanguage('zh')}>
          中文
        </button>
      </div>
    </div>
  );
}

// 使用命名空间
i18n.init({
  resources: {
    en: {
      common: {
        welcome: 'Welcome',
      },
      about: {
        title: 'About Us',
      },
    },
  },
});

function AboutPage() {
  const { t } = useTranslation('about');
  
  return <h1>{t('title')}</h1>;
}
```

**懒加载翻译：**

```javascript
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  // 懒加载翻译文件
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
});

// 动态加载语言包
const loadLanguage = async (lng) => {
  const translations = await import(`./locales/${lng}.json`);
  i18n.addResourceBundle(lng, 'translation', translations);
  await i18n.changeLanguage(lng);
};
```

### formatjs (React Intl)

**配置：**

```javascript
import { IntlProvider } from 'react-intl';
import English from './locales/en.json';
import Chinese from './locales/zh.json';

const messages = {
  en: English,
  zh: Chinese,
};

function App() {
  const [locale, setLocale] = useState('zh');
  
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <MyComponent />
    </IntlProvider>
  );
}
```

**使用：**

```javascript
import { FormattedMessage, FormattedNumber, FormattedDate } from 'react-intl';

function MyComponent() {
  return (
    <div>
      {/* 简单文本 */}
      <FormattedMessage
        id="welcome"
        defaultMessage="Welcome"
      />
      
      {/* 带参数的文本 */}
      <FormattedMessage
        id="hello"
        defaultMessage="Hello, {name}!"
        values={{ name: 'John' }}
      />
      
      {/* 数字格式化 */}
      <FormattedNumber
        value={1234.56}
        style="currency"
        currency="USD"
      />
      
      {/* 日期格式化 */}
      <FormattedDate
        value={new Date()}
        year="numeric"
        month="long"
        day="numeric"
      />
    </div>
  );
}

// 使用 useIntl hook
import { useIntl } from 'react-intl';

function MyComponent() {
  const intl = useIntl();
  
  return (
    <div>
      {intl.formatMessage({
        id: 'welcome',
        defaultMessage: 'Welcome',
      })}
    </div>
  );
}
```

### 国际化库对比

| 库 | 特点 | 优点 | 缺点 |
|-----|------|------|------|
| **react-i18next** | 功能强大 | 插件丰富、懒加载 | 配置复杂 |
| **react-intl** | 官方推荐 | 格式化功能强大 | 学习曲线 |
| **自定义实现** | 简单灵活 | 轻量级 | 功能有限 |

### 最佳实践

```javascript
// 1. 翻译文件分离
// locales/en.json
{
  "common": {
    "welcome": "Welcome",
    "login": "Login"
  },
  "dashboard": {
    "title": "Dashboard",
    "stats": "Statistics"
  }
}

// 2. 使用命名空间
// 避免命名冲突
// 便于管理大型项目

// 3. 提供默认值
// 翻译缺失时显示默认值
// 避免显示 key

// 4. 复数形式
{
  "item": "One item",
  "item_other": "{{count}} items"
}

// 5. 日期和数字格式化
// 根据语言环境自动格式化
// 使用内置的格式化功能
```

### 总结

**选择建议：**

- **小型项目** - 自定义实现
- **中型项目** - react-i18next
- **大型项目** - react-intl

**最佳实践：**

- 分离翻译文件
- 使用命名空间
- 提供默认值
- 支持复数形式
- 格式化日期和数字

---

## 27、React中如何做单元测试和集成测试？

### Jest + React Testing Library

**基本设置：**

```javascript
// MyComponent.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  test('renders heading', () => {
    render(<MyComponent />);
    const heading = screen.getByRole('heading', { name: /hello/i });
    expect(heading).toBeInTheDocument();
  });
  
  test('button click changes text', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    expect(screen.getByText(/clicked/i)).toBeInTheDocument();
  });
});
```

**测试用户交互：**

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Counter from './Counter';

describe('Counter', () => {
  test('increments count on button click', () => {
    render(<Counter />);
    const button = screen.getByRole('button', { name: /increment/i });
    const count = screen.getByTestId('count');
    
    expect(count).toHaveTextContent('0');
    
    fireEvent.click(button);
    expect(count).toHaveTextContent('1');
    
    fireEvent.click(button);
    expect(count).toHaveTextContent('2');
  });
  
  test('async operation updates UI', async () => {
    render(<Counter />);
    const loadButton = screen.getByRole('button', { name: /load/i });
    
    fireEvent.click(loadButton);
    
    // 等待异步操作完成
    await waitFor(() => {
      expect(screen.getByText(/loaded/i)).toBeInTheDocument();
    });
  });
});
```

**测试异步组件：**

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import UserProfile from './UserProfile';
import { getUser } from './api';

// Mock API
jest.mock('./api');

describe('UserProfile', () => {
  test('displays user data', async () => {
    const mockUser = { id: 1, name: 'John Doe' };
    getUser.mockResolvedValue(mockUser);
    
    render(<UserProfile userId={1} />);
    
    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
  });
  
  test('displays loading state', () => {
    getUser.mockImplementation(() => new Promise(() => {}));
    
    render(<UserProfile userId={1} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### 测试 Hooks

```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import useCounter from './useCounter';
import useUserData from './useUserData';

describe('useCounter', () => {
  test('increments count', () => {
    const { result } = renderHook(() => useCounter());
    
    expect(result.current.count).toBe(0);
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});

describe('useUserData', () => {
  test('fetches and returns user data', async () => {
    const mockUser = { id: 1, name: 'John' };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockUser),
      })
    );
    
    const { result } = renderHook(() => useUserData(1));
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });
});
```

### 测试 Redux

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Counter from './Counter';
import counterReducer from './counterSlice';

function createTestStore() {
  return configureStore({
    reducer: {
      counter: counterReducer,
    },
  });
}

describe('Counter with Redux', () => {
  test('renders count from store', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <Counter />
      </Provider>
    );
    
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
  
  test('dispatches increment action', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <Counter />
      </Provider>
    );
    
    const button = screen.getByRole('button', { name: /increment/i });
    fireEvent.click(button);
    
    expect(store.getState().counter.value).toBe(1);
  });
});
```

### 测试 React Router

```javascript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

describe('App routing', () => {
  test('renders home page', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/home page/i)).toBeInTheDocument();
  });
  
  test('navigates to about page', () => {
    render(
      <BrowserRouter initialEntries={['/about']}>
        <App />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/about us/i)).toBeInTheDocument();
  });
});
```

### 测试最佳实践

```javascript
// 1. 测试用户行为，不是实现细节
// ✓ good: 用户点击按钮，文本改变
// ✗ bad: state 从 0 变为 1

// 2. 使用可访问性选择器
// ✓ good: getByRole('button')
// ✗ bad: getByClassName('btn')

// 3. 避免测试第三方库
// 不要测试 React Router、Redux 等库的功能

// 4. 使用快照测试谨慎
// ✓ good: UI 组件的快照
// ✗ bad: 业务逻辑的快照

// 5. Mock 外部依赖
// API、浏览器 API 等
```

### 测试覆盖率

```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}

// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 总结

**测试工具：**

- **单元测试** - Jest
- **组件测试** - React Testing Library
- **E2E 测试** - Cypress, Playwright

**测试策略：**

- 测试用户行为
- 使用可访问性选择器
- Mock 外部依赖
- 保持测试简单
- 设置合理的覆盖率目标

---

## 28、React项目如何进行代码分割和懒加载？

### 动态导入（Dynamic Imports）

**基础用法：**

```javascript
import { lazy, Suspense } from 'react';

// 懒加载组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading component...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}
```

**路由懒加载：**

```javascript
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**条件懒加载：**

```javascript
import { lazy, Suspense, useState } from 'react';

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

### Webpack 代码分割

**按路由分割：**

```javascript
// 每个路由自动分割为单独的 chunk
const routes = [
  {
    path: '/',
    component: lazy(() => import('./pages/Home')),
  },
  {
    path: '/about',
    component: lazy(() => import('./pages/About')),
  },
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard')),
  },
];
```

**按功能分割：**

```javascript
// admin 相关的代码分割在一起
const AdminPanel = lazy(() => 
  import(/* webpackChunkName: "admin" */ './admin/AdminPanel')
);

const UserManagement = lazy(() =>
  import(/* webpackChunkName: "admin" */ './admin/UserManagement')
);

const Settings = lazy(() =>
  import(/* webpackChunkName: "admin" */ './admin/Settings')
);
```

**预加载（Prefetch）：**

```javascript
import { lazy } from 'react';

// 预加载组件（用户可能需要）
const HeavyComponent = lazy(() => import(
  /* webpackPrefetch: true */ 
  './HeavyComponent'
));

function App() {
  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>
        Load Heavy Component
      </button>
      {/* HeavyComponent 代码在空闲时预加载 */}
    </div>
  );
}
```

**预获取（Preload）：**

```javascript
// 立即预获取（当前导航可能需要）
const NextPageComponent = lazy(() => import(
  /* webpackPreload: true */ 
  './NextPage'
));
```

### React.lazy 最佳实践

```javascript
// 1. 使用 Error Boundary
import { ErrorBoundary } from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

// 2. 提供有意义的 loading 状态
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <Spinner />
      <p>Loading...</p>
    </div>
  );
}

// 3. 使用骨架屏
function SkeletonLoader() {
  return (
    <div className="skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-body" />
    </div>
  );
}

// 4. 分级加载
function App() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <Layout>
        <Suspense fallback={<MiniLoader />}>
          <Content />
        </Suspense>
      </Layout>
    </Suspense>
  );
}
```

### 分析打包结果

```bash
# 安装 webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# 配置 webpack
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'server',
      analyzerPort: 8888,
      openAnalyzer: true,
    }),
  ],
};

# 运行分析
npm run build

# 或者在 Next.js 中
ANALYZE=true npm run build
```

### 优化策略

```javascript
// 1. 第三方库单独打包
const OptimizedApp = () => {
  return (
    <div>
      {/* 大型库延迟加载 */}
      <Suspense fallback={<div>Loading...</div>}>
        <ReactECharts />
      </Suspense>
    </div>
  );
};

// 2. 共享代码提取
// Webpack 自动提取公共代码

// 3. Tree Shaking
// 只导入需要的模块
import { debounce } from 'lodash-es'; // 而不是 import _ from 'lodash'

// 4. 使用 ES Module
// 支持更好的 tree shaking
```

### 性能监控

```javascript
// 监控懒加载性能
const LazyComponent = lazy(() => 
  import('./HeavyComponent').then(module => {
    // 记录加载时间
    console.log('Component loaded in:', performance.now());
    return module;
  })
);

// 使用 React.lazy 配合资源提示
<link rel="preload" href="/heavy-component.js" as="script" />
```

### 总结

**代码分割策略：**

- **路由级别** - 每个页面单独打包
- **功能级别** - 相关功能打包在一起
- **组件级别** - 大型组件按需加载

**优化技巧：**

- 使用 Suspense 提供加载状态
- Error Boundary 处理错误
- 预加载可能需要的代码
- 分析打包结果优化
- 监控加载性能

---

## 29、React项目如何进行性能监控和分析？

### React DevTools Profiler

**基础使用：**

```javascript
import { Profiler } from 'react';

function onRenderCallback(
  id,              // 组件的 id
  phase,           // "mount" 或 "update"
  actualDuration,  // 组件渲染花费的时间
  baseDuration,    // 不使用 memo 时的渲染时间
  startTime,       // 开始渲染的时间
  commitTime,      // 提交的时间
  interactions     // 本次更新涉及的 interactions
) {
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
    interactions,
  });
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Navigation />
      <Router />
      <Footer />
    </Profiler>
  );
}

// 使用 Profiler 标签测量性能
function PerformanceExample() {
  return (
    <div>
      <Profiler id="Navigation" onRender={onRenderCallback}>
        <Navigation />
      </Profiler>
      
      <Profiler id="Router" onRender={onRenderCallback}>
        <Router />
      </Profiler>
    </div>
  );
}
```

### 自定义性能监控

```javascript
// 性能监控工具
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
  }
  
  // 记录渲染时间
  recordRender(componentName, duration) {
    this.metrics.push({
      type: 'render',
      component: componentName,
      duration,
      timestamp: performance.now(),
    });
    
    // 上报到监控系统
    this.report({
      metric: 'component_render',
      component: componentName,
      duration,
    });
  }
  
  // 记录 API 请求
  recordRequest(url, duration, status) {
    this.metrics.push({
      type: 'request',
      url,
      duration,
      status,
      timestamp: performance.now(),
    });
    
    this.report({
      metric: 'api_request',
      url,
      duration,
      status,
    });
  }
  
  // 记录用户交互
  recordInteraction(type, duration) {
    this.metrics.push({
      type: 'interaction',
      interactionType: type,
      duration,
      timestamp: performance.now(),
    });
  }
  
  // 上报数据
  report(data) {
    // 发送到监控服务
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(err => console.error('Failed to report metrics:', err));
  }
  
  // 获取性能报告
  getReport() {
    const renders = this.metrics.filter(m => m.type === 'render');
    const requests = this.metrics.filter(m => m.type === 'request');
    
    return {
      renders: {
        count: renders.length,
        averageDuration: renders.reduce((acc, m) => acc + m.duration, 0) / renders.length,
        slowestComponent: renders.reduce((max, m) => m.duration > max.duration ? m : max),
      },
      requests: {
        count: requests.length,
        averageDuration: requests.reduce((acc, m) => acc + m.duration, 0) / requests.length,
        slowestRequest: requests.reduce((max, m) => m.duration > max.duration ? m : max),
      },
    };
  }
}

const monitor = new PerformanceMonitor();
```

**与 React 集成：**

```javascript
function withPerformanceMonitor(Component) {
  return function MonitoredComponent(props) {
    const renderStart = useRef(performance.now());
    
    useEffect(() => {
      const renderDuration = performance.now() - renderStart.current;
      monitor.recordRender(Component.name, renderDuration);
    });
    
    return <Component {...props} />;
  };
}

// 使用
const MonitoredDashboard = withPerformanceMonitor(Dashboard);
```

### Web Vitals 监控

```javascript
// web-vitals 库
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals(metric) {
  // 上报到监控服务
  console.log(metric);
  
  // 发送到分析服务
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metric),
  });
}

// 监控核心 Web 指标
getCLS(reportWebVitals);  // Cumulative Layout Shift
getFID(reportWebVitals); // First Input Delay
getFCP(reportWebVitals); // First Contentful Paint
getLCP(reportWebVitals); // Largest Contentful Paint
getTTFB(reportWebVitals); // Time to First Byte

// 自定义监控
function reportPerfEntry(entry) {
  if (entry.entryType === 'measure') {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
}

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    reportPerfEntry(entry);
  }
});

observer.observe({ entryTypes: ['measure', 'paint'] });
```

### 性能分析

```javascript
// 分析渲染性能
function analyzePerformance() {
  // Performance API
  const perfData = performance.getEntriesByType('navigation')[0];
  
  const metrics = {
    // DNS 查询时间
    dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
    // TCP 连接时间
    tcpConnection: perfData.connectEnd - perfData.connectStart,
    // 请求时间
    requestTime: perfData.responseEnd - perfData.requestStart,
    // DOM 解析时间
    domParse: perfData.domComplete - perfData.domInteractive,
    // 白屏时间
    whiteScreen: perfData.responseStart - perfData.fetchStart,
    // 首屏时间
    firstScreen: perfData.domContentLoadedEventEnd - perfData.fetchStart,
    // 完全加载时间
    fullLoad: perfData.loadEventEnd - perfData.fetchStart,
  };
  
  return metrics;
}

// 使用
const metrics = analyzePerformance();
console.log('Performance Metrics:', metrics);
```

### 错误监控

```javascript
// 全局错误监控
window.addEventListener('error', (event) => {
  console.error('Error:', event.error);
  
  // 上报错误
  reportError({
    type: 'javascript_error',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

// Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  
  reportError({
    type: 'unhandled_promise',
    reason: event.reason,
  });
});

// React 错误边界
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('React error:', error, errorInfo);
    
    reportError({
      type: 'react_error',
      error,
      componentStack: errorInfo.componentStack,
    });
  }
}
```

### 集成第三方监控服务

**Sentry 集成：**

```javascript
import * as Sentry from '@sentry/react';

// 初始化 Sentry
Sentry.init({
  dsn: 'your-dsn-here',
  environment: process.env.NODE_ENV,
  release: process.env.REACT_APP_VERSION,
  
  // 性能监控
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  
  // 采样率
  tracesSampleRate: 1.0, // 性能追踪采样率
  replaysSessionSampleRate: 0.1, // 回放采样率
  replaysOnErrorSampleRate: 1.0, // 错误回放采样率
});

// 手动捕获错误
try {
  // 可能出错的代码
} catch (error) {
  Sentry.captureException(error);
}

// 添加用户上下文
Sentry.setUser({
  id: '123',
  email: 'user@example.com',
});

// 添加自定义上下文
Sentry.setContext('additional_info', {
  page: window.location.pathname,
  userAgent: navigator.userAgent,
});
```

**Google Analytics：**

```javascript
// React Google Analytics
import ReactGA from 'react-ga';

ReactGA.initialize('UA-XXXXXXXXX-X');

// 页面浏览
ReactGA.pageview(window.location.pathname);

// 自定义事件
ReactGA.event({
  category: 'User',
  action: 'Button Click',
  label: 'Submit',
});

// 性能监控
ReactGA.timing({
  category: 'Loading',
  variable: 'Page Load',
  value: performance.now(),
});
```

### 性能优化建议

```javascript
// 1. 使用 React.memo 优化组件
const MemoizedComponent = React.memo(Component);

// 2. 使用 useMemo 和 useCallback
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);

// 3. 虚拟化长列表
import { FixedSizeList } from 'react-window';

// 4. 懒加载组件
const LazyComponent = lazy(() => import('./Component'));

// 5. 图片优化
import Image from 'next/image';

<Image src="/hero.jpg" alt="Hero" width={800} height={600} />
```

### 总结

**监控指标：**

- **性能指标** - LCP, FCP, FID, CLS
- **渲染性能** - 组件渲染时间
- **API 性能** - 请求时间和成功率
- **错误率** - JavaScript 错误和网络错误

**监控工具：**

- **React DevTools Profiler** - 组件性能分析
- **Web Vitals** - 核心网页指标
- **Sentry** - 错误监控和性能追踪
- **Lighthouse** - 性能审计

**优化策略：**

- 识别性能瓶颈
- 优化慢速组件
- 减少不必要的渲染
- 优化资源加载
- 监控优化效果

---

## 30、React最佳实践有哪些？如何编写高质量的React代码？

### 组件设计原则

**1. 单一职责原则（SRP）**

```javascript
// ❌ 错误：组件职责过多
function BadComponent() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  
  // 获取多个数据
  useEffect(() => {
    fetchUsers().then(setUsers);
    fetchPosts().then(setPosts);
    fetchComments().then(setComments);
  }, []);
  
  // 复杂的渲染逻辑
  return (
    <div>
      <UserList users={users} />
      <PostList posts={posts} />
      <CommentList comments={comments} />
      {/* 更多渲染逻辑 */}
    </div>
  );
}

// ✅ 正确：拆分为小组件
function UserList({ users }) {
  return <ul>{users.map(user => <li key={user.id}>{user.name}</li>)}</ul>;
}

function PostList({ posts }) {
  return <ul>{posts.map(post => <li key={post.id}>{post.title}</li>)}</ul>;
}

function CommentList({ comments }) {
  return <ul>{comments.map(c => <li key={c.id}>{c.text}</li>)}</ul>;
}

function Dashboard() {
  return (
    <div>
      <UserSection />
      <PostSection />
      <CommentSection />
    </div>
  );
}
```

**2. 关注点分离**

```javascript
// ✅ 数据逻辑抽离为自定义 Hook
function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  return { users, loading, error, refetch: fetchUsers };
}

// 组件只负责渲染
function UserList() {
  const { users, loading, error } = useUsers();
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return <ul>{users.map(user => <li key={user.id}>{user.name}</li>)}</ul>;
}
```

**3. 组合优于继承**

```javascript
// ❌ 错误：使用继承
class Button extends React.Component {
  render() {
    return <button className={this.props.className} onClick={this.props.onClick}>
      {this.props.children}
    </button>;
  }
}

class PrimaryButton extends Button {
  render() {
    return super.render(); // 不容易扩展
  }
}

// ✅ 正确：使用组合
function Button({ variant = 'default', ...props }) {
  const className = `btn btn-${variant}`;
  return <button className={className} {...props} />;
}

// 使用
<Button variant="primary">Click me</Button>;
<Button variant="secondary">Cancel</Button>;
```

### 代码组织

**1. 文件结构**

```
src/
├── components/           # 可复用组件
│   ├── common/         # 通用组件
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   └── features/       # 功能组件
│       ├── UserList/
│       └── PostCard/
├── hooks/              # 自定义 Hooks
│   ├── useAuth.js
│   ├── useFetch.js
│   └── useForm.js
├── services/           # API 服务
│   ├── api.js
│   └── auth.js
├── utils/              # 工具函数
│   ├── helpers.js
│   └── constants.js
├── styles/             # 样式文件
│   ├── globals.css
│   └── variables.css
├── types/              # TypeScript 类型
│   └── index.d.ts
├── App.js
└── index.js
```

**2. 组件导出**

```javascript
// components/Button/index.js
// 导出组件、类型、默认样式
export { default } from './Button';
export type { ButtonProps } from './Button';
export { default as buttonStyles } from './Button.module.css';

// 使用
import Button, { ButtonProps, buttonStyles } from '@/components/Button';
```

### 命名规范

```javascript
// 1. 组件：PascalCase
function UserProfile() {}
const Header = () => {};

// 2. 函数和变量：camelCase
function getUserData() {}
const userName = 'John';

// 3. 常量：UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;

// 4. 布尔值：is/has/should 前缀
const isLoading = true;
const hasPermission = false;
const shouldShowModal = true;

// 5. 事件处理：handle 前缀
const handleSubmit = () => {};
const handleInputChange = () => {};
```

### Props 设计

**1. 明确的 Props 类型**

```javascript
// ✅ 使用 TypeScript 或 PropTypes
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

function Button({ variant = 'primary', size = 'medium', children, ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} {...props}>
      {children}
    </button>
  );
}
```

**2. 合理的默认值**

```javascript
// ✅ 提供合理的默认值
function Card({ title, description, footer, shadow = 'md', rounded = 'lg' }) {
  return (
    <div className={`card shadow-${shadow} rounded-${rounded}`}>
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
```

**3. 避免过度抽象**

```javascript
// ❌ 过度抽象的组件
function SuperComponent({ data, config, options, handlers }) {
  // 太多参数，难以理解和使用
}

// ✅ 简单直接的组件
function DataTable({ columns, data, onRowClick }) {
  // 清晰的职责
}
```

### 状态管理

**1. 本地状态优先**

```javascript
// ✅ 简单状态使用 useState
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**2. 复杂状态使用 useReducer**

```javascript
function counterReducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });
  
  return (
    <div>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
```

**3. 跨组件状态使用 Context**

```javascript
// 用户认证上下文
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const login = async (credentials) => {
    setLoading(true);
    try {
      const user = await api.login(credentials);
      setUser(user);
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    api.logout();
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 错误处理

**1. 错误边界**

```javascript
// 顶层错误边界
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>

// 模块级错误边界
<ErrorBoundary fallback={<DashboardError />}>
  <Dashboard />
</ErrorBoundary>
```

**2. 异步错误处理**

```javascript
function useAsync(asyncFunction) {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  const execute = async (...args) => {
    setStatus('pending');
    setData(null);
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      setData(result);
      setStatus('success');
      return result;
    } catch (err) {
      setError(err);
      setStatus('error');
      throw err;
    }
  };
  
  return { execute, status, data, error };
}

// 使用
function UserProfile({ userId }) {
  const { execute, status, data, error } = useAsync(
    () => api.getUser(userId)
  );
  
  useEffect(() => {
    execute();
  }, [userId]);
  
  if (status === 'pending') return <Spinner />;
  if (status === 'error') return <Error message={error.message} />;
  return <div>{data?.name}</div>;
}
```

### 性能优化

**1. 避免不必要的渲染**

```javascript
// ✅ 使用 React.memo
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* 渲染逻辑 */}</div>;
});

// ✅ 使用 useMemo
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ 使用 useCallback
const handleClick = useCallback(() => {
  doSomething();
}, []);
```

**2. 代码分割**

```javascript
// ✅ 路由懒加载
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// ✅ 组件懒加载
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### 可访问性

**1. 语义化 HTML**

```javascript
// ✅ 使用语义化标签
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Article content...</p>
  </article>
</main>

<footer>
  <p>&copy; 2024 My App</p>
</footer>
```

**2. ARIA 属性**

```javascript
// ✅ 添加 ARIA 属性
<button 
  aria-label="Close modal"
  aria-pressed={isPressed}
  onClick={handleClick}
>
  ×
</button>

<div role="alert" aria-live="polite">
  {errorMessage}
</div>
```

**3. 键盘导航**

```javascript
// ✅ 支持键盘导航
function Modal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  return (
    isOpen && (
      <div role="dialog" aria-modal="true">
        <button 
          onClick={onClose}
          aria-label="Close"
        >
          Close
        </button>
      </div>
    )
  );
}
```

### 测试

**1. 单元测试**

```javascript
// ✅ 测试组件行为
describe('Button', () => {
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**2. 集成测试**

```javascript
// ✅ 测试用户流程
describe('User Flow', () => {
  it('allows user to login and view dashboard', async () => {
    render(<App />);
    
    // 登录
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' }});
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' }});
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // 等待跳转到 dashboard
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});
```

### 文档

**1. 组件文档**

```javascript
/**
 * Button Component
 * 
 * @description A reusable button component with multiple variants and sizes.
 * 
 * @example
 * ```jsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
function Button({ children, ...props }) {
  return <button {...props}>{children}</button>;
}
```

**2. JSDoc 注释**

```javascript
/**
 * Fetches user data from the API
 * 
 * @param {number} userId - The ID of the user to fetch
 * @returns {Promise<User>} A promise that resolves to the user object
 * 
 * @example
 * const user = await fetchUser(123);
 * console.log(user.name);
 */
async function fetchUser(userId) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}
```

### 安全性

**1. 防止 XSS**

```javascript
// ✅ 防止 XSS
function Message({ content }) {
  // React 自动转义，避免使用 dangerouslySetInnerHTML
  return <div>{content}</div>;
}

// 如果必须使用，确保内容是可信的
function SafeHTML({ html }) {
  // 使用 DOMPurify 或其他库清理 HTML
  const cleanHTML = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}
```

**2. 敏感数据保护**

```javascript
// ✅ 不在客户端存储敏感信息
// 不要在 localStorage 中存储密码、token 等

// ✅ 使用 HttpOnly cookies
// 在服务端设置 HttpOnly 和 Secure cookies

// ✅ 验证和清理用户输入
function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, '');
}
```

### 总结

**最佳实践清单：**

```javascript
// 组件设计
✓ 单一职责
✓ 关注点分离
✓ 组合优于继承
✓ 合理的 Props 设计

// 代码组织
✓ 清晰的文件结构
✓ 统一的命名规范
✓ 模块化导出

// 状态管理
✓ 本地状态优先
✓ 复杂状态使用 useReducer
✓ 跨组件状态使用 Context

// 错误处理
✓ 使用 Error Boundary
✓ 处理异步错误
✓ 友好的错误提示

// 性能优化
✓ 避免不必要的渲染
✓ 代码分割和懒加载
✓ 使用 React DevTools Profiler

// 可访问性
✓ 语义化 HTML
✓ ARIA 属性
✓ 键盘导航支持

// 测试
✓ 单元测试
✓ 集成测试
✓ 测试覆盖率

// 文档
✓ 组件文档
✓ JSDoc 注释
✓ 使用示例

// 安全性
✓ 防止 XSS
✓ 敏感数据保护
✓ 输入验证和清理
```

**高质量代码特征：**

- **可读性** - 代码清晰易懂
- **可维护性** - 容易修改和扩展
- **可测试性** - 容易编写测试
- **可重用性** - 组件和函数可复用
- **性能** - 高效的渲染和更新
- **可访问性** - 对所有用户友好
- **安全性** - 防止常见安全漏洞

---

**React 30问 - 详细解答 完成！**
