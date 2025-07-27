// global.d.ts

// 1. Import the necessary types from the libraries
import { Session } from '@fastify/session';
import { DemoSession } from './interfaces.ts'; // Ensure this path is correct for your project structure

// 2. Augment the 'fastify' module
declare module 'fastify' {
  // First, augment the FastifyRequest interface to include the 'user' property
  // that you are adding in your `validateDemoSession` function.
  interface FastifyRequest {
    user?: {
      pubKey: string;
    };
  }

  // Now, tell TypeScript what the structure of your session data is.
  // This merges your custom fields with the default 'Session' type
  // from @fastify/session, so you don't lose methods like .destroy().
  interface Session {
    user?: {
      pubKey: string;
    };
    demo?: DemoSession;
  }
}


