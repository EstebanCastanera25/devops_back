import mongoose from 'mongoose'

export async function connectDB () {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MONGO_URI=', process.env.MONGO_URI);
    console.log('Conectado a MongoDB Atlas')
  } catch (err) {
    console.error('Error de conexión a MongoDB:', err.message)
    process.exit(1)
  }
}
