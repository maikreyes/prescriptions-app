import { createServer, IncomingMessage, ServerResponse } from 'http';
import serverless from 'serverless-http';

let handler: serverless.Handler | null = null;

async function getHandler() {
  if (!handler) {
    const { default: bootstrap } = await import('../dist/src/main.js');
    const app = await bootstrap();
    handler = serverless(app, {
      provider: 'vercel',
    });
  }
  return handler;
}

export default async function (req: IncomingMessage, res: ServerResponse) {
  try {
    const fn = await getHandler();
    await fn(req, res);
  } catch (error: any) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: error.message || 'Internal Server Error' }));
  }
}