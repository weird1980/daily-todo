import { WebSocketServer } from 'ws';

let wss = null;

/**
 * Initializes a WebSocket server attached to the given HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {WebSocketServer}
 */
export function initWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer });
  return wss;
}

/**
 * Broadcasts a JSON message to all connected WebSocket clients.
 * @param {string} event - Event name
 * @param {*} data - Payload to send
 */
export function broadcast(event, data) {
  if (!wss) return;

  const message = JSON.stringify({ event, data });

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}
