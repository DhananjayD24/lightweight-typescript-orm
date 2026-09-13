import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes';
import { initDb } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', router);

async function startServer() {
  await initDb();

  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Todo Express Server running on http://localhost:${PORT}`);
    console.log(`⚡ Powered by lightweight-ts-orm`);
    console.log(`==================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
