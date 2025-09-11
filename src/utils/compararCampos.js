/**
 * @function compararCampos
 * @description Compara dos objetos y devuelve los campos que fueron modificados, incluyendo campos anidados y arrays.
 *
 * @param {Object} previo - Objeto original antes de la modificación
 * @param {Object} nuevo - Objeto actualizado
 * @param {string} [prefix=''] - Prefijo interno para campos anidados (no modificar)
 * @returns {Array<Object>} Lista de diferencias con formato:
 * [
 *   {
 *     campo: 'nombre_campo',
 *     valorAnterior: 'valor anterior',
 *     valorNuevo: 'valor nuevo'
 *   }
 * ]
 */
export default function compararCampos (previo, nuevo, prefix = '') {
  const cambios = []
  const claves = new Set([
    ...Object.keys(previo || {}),
    ...Object.keys(nuevo || {})
  ])

  for (const clave of claves) {
    const key = prefix ? `${prefix}.${clave}` : clave
    const val1 = previo?.[clave]
    const val2 = nuevo?.[clave]

    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        cambios.push({ campo: key, valorAnterior: val1, valorNuevo: val2 })
      }
    } else if (val1 instanceof Date || val2 instanceof Date) {
      if ((val1?.toISOString?.() ?? null) !== (val2?.toISOString?.() ?? null)) {
        cambios.push({ campo: key, valorAnterior: val1, valorNuevo: val2 })
      }
    } else if (typeof val1 === 'object' && val1 !== null) {
      cambios.push(...compararCampos(val1, val2, key))
    } else {
      if (JSON.stringify(val1 ?? null) !== JSON.stringify(val2 ?? null)) {
        cambios.push({ campo: key, valorAnterior: val1 ?? null, valorNuevo: val2 ?? null })
      }
    }
  }

  return cambios
}
