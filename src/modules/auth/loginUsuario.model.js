import mongoose from 'mongoose';

const LoginUsuarioSchema = new mongoose.Schema({
  miembro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Miembro',
    required: true,
    unique: true // cada miembro solo puede tener un login
  },
  usuario: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  activo: {
    type: Boolean,
    default: true
  },
  ultimoLogin: {
    type: Date
  },
  intentosFallidos: {
    type: Number,
    default: 0
  },
  bloqueadoHasta: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export const LoginUsuario = mongoose.model('LoginUsuario', LoginUsuarioSchema);