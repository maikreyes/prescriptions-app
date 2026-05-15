import serverless from 'serverless-http';
import bootstrap from './dist/src/main.js';

let handler: serverless.Handler | null = null;

async function getHandler() {
  if (!handler) {
    const app = await bootstrap();
    const server = app.getHttpServer();
    handler = serverless(server);
  }
  return handler;
}

export default async function (req: any, res: any) {
  const fn = await getHandler();
  return fn(req, res);
}

export const config = {
  runtime: 'nodejs18.x',
};