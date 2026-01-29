# Kafka Manager 后端服务

基于 Node.js + Express + KafkaJS 的 Kafka 管理后端服务。

## 功能特性

- ✅ 集群管理 - 获取集群信息、Broker 状态
- ✅ Topic 管理 - 查看、创建、删除 Topic
- ✅ Consumer Group 管理 - 查看消费组状态和 Lag
- ✅ 消息管理 - 查看和发送消息
- ✅ 实时指标 - WebSocket 推送实时数据
- ✅ 用户认证 - 登录、登出、用户信息管理

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

配置项说明：

```env
# Kafka 配置
KAFKA_BROKERS=localhost:9092          # Kafka Broker 地址，多个用逗号分隔
KAFKA_CLIENT_ID=kafka-manager         # 客户端 ID
KAFKA_CONNECTION_TIMEOUT=10000        # 连接超时时间(ms)
KAFKA_REQUEST_TIMEOUT=30000           # 请求超时时间(ms)

# 服务器配置
PORT=3001                             # HTTP API 端口
WS_PORT=3002                          # WebSocket 端口

# 认证配置
JWT_SECRET=your-secret-key            # JWT 密钥
ADMIN_USERNAME=admin                  # 管理员用户名
ADMIN_PASSWORD=admin123               # 管理员密码
```

### 3. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 获取当前用户信息 |
| PUT | /api/auth/me | 更新用户信息 |
| PUT | /api/auth/password | 修改密码 |

### 集群接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cluster/info | 获取集群信息 |
| GET | /api/cluster/metrics | 获取集群指标 |
| GET | /api/cluster/health | 健康检查 |

### Broker 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/brokers | 获取所有 Broker |
| GET | /api/brokers/:id | 获取 Broker 详情 |

### Topic 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/topics | 获取所有 Topic |
| GET | /api/topics/:name | 获取 Topic 详情 |
| POST | /api/topics | 创建 Topic |
| DELETE | /api/topics/:name | 删除 Topic |

### Consumer Group 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/consumer-groups | 获取所有 Consumer Group |
| GET | /api/consumer-groups/:groupId | 获取 Consumer Group 详情 |

### 消息接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/messages/:topic | 获取消息 |
| POST | /api/messages/:topic | 发送消息 |
| POST | /api/messages/:topic/batch | 批量发送消息 |

## WebSocket 接口

连接地址: `ws://localhost:3002`

### 消息类型

**客户端发送：**
```json
{ "type": "subscribe", "channel": "metrics" }
{ "type": "unsubscribe", "channel": "metrics" }
{ "type": "ping" }
```

**服务端推送：**
```json
{ "type": "connected", "data": { "clientId": "xxx" } }
{ "type": "metrics", "data": { ... } }
{ "type": "pong", "data": { "timestamp": "..." } }
```

## 与前端对接

前端需要修改 API 调用地址，将 Mock API 替换为真实 API：

```typescript
// src/api/config.ts
export const API_BASE_URL = 'http://localhost:3001/api';
export const WS_URL = 'ws://localhost:3002';
```

## Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001 3002
CMD ["npm", "start"]
```

## 注意事项

1. 确保 Kafka 集群已启动且可访问
2. 生产环境请修改默认密码
3. 建议使用 HTTPS 和 WSS 保护通信
4. 可配置 Nginx 反向代理统一端口
