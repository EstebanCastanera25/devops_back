import mongoose from 'mongoose'

/**
 * Crea una respuesta estandarizada para API.
 * @param {Object} opciones
 * @param {number} opciones.status - Código HTTP.
 * @param {string} opciones.mensaje - Mensaje para el cliente.
 * @param {Array|Object|null} [opciones.data] - Datos opcionales a retornar.
 * @param {string|null} [opciones.error] - Mensaje de error técnico o interno.
 * @param {number|null} [opciones.cantidad] - Cantidad total (autocalculado si `data` es array).
 */
export function buildResponse ({ status, mensaje,cantidad = null, data = null, error = null }) {
  const response = { status, mensaje }

  if (data !== null) {
    response.data = data
    if (cantidad === null && Array.isArray(data)) {
      response.cantidad = data.length
    } else if (cantidad !== null) {
      response.cantidad = cantidad
    }
  }

  if (error) {
    response.error = error
  }

  return response
}

/**
 * Verifica si hay campos obligatorios faltantes en un objeto.
 */
export function validarCamposObligatorios (obj, campos = []) {
  const faltantes = campos.filter(c => !obj[c] || (Array.isArray(obj[c]) && obj[c].length === 0))
  if (faltantes.length > 0) {
    return {
      error: `Faltan campos obligatorios: ${faltantes.join(', ')}`,
      campos: faltantes
    }
  }
  return null
};

export function validarCamposObligatoriosAnidado (obj, campos = []) {
  const getDeep = (o, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], o)
  }

  const faltantes = campos.filter(c => {
    const val = getDeep(obj, c)
    return val === undefined || val === null || (Array.isArray(val) && val.length === 0)
  })

  if (faltantes.length > 0) {
    return {
      error: `Faltan campos obligatorios: ${faltantes.join(', ')}`,
      campos: faltantes
    }
  }
  return null
}

export function esObjectIdValido (id) {
  return id && mongoose.Types.ObjectId.isValid(id)
};

/**
 * Envía directamente la respuesta construida con `buildResponse`.
 */
export function enviarRespuesta (res, opciones) {
  const respuesta = buildResponse(opciones)
  return res.status(opciones.status).json(respuesta)
}
