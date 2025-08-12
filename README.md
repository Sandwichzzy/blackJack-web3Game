# Blackjack Web3 游戏

这是一个基于 [Next.js](https://nextjs.org) 和 Web3 技术构建的黑杰克游戏项目，使用 [`create-wagmi`](https://github.com/wevm/wagmi/tree/main/packages/create-wagmi) 脚手架创建。

## 项目概述

一个现代化的 Web3 黑杰克游戏，集成了区块链功能和云数据库存储。项目包含智能合约、前端游戏界面、API 接口和 Chainlink Functions 集成。

## 技术栈

- **前端框架**: Next.js 14 with React 18
- **Web3 集成**: Wagmi + Viem + Ethers.js
- **智能合约**: Solidity (Chainlink Functions)
- **样式**: Tailwind CSS
- **数据库**: AWS DynamoDB
- **开发语言**: TypeScript + JavaScript
- **包管理器**: pnpm
- **区块链网络**: Avalanche Fuji Testnet

## 项目架构

### 目录结构

```
blackJack-web3Game/
├── contracts/                 # 智能合约
│   └── FunctionsComsumer.sol # Chainlink Functions 消费者合约
├── src/                      # 前端源代码
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API 路由
│   │   │   └── route.ts     # 游戏逻辑处理
│   │   ├── globals.css      # 全局样式
│   │   ├── layout.tsx       # 应用布局
│   │   ├── page.tsx         # 主页面
│   │   └── providers.tsx    # Web3 提供者
│   └── wagmi.ts             # Wagmi 配置
├── uploadSecretToDon.js      # Chainlink Functions 密钥上传脚本
├── flow.png                  # 项目流程图
└── 配置文件...
```

### 页面结构

- **主页面** (`src/app/page.tsx`): 游戏主界面，包含游戏区域和控制按钮
- **API 路由** (`src/app/api/route.ts`): 游戏逻辑处理，包括发牌、抽牌、站立等操作
- **布局组件** (`src/app/layout.tsx`): 应用整体布局和 Web3 提供者配置

### 核心功能

1. **游戏逻辑**: 标准黑杰克规则实现
2. **Web3 集成**: 区块链钱包连接和交易
3. **智能合约**: Chainlink Functions 集成
4. **分数存储**: AWS DynamoDB 存储玩家分数
5. **实时游戏**: 即时的游戏状态更新

### 智能合约

**FunctionsComsumer.sol**: Chainlink Functions 消费者合约，用于处理链上请求和响应。

### 数据库设计

**DynamoDB 表: blackJack**

- Partition Key: `player` (string) - 玩家标识
- 属性: `score` (number) - 玩家分数

### 样式设计

- 使用 Tailwind CSS 实现响应式设计
- 现代化的卡牌游戏界面
- 流畅的动画和交互效果

## 安装和配置

### 环境要求

- Node.js 18+ (推荐使用 LTS 版本)
- pnpm 包管理器
- 支持 Web3 的浏览器钱包 (如 MetaMask)

### 环境变量配置

创建 `.env.local` 文件并配置以下环境变量：

```env
# AWS 配置
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# 区块链配置
ETHEREUM_PROVIDER_AVALANCHEFUJI=your-avalanche-fuji-rpc-url
EVM_PRIVATE_KEY=your-private-key

# Chainlink Functions
AWS_API_KEY=your-aws-api-key
```

### 安装依赖

```bash
# 安装 pnpm (如果未安装)
npm install -g pnpm

# 安装项目依赖
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

### 运行 Chainlink Functions 脚本

```bash
# 上传密钥到 DON
node uploadSecretToDon.js
```

## API 接口

### GET /api

初始化游戏，发放初始卡牌

**响应示例:**

```json
{
  "playerCards": ["A♠", "K♥"],
  "dealerCards": ["7♦", "?"],
  "playerScore": 21,
  "dealerScore": 7,
  "gameStatus": "playing"
}
```

### POST /api

游戏操作接口

**请求体:**

```json
{
  "action": "hit" | "stand",
  "gameState": "当前游戏状态"
}
```

**响应示例:**

```json
{
  "playerCards": ["A♠", "K♥", "5♣"],
  "dealerCards": ["7♦", "J♠"],
  "playerScore": 16,
  "dealerScore": 17,
  "gameStatus": "dealer_won",
  "message": "庄家获胜！"
}
```

## 游戏规则

1. **发牌阶段**: 玩家和庄家各发 2 张牌
2. **玩家回合**: 玩家可以选择抽牌(Hit)或站立(Stand)
3. **目标**: 让手牌总值尽可能接近 21 但不超过
4. **牌值计算**:
   - A 可以算作 1 或 11
   - J/Q/K 算作 10
   - 数字牌按面值计算
5. **爆牌**: 超过 21 点为爆牌(Bust)
6. **分数规则**:
   - 胜利: +100 分
   - 失败: -100 分
   - 平局: 0 分

## 开发指南

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 规则
- 使用 Prettier 进行代码格式化

### 部署

1. **构建项目**

   ```bash
   pnpm build
   ```

2. **部署到 Vercel**

   ```bash
   # 安装 Vercel CLI
   npm i -g vercel

   # 部署
   vercel --prod
   ```

3. **部署智能合约**
   ```bash
   # 使用 Hardhat 或 Foundry 部署
   npx hardhat deploy --network avalanche-fuji
   ```
