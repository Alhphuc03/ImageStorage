import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return resolve(null);
    }
    const chunks = [];
    req.on('data', chunk => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer.length > 0 ? buffer.toString('utf-8') : null);
    });
    req.on('error', (err) => {
      resolve(null);
    });
  });
}

function netlifyFunctionsPlugin() {
  return {
    name: 'vite-plugin-netlify-functions',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        let functionName = null;
        if (pathname.startsWith('/.netlify/functions/')) {
          functionName = pathname.replace('/.netlify/functions/', '').split('/')[0];
        } else if (pathname.startsWith('/api/')) {
          functionName = pathname.replace('/api/', '').split('/')[0];
        }

        if (!functionName) {
          return next();
        }

        try {
          const functionFile = path.resolve(__dirname, `netlify/functions/${functionName}.js`);
          const fileUrl = pathToFileURL(functionFile).href + `?t=${Date.now()}`;
          const mod = await import(fileUrl);

          if (!mod || !mod.handler) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: `Function ${functionName} not found` }));
          }

          const body = await getRequestBody(req);

          const event = {
            httpMethod: req.method,
            queryStringParameters: Object.fromEntries(urlObj.searchParams),
            headers: req.headers,
            body: body || null,
          };

          const result = await mod.handler(event, {});

          res.statusCode = result.statusCode || 200;
          if (result.headers) {
            Object.entries(result.headers).forEach(([k, v]) => {
              res.setHeader(k, v);
            });
          }
          res.end(result.body || '');
        } catch (err) {
          console.error(`Lỗi thực thi function ${functionName}:`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), netlifyFunctionsPlugin()],
});
