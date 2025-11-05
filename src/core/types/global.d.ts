// types/global.d.ts (Express - NEW)
import { DemoSession } from './interfaces.js'; // Ensure path is correct

// 1. Augment express-session
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      pubKey: string;
      encryptedKey?: string;
    };
    demo?: DemoSession;
  }
}

// 2. Augment Express.Request (for req.user in validateDemoSession)
declare global {
  namespace Express {
    export interface Request {
      user?: {
        pubKey: string;
      };
    }
  }
}
