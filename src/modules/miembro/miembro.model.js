import mongoose, { Schema } from 'mongoose'


const DomicilioSchema = new Schema({
  calle: { type: String, trim: true, default: '' },
  numero: { type: Number, trim: true, default: null },
  piso: { type: Number, trim: true, default: null  },
  departamento: { type: String, trim: true, default: '' },
  barrio: { type: String, trim: true, default: '' },
  ciudad: { type: String, trim: true, default: '' },
  provincia: { type: String, trim: true, default: '' },
  codigoPostal: { type: String, trim: true, default: '' },
}, { _id: false })
const redesSocialSchema = new Schema({
  nombre: {
    type: String,
    enum: ['Instagram', 'X', 'Tiktok', 'Facebook'],
    trim: true
  },
  url: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false })

const DatosContactoSchema = new Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: null,
    match: [/\S+@\S+\.\S+/, 'Email no válido']
  },
  telefono_movil: {
    type: String,
    trim: true,
    default: null
  },
  telefono_fijo: {
    type: String,
    trim: true,
    default: null
  },
  pais: {
    type: String,
    trim: true,
    default: 'Argentina'
  }
}, { _id: false })

const IdentificacionSchema = new Schema({
  dni: {
    type: Number,
    required: false,
    default:null
  },
  extranjero: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const DatosPersonalesSchema = new Schema({
  genero: {
    type: String,
    enum: ['Masculino', 'Femenino', 'Otro'],
    default: 'Otro'
  },
  f_nacimiento: {
    type: Date,
    default:null
  },
  profesion: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false })

const EstadoSchema = new Schema({
  baja: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const MiembroSchema = new mongoose.Schema({
  nombres: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  apellidos: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true
  },
  domicilio: DomicilioSchema,
  // Agrupación de datos de contacto
  datosContacto: DatosContactoSchema,
 // Datos de identidad
  identificacion: IdentificacionSchema,
  // Otros datos personales
  datosPersonales: DatosPersonalesSchema,
  // Estado y afiliación
  estado: EstadoSchema,
  redesSociales: [redesSocialSchema],
  rol: {
    type: String,
    enum: ['admin', 'usuario', 'colaborador'],
    default: 'usuario'
  },
  observaciones: {
    type: String,
    trim: true,
    default: ''
  },
  foto_perfil: {
    type: String,
    trim: true,
    default: ''
  },
  modificadoPor: {
    type: String,
    default: ''
  },
  usuario_alta: {
    type: String,
    default: ''
  },
  motivo_baja: {
  type: String,
  trim: true,
  default: ''
  },
  usuario_baja: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

MiembroSchema.index({ 'datosContacto.email': 1 })

export const Miembro = mongoose.model('Miembro', MiembroSchema)
