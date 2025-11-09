# 🧠 Horizon Trading Platform - Backend

A **microservices-based Solana trading platform** built with TypeScript, Node.js, and Redis. It powers real-time token trading with WebSocket updates, wallet monitoring, and transaction execution through Jito Block Engine or Bloxroute.

## ✨ Features

- 🔄 **Real-time trading**: Buy/sell Solana tokens with instant execution
- 🚀 **Dual execution modes**: Standard (Jito Block Engine) and Turbo (Bloxroute)
- 📊 **Live portfolio tracking**: Automatic wallet monitoring with WebSocket updates
- 🏗️ **Microservices architecture**: Scalable services with Redis Pub/Sub coordination
- ⚡ **High availability**: Distributed locking and graceful failover
- 🔐 **Secure sessions**: Encrypted wallet keys with Redis-backed sessions

---

## 🏗️ Architecture

This backend consists of **3 microservices**:

### **1. `shared/` - Common Library**

Shared utilities, types, and configurations used across all services.

**Exports:**

- Logger (Pino-based structured logging)
- Redis client factory
- Environment variables & constants
- Token metadata utilities
- TypeScript interfaces

### **2. `main-api/` - REST API Server**

HTTP server handling authentication, trading operations, and WebSocket connections.

**Endpoints:**

- `POST /api/user/loadKey` - Load wallet
- `POST /api/user/logout` - Logout and stop tracking
- `GET /api/user/balance` - Get SOL balance
- `GET /api/user/tracked-tokens` - Get token portfolio
- `POST /api/swap/buy` - Buy tokens (SOL → Token)
- `POST /api/swap/sell` - Sell tokens (Token → SOL)
- `POST /api/demo/*` - Demo trading mode

**Features:**

- Express sessions stored in Redis
- Rate limiting (1533 req/10s)
- WebSocket server with Redis Pub/Sub sync
- CORS configured for frontend

### **3. `wallet-listener/` - Blockchain Monitor**

Background service that monitors Solana wallets in real-time.

**Features:**

- Listens to blockchain transactions via Solana WebSocket
- Distributed locking (prevents duplicate monitoring)
- Reconciliation loop (syncs every 5 seconds)
- Publishes updates to Redis Pub/Sub
- SOL price caching plugin

---

## 💪 Setup

### Prerequisites

- Node.js 22+
- Redis (or use Docker Compose)
- Solana RPC endpoint (Helius, QuickNode, etc.)

### 1. Clone the repository

```bash
git clone https://github.com/hamoudilaz/horizon-server.git
cd horizon-server/backend
```

### 2. Install dependencies

```bash
npm install
```

This installs dependencies for all workspaces (`shared`, `main-api`, `wallet-listener`).

### 3. Configure environment variables

Create `.env` files in both `main-api/` and `wallet-listener/`:

**`main-api/.env`:**

```env
# Jupiter API
JUP_QUOTE=https://lite-api.jup.ag/swap/v1/quote
JUP_SWAP=https://lite-api.jup.ag/swap/v1/swap

# Jito Block Engine
JITO_RPC=https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/transactions

# Bloxroute (Turbo Mode)
BLOXROUTE_URL=https://your-bloxroute-endpoint
BLOXROUTE_AUTH=your_bloxroute_auth_header

# Solana RPC
RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key
WSS_URL=wss://your-wss-endpoint

# Redis
REDIS_URL=redis://localhost:6379

# Security
SESSION_SECRET=your-secret-key-here
ENCRYPTION_KEY=your-32-byte-hex-key

# Frontend
FRONTEND_URL_CORS=http://localhost:5173
NODE_ENV=development
PORT=3000

# Logging
LOG_LEVEL=info
```

**`wallet-listener/.env`:**

```env
# Solana RPC
RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key
WSS_URL=wss://your-wss-endpoint

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

> 🔑 **Free RPC**: Sign up at [helius.dev](https://www.helius.dev) or [shyft.io](https://shyft.io)  
> ⚡ **Bloxroute access**: Sign up at [bloxroute.com](https://bloxroute.com) for ultra-fast transaction routing

---

## 🚀 Running the Platform

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up --build
```

This starts:

- Redis on port 6379
- `main-api` on port 3000
- `wallet-listener` (background service)

### Option 2: Local Development

**Terminal 1 - Start Redis:**

```bash
redis-server
```

**Terminal 2 - Build shared package:**

```bash
npm run build -w @horizon/shared
```

**Terminal 3 - Start main API:**

```bash
npm run dev:main-api
```

**Terminal 4 - Start wallet listener:**

```bash
npm run dev:listener
```

**Access the API:**
👉 **[http://localhost:3000](http://localhost:3000)**

**Frontend:**
Clone from: [https://github.com/hamoudilaz/client-horizon](https://github.com/hamoudilaz/client-horizon)

---

## ⚙️ How It Works

### Trading Modes

**Standard Mode:**

- Uses Jito Block Engine for transaction bundling
- Endpoint: `JITO_RPC`
- Best for: Regular trading with MEV protection

**Turbo Mode:**

- Activated when `node: true` in buy/sell request
- Routes through Bloxroute for ultra-fast transaction routing
- Best for: Sniping and high-speed trades

### Real-time Updates Flow

```
1. User buys token via POST /api/swap/buy
   └─ Transaction submitted to Solana

2. wallet-listener detects transaction
   ├─ Decodes token mint & balance
   ├─ Fetches metadata (logo, symbol)
   └─ Publishes to Redis: ws-messages channel

3. main-api receives Pub/Sub message
   └─ Forwards to WebSocket clients

4. Frontend updates UI in real-time
```

### Redis Architecture

**Data Storage:**

- `active-wallets` (SET) - Wallets being monitored
- `tracked-tokens:{pubKey}` (HASH) - User portfolios
- `lock:{pubKey}` (STRING) - Distributed locks (30s TTL)
- `sol-price` (STRING) - Cached SOL/USD price
- `sess:{sessionId}` (STRING) - Express sessions

**Pub/Sub Channels:**

- `ws-messages` - User-specific wallet updates
- `ws-demo-broadcast` - Demo mode events

---

## 📂 Project Structure

```
backend/
├── shared/                    # Common library (@horizon/shared)
│   ├── src/
│   │   ├── logger.ts         # Pino logger
│   │   ├── redisClient.ts    # Redis factory
│   │   ├── env.ts            # Environment variables
│   │   ├── constants.ts      # Global constants
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── utils/
│   │       └── price.service.ts  # Price utilities
│   └── package.json
│
├── main-api/                  # REST API & WebSocket server
│   ├── src/
│   │   ├── server.ts         # Entry point
│   │   ├── app.ts            # Express app setup
│   │   ├── api/              # Route handlers
│   │   │   ├── user/         # User endpoints
│   │   │   ├── swap/         # Trading endpoints
│   │   │   └── demo/         # Demo mode
│   │   ├── config/
│   │   │   ├── redis.ts      # Redis clients
│   │   │   └── websocket.setup.ts  # WebSocket + Pub/Sub
│   │   ├── services/
│   │   │   ├── engine/       # Jito & Bloxroute executors
│   │   │   ├── solana/       # Blockchain utilities
│   │   │   └── validation/   # Input validators
│   │   └── core/
│   │       ├── middlewares/  # Express middlewares
│   │       ├── types/        # TypeScript types
│   │       └── utils/        # Helpers
│   ├── __tests__/            # API tests
│   └── package.json
│
└── wallet-listener/           # Blockchain monitor service
    ├── src/
    │   ├── index.ts          # Entry point
    │   ├── config.ts         # Solana & Redis setup
    │   ├── core/
    │   │   ├── listenerManager.ts  # Wallet subscription logic
    │   │   └── solanaUtils.ts      # Transaction decoders
    │   └── plugins/
    │       └── sol-price.plugin.ts # Price caching
    └── package.json
```

---

## 🧪 Testing

```bash
# Run tests for main-api
npm test -w main-api
```

---

## 🐳 Docker Deployment

**Build images:**

```bash
docker-compose build
```

**Run services:**

```bash
docker-compose up -d
```

**View logs:**

```bash
docker-compose logs -f main-api
docker-compose logs -f wallet-listener
```

---

## 🔐 Security Features

- **Encrypted wallet keys**: AES-256 encryption before storing in sessions
- **Redis-backed sessions**: No in-memory session leaks
- **Rate limiting**: Per-IP request throttling
- **CORS protection**: Configured allowed origins
- **Secure cookies**: `httpOnly`, `secure`, `sameSite` configured

---

## 📈 Scalability

- **Horizontal scaling**: Multiple API instances supported
- **Distributed locking**: Prevents duplicate wallet monitoring
- **Redis Pub/Sub**: Syncs WebSocket messages across instances
- **Graceful shutdown**: SIGTERM/SIGINT handlers

---

## 📬 Contact

For help, ideas, or feedback — open an issue or reach out:

- **Telegram**: [@h3ll0wrld](https://t.me/h3ll0wrld)
- **Twitter**: [@temporal_xyz](https://x.com/temporal_xyz)

---
