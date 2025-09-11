export function validarRequeridosMiembro (data) {
  const faltantes = []

  const nombres = data?.nombres
  const apellidos = data?.apellidos
  const telefonoMovil = data?.datosContacto?.telefono_movil

  if (!nombres || (typeof nombres === 'string' && !nombres.trim())) faltantes.push('nombres')
  if (!apellidos || (typeof apellidos === 'string' && !apellidos.trim())) faltantes.push('apellidos')
  if (!telefonoMovil || (typeof telefonoMovil === 'string' && !telefonoMovil.trim())) faltantes.push('datosContacto.telefono_movil')

  if (faltantes.length) {
    return {
      error: `Faltan campos obligatorios: ${faltantes.join(', ')}`,
      campos: faltantes
    }
  }
  return null
}
/**
 * Capitaliza cada palabra: primera letra en mayúscula y el resto en minúscula.
 * Ej: "esteban leonel" → "Esteban Leonel"
 * @param {string} texto - Cadena de texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export function capitalizarTexto (texto = '') {
  if (typeof texto !== 'string') return ''

  return texto
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

/**
 * Capitaliza cada palabra de una dirección: pone la primera letra en mayúscula
 * y el resto en minúscula. Ideal para mantener estilo uniforme en campos como dirección.
 *
 * @function capitalizarDireccion
 * @param {string} direccion - Texto de la dirección (ej. "av. rivadavia 1234").
 * @returns {string} Dirección con mayúsculas en iniciales (ej. "Av. Rivadavia 1234").
 *
 * @example
 * capitalizarDireccion("agustín de vedia 2519")
 * //=> "Agustín De Vedia 2519"
 */
export function capitalizarDireccion (direccion) {
  if (typeof direccion !== 'string') return ''
  return direccion
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ')
}

/**
 * Normaliza el número de teléfono móvil según reglas:
 * - Si tiene 8 dígitos: agrega "11" adelante.
 * - Si tiene 10 dígitos y empieza con "15": reemplaza "15" por "11".
 * - Si tiene menos de 8 dígitos: retorna error.
 * - Si tiene 8, 10 o más de 10 dígitos (sin cumplir condiciones especiales): lo deja igual.
 * @param {string} telefono - Número de teléfono.
 * @returns {{success: boolean, telefono?: string, error?: string}}
 */
export function normalizarTelefono(telefono) {
   if (!telefono) return { success: true, telefono: "" };

  // Limpiar espacios y guiones
  let tel = telefono.toString().trim().replace(/[\s-]/g, '')

  if (!/^\d+$/.test(tel)) {
    return { success: false, error: 'El teléfono solo debe contener números' }
  }

  if (tel.length < 8) {
    return { success: false, error: 'El teléfono debe tener al menos 8 dígitos' }
  }

  // Regla 1: 8 dígitos → agregar 11 al inicio
  if (tel.length === 8) {
    tel = '11' + tel
  }

  // Regla 2: 10 dígitos y empieza con 15 → reemplazar por 11
  if (tel.length === 10 && tel.startsWith('15')) {
    tel = '11' + tel.slice(2)
  }

  // Regla 3: si tiene 8, 10 o más dígitos pero no cae en reglas anteriores → dejar igual
  return { success: true, telefono: tel }
}
export function limpiarCampoTexto (valor, porDefecto = null) {
  if (valor === null || valor === undefined) return porDefecto
  const str = String(valor).trim()
  return str === '' ? porDefecto : str
}

export const REGEX_TODO = '.+'

export function aBoolCadena (valor) {
  if (valor === 'true' || valor === true) return true
  if (valor === 'false' || valor === false) return false
  return null // 'todos'
}

export function regexSiNoTodos (cad = REGEX_TODO) {
  return cad !== REGEX_TODO ? new RegExp(cad, 'i') : null
}

export function filtroNullable (valor, campo) {
  if (valor === 'null' || valor === 'vacio') {
    return { [campo]: null }
  }
  const rx = regexSiNoTodos(valor)
  return rx ? { [campo]: rx } : {}
}


// --------- Barrio -> Comuna (CABA) ----------
// --- normalizador
const _norm = (s) =>
  (s ?? '').toString().trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// --- mapa barrio -> nº de comuna
const BARRIO_A_COMUNA = (() => {
  const pares = [
    [1, ['Retiro','San Nicolás','Puerto Madero','San Telmo','Monserrat','Constitución']],
    [2, ['Recoleta']],
    [3, ['Balvanera','San Cristóbal']],
    [4, ['La Boca','Barracas','Parque Patricios','Nueva Pompeya']],
    [5, ['Almagro','Boedo']],
    [6, ['Caballito']],
    [7, ['Flores','Parque Chacabuco']],
    [8, ['Villa Soldati','Villa Riachuelo','Villa Lugano']],
    [9, ['Liniers','Mataderos','Parque Avellaneda']],
    [10, ['Villa Real','Monte Castro','Versalles','Floresta','Vélez Sársfield']],
    [11, ['Villa General Mitre','Villa Devoto','Villa del Parque','Villa Santa Rita']],
    [12, ['Coghlan','Saavedra','Villa Urquiza','Villa Pueyrredón']],
    [13, ['Núñez','Belgrano','Colegiales']],
    [14, ['Palermo']],
    [15, ['Chacarita','Villa Crespo','La Paternal','Villa Ortúzar','Agronomía','Parque Chas']],
  ];
  const map = {};
  for (const [c, barrios] of pares) for (const b of barrios) map[_norm(b)] = c;
  return map;
})();

// Corregido: comparar SIN tildes
export function esProvinciaCABA(prov) {
  const p = _norm(prov);
  return p === 'ciudad autonoma de buenos aires' || p === 'caba' || p === 'capital federal';
}

export function comunaPorBarrio(barrio) {
  if (!barrio) return null;
  const n = BARRIO_A_COMUNA[_norm(barrio)];
  return n ? `Comuna ${n}` : null;   // devuelve "Comuna N"
}

export function normalizarCamposIngreso(miembro, estricto = false) {
  const dom = miembro?.domicilio || {};
  dom.calle     = capitalizarDireccion(dom.calle || '');
  dom.barrio    = capitalizarTexto(dom.barrio || '');
  dom.ciudad    = capitalizarTexto(dom.ciudad || '');
  dom.provincia = capitalizarTexto(dom.provincia || '');

  if (esProvinciaCABA(dom.provincia)) {
    const setComuna = (etiqueta) => {
      dom.ciudad = etiqueta;          // guarda "Comuna N" en ciudad
      dom.comuna = etiqueta;          // opcional: también en un campo aparte
    };

    if (!dom.barrio && dom.ciudad) {
      // el barrio vino en "ciudad"
      const etiqueta = comunaPorBarrio(dom.ciudad);   // <- usar ciudad
      if (etiqueta) {
        dom.barrio = dom.ciudad;       // migro el barrio a su campo correcto
        setComuna(etiqueta);           // ciudad/comuna = "Comuna N"
      } else if (estricto) {
        return { error: `Barrio de CABA no reconocido: ${dom.ciudad}` };
      }
    } else if (dom.barrio) {
      const etiqueta = comunaPorBarrio(dom.barrio);
      if (etiqueta) setComuna(etiqueta);
      else if (estricto) {
        return { error: `Barrio de CABA no reconocido: ${dom.barrio}` };
      }
    }
  }

  miembro.domicilio = dom;
  return {};
}