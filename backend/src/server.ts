import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes  from './routes/auth';
import userRoutes  from './routes/users';
import postRoutes  from './routes/posts';
import matchRoutes from './routes/match';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth',  authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/match', matchRoutes);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
