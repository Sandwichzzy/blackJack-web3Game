# Blackjack Web3 游戏

这是一个基于 [Next.js](https://nextjs.org) 和 Web3 技术构建的黑杰克游戏项目，使用 [`create-wagmi`](https://github.com/wevm/wagmi/tree/main/packages/create-wagmi) 脚手架创建。

## 项目概述

一个现代化的 Web3 黑杰克游戏，集成了区块链功能和云数据库存储。

## 技术栈

- **前端框架**: Next.js 14 with React 18
- **Web3 集成**: Wagmi + Viem
- **样式**: Tailwind CSS
- **数据库**: AWS DynamoDB
- **开发语言**: TypeScript

## 项目架构

### 页面结构

- **主页面** (`src/app/page.tsx`): 游戏主界面，包含游戏区域和控制按钮
- **API 路由** (`src/app/api/route.ts`): 游戏逻辑处理，包括发牌、抽牌、站立等操作

### 核心功能

1. **游戏逻辑**: 标准黑杰克规则实现
2. **Web3 集成**: 区块链钱包连接和交易
3. **分数存储**: AWS DynamoDB 存储玩家分数
4. **实时游戏**: 即时的游戏状态更新

### 数据库设计

**DynamoDB 表: blackJack**

- Partition Key: `player` (string) - 玩家标识
- 属性: `score` (number) - 玩家分数

### 样式设计

- 使用 Tailwind CSS 实现响应式设计
- 现代化的卡牌游戏界面
- 流畅的动画和交互效果

## 开发说明

### 环境变量

需要配置以下环境变量：

```env
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 安装依赖

```bash
pnpm install
```

### 运行开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
pnpm start
```

## API 接口

### GET /api

初始化游戏，发放初始卡牌

### POST /api

游戏操作接口

- `action: "hit"` - 抽牌
- `action: "stand"` - 站立

## 游戏规则

1. 玩家和庄家各发 2 张牌
2. 玩家可以选择抽牌(Hit)或站立(Stand)
3. 目标是让手牌总值尽可能接近 21 但不超过
4. A 可以算作 1 或 11，J/Q/K 算作 10
5. 超过 21 点为爆牌(Bust)
6. 分数规则：胜利+100 分，失败-100 分，平局 0 分
