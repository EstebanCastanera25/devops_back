/*******************************************************************************************************************************************************************************
 * @file: historialMiembro.model.js
 * @description Modelo de datos para el historial de acciones realizadas sobre registros de miembros en MongoDB.
 * 
 * @version 1.0.0
 *******************************************************************************************************************************************************************************/

import mongoose, { Schema } from 'mongoose'


/* ---------- Sub-schema para describir cada cambio ---------- */
const cambioSchema = new Schema(
  {
    campo        : { type: String,        required: true },
    valorAnterior: { type: Schema.Types.Mixed, default: null },
    valorNuevo   : { type: Schema.Types.Mixed, default: null }
  },
  { _id: false }                           // no generar _id en cada elemento del array
);

/* ---------- Schema principal ---------- */
const HistorialMiembroSchema = new Schema(
  {
    miembroId   : { type: Schema.Types.ObjectId, ref: 'Miembro', required: false  },
    modificadoPor: { type: String, required: true },
    accion      : {
      type   : String,
      enum   : ['Creado', 'Modificado', 'Baja','Alta', 'Eliminado', 'Exportado', 'Importado'],
      required: true
    },
    detalle     : { type: [cambioSchema], required: true }
  },
  {
    timestamps: { createdAt: 'fechaAccion' },  // sólo necesitamos la fecha de la acción
    collection: 'historial_miembros'
  }
);

export const HistorialMiembro = mongoose.model('HistorialMiembro', HistorialMiembroSchema)