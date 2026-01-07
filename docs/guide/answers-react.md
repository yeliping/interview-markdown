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

## 19、Lane是什么？解决了React什么问题。原理是什么？

### Lane 是什么

**Lane（车道/通道）** 是 React 18 引入的一种优先级模型，用于管理和调度任务的执行优先级。Lane 使用二进制位（bit）来表示不同的优先级级别。

```javascript
// Lane 的定义（简化版）
const NoLanes = 0b0000000000000000000000000000000;
const NoLane = 0b0000000000000000000000000000000;

// 同步优先级（最高）
const SyncLane = 0b0000000000000000000000000000001;

// 连续输入事件优先级
const InputContinuousLane = 0b0000000000000000000000000000100;

// 默认优先级
const DefaultLane = 0b0000000000000000000000000010000;

// 过渡动画优先级
const TransitionLane1 = 0b0000000000000000000000001000000;
const TransitionLane2 = 0b0000000000000000000000010000000;

// 空闲优先级
const IdleLane = 0b0100000000000000000000000000000;

// 优先级最高位
const TotalLanes = 0b1111111111111111111111111111111;
```

### Lane 解决了什么问题

Lane 主要解决了 React 18 之前优先级系统的几个核心问题：

#### 1. 优先级冲突问题

**之前的问题（Expiration Time 模式）：**
```javascript
// React 16/17 使用 Expiration Time（过期时间）
// 问题：不同类型的更新无法区分优先级

// 场景：用户输入和数据获取同时发生
// 1. 用户输入（高优先级）
setCount(count + 1);  // 应该立即执行

// 2. 数据获取（低优先级）
fetchData().then(data => setData(data));  // 可以延迟执行

// 问题：两个更新无法区分，可能同时执行或都被阻塞
```

**Lane 的解决方案：**
```javascript
// Lane 使用二进制位表示优先级
// 高优先级更新使用高位 Lane
// 低优先级更新使用低位 Lane

// 用户输入（高优先级）
function handleClick() {
  // 使用 InputContinuousLane
  unstable_runWithPriority(
    UserBlockingPriority,
    () => {
      setCount(count + 1);
    }
  );
}

// 数据获取（低优先级）
function fetchData() {
  // 使用 TransitionLane
  startTransition(() => {
    const data = await fetch('/api/data');
    setData(data);
  });
}

// 结果：高优先级更新会优先执行，低优先级更新会被推迟
```

#### 2. 优先级中断和恢复问题

**之前的问题：**
```javascript
// 低优先级任务被高优先级任务中断后
// 之前的工作可能被丢弃，需要重新开始

function render() {
  // 开始渲染低优先级任务
  workInProgress = renderComponent(lowPriorityUpdate);
  
  // 高优先级任务到来
  highPriorityUpdate();
  
  // 问题：之前的工作被丢弃，需要重新渲染整个组件树
  // 浪费了之前的工作
}
```

**Lane 的解决方案：**
```javascript
// Lane 支持部分完成和恢复
// 通过位运算可以合并和拆分 lanes

// 工作中的 lanes
let workInProgressRootRenderLanes = NoLanes;

// 合并 lanes
function mergeLanes(a, b) {
  return a | b;  // 按位或
}

// 移除 lanes
function removeLanes(set, subset) {
  return set & ~subset;  // 按位与非
}

// 检查是否包含某个 lane
function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;  // 按位与等于子集
}

// 示例：处理中断
const workLanes = SyncLane | TransitionLane1;  // 0b0000000000000000000000000001001

// 高优先级任务到来，只重新执行高优先级部分
const highPriorityLanes = SyncLane;
const lowPriorityLanes = TransitionLane1;

// 可以保留低优先级的工作，只重新执行高优先级部分
```

#### 3. 过渡中断问题

**之前的问题：**
```javascript
// 过渡动画被用户输入中断后
// 整个过渡会被取消，需要重新开始

// 用户滑动列表
function onScroll() {
  // 触发列表更新（过渡动画）
  startTransition(() => {
    setVisibleItems(items.slice(0, 100));
  });
  
  // 用户继续滚动
  // 问题：之前的过渡动画被完全取消
  // 用户体验不好
}
```

**Lane 的解决方案：**
```javascript
// Lane 支持过渡的优雅降级
// 可以暂停过渡，优先响应用户输入

// 过渡使用 TransitionLane
function onScroll() {
  // 使用 startTransition 标记过渡更新
  startTransition(() => {
    setVisibleItems(items.slice(0, 100));
  });
}

// 用户输入到来
function onUserInput() {
  // 用户输入使用高优先级 Lane
  setCount(count + 1);
  
  // 过渡更新被暂停，但不被取消
  // 用户输入完成后，过渡可以继续
}

// 可以根据优先级决定是否中断
function shouldYield() {
  // 如果有更高优先级的更新，让出执行权
  const hasHigherPriorityWork = (workInProgressRootRenderLanes & ~renderLanes) !== NoLanes;
  
  if (hasHigherPriorityWork) {
    return true;  // 让出执行权
  }
  
  return false;
}
```

### Lane 的原理

#### 1. 二进制位表示

Lane 使用 32 位整数（或 64 位）的每一位表示一个独立的优先级通道：

```javascript
// 32 位 Lane 模型
// 位置越靠左，优先级越高

const SyncLane =                    0b0000000000000000000000000000001;  // 第 0 位
const InputContinuousHydrationLane = 0b0000000000000000000000000000010;  // 第 1 位
const InputContinuousLane =          0b0000000000000000000000000000100;  // 第 2 位
const DefaultHydrationLane =         0b0000000000000000000000000001000;  // 第 3 位
const DefaultLane =                  0b0000000000000000000000000010000;  // 第 4 位
const TransitionHydrationLane =      0b0000000000000000000000000100000;  // 第 5 位
const TransitionLane1 =              0b0000000000000000000000001000000;  // 第 6 位
const TransitionLane2 =              0b0000000000000000000000010000000;  // 第 7 位
// ... 更多 lanes
```

#### 2. Lane 的位运算操作

```javascript
// 1. 合并 lanes
function getHighestPriorityLanes(lanes) {
  // 返回最高优先级的 lane
  return lanes & -lanes;  // 获取最低位的 1（最高优先级）
}

// 示例
const lanes = SyncLane | InputContinuousLane | TransitionLane1;
// lanes = 0b0000000000000000000000000000101

const highest = getHighestPriorityLanes(lanes);
// highest = 0b0000000000000000000000000000001 (SyncLane)

// 2. 检查是否有某个 lane
function includesLane(set, lane) {
  return (set & lane) === lane;
}

// 3. 移除 lanes
function removeLanes(set, subset) {
  return set & ~subset;
}

// 示例
const lanes = SyncLane | TransitionLane1;
const result = removeLanes(lanes, SyncLane);
// result = TransitionLane1

// 4. 合并 lanes
function mergeLanes(a, b) {
  return a | b;
}

// 5. 检查是否为空
function isNoLanes(lanes) {
  return lanes === NoLanes;
}
```

#### 3. Lane 在 Fiber 节点中的使用

```javascript
// FiberNode 中的 lanes
class FiberNode {
  constructor(tag, pendingProps, key, lanes) {
    // 当前节点的 lanes
    this.lanes = lanes;
    
    // 子树的 lanes
    this.childLanes = NoLanes;
    
    // 双缓冲
    this.alternate = null;
  }
  
  // 合并子树 lanes
  function mergeChildLanes(fiber) {
    let child = fiber.child;
    let lanes = NoLanes;
    
    while (child !== null) {
      lanes = mergeLanes(lanes, child.lanes);
      lanes = mergeLanes(lanes, child.childLanes);
      child = child.sibling;
    }
    
    fiber.childLanes = lanes;
  }
}

// 更新 lanes
function markRootUpdated(root, updateLane) {
  root.pendingLanes |= updateLane;
  root.finishedLanes = NoLanes;
}

function markRootFinished(root, remainingLanes) {
  root.finishedLanes = remainingLanes;
}
```

#### 4. Lane 的调度流程

```javascript
// 1. 创建更新时分配 Lane
function createUpdate(lane) {
  const update = {
    lane: lane,
    payload: null,
    next: null,
  };
  return update;
}

// 2. 根据优先级选择 Lane
function requestEventTime() {
  // 获取当前时间
  return performance.now();
}

function requestUpdateLane(fiber) {
  // 同步模式：使用 SyncLane
  const mode = fiber.mode;
  if ((mode & ConcurrentMode) === NoMode) {
    return SyncLane;
  }
  
  // 获取当前优先级
  const currentEventTime = requestEventTime();
  const currentUpdatePriority = getCurrentUpdatePriority();
  
  if (currentUpdatePriority !== NoLanes) {
    return currentUpdatePriority;
  }
  
  // 默认：使用 DefaultLane
  return DefaultLane;
}

// 3. 调度更新
function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
  // 标记 root 需要更新
  markRootUpdated(root, lane);
  
  // 确保 root 被调度
  ensureRootIsScheduled(root, eventTime);
}

function ensureRootIsScheduled(root, currentTime) {
  // 获取下一个 lanes
  const nextLanes = getNextLanes(root);
  
  if (nextLanes === NoLanes) {
    return;  // 没有需要执行的 lanes
  }
  
  // 调度任务
  scheduleCallback(
    getPriorityForLane(nextLanes),
    () => performConcurrentWorkOnRoot(root),
  );
}

// 4. 执行工作
function performConcurrentWorkOnRoot(root) {
  // 获取要执行的 lanes
  const lanes = getNextLanes(root);
  
  // 渲染 root
  const exitStatus = renderRootConcurrent(root, lanes);
  
  if (exitStatus === RootInterrupted) {
    // 被中断，保留当前工作
    const remainingLanes = getRemainingLanes(root, lanes);
    markRootFinished(root, remainingLanes);
  } else if (exitStatus === RootCompleted) {
    // 完成，提交更新
    commitRoot(root);
  }
  
  return getRemainingWork();
}

// 5. 检查是否应该让出执行权
function shouldYieldToHost() {
  const currentTime = performance.now();
  
  // 检查是否有更高优先级的更新
  const hasHigherPriorityWork = 
    (workInProgressRootRenderLanes & ~renderLanes) !== NoLanes;
  
  if (hasHigherPriorityWork) {
    return true;  // 让出执行权
  }
  
  // 检查时间片
  if (currentTime >= deadline) {
    return true;
  }
  
  return false;
}
```

### Lane 与 Expiration Time 的对比

| 特性 | Expiration Time (React 16/17) | Lane (React 18) |
|------|-----------------------------|-----------------|
| 优先级表示 | 时间戳 | 二进制位 |
| 优先级数量 | 有限（按时间） | 32 个独立通道 |
| 优先级合并 | 时间比较 | 位运算（快速） |
| 中断恢复 | 重新开始 | 部分恢复 |
| 过渡支持 | 不支持 | 完整支持 |
| 并发模式 | 不支持 | 原生支持 |

### Lane 的实际应用

#### 1. 用户输入优化

```javascript
// 文本输入场景
function TextInput() {
  const [text, setText] = useState('');
  
  function handleChange(e) {
    // 用户输入：使用高优先级
    // 保证输入响应及时
    setText(e.target.value);
  }
  
  function handleSearch() {
    // 搜索：使用过渡优先级
    // 可以被用户输入中断
    startTransition(() => {
      performSearch(text);
    });
  }
  
  return (
    <input
      value={text}
      onChange={handleChange}
      onKeyUp={handleSearch}
    />
  );
}
```

#### 2. 列表渲染优化

```javascript
// 大列表滚动场景
function VirtualList({ items }) {
  const [visibleItems, setVisibleItems] = useState(items.slice(0, 50));
  
  function handleScroll() {
    // 滚动事件：使用过渡优先级
    // 可以被用户输入中断
    startTransition(() => {
      const newVisibleItems = calculateVisibleItems(items);
      setVisibleItems(newVisibleItems);
    });
  }
  
  return (
    <div onScroll={handleScroll}>
      {visibleItems.map(item => (
        <Item key={item.id} data={item} />
      ))}
    </div>
  );
}
```

#### 3. 数据获取优化

```javascript
// 数据获取场景
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  async function fetchUserData() {
    setLoading(true);
    try {
      // 数据获取：使用过渡优先级
      // 可以被用户交互中断
      await startTransition(async () => {
        const data = await fetchUser();
        setUser(data);
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div>
      <button onClick={fetchUserData}>Load User</button>
      {loading && <div>Loading...</div>}
      {user && <div>{user.name}</div>}
    </div>
  );
}
```

### Lane 的优势总结

1. **更精细的优先级控制**
   - 32 个独立的优先级通道
   - 支持优先级合并和拆分

2. **更好的并发支持**
   - 支持任务中断和恢复
   - 避免重复工作

3. **流畅的用户体验**
   - 高优先级任务优先执行
   - 低优先级任务优雅降级

4. **高效的位运算**
   - 快速的优先级比较
   - 低开销的合并操作

5. **过渡支持**
   - 原生支持过渡动画
   - 可中断的长时间任务

### 总结

**Lane 是 React 18 的核心优化之一，它通过二进制位的优先级模型解决了：**

1. ✅ 优先级冲突问题
2. ✅ 优先级中断和恢复问题
3. ✅ 过渡中断问题
4. ✅ 并发渲染的调度问题

**Lane 的核心思想：**
- 使用二进制位表示优先级
- 通过位运算实现高效的优先级管理
- 支持任务的优雅中断和恢复
- 提供流畅的用户体验

**Lane 的关键特性：**
- 32 个独立的优先级通道
- 位运算实现高效合并
- 支持并发模式
- 原生支持过渡动画

---

## 20、React高频Hooks手写(基础的SetState)

### useState 实现

```javascript
let hooks = [];
let hookIndex = 0;

function useState(initialValue) {
  const index = hookIndex;
  
  // 首次渲染时初始化状态
  if (hooks[index] === undefined) {
    hooks[index] = {
      value: typeof initialValue === 'function' ? initialValue() : initialValue
    };
  }
  
  // 定义 setState 函数
  const setState = (newValue) => {
    const hook = hooks[index];
    
    // 如果新值与旧值相同，不触发更新
    if (typeof newValue === 'function') {
      const nextValue = newValue(hook.value);
      if (nextValue === hook.value) return;
      hook.value = nextValue;
    } else {
      if (newValue === hook.value) return;
      hook.value = newValue;
    }
    
    // 触发重新渲染
    scheduleWork();
  };
  
  hookIndex++;
  return [hooks[index].value, setState];
}

// 模拟调度更新
function scheduleWork() {
  hookIndex = 0; // 重置 hook 索引
  render(); // 触发重新渲染
}

function render() {
  hookIndex = 0; // 重置 hook 索引
  // 这里会执行组件函数
  // 组件函数会依次调用 hooks
}
```

### useEffect 实现

```javascript
function useEffect(callback, deps) {
  const index = hookIndex;
  
  if (hooks[index] === undefined) {
    hooks[index] = {
      deps: undefined,
      cleanup: undefined
    };
  }
  
  const hook = hooks[index];
  const hasChangedDeps = hook.deps === undefined || 
    deps.some((dep, i) => dep !== hook.deps[i]);
  
  if (hasChangedDeps) {
    // 执行清理函数
    if (hook.cleanup) {
      hook.cleanup();
    }
    
    // 执行副作用
    hook.cleanup = callback();
    hook.deps = deps;
  }
  
  hookIndex++;
}
```

### useMemo 实现

```javascript
function useMemo(factory, deps) {
  const index = hookIndex;
  
  if (hooks[index] === undefined) {
    hooks[index] = {
      value: undefined,
      deps: undefined
    };
  }
  
  const hook = hooks[index];
  const hasChangedDeps = hook.deps === undefined || 
    deps.some((dep, i) => dep !== hook.deps[i]);
  
  if (hasChangedDeps) {
    hook.value = factory();
    hook.deps = deps;
  }
  
  hookIndex++;
  return hook.value;
}
```

### useCallback 实现

```javascript
function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
}
```

### useRef 实现

```javascript
function useRef(initialValue) {
  const index = hookIndex;
  
  if (hooks[index] === undefined) {
    hooks[index] = {
      current: initialValue
    };
  }
  
  hookIndex++;
  return hooks[index];
}
```

### useContext 实现

```javascript
function createContext(defaultValue) {
  const context = {
    Provider: null,
    Consumer: null,
    currentValue: defaultValue
  };
  
  context.Provider = ({ value, children }) => {
    context.currentValue = value;
    return children;
  };
  
  context.Consumer = ({ children }) => {
    return children(context.currentValue);
  };
  
  return context;
}

function useContext(context) {
  return context.currentValue;
}
```

---

## 21、手写 React FiberNode 链表伪代码

### FiberNode 结构

```javascript
// FiberNode 节点结构
function FiberNode(tag, pendingProps, key) {
  // 节点类型标签（函数组件、类组件、DOM节点等）
  this.tag = tag;
  
  // key 用于 diff 算法
  this.key = key;
  
  // 组件类型或 DOM 标签名
  this.type = null;
  
  // 关联的 DOM 节点
  this.stateNode = null;
  
  // Fiber 树结构
  this.return = null;      // 父节点
  this.child = null;       // 第一个子节点
  this.sibling = null;     // 下一个兄弟节点
  this.index = 0;          // 在兄弟节点中的索引
  
  // 属性和状态
  this.pendingProps = pendingProps;  // 即将应用的 props
  this.memoizedProps = null;          // 上次渲染使用的 props
  this.memoizedState = null;          // 上次渲染后的 state
  this.updateQueue = null;            // 更新队列
  
  // 副作用
  this.flags = 0;                    // 副作用标记
  this.subtreeFlags = 0;             // 子树副作用标记
  this.deletions = null;             // 要删除的子节点
  
  // 优先级和调度
  this.lanes = 0;                    // 优先级 lanes
  this.childLanes = 0;               // 子树优先级 lanes
  
  // 双缓冲
  this.alternate = null;             // 对应的另一个 Fiber 树节点
}

// 工作单元
let workInProgress = null;
let workInProgressRoot = null;

// 构建 Fiber 树
function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    // 首次渲染
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren
    );
  } else {
    // 更新渲染
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}

// 协调单个子节点
function reconcileSingleElement(returnFiber, currentFirstChild, element) {
  const key = element.key;
  let child = currentFirstChild;
  
  while (child !== null) {
    // key 相同
    if (child.key === key) {
      const elementType = element.type;
      if (child.elementType === elementType) {
        // 复用节点
        const existing = useFiber(child, element.props);
        existing.return = returnFiber;
        return existing;
      }
      // key 相同但类型不同，删除旧节点
      deleteRemainingChildren(returnFiber, child);
      break;
    } else {
      // key 不同，删除旧节点
      deleteChild(returnFiber, child);
    }
    
    child = child.sibling;
  }
  
  // 创建新节点
  const created = createFiberFromElement(element, returnFiber.mode, returnFiber.lanes);
  created.return = returnFiber;
  return created;
}

// 创建 Fiber 节点
function createFiberFromElement(element, mode, lanes) {
  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  
  let fiberTag;
  if (typeof type === 'string') {
    fiberTag = HostComponent; // DOM 节点
  } else if (typeof type === 'function') {
    fiberTag = type.prototype.isReactComponent
      ? ClassComponent
      : FunctionComponent;
  } else {
    fiberTag = IndeterminateComponent;
  }
  
  const fiber = createFiber(fiberTag, pendingProps, key, mode);
  fiber.elementType = type;
  fiber.type = type;
  fiber.lanes = lanes;
  
  return fiber;
}

// 复用 Fiber 节点
function useFiber(fiber, pendingProps) {
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.index = 0;
  clone.sibling = null;
  return clone;
}

// 创建 workInProgress Fiber
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 首次创建
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
    // 复用 alternate
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    
    // 清除副作用
    workInProgress.flags = 0;
    workInProgress.subtreeFlags = 0;
  }
  
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  
  // 克隆依赖
  const currentDependencies = current.dependencies;
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : {
          lanes: currentDependencies.lanes,
          firstContext: currentDependencies.firstContext,
        };
  
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  
  return workInProgress;
}

// 标记删除
function deleteChild(returnFiber, childToDelete) {
  if (!returnFiber.deletions) {
    returnFiber.deletions = [childToDelete];
    returnFiber.flags |= ChildDeletion;
  } else {
    returnFiber.deletions.push(childToDelete);
  }
}

// 标记删除所有剩余子节点
function deleteRemainingChildren(returnFiber, currentFirstChild) {
  let childToDelete = currentFirstChild;
  while (childToDelete !== null) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
  return null;
}

// 标签常量
const FunctionComponent = 0;
const ClassComponent = 1;
const IndeterminateComponent = 2;
const HostRoot = 3;
const HostPortal = 4;
const HostComponent = 5;
const HostText = 6;
```

---

## 22、手写 React Scheduler涉及到核心微任务、宏任务代码

### Scheduler 核心实现

```javascript
// 任务优先级定义
const ImmediatePriority = 1;    // 同步任务
const UserBlockingPriority = 2; // 用户阻塞任务
const NormalPriority = 3;       // 普通任务
const LowPriority = 4;          // 低优先级
const IdlePriority = 5;         // 空闲任务

// 任务队列
let taskQueue = [];
let currentTask = null;
let isSchedulerPaused = false;
let isHostCallbackScheduled = false;

// 时间切片配置
let frameInterval = 5; // 每帧可执行时间（ms）
let frameDeadline = 0;

// 任务对象结构
function Task(callback, priorityLevel) {
  this.callback = callback;
  this.priorityLevel = priorityLevel;
  this.startTime = performance.now();
  this.expirationTime = this.startTime + getTimeoutByPriority(priorityLevel);
}

// 根据优先级获取超时时间
function getTimeoutByPriority(priorityLevel) {
  switch (priorityLevel) {
    case ImmediatePriority:
      return -1; // 立即执行
    case UserBlockingPriority:
      return 250; // 250ms
    case NormalPriority:
      return 5000; // 5s
    case LowPriority:
      return 10000; // 10s
    case IdlePriority:
      return 1073741823; // 永不超时
    default:
      return 5000;
  }
}

// 调度任务
function scheduleCallback(priorityLevel, callback) {
  const currentTime = performance.now();
  
  const newTask = new Task(callback, priorityLevel);
  
  // 将任务加入队列（按过期时间排序）
  taskQueue.push(newTask);
  taskQueue.sort((a, b) => a.expirationTime - b.expirationTime);
  
  // 请求调度
  requestHostCallback();
  
  return newTask;
}

// 请求宿主回调（使用 MessageChannel 实现宏任务）
let scheduledHostCallback = null;
let messageChannel = null;

function requestHostCallback() {
  if (!isHostCallbackScheduled) {
    isHostCallbackScheduled = true;
    requestHostTimeout(flushWork);
  }
}

// 使用 MessageChannel 实现宏任务调度
function setupMessageChannel() {
  if (messageChannel) {
    return;
  }
  
  messageChannel = new MessageChannel();
  const port = messageChannel.port2;
  messageChannel.port1.onmessage = performWorkUntilDeadline;
  
  port.postMessage(null);
}

// 执行工作直到截止时间
function performWorkUntilDeadline() {
  if (isSchedulerPaused || scheduledHostCallback === null) {
    return;
  }
  
  const currentTime = performance.now();
  
  // 计算当前帧的截止时间
  frameDeadline = currentTime + frameInterval;
  
  let hasMoreWork = true;
  
  try {
    hasMoreWork = scheduledHostCallback(currentTime);
  } finally {
    if (hasMoreWork) {
      // 还有工作，继续调度
      port.postMessage(null);
    } else {
      isHostCallbackScheduled = false;
    }
  }
}

function requestHostTimeout(callback) {
  scheduledHostCallback = callback;
  setupMessageChannel();
}

// 刷新工作队列
function flushWork(startTime) {
  isHostCallbackScheduled = false;
  
  if (isSchedulerPaused) {
    return false;
  }
  
  let currentTime = startTime;
  
  // 获取第一个任务
  currentTask = taskQueue.shift();
  
  while (currentTask !== null) {
    // 检查任务是否过期
    if (currentTask.expirationTime > currentTime && 
        !shouldYieldToHost()) {
      // 任务未过期且还有时间，继续执行
      break;
    }
    
    const callback = currentTask.callback;
    
    if (typeof callback === 'function') {
      currentTask.callback = null;
      
      // 执行回调
      const continuationCallback = callback(currentTask.expirationTime);
      
      // 如果返回新的回调，重新加入队列
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        taskQueue.push(currentTask);
        taskQueue.sort((a, b) => a.expirationTime - b.expirationTime);
      }
    }
    
    // 获取下一个任务
    currentTask = taskQueue.shift();
  }
  
  return currentTask !== null;
}

// 检查是否应该让出执行权
function shouldYieldToHost() {
  const currentTime = performance.now();
  
  if (currentTime >= frameDeadline) {
    // 时间片已用完
    return true;
  }
  
  return false;
}

// 暂停调度
function pauseScheduler() {
  isSchedulerPaused = true;
}

// 恢复调度
function resumeScheduler() {
  isSchedulerPaused = false;
  if (isHostCallbackScheduled) {
    requestHostTimeout(flushWork);
  }
}

// 取消任务
function cancelCallback(task) {
  task.callback = null;
}

// 获取当前任务
function getCurrentTask() {
  return currentTask;
}

// 使用 requestIdleCallback 的备选方案（如果浏览器支持）
let requestIdleCallbackImplementation = requestIdleCallback;
let cancelIdleCallbackImplementation = cancelIdleCallback;

if (typeof requestIdleCallback !== 'function') {
  // 使用 setTimeout 模拟 requestIdleCallback
  requestIdleCallbackImplementation = (callback, options) => {
    const timeout = options && options.timeout;
    const startTime = performance.now();
    
    const id = setTimeout(() => {
      const endTime = performance.now();
      const timeRemaining = Math.max(0, 50 - (endTime - startTime));
      
      callback({
        didTimeout: timeRemaining <= 0,
        timeRemaining: () => timeRemaining
      });
    }, timeout || 50);
    
    return id;
  };
  
  cancelIdleCallbackImplementation = (id) => {
    clearTimeout(id);
  };
}

// 微任务调度（用于优先级较高的任务）
let microtaskQueue = [];
let isMicrotaskScheduled = false;

function scheduleMicrotask(callback) {
  microtaskQueue.push(callback);
  
  if (!isMicrotaskScheduled) {
    isMicrotaskScheduled = true;
    Promise.resolve().then(flushMicrotasks);
  }
}

function flushMicrotasks() {
  isMicrotaskScheduled = false;
  
  while (microtaskQueue.length > 0) {
    const callback = microtaskQueue.shift();
    callback();
  }
}

// 示例：使用 Scheduler
function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime;
  
  // 获取任务
  currentTask = taskQueue.shift();
  
  while (currentTask !== null && 
         (!hasTimeRemaining || currentTime < frameDeadline)) {
    
    const callback = currentTask.callback;
    
    if (typeof callback === 'function') {
      // 执行任务
      const continuationCallback = callback();
      
      if (typeof continuationCallback === 'function') {
        // 任务未完成，重新加入队列
        currentTask.callback = continuationCallback;
        taskQueue.push(currentTask);
        taskQueue.sort((a, b) => a.expirationTime - b.expirationTime);
      }
    } else {
      // 任务已完成或被取消
      taskQueue.shift();
    }
    
    // 更新当前任务
    currentTask = taskQueue[0];
    currentTime = performance.now();
  }
  
  // 返回是否还有工作
  return currentTask !== null;
}

// 暴露 API
const Scheduler = {
  scheduleCallback,
  cancelCallback,
  getCurrentTask,
  shouldYieldToHost,
  pauseScheduler,
  resumeScheduler,
  scheduleMicrotask
};

export default Scheduler;
```

---

## 23、React的同构开发你是如何部署的？使用Next还是自己开发的？流式渲染是什么有什么好处？

### 同构开发部署方案

#### 1. 使用 Next.js 部署

**Next.js 是最成熟的 React SSR 方案**，我通常推荐使用 Next.js，原因如下：

```javascript
// Next.js 项目结构
my-nextjs-app/
├── pages/              # 路由页面
│   ├── index.js       # 首页
│   ├── _app.js        # 应用入口
│   └── _document.js   # HTML 模板
├── public/            # 静态资源
├── styles/            # 样式文件
├── package.json
└── next.config.js
```

**部署流程：**

```javascript
// 1. 构建应用
npm run build

// 2. 启动生产环境
npm start

// 或者使用 Node.js 服务器
node server.js

// 3. 使用 Docker 部署
// Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

// 4. 使用 Vercel 部署（Next.js 官方推荐）
vercel --prod
```

**Next.js 的优势：**
- 自动代码分割，按需加载
- 内置图片优化、字体优化
- API Routes 支持
- ISR（增量静态再生）和 SSR 混合渲染
- 优秀的开发体验（热更新、Fast Refresh）

#### 2. 自研同构方案

如果需要深度定制，可以自研：

```javascript
// 1. 服务器端渲染
import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';

const app = express();

app.get('*', (req, res) => {
  const context = {};
  
  // 渲染 React 组件为 HTML
  const html = renderToString(
    <StaticRouter location={req.url} context={context}>
      <App />
    </StaticRouter>
  );
  
  // 返回完整 HTML
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

// 2. 客户端水合
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

hydrateRoot(
  document.getElementById('root'),
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// 3. Webpack 配置
// webpack.server.js
const path = require('path');

module.exports = {
  mode: 'development',
  target: 'node',
  entry: './server.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'server.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
};

// webpack.client.js
module.exports = {
  mode: 'development',
  entry: './client.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'client.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
};
```

### 流式渲染（Streaming SSR）

**什么是流式渲染？**

流式渲染是指在服务器端渲染时，将 HTML 分块逐步发送给浏览器，而不是等待整个页面渲染完成后一次性返回。

```javascript
// 使用 React 18 的流式渲染
import { renderToPipeableStream } from 'react-dom/server';
import App from './App';

app.get('*', (req, res) => {
  const { pipe } = renderToPipeableStream(
    <App />,
    {
      // 当 shell 渲染完成时立即发送
      onShellReady() {
        res.statusCode = 200;
        res.setHeader('Content-type', 'text/html');
        pipe(res);
      },
      
      // 处理错误
      onShellError(error) {
        res.statusCode = 500;
        res.send('<!doctype html><p>Error loading app...</p>');
      },
      
      // 客户端需要加载的 JS 文件
      bootstrapModules: ['/client.js'],
    }
  );
});

// Next.js 13+ 的流式渲染
export default function Page() {
  // 自动启用流式渲染
  return <div>Hello World</div>;
}
```

**流式渲染的好处：**

1. **更快的首屏渲染（FCP）**
   - 页面 shell 可以立即发送给浏览器
   - 用户可以更快看到页面框架
   - FCP（First Contentful Paint）时间显著降低

2. **更好的用户体验**
   - 渐进式加载，用户感觉页面加载更快
   - 减少白屏时间
   - 提升 LCP（Largest Contentful Paint）指标

3. **更高效的资源利用**
   - 服务器可以边渲染边发送，不需要等待整个页面
   - 减少内存占用
   - 提高并发处理能力

4. **支持 Suspense**
   - 可以将耗时的数据获取部分标记为 Suspense
   - 先渲染可用的内容，后续部分流式补充

```javascript
// 使用 Suspense 实现流式加载
import { Suspense } from 'react';

function UserProfile() {
  return (
    <div>
      <h1>User Profile</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <UserInfo />
      </Suspense>
      <Suspense fallback={<div>Loading posts...</div>}>
        <UserPosts />
      </Suspense>
    </div>
  );
}
```

5. **更快的交互（TTI）**
   - 页面内容分块加载，关键资源优先加载
   - 减少阻塞渲染的 JS 大小
   - 提前触发水合过程

**性能对比：**

| 指标 | 传统 SSR | 流式 SSR | 提升 |
|------|---------|---------|------|
| TTFB | 200ms | 50ms | 75% ↓ |
| FCP | 800ms | 300ms | 62.5% ↓ |
| LCP | 1500ms | 1200ms | 20% ↓ |
| TTI | 2000ms | 1800ms | 10% ↓ |

**实际应用场景：**

1. **电商网站**
   - 先渲染商品框架，再流式加载商品详情
   - 用户可以立即看到页面结构

2. **新闻网站**
   - 先渲染标题和摘要，再流式加载正文
   - 减少用户等待时间

3. **社交媒体**
   - 先渲染评论框架，再流式加载具体评论
   - 提升用户体验

---

## 24、React服务端渲染需要进行Hydrate么？哪些版本需要？据我所了解Qwik是去调和的，为什么呢？

### React SSR 是否需要 Hydrate

**是的，React SSR 需要 Hydrate**，Hydrate 是 SSR 的关键步骤。

#### 为什么需要 Hydrate？

```javascript
// 1. 服务器端渲染
// server.js
import { renderToString } from 'react-dom/server';
import App from './App';

const html = renderToString(<App />);
// 返回的 HTML：
// <div id="root"><h1>Hello</h1><button>Click</button></div>

// 2. 客户端需要接管（Hydrate）
// client.js
import { hydrateRoot } from 'react-dom/client';
import App from './App';

// Hydrate：让 React 识别已有的 DOM，并添加事件监听器
hydrateRoot(document.getElementById('root'), <App />);
```

**Hydrate 的作用：**
1. **事件绑定**：服务器返回的 HTML 是静态的，没有事件监听器。Hydrate 会为这些 DOM 元素绑定事件。
2. **状态同步**：将服务器端的状态与客户端同步。
3. **建立虚拟 DOM**：基于现有的 DOM 创建虚拟 DOM 树，为后续更新做准备。

#### React 各版本的 Hydrate

**React 16 及之前：**
```javascript
// 使用 hydrate
import { hydrate } from 'react-dom';
hydrate(<App />, document.getElementById('root'));
```

**React 17：**
```javascript
// hydrate 仍然可用，但推荐使用 createRoot
import { hydrate } from 'react-dom';
hydrate(<App />, document.getElementById('root'));
```

**React 18：**
```javascript
// 使用 hydrateRoot（新 API）
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />);

// 支持 Suspense 和流式渲染
import { renderToPipeableStream } from 'react-dom/server';
```

**所有版本的 React SSR 都需要 Hydrate**，这是 React 工作原理决定的。

#### Hydrate 的问题

```javascript
// 问题1：Hydrate 不匹配
// 服务端渲染
const html = renderToString(<div>Hello</div>);

// 客户端渲染
hydrateRoot(
  document.getElementById('root'),
  <div>Hello World</div>  // 内容不匹配！
);
// 控制台警告：Hydration failed because the initial UI does not match

// 问题2：Hydrate 性能开销
// 需要遍历整个 DOM 树，对比虚拟 DOM
// 对于大型应用，这可能导致阻塞

// 问题3：JavaScript 必须完全加载才能交互
// 用户看到页面后，仍需等待 JS 加载完成才能点击
```

### Qwik 为什么去 Hydrate？

**Qwik 的核心理念：Resumability（可恢复性）**

Qwik 不需要 Hydrate，原因如下：

#### 1. Qwik 的工作原理

```javascript
// Qwik 组件
import { component$, useSignal } from '@builder.io/qwik';

export default component$(() => {
  const count = useSignal(0);
  
  return (
    <div>
      <h1>Count: {count.value}</h1>
      <button onClick$={() => count.value++}>
        Increment
      </button>
    </div>
  );
});

// 服务端渲染输出
// HTML 包含了所有必要的信息，包括事件处理器
<div>
  <h1>Count: 0</h1>
  <button 
    on:click="/build/q-abc123.js#handler_increment"
    q:id="1"
  >
    Increment
  </button>
</div>

// 注意：HTML 中已经包含了事件处理器的引用
// 不需要在客户端重新绑定事件
```

#### 2. Qwik 与 React 的对比

| 特性 | React SSR | Qwik |
|------|----------|------|
| 事件绑定 | 客户端 Hydrate 时绑定 | HTML 中直接包含 |
| 状态管理 | 客户端重建状态 | HTML 中序列化状态 |
| JS 加载 | 页面交互前必须加载 | 按需懒加载 |
| 首次交互 | 等待 Hydrate 完成 | 立即可交互 |
| 水合过程 | 遍历整个 DOM 树 | 无需水合 |

#### 3. Qwik 的优势

```javascript
// 1. 立即可交互
// Qwik 应用在 HTML 返回后立即可交互
// 不需要等待 JS 加载

// 2. 代码分割粒度更细
// 每个事件处理器都可以单独加载
// 只在需要时才加载对应的 JS

// 3. 更小的初始 JS 包
// React 需要加载整个 React + 应用代码
// Qwik 只加载必要的事件处理器

// 4. 自动恢复
// Qwik 会将状态序列化到 HTML 中
// 客户端直接读取，无需重建
```

#### 4. Qwik 实现细节

```javascript
// Qwik 的懒加载机制
// HTML 中的特殊属性
<button 
  on:click="/build/q-abc123.js#handler_increment"  // 事件处理器路径
  q:id="1"                                         // 元素 ID
>
  Increment
</button>

// 当用户点击按钮时：
// 1. Qwik 运行时拦截事件
// 2. 动态加载对应的 JS 文件：/build/q-abc123.js
// 3. 执行事件处理器
// 4. 更新 DOM（使用 fine-grained reactivity）

// 状态序列化
<script q:json="state">
  {
    "count": 0,
    "user": { "name": "John" }
  }
</script>

// 客户端直接读取状态，无需水合
```

#### 5. React 的未来方向

React 也在探索类似的优化：

```javascript
// React 18 的 Partial Hydration（部分水合）
import { Suspense } from 'react';

function App() {
  return (
    <div>
      <Header />           {/* 立即水合 */}
      <Suspense fallback={<Loading />}>
        <HeavyComponent /> {/* 延迟水合 */}
      </Suspense>
    </div>
  );
}

// React Server Components（服务器组件）
// 不需要发送到客户端，减少 JS 大小
```

### 总结

**React 必须进行 Hydrate**，因为：
1. React 组件是动态的，需要事件绑定和状态管理
2. React 的工作原理依赖于虚拟 DOM 和 Diff 算法
3. 所有版本（16/17/18）都需要 Hydrate

**Qwik 不需要 Hydrate**，因为：
1. 采用 Resumable 架构，状态和事件处理器都序列化到 HTML 中
2. 使用 fine-grained reactivity，无需虚拟 DOM
3. 按需懒加载，减少初始 JS 大小
4. 立即可交互，无需等待水合

**Qwik 的权衡：**
- 优势：更快的交互、更小的 JS 包、更好的性能
- 劣势：不同的开发范式、生态系统较小、学习成本

---

## 25、React同构渲染如果提高性能问题？你是怎么落地的。同构解决了哪些性能指标。

### React 同构渲染性能优化方案

#### 1. 缓存策略

```javascript
// Redis 缓存渲染结果
import Redis from 'ioredis';

const redis = new Redis();

async function renderWithCache(req, res, next) {
  const cacheKey = `ssr:${req.url}`;
  
  // 尝试从缓存读取
  const cachedHtml = await redis.get(cacheKey);
  
  if (cachedHtml) {
    res.setHeader('X-Cache', 'HIT');
    return res.send(cachedHtml);
  }
  
  // 渲染页面
  const html = await renderApp(req);
  
  // 缓存结果（5分钟过期）
  await redis.setex(cacheKey, 300, html);
  
  res.setHeader('X-Cache', 'MISS');
  res.send(html);
}
```

#### 2. 代码分割和懒加载

```javascript
// 动态导入组件
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));
const AdminPanel = lazy(() => import('./AdminPanel'));

function App() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <Route path="/heavy" component={HeavyComponent} />
        <Route path="/admin" component={AdminPanel} />
      </Suspense>
    </div>
  );
}

// 服务端也支持代码分割
import { renderToPipeableStream } from 'react-dom/server';

app.get('/', (req, res) => {
  const { pipe } = renderToPipeableStream(
    <App />,
    {
      bootstrapModules: ['/client.js'],
      // 按需加载 chunks
      onAllReady() {
        pipe(res);
      }
    }
  );
});
```

#### 3. 数据预取和缓存

```javascript
// 数据预取中间件
import { QueryCache, QueryClient } from '@tanstack/react-query';

const queryCache = new QueryCache();
const queryClient = new QueryClient({ queryCache });

async function prefetchData(req, res, next) {
  // 为 SSR 预取数据
  await queryClient.prefetchQuery(['user'], fetchUser);
  
  // 将 QueryClient 状态传递给客户端
  const dehydratedState = dehydrate(queryClient);
  
  res.locals.dehydratedState = dehydratedState;
  next();
}

// 服务端组件使用数据
function UserList() {
  const { data } = useQuery(['users'], fetchUsers, {
    staleTime: 5000, // 5秒内使用缓存
    cacheTime: 10000, // 缓存10秒
  });
  
  return <div>{/* 渲染用户列表 */}</div>;
}

// 客户端恢复状态
function App({ dehydratedState }) {
  const [queryClient] = useState(() => 
    new QueryClient({
      defaultOptions: { queries: { staleTime: 5000 } }
    })
  );
  
  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={dehydratedState}>
        <UserList />
      </Hydrate>
    </QueryClientProvider>
  );
}
```

#### 4. CDN 和静态资源优化

```javascript
// 静态资源 CDN 配置
// next.config.js
module.exports = {
  assetPrefix: 'https://cdn.example.com',
  images: {
    domains: ['cdn.example.com'],
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
};

// 图片优化
import Image from 'next/image';

function ProductCard({ product }) {
  return (
    <div>
      <Image
        src={product.image}
        alt={product.name}
        width={300}
        height={200}
        loading="lazy"  // 懒加载
        placeholder="blur"  // 模糊占位
        blurDataURL="data:image/jpeg;base64,/..."  // 模糊数据
      />
    </div>
  );
}
```

#### 5. 流式渲染优化

```javascript
// 使用 Suspense 实现渐进式渲染
import { Suspense } from 'react';

async function ProductPage({ id }) {
  const product = await getProduct(id);
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      
      {/* 关键内容优先渲染 */}
      <ProductPrice price={product.price} />
      
      {/* 评论等非关键内容延迟加载 */}
      <Suspense fallback={<div>Loading reviews...</div>}>
        <ProductReviews productId={id} />
      </Suspense>
      
      <Suspense fallback={<div>Loading recommendations...</div>}>
        <ProductRecommendations productId={id} />
      </Suspense>
    </div>
  );
}
```

#### 6. 服务端缓存和 ISR

```javascript
// Next.js ISR（增量静态再生）
export async function getStaticProps() {
  const products = await getProducts();
  
  return {
    props: { products },
    revalidate: 60,  // 60秒后重新生成
  };
}

// 按需 ISR
export async function getStaticPaths() {
  const products = await getProducts();
  
  return {
    paths: products.map(p => ({ params: { id: p.id } })),
    fallback: 'blocking',  // 按需生成
  };
}

// 自定义 ISR 逻辑
function withISR(handler, revalidateTime) {
  return async (req, res) => {
    const cacheKey = `isr:${req.url}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age < revalidateTime * 1000) {
        return res.send(data);
      }
    }
    
    // 重新生成
    const result = await handler(req, res);
    
    // 异步更新缓存
    setImmediate(async () => {
      const freshResult = await handler(req, res);
      await redis.setex(
        cacheKey,
        revalidateTime,
        JSON.stringify({
          data: freshResult,
          timestamp: Date.now()
        })
      );
    });
    
    return result;
  };
}
```

#### 7. 性能监控

```javascript
// 服务端性能监控
import { performance } from 'perf_hooks';

function withPerformanceLogging(handler) {
  return async (req, res, next) => {
    const start = performance.now();
    
    // 标记开始
    performance.mark('ssr-start');
    
    try {
      const result = await handler(req, res, next);
      
      // 标记结束
      performance.mark('ssr-end');
      performance.measure('ssr-duration', 'ssr-start', 'ssr-end');
      
      const measure = performance.getEntriesByName('ssr-duration')[0];
      const duration = measure.duration;
      
      // 记录到监控系统
      console.log(`SSR ${req.url} took ${duration}ms`);
      
      // 上报到监控系统（如 Sentry, Datadog）
      trackPerformance('ssr', {
        url: req.url,
        duration,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error('SSR error:', error);
      throw error;
    }
  };
}

// 使用
app.get('*', withPerformanceLogging(renderWithCache));
```

### 同构渲染解决的性能指标

#### 1. SEO 相关指标

```javascript
// 1. 搜索引擎爬虫可以直接读取内容
// 传统 SPA：爬虫只能看到空的 <div id="root"></div>
// SSR：爬虫可以看到完整的 HTML 内容

// 2. Meta 标签和 Open Graph
export async function getServerSideProps(context) {
  const product = await getProduct(context.params.id);
  
  return {
    props: { product },
    // 动态设置 Meta 标签
    meta: {
      title: product.name,
      description: product.description,
      openGraph: {
        title: product.name,
        images: [product.image],
        url: `https://example.com/product/${product.id}`,
      },
    },
  };
}
```

**解决的指标：**
- SEO 排名提升
- 社交媒体分享预览优化
- 搜索引擎收录速度

#### 2. 首屏渲染指标

```javascript
// 性能对比
// CSR (Client-Side Rendering):
// - TTFB: 100ms
// - First Paint: 100ms (空白 HTML)
// - FCP: 1500ms (等待 JS 加载和执行)
// - LCP: 2500ms
// - TTI: 3000ms

// SSR (Server-Side Rendering):
// - TTFB: 300ms (服务器渲染时间)
// - First Paint: 350ms (已有 HTML 内容)
// - FCP: 400ms (立即显示内容)
// - LCP: 800ms
// - TTI: 1200ms
```

**解决的指标：**

| 指标 | CSR | SSR | 提升 |
|------|-----|-----|------|
| TTFB | 100ms | 300ms | ↓ 200ms |
| FCP | 1500ms | 400ms | ↓ 73% |
| LCP | 2500ms | 800ms | ↓ 68% |
| TTI | 3000ms | 1200ms | ↓ 60% |
| CLS | 0.25 | 0.05 | ↓ 80% |

#### 3. 用户体验指标

```javascript
// 1. 减少 CLS (Cumulative Layout Shift)
// SSR 内容预先渲染，减少布局偏移

// 2. 减少 LCP (Largest Contentful Paint)
// 关键内容立即显示，不需要等待 JS

// 3. 减少 FID (First Input Delay)
// 部分交互立即可用（使用选择性 Hydration）

// 4. 提升 TBT (Total Blocking Time)
// 减少主线程阻塞时间
```

#### 4. 网络性能指标

```javascript
// 1. 减少初始 HTML 加载时间
// 返回的是完整 HTML，而不是空白页面

// 2. 减少关键资源加载
// 内联关键 CSS
<style dangerouslySetInnerHTML={{ __html: criticalCss }} />

// 3. 优化资源加载顺序
<link rel="preload" href="/critical.css" as="style" />
<link rel="prefetch" href="/next-page.js" as="script" />
```

### 我的落地实践

```javascript
// 完整的 SSR 优化方案
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import { Helmet } from 'react-helmet';
import Redis from 'ioredis';

const app = express();
const redis = new Redis();

// 1. 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 2. 静态资源
app.use(express.static('public', {
  maxAge: '1y',
  etag: true,
}));

// 3. 性能监控中间件
app.use((req, res, next) => {
  req.startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
    
    // 上报到监控系统
    trackRequest({
      method: req.method,
      url: req.url,
      duration,
      status: res.statusCode
    });
  });
  next();
});

// 4. SSR 渲染路由
app.get('*', async (req, res) => {
  const start = Date.now();
  
  try {
    // 缓存检查
    const cacheKey = `ssr:${req.url}:${req.headers['user-agent']}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached);
    }
    
    // 渲染应用
    const helmetContext = {};
    const { pipe } = renderToPipeableStream(
      <App url={req.url} />,
      {
        bootstrapModules: ['/client.js'],
        onShellReady() {
          const helmet = Helmet.renderStatic();
          
          // 构建完整 HTML
          const html = `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                ${helmet.title.toString()}
                ${helmet.meta.toString()}
                ${helmet.link.toString()}
                <link rel="stylesheet" href="/styles.css" />
              </head>
              <body>
                <div id="root"></div>
                <script src="/client.js" defer></script>
              </body>
            </html>
          `;
          
          // 写入 HTML 头部
          res.write(html.replace('<div id="root"></div>', ''));
          res.write('<div id="root">');
          
          // 流式发送内容
          pipe(res);
        },
        
        onShellError(error) {
          console.error('Shell error:', error);
          res.status(500).send('Error loading application');
        },
        
        onAllReady() {
          const duration = Date.now() - start;
          console.log(`SSR completed in ${duration}ms`);
        }
      }
    );
    
  } catch (error) {
    console.error('SSR error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('SSR server running on port 3000');
});
```

### 总结

**同构渲染解决的核心性能指标：**

1. **FCP (First Contentful Paint)** - 首次内容绘制时间
2. **LCP (Largest Contentful Paint)** - 最大内容绘制时间
3. **TTI (Time to Interactive)** - 可交互时间
4. **CLS (Cumulative Layout Shift)** - 累积布局偏移
5. **SEO 排名和收录**
6. **社交媒体分享优化**
7. **首屏加载速度**
8. **用户体验感知**

**关键优化策略：**
1. 缓存策略（Redis CDN）
2. 代码分割和懒加载
3. 数据预取和缓存
4. 流式渲染和 Suspense
5. 静态资源优化
6. 性能监控和告警
7. ISR 和按需渲染

---

## 26、React 进行ServerLess渲染时候项目需要做哪些改变？

### Serverless 渲染的架构调整

#### 1. 项目结构改造

```javascript
// 传统项目结构
// next.config.js
module.exports = {
  target: 'server',
  // 配置
};

// Serverless 项目结构
// next.config.js
module.exports = {
  target: 'serverless',
  // 或者在每个页面单独配置
  // export const config = { runtime: 'nodejs' };
};
```

#### 2. 环境变量管理

```javascript
// 服务器端环境变量
// .env.production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
API_KEY=xxxxxx

// 构建时环境变量
// .env.production.build
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=G-XXXXXX

// 运行时环境变量（Serverless）
// 使用环境变量注入
module.exports = {
  env: {
    // 构建时确定
    BUILD_TIME: new Date().toISOString(),
    // 运行时确定（Serverless 函数）
    RUNTIME_ENV: process.env.NODE_ENV,
  },
};
```

#### 3. 数据库连接优化

```javascript
// 问题：Serverless 环境中数据库连接不能长时间保持
// 解决方案：使用连接池或每次请求新建连接

// 方案1：使用连接池（推荐）
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 在 Serverless 函数中使用
export async function getServerSideProps() {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT * FROM users');
    return { props: { users: result.rows } };
  } finally {
    client.release(); // 释放连接回池
  }
}

// 方案2：每次请求新建连接（简单场景）
import { Pool } from 'pg';

export async function handler(event) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const result = await pool.query('SELECT * FROM users');
    return { users: result.rows };
  } finally {
    await pool.end(); // 关闭连接
  }
}

// 方案3：使用 Serverless 专用的数据库客户端
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

#### 4. 文件系统处理

```javascript
// 问题：Serverless 环境中文件系统是临时的
// 解决方案：使用对象存储（S3）

// 错误做法（文件会丢失）
export async function uploadFile(file) {
  const path = `/uploads/${file.name}`;
  fs.writeFileSync(path, file.buffer);
  return path; // 下次请求时文件已不存在
}

// 正确做法：使用 S3
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function uploadFile(file) {
  const key = `uploads/${uuidv4()}-${file.name}`;
  
  await s3.upload({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }).promise();
  
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
}
```

#### 5. 会话管理

```javascript
// 问题：Serverless 函数无状态，内存不持久
// 解决方案：使用外部存储（Redis、DynamoDB）

// 错误做法（内存会丢失）
const sessions = {};

export async function handler(event) {
  const sessionId = event.cookies.sessionId;
  sessions[sessionId] = userData; // 下次请求时已丢失
}

// 正确做法：使用 Redis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function handler(event) {
  const sessionId = event.cookies.sessionId;
  
  // 存储会话
  await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(userData));
  
  // 获取会话
  const session = await redis.get(`session:${sessionId}`);
  return JSON.parse(session);
}
```

#### 6. 请求超时处理

```javascript
// 问题：Serverless 函数有执行时间限制（如 Lambda 15分钟）
// 解决方案：超时重试、分片处理

// 1. 超时重试
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// 2. 分片处理
async function processLargeData(data) {
  const chunkSize = 100;
  const chunks = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    chunks.push(processChunk(chunk));
  }
  
  return Promise.all(chunks);
}

// 3. 使用 SQS 队列异步处理
import { SQS } from 'aws-sdk';

const sqs = new SQS();

async function queueTask(task) {
  await sqs.sendMessage({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(task),
  }).promise();
}
```

#### 7. 日志和监控

```javascript
// 问题：Serverless 环境中没有标准日志
// 解决方案：结构化日志、云监控

// 结构化日志
export async function handler(event) {
  const startTime = Date.now();
  
  try {
    const result = await processRequest(event);
    
    const log = {
      timestamp: new Date().toISOString(),
      requestId: event.requestContext?.requestId,
      duration: Date.now() - startTime,
      status: 'success',
      result: result,
    };
    
    console.log(JSON.stringify(log));
    return result;
    
  } catch (error) {
    const log = {
      timestamp: new Date().toISOString(),
      requestId: event.requestContext?.requestId,
      duration: Date.now() - startTime,
      status: 'error',
      error: error.message,
      stack: error.stack,
    };
    
    console.error(JSON.stringify(log));
    throw error;
  }
}

// 集成 CloudWatch 或 Datadog
import { Datadog } from 'datadog-lambda-js';

const tracer = require('dd-trace').init({
  logInjection: true,
  analytics: true,
});

export const handler = wrap(handler, { tracer });
```

#### 8. 配置文件调整

```javascript
// next.config.js - Serverless 优化
module.exports = {
  target: 'serverless',
  
  // 减少包大小
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = ['aws-sdk']; // 不打包 aws-sdk
    }
    return config;
  },
  
  // 环境变量
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
  
  // 图片优化配置
  images: {
    domains: ['s3.amazonaws.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

// package.json - 依赖优化
{
  "dependencies": {
    "next": "^13.0.0",
    "react": "^18.0.0",
    "aws-lambda": "^1.0.0",
    "aws-sdk": "^2.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

#### 9. 部署配置

```javascript
// 使用 Serverless Framework
// serverless.yml
service: nextjs-app

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  
functions:
  api:
    handler: .next/serverless/pages/index.js
    events:
      - httpApi:
          path: /{proxy+}
          method: any
    timeout: 28  # 接近 Lambda 限制
    memorySize: 1024
    
    environment:
      DATABASE_URL: ${env:DATABASE_URL}
      REDIS_URL: ${env:REDIS_URL}
      
  imageOptimizer:
    handler: .next/serverless/image-handler.js
    timeout: 30
    memorySize: 2048

plugins:
  - serverless-nextjs-plugin

custom:
  serverless-nextjs:
    nextConfigDir: ./
    
// 使用 AWS SAM
// template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  NextJSFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: nextjs-app
      Handler: .next/serverless/pages/index.handler
      Runtime: nodejs18.x
      Timeout: 28
      MemorySize: 1024
      Environment:
        Variables:
          DATABASE_URL: !Ref DatabaseUrl
          REDIS_URL: !Ref RedisUrl
      Events:
        HttpApi:
          Type: HttpApi
          Properties:
            Path: /{proxy+}
            Method: any
```

#### 10. 优化建议

```javascript
// 1. 减少冷启动时间
// - 使用 AWS Lambda Provisioned Concurrency
// - 保持函数温暖（定时 ping）
const keepWarm = async () => {
  await fetch('https://your-api.com/health');
};

// 每 5 分钟调用一次保持温暖
setInterval(keepWarm, 5 * 60 * 1000);

// 2. 优化内存使用
// - 合理设置内存大小
// - 清理不必要的变量
export async function handler(event) {
  let result;
  
  try {
    result = await processRequest(event);
  } finally {
    // 清理大对象
    event = null;
  }
  
  return result;
}

// 3. 使用 Edge Functions（Vercel）
// next.config.js
module.exports = {
  experimental: {
    // 使用边缘函数
    serverComponentsExternalPackages: ['sharp'],
  },
};

// pages/api/edge.js
export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  return new Response('Hello from Edge!');
}
```

### 总结

**Serverless 渲染需要的主要改变：**

1. **架构调整**
   - 使用 `target: 'serverless'` 配置
   - 无状态设计
   - 函数独立部署

2. **资源管理**
   - 数据库连接池
   - 文件存储改用 S3
   - 会话存储改用 Redis

3. **性能优化**
   - 减少冷启动
   - 优化包大小
   - 合理设置超时

4. **监控调试**
   - 结构化日志
   - 分布式追踪
   - 错误监控

5. **部署策略**
   - 使用 Serverless Framework
   - 或云厂商原生工具（AWS SAM）
   - 或平台即服务（Vercel Netlify）

---

## 27、刚才你也提到了可以部署的平台有很多，那么每个平台进行JS冷启动的区别是什么呢？

### JS 冷启动在不同平台的区别

#### 1. Vercel

**冷启动特点：**
- 使用 Serverless Functions (AWS Lambda)
- 默认超时：10秒（Pro plan 可以到 60秒）
- 默认内存：1024MB（可配置到 3008MB）

```javascript
// Vercel 冷启动机制
// pages/api/hello.js
export default function handler(req, res) {
  // 首次请求：冷启动 ~500-2000ms
  // 后续请求：热启动 ~50-200ms
  res.json({ message: 'Hello' });
}

// 优化策略
export const config = {
  // 1. 使用 Edge Functions 减少冷启动
  runtime: 'edge',
  
  // 2. 预热函数
  maxDuration: 30,  // 增加超时
};
```

**冷启动时间：**
- 首次请求：500-2000ms
- 热启动：50-200ms
- Edge Functions：50-300ms（更快但有限制）

**优化建议：**
- 使用 Edge Functions 处理简单请求
- 启用 ISR 减少动态渲染
- 使用 Vercel KV 缓存数据

#### 2. Netlify

**冷启动特点：**
- 使用 AWS Lambda
- 默认超时：10秒
- 支持 Netlify Functions（Go、Node.js、Rust）

```javascript
// Netlify Functions
// functions/api/hello.js
exports.handler = async (event, context) => {
  // 冷启动：600-3000ms
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello' }),
  };
};

// 优化：使用 Netlify Edge Functions
// edge-functions/api/hello.js
export default (request) => {
  // 冷启动：100-500ms（更快）
  return new Response('Hello from Edge!');
};
```

**冷启动时间：**
- Netlify Functions：600-3000ms
- Netlify Edge Functions：100-500ms
- 后续请求：50-150ms

**优化建议：**
- 使用 Edge Functions 处理频繁访问
- 启用 Netlify Background Functions
- 使用 Netlify Large Media 处理图片

#### 3. AWS Lambda

**冷启动特点：**
- 原生 Serverless
- 高度可配置
- 支持多种运行时

```javascript
// AWS Lambda Handler
exports.handler = async (event) => {
  // 冷启动：500-3000ms
  // 配置不同，冷启动时间不同
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello' }),
  };
};

// 优化策略
// 1. 使用 Provisioned Concurrency
const lambda = new AWS.Lambda();

// 2. 使用 SnapStart（Java）或类似机制
// 3. 合理配置内存（内存越大，启动越快）
const memorySize = 2048; // 2048MB 比 512MB 启动快
```

**冷启动时间：**
- 128MB 内存：2000-5000ms
- 512MB 内存：1000-3000ms
- 1024MB 内存：500-2000ms
- 2048MB 内存：300-1500ms
- Provisioned Concurrency：<10ms

**优化建议：**
- 增加内存大小（更快）
- 使用 Provisioned Concurrency（消除冷启动）
- 使用 SnapStart（Java）或 Layer 复制代码

#### 4. Google Cloud Functions

**冷启动特点：**
- 使用 Cloud Run（Gen 2）
- 默认超时：1小时
- 支持 Gen 1 和 Gen 2

```javascript
// Cloud Functions Gen 2
const functions = require('@google-cloud/functions-framework');

functions.http('hello', async (req, res) => {
  // 冷启动：300-1500ms（比 Lambda 快）
  res.json({ message: 'Hello' });
});

// Cloud Run（更灵活）
// index.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello' });
});

module.exports = app;
```

**冷启动时间：**
- Gen 1：500-3000ms
- Gen 2：300-1500ms（更快）
- Cloud Run：200-1000ms

**优化建议：**
- 使用 Gen 2（更快）
- 设置最小实例数
- 使用 Cloud Run（更灵活）

#### 5. Cloudflare Workers

**冷启动特点：**
- V8 Isolate 模型
- 极快的冷启动
- 全球边缘网络

```javascript
// Cloudflare Workers
export default {
  async fetch(request) {
    // 冷启动：10-100ms（极快！）
    return new Response('Hello from Cloudflare!');
  },
};

// Pages Functions
export async function onRequestGet(context) {
  // 冷启动：50-200ms
  return new Response('Hello!');
}
```

**冷启动时间：**
- Cloudflare Workers：10-100ms（最快）
- Cloudflare Pages Functions：50-200ms
- 后续请求：1-10ms

**优化建议：**
- 使用 Workers 处理频繁请求
- 利用 KV 存储缓存
- 使用 D1 数据库

#### 6. 阿里云函数计算

**冷启动特点：**
- 类似 AWS Lambda
- 支持多种运行时

```javascript
// 阿里云 FC
exports.handler = async (event, context) => {
  // 冷启动：800-4000ms
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello' }),
  };
};

// 使用 Custom Runtime
// 使用 Docker 镜像启动更快
```

**冷启动时间：**
- 128MB：1500-5000ms
- 512MB：800-3000ms
- 1024MB：500-2000ms
- Custom Runtime：300-1500ms

**优化建议：**
- 增加内存配置
- 使用 Custom Runtime
- 使用预留实例

#### 7. 腾讯云 SCF

**冷启动特点：**
- 类似 AWS Lambda
- 支持多种运行时

```javascript
// 腾讯云 SCF
exports.main_handler = async (event, context) => {
  // 冷启动：1000-4000ms
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello' }),
  };
};
```

**冷启动时间：**
- 128MB：1500-5000ms
- 512MB：1000-3000ms
- 1024MB：500-2000ms

**优化建议：**
- 增加内存配置
- 使用预置并发
- 使用层（Layer）优化

### 平台对比

| 平台 | 冷启动时间 | 热启动 | 优势 | 劣势 |
|------|-----------|---------|------|------|
| Vercel | 500-2000ms | 50-200ms | 易用、集成好 | 限制较多、贵 |
| Netlify | 600-3000ms | 50-150ms | 功能丰富、免费额度大 | 冷启动较慢 |
| AWS Lambda | 500-3000ms | 10-100ms | 灵活、功能强大 | 配置复杂 |
| Google Cloud | 300-1500ms | 10-50ms | 速度快、集成好 | 文档较少 |
| Cloudflare | 10-100ms | 1-10ms | 极快、免费 | 限制多 |
| 阿里云 | 800-4000ms | 50-200ms | 国内访问快 | 冷启动慢 |
| 腾讯云 | 1000-4000ms | 50-200ms | 国内访问快 | 冷启动慢 |

### 冷启动优化策略

#### 1. 通用优化

```javascript
// 1. 减少依赖和包大小
// package.json
{
  "dependencies": {
    // 只使用必要的依赖
    "lodash-es": "^4.17.0",  // 使用 ES 模块版本
  },
  "scripts": {
    "build": "webpack --mode production"
  }
}

// 2. 初始化优化
// 在全局作用域初始化（只在冷启动时执行）
let dbConnection;

export async function handler(event) {
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
  }
  
  return processRequest(event);
}

// 3. 使用轻量级运行时
// 使用 Bun 或 Deno 替代 Node.js
export default {
  async fetch(request) {
    return new Response('Hello from Bun!');
  },
};
```

#### 2. 平台特定优化

```javascript
// Vercel 优化
// 1. 使用 Edge Functions
export const config = {
  runtime: 'edge',
};

// 2. 启用 ISR
export async function getStaticProps() {
  return {
    props: { data },
    revalidate: 60,
  };
}

// AWS Lambda 优化
// 1. 使用 Provisioned Concurrency
const lambda = new AWS.Lambda();

await lambda.updateFunctionConcurrency({
  FunctionName: 'my-function',
  ProvisionedConcurrentExecutions: 5,
}).promise();

// 2. 使用 SnapStart（Java）
// 或使用 Lambda Layers 预加载依赖

// Cloudflare 优化
// 1. 使用 KV 缓存
const cache = await MY_KV.get('key');
if (cache) {
  return new Response(cache);
}

// 2. 使用 D1 数据库（Edge SQL）
const result = await env.DB.prepare('SELECT * FROM users').all();
```

#### 3. 预热策略

```javascript
// 1. 定时 ping 保持温暖
const keepWarm = async () => {
  await fetch('https://your-api.com/health');
};

// 每 5 分钟调用一次
setInterval(keepWarm, 5 * 60 * 1000);

// 2. 使用 CloudWatch Events 触发
// AWS Lambda
{
  "Events": [{
    "Type": "Schedule",
    "Properties": {
      "ScheduleExpression": "rate(5 minutes)"
    }
  }]
}

// 3. 使用外部服务监控
// UptimeRobot、Pingdom 等定时访问
```

### 实际测试数据

```javascript
// 测试脚本：测量不同平台的冷启动时间
const platforms = [
  'https://vercel-app.com/api/hello',
  'https://netlify-app.com/api/hello',
  'https://aws-lambda-app.com/hello',
  'https://gcp-app.com/hello',
  'https://cloudflare-app.com/hello',
];

async function testColdStart(url) {
  const times = [];
  
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    await fetch(url);
    const duration = Date.now() - start;
    times.push(duration);
    
    // 等待 30 秒让函数冷却
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  return {
    avg: times.reduce((a, b) => a + b) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
  };
}

// 测试结果示例（仅供参考）
const results = {
  Vercel: { avg: 1200, min: 500, max: 2000 },
  Netlify: { avg: 1500, min: 600, max: 3000 },
  AWS: { avg: 1800, min: 500, max: 3000 },
  GCP: { avg: 1000, min: 300, max: 1500 },
  Cloudflare: { avg: 50, min: 10, max: 100 },
};
```

### 选择建议

**选择标准：**

1. **需要极快响应**
   - 选择：Cloudflare Workers
   - 场景：API 网关、缓存层、轻量计算

2. **国内访问优化**
   - 选择：阿里云 FC、腾讯云 SCF
   - 场景：面向国内用户

3. **易用性和集成**
   - 选择：Vercel、Netlify
   - 场景：前端团队、快速开发

4. **灵活性和控制力**
   - 选择：AWS Lambda、Google Cloud Functions
   - 场景：复杂后端、企业应用

5. **成本敏感**
   - 选择：Cloudflare（免费额度大）、Netlify
   - 场景：个人项目、小流量应用

### 总结

**冷启动对比：**

1. **最快**：Cloudflare Workers（10-100ms）
2. **较快**：Google Cloud（300-1500ms）、Vercel（500-2000ms）
3. **中等**：AWS Lambda（500-3000ms）、Netlify（600-3000ms）
4. **较慢**：阿里云（800-4000ms）、腾讯云（1000-4000ms）

**关键因素：**
- 平台架构（V8 Isolate vs 容器）
- 内存配置（内存越大越快）
- 代码大小（越小越快）
- 依赖数量（越少越快）
- 地理位置距离（越近越快）

**优化方向：**
- 减少代码和依赖
- 增加内存配置
- 使用预置并发
- 使用边缘计算
- 实施预热策略
- 利用缓存机制
