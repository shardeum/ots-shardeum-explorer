import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';

const app = express();

// Enable CORS for all routes
app.use(cors());

// Determine target URL based on environment
const getTargetUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.VITE_RPC_URL || 'http://34.74.4.130:8090';
  }
  // Local development defaults to local Erigon at port 8080
  return process.env.VITE_RPC_URL || 'http://127.0.0.1:8080';
};

// Create proxy middleware
const proxyMiddleware = createProxyMiddleware({
  target: getTargetUrl(),
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/'
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`Proxying ${req.method} request to: ${proxyReq.path}`);
    },
    error: (err: Error, req: IncomingMessage, res: ServerResponse | Socket) => {
      console.error('Proxy Error:', err);
      if (res instanceof ServerResponse) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy Error', message: err.message }));
      }
    }
  }
});

// Use proxy for all routes
app.use('/api', proxyMiddleware);

const PORT = process.env.PROXY_PORT || 8545;

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Proxying requests to: ${getTargetUrl()}`);
});