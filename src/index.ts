import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import { authRouter } from './routes/auth';
import { providersRouter } from './routes/providers';
import { conversationsRouter } from './routes/conversations';
import { messagesRouter } from './routes/messages';
import { streamingRouter } from './routes/streaming';
import { env } from './config';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/providers', providersRouter);
app.use('/conversations', conversationsRouter);
app.use('/messages', messagesRouter);
app.use('/streaming', streamingRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

initDb();
const port = env.PORT || 3001;
app.listen(port, () => {
  console.log(`EasyChat backend running on port ${port}`);
});

export default app;