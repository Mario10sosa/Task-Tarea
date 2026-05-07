import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './config/database';
import apiRoutes from './routes';
import { apiReference } from '@scalar/express-api-reference';
import openapiDocument from './docs/openapi.json';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Decorator — Servir archivos adjuntos estáticos
app.use('/uploads', express.static(require('path').join(process.cwd(), 'uploads')));

// Routes
app.use('/api', apiRoutes);

// API Documentation
app.use(
  '/docs',
  apiReference({
    spec: {
      content: openapiDocument,
    },
    theme: 'deepSpace',
  } as any),
);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parcial';

const startServer = async () => {
  await Database.getInstance().connect(MONGO_URI);
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

export default app;