import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './src/config/database.js'
import corsMiddleware from './src/middlewares/cors.js'
import miembroRoutes from './src/modules/miembro/miembro.routes.js'
import authRoutes from './src/modules/auth/auth.routes.js'
import './datadog.js';
import tracer from 'dd-trace';


dotenv.config()

const app = express()
const PORT = process.env.PORT || 5300

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(corsMiddleware)
app.disable('x-powered-by')

// Rutas
app.use('/api/miembros', miembroRoutes)
app.use('/api/auth', authRoutes)

app.get('/_dd-test', async (_req, res) => {
  await tracer.trace('manual.test', async () => new Promise(r => setTimeout(r, 50)));
  res.json({ ok: true });
});

async function startServer () {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`Servidor corriendo`)
  })
}
startServer()
