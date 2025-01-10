import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import getPort from 'get-port';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static('public'));

const startServer = async () => {
  const port = await getPort();
  app.listen(port, () => {
    console.log(`🚀 Game server running at http://localhost:${port}`);
  });
};

startServer();