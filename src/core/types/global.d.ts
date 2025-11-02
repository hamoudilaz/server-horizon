// types/global.d.ts (Express - NEW)
import { DemoSession } from './interfaces.js'; // Ensure path is correct

// 1. Augment express-session
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      pubKey: string;
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

// You must add "ts-patch" or a similar solution if you get errors
// about augmenting modules. For a simpler start, you can just
// augment the Request object and trust req.session will exist.
