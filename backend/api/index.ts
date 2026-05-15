import { createServer, IncomingMessage, ServerResponse } from 'http';
import serverless from 'serverless-http';
import bootstrap from './dist/src/main.js';

let handler: serverless.Handler | null = null;

async function getHandler() {
  if (!handler) {
    const app = await bootstrap();
    handler = serverless(app, {
      provider: 'vercel',
    });
  }
  return handler;
}

export default async function (req: IncomingMessage, res: ServerResponse) {
  const fn = await getHandler();
  await fn(req, res);
}