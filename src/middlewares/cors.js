import cors from 'cors'

const corsOptions = {
  origin: ['http://localhost:4200','https://devops-front-637k.onrender.com/'], // Cambiar en producción por el dominio real
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
}

export default cors(corsOptions)
