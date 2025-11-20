import dotenv from 'dotenv';
dotenv.config();

// Application Settings
export const NODE_ENV = process.env.NODE_ENV;
export const PORT = Number(process.env.PORT) || 3000;
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Security & Authentication
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// CORS & Frontend
export const FRONTEND_URL_CORS = process.env.FRONTEND_URL_CORS;

// Database & Redis
export const REDIS_URL = process.env.REDIS_URL;
export const DATABASE_URL = process.env.DATABASE_URL;

// Solana RPC & WebSocket
export const RPC_URL = process.env.RPC_URL;
export const WSS_URL = process.env.WSS_URL;

// Transaction Execution Services
export const JITO_RPC = process.env.JITO_RPC;
export const BLOXROUTE_URL = process.env.BLOXROUTE_URL;
export const AUTH_HEADER = process.env.BLOXROUTE_AUTH;

// Jupiter Swap API
export const QUOTE_API = process.env.JUP_QUOTE;
export const SWAP_API = process.env.JUP_SWAP;

// External APIs
export const BIRDEYE_APIKEY = process.env.BIRDEYE_APIKEY || '';

// Logging & Monitoring
export const LOKI_HOST = process.env.LOKI_HOST;
export const APP_NAME = process.env.APP_NAME;
