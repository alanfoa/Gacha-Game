import express from 'express';
import cors from 'cors';
import gachaRouter from './routes/gacha.js';
import battleRouter from './routes/battle.js';
import missionsRouter from './routes/missions.js';
import debugRouter from './routes/debug.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', gachaRouter);
app.use('/api', battleRouter);
app.use('/api', missionsRouter);
app.use('/api', debugRouter);

app.listen(PORT, () => {
  console.log(`🎴 Servidor corriendo en http://localhost:${PORT}`);
});
