import express from 'express';
import cors from 'cors';
import gachaRouter from './routes/gacha.js';
import battleRouter from './routes/battle.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', gachaRouter);
app.use('/api', battleRouter);

app.listen(PORT, () => {
  console.log(`🎴 Servidor corriendo en http://localhost:${PORT}`);
});
