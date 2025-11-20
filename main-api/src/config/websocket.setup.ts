import { Server } from 'http';
import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { pubSubClient } from './redis.js';
import { logger } from '@horizon/shared';

export let wss: WebSocketServer;

const userConnections = new Map();

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server });
  wss.on('connection', (ws: WebSocket & { pubKey?: string; clientId?: string }) => {
    logger.info('Frontend WebSocket client connected');

    ws.on('close', () => {
      if (ws.pubKey && ws.clientId) {
        logger.info({ pubKey: ws.pubKey, clientId: ws.clientId }, 'Frontend WebSocket client disconnected');
        const clients = userConnections.get(ws.pubKey);

        if (clients) {
          clients.delete(ws.clientId); // Only delete this specific client
          logger.debug({ pubKey: ws.pubKey, remaining: clients.size }, 'Client removed from connection map');

          // If no clients remain, delete the pubKey entry to save memory
          if (clients.size === 0) {
            userConnections.delete(ws.pubKey);
            logger.debug({ pubKey: ws.pubKey }, 'No clients left, removing user from connection map');
          }
        }
      } else {
        logger.info('Frontend WebSocket client disconnected (unauthenticated)');
      }
    });
    ws.on('message', (message: string) => {
      if (message.toString().includes('grafana')) {
        return;
      }

      try {
        const data = JSON.parse(message);
        // Expect a message like { type: 'auth', pubKey: '...' } from the client
        if (data.type === 'auth' && data.pubKey && data.clientId) {
          ws.pubKey = data.pubKey;
          ws.clientId = data.clientId;

          // If no Map exists for this pubKey, create it
          if (!userConnections.has(data.pubKey)) {
            userConnections.set(data.pubKey, new Map());
          }

          // Store this client's WebSocket in the sub-map
          userConnections.get(data.pubKey)!.set(data.clientId, ws);
          logger.info({ pubKey: data.pubKey, clientId: data.clientId }, 'WebSocket registered');
        }
      } catch {
        logger.warn({ message: message.toString() }, 'Received non-JSON WebSocket message');
      }
    });
  });

  const startSubscriber = async () => {
    try {
      // Subscribe to the global channel
      await pubSubClient.subscribe('ws-messages', (message) => {
        try {
          const { pubKey, data } = JSON.parse(message);

          // Find the local connection(s) for this user on THIS container
          const clients = userConnections.get(pubKey);

          if (clients) {
            logger.debug({ pubKey, count: clients.size }, 'Relaying Redis Pub/Sub message to local WebSocket(s)');
            for (const [, ws] of clients) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
              }
            }
          }
          // If no clients found, that's fine. It just means they are
          // connected to a different server instance.
        } catch (err) {
          logger.error({ err, message }, 'Failed to parse/relay Pub/Sub message');
        }
      });
      await pubSubClient.subscribe('ws-demo-broadcast', (message) => {
        try {
          // This message is just the 'data' object, no pubKey
          const data = JSON.parse(message);
          logger.debug('Relaying Redis Pub/Sub demo message to all local WebSocket(s)');

          // Broadcast to ALL clients connected to THIS container
          wss.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(data));
            }
          });
        } catch (err) {
          logger.error({ err, message }, 'Failed to parse/relay Demo Pub/Sub message');
        }
      });

      logger.info('Redis Pub/Sub subscriber connected and listening to channels: ws-messages, ws-demo-broadcast');
    } catch (err) {
      logger.fatal({ err }, 'Failed to subscribe to Redis Pub/Sub');
      process.exit(1); // This is critical, app can't sync without it
    }
  };

  startSubscriber().catch((err) => {
    logger.fatal({ err }, 'Failed to start Redis Pub/Sub subscriber');
    process.exit(1);
  });
}
