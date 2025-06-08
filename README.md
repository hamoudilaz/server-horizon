# 🧠 Solana Trader Backend service

This is the backend server for my Solana-based trading platform. It powers real-time token trading with a focus on speed, precision, and reliability.

You can use this backend to:

* 🔄 Buy/sell based on user input.
* 🚀 Choose between **Standard Mode** (Jito Block Engine) and **Turbo Mode** (Nozomi Validator).
* 📉 Track token balances for managing wallet state.
* ⚡ Handle connection fallbacks and ensure consistent execution even under load.

---

## 💪 Setup

### 1. Clone the repo

```bash
git clone https://github.com/hamoudilaz/horizon-server.git
cd backend-folder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file in the root directory

```env
JUP_QUOTE=https://lite-api.jup.ag/swap/v1/quote
JUP_SWAP=https://lite-api.jup.ag/swap/v1/swap
JITO_RPC=https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/transactions
FRONTEND_URL_CORS=http://localhost:5173

# Turbo mode only (Nozomi)
NOZ_URL=https://api.nozomi.network/v1/submit
NOZ_API_KEY=your_nozomi_api_key

# RPC/WebSocket
RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key
WSS_SHYFT=wss://your-wss-from-shyft.io
```

> 💬 To get Nozomi access (free), contact [@h3ll0wrld on Telegram](https://t.me/h3ll0wrld) or [@temporal\_xyz on Twitter](https://x.com/temporal_xyz) and ask for API key access.

> 🔑 To get a free RPC and WSS endpoint, sign up at [helius.dev](https://www.helius.dev) or [shyft.io](https://shyft.io).

---

## ▶️ Run the server

```bash
npm start
```

Server will start on:
**[http://localhost:3000](http://localhost:3000)**
and automatically initialize the WebSocket listener.

To run the platform fully, you also need the frontend:
👉 Clone it from: [https://github.com/hamoudilaz/client-horizon](https://github.com/hamoudilaz/client-horizon)

---

## ⚙️ How it works

* **Standard Mode**
  Uses Jito Block Engine via `JITO_RPC` for block-level transaction monitoring and swap execution.

* **Turbo Mode**
  Activates if node = true in the buy request (via frontend dashboard switch). This uses Nozomi validator APIs for hyper-fast execution paths (useful for sniping or high-speed trades).

* **Failover**
  If an endpoint fails or throws, the system gracefully falls back to backup services (Coinbase for pricing, different validators, etc).

* **WebSocket Setup**
  Real-time listener for account/token activity via `setupWebSocket()`.

---

## 📂 Project structure

| Folder/File  | Description                                            |
| ------------ | ------------------------------------------------------ |
| `__tests__/` | Endpoint tests for all routes                          |
| `config/`    | Config files for Jest and test setup                   |
| `engine/`    | Contains Jito and Nozomi execution logic               |
| `handlers/`  | Route middlewares like `handleActions` and `swap`      |
| `helpers/`   | Helper functions and WebSocket/parallel utilities      |
| `routes/`    | Main API endpoint route definitions                    |
| `utils/`     | Input validation, global constants, and decoding logic |
| `panel.js`   | Core logic and wallet management interface             |
| `server.js`  | Main entry point for starting the backend server       |

---

## 📬 Contact

For help, ideas or feedback — open an issue or reach out via Telegram or Twitter!

---
