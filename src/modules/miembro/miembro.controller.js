import mongoose from 'mongoose'
import { Miembro } from '../miembro/miembro.model.js'
import { HistorialMiembro } from '../miembro/historialMiembro.model.js'
import { LoginUsuario } from '../auth/loginUsuario.model.js';
import {limpiarCampoTexto,validarRequeridosMiembro,capitalizarTexto,normalizarTelefono,normalizarCamposIngreso} from '../../utils/normalizarCamposIngreso.js'
import { enviarRespuesta, validarCamposObligatorios,esObjectIdValido } from '../../utils/respuesta.utils.js';
import xlsx from 'xlsx'

export const miembroController = {
  async registroAdmin (req, res) {
    const data = req.body
    try {
      const existente = await Miembro.findOne({ dni: data.dni })
      if (existente) {
        return res.status(409).send({ mensaje: 'El DNI ya existe' })
      }

      if (!data.password) {
        return res.status(400).send({ mensaje: 'Contraseña requerida' })
      }

      const hash = await bcrypt.hash(data.password, 10)
      data.password = hash
      data.rol = 'admin'

      const nuevoMiembro = await Miembro.create(data)
      return res.status(201).send({ mensaje: 'Admin registrado', data: nuevoMiembro })
    } catch (err) {
      return res.status(500).send({ mensaje: 'Error del servidor', error: err.message })
    }
  },


  async listarMiembros (req, res) {
  const {
    nombres = '.+',
    apellidos = '.+',
    email = '.+',
    edad = '.+',
    edad_condicion = '.+',
    dni = '.+',
    genero = 'todos',
    f_nacimiento = '.+',
    pais = '.+',
    extranjero = 'todos',
    telefono_movil = '.+',
    telefono_fijo = '.+',
    rol = '.+',
    redesSociales = '.+',
    profesion = '.+',
    observaciones = '.+',
    baja = 'todos',              
    id_fiscalizacion = '.+',
    desde = null,
    hasta = null
  } = req.body || {}

  /* 2️⃣  Construir filtro */
  const filtro = {}
  if (nombres        !== '.+') filtro.nombres  = new RegExp(nombres, 'i')
  if (apellidos      !== '.+') filtro.apellidos= new RegExp(apellidos, 'i')
  if (email          !== '.+') filtro['datosContacto.email'] = new RegExp(email, 'i')
  if (genero         !== 'todos') filtro['datosPersonales.genero'] = new RegExp(genero, 'i')
  if (f_nacimiento   !== '.+') filtro['datosPersonales.f_nacimiento'] = new RegExp(f_nacimiento, 'i')
  if (pais           !== '.+') filtro['datosContacto.pais'] = new RegExp(pais, 'i')
  if (telefono_movil !== '.+') filtro['datosContacto.telefono_movil'] = new RegExp(telefono_movil, 'i')
  if (telefono_fijo  !== '.+') filtro['datosContacto.telefono_fijo']  = new RegExp(telefono_fijo, 'i')
  if (rol            !== '.+') filtro.rol = new RegExp(rol, 'i')
  if (profesion      !== '.+') filtro['datosPersonales.profesion'] = new RegExp(profesion, 'i')
  if (observaciones  !== '.+') filtro.observaciones = new RegExp(observaciones, 'i')

  if (extranjero  !== 'todos') filtro['identificacion.extranjero'] = extranjero
  if (baja        !== 'todos') filtro['estado.baja']               = baja === 'true'

  if (redesSociales !== '.+') {
    filtro.redesSociales = { $elemMatch: { nombre: new RegExp(redesSociales, 'i') } }
  }

  if (dni !== '.+') {
    filtro.$expr = {
      $regexMatch: {
        input: { $toString: '$identificacion.dni' },
        regex: dni.toString(),
        options: 'i'
      }
    }
  }

  
  if (desde || hasta) {
    filtro.createdAt = {}
    if (desde) filtro.createdAt.$gte = new Date(desde)
    if (hasta) filtro.createdAt.$lte = new Date(hasta)
  }

  /* 2.b  Edad / fecha (tu lógica original) */
  if (
    f_nacimiento !== '.+' &&
    ['>', '<', '>=', '<=', '='].includes(edad_condicion)
  ) {
    const fecha = new Date(f_nacimiento)
    filtro['datosPersonales.f_nacimiento'] = generarFiltroFecha(fecha, edad_condicion)
  } else if (
    edad !== '.+' &&
    !isNaN(Number(edad)) &&
    ['>', '<', '>=', '<=', '='].includes(edad_condicion)
  ) {
    const hoy = new Date()
    const fechaBase = new Date(hoy)
    fechaBase.setFullYear(hoy.getFullYear() - parseInt(edad, 10))
    fechaBase.setHours(0, 0, 0, 0)
    filtro['datosPersonales.f_nacimiento'] = generarFiltroFecha(fechaBase, edad_condicion)
  }

  /* 3️⃣  Pipeline: solo incluimos $match si el filtro NO está vacío */
  const pipeline = []
  if (Object.keys(filtro).length) pipeline.push({ $match: filtro })

  pipeline.push(
    {$project: {
      nombres: 1, apellidos: 1,
      'datosContacto.email': 1,
      'datosContacto.telefono_movil': 1,
      'datosContacto.telefono_fijo': 1,
      'datosContacto.pais': 1,
      'identificacion.dni': 1,
      'identificacion.extranjero': 1,
      'datosPersonales.genero': 1,
      'datosPersonales.f_nacimiento': 1,
      'datosPersonales.profesion': 1,
      rol: 1,
      'estado.baja': 1,
      redesSociales: 1,
      observaciones: 1,
      usuario_alta: 1,
      usuario_baja: 1,
      domicilio: 1,
      foto_perfil: 1,
      motivo_baja: 1,
      createdAt: 1,
      updatedAt: 1
    }
  })

  /* 4️⃣  Ejecutar */
  try {
    const miembros = await Miembro.aggregate(pipeline)
    return res.status(200).send({
      mensaje : 'Miembros listados',
      cantidad: miembros.length,
      data    : miembros
    })
    } catch (err) {
      return res.status(500).send({ mensaje: 'Error al listar', error: err.message })
    }
  },

  
  async agregarMiembro (req, res) {
   const data = req.body;
    // Forzar a que email exista aunque sea null
    if (!data.datosContacto) data.datosContacto = {};
    if (data.datosContacto.email === undefined || data.datosContacto.email === '') {
      data.datosContacto.email = null;
    }
    if (!data.domicilio) data.domicilio = {};    

  const { error: errNorm } = normalizarCamposIngreso(data /*, false */);
  if (errNorm) {
    return enviarRespuesta(res, {
      status: 400,
      mensaje: 'Datos inválidos',
      error: errNorm
    });
  }
   
   // Obtener usuario autenticado desde el token
   const usuario = req.user?.usuario || 'Sistema';
   data.usuario_alta = usuario;
   data.modificadoPor = usuario;

    // Validación mínima requerida
  const faltaMinimo = validarRequeridosMiembro(data);
  if (faltaMinimo) {
    return enviarRespuesta(res, {
      status: 400,
      mensaje: 'Datos incompletos',
      error: faltaMinimo.error
    });
  }

   
   try {
    //  Verificar si ya existe un miembro con ese DNI
    if (data.identificacion?.dni) {
      const existe = await Miembro.findOne({ 'identificacion.dni': data.identificacion.dni });
      if (existe) {
        return enviarRespuesta(res, {
          status: 409,
          mensaje: `El DNI ${data.identificacion.dni} ya está registrado en otro miembro`
        });
      }
    }

    // Crear el miembro
    const { success, data: miembroCreado, error } = await crearMiembro(data);

    if (!success) {
      return enviarRespuesta(res, {
        status: 400,                           // 400 si es validación; poné 500 si preferís genérico
        mensaje: 'No se pudo registrar el miembro',
        error
      });
    }

    // Registrar historial
    await HistorialMiembro.create({
      miembroId: miembroCreado._id,
      modificadoPor: usuario,
      accion: 'Creado',
      detalle: [{
        campo: 'miembro',
        valorAnterior: null,
        valorNuevo: miembroCreado
      }]
    });

    return res.status(201).json({
      mensaje: 'Miembro registrado con éxito',
      data: miembroCreado
    });

  } catch (err) {
    console.error('Error al agregar miembro:', err);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }

  
  },

  
  async obtenerMiembro (req, res) {
    const { id } = req.params

    if (!esObjectIdValido(id)) {
      return res.status(400).send({ mensaje: 'ID inválido' })
    }
    console.log("id",id)
    try {
      const miembro = await Miembro.findById(id)
      if (!miembro) {
        return res.status(404).send({ mensaje: 'Miembro no encontrado' })
      }

      return res.status(200).send({ mensaje: 'Miembro obtenido', data: miembro })
    } catch (err) {
      return res.status(500).send({ mensaje: 'Error al obtener miembro', error: err.message })
    }
  },

  async actualizarMiembro (req, res) {
    const { id } = req.params
    const data = req.body
    const usuario = req.user?.usuario || 'Sistema';
    console.log("data",data)

    if (!esObjectIdValido(id)) {
      return enviarRespuesta(res, { status: 400, mensaje: 'ID inválido' });
    }
  try {
      const anterior = await Miembro.findById(id);
      if (!anterior) {
        return enviarRespuesta(res, { status: 404, mensaje: 'Miembro no encontrado' });
      }

      data.modificadoPor = usuario;

      // ── Capitalizaciones / normalizaciones (solo si vienen) ──
      if (typeof data.nombres === 'string')   data.nombres   = capitalizarTexto(data.nombres);
      if (typeof data.apellidos === 'string') data.apellidos = capitalizarTexto(data.apellidos);
      if (data.datosContacto?.pais) {data.datosContacto.pais = capitalizarTexto(data.datosContacto.pais);}
      if (data.datosPersonales?.genero) {data.datosPersonales.genero = capitalizarTexto(data.datosPersonales.genero);}
      if (data.datosPersonales?.profesion) {data.datosPersonales.profesion = capitalizarTexto(data.datosPersonales.profesion);}

      // Teléfono móvil
      if (data.datosContacto && 'telefono_movil' in data.datosContacto && data.datosContacto.telefono_movil) {
        const telResult = normalizarTelefono(data.datosContacto.telefono_movil);
        if (!telResult.success) {
          return enviarRespuesta(res, { status: 400, mensaje: telResult.error });
        }
        data.datosContacto.telefono_movil = telResult.telefono;
      }
      // DNI
      if ('identificacion' in data) {
        let dniNum = data?.identificacion?.dni;
        if (!dniNum && dniNum !== 0) {
          data.identificacion = { ...(data.identificacion || {}), dni: '', extranjero: null };
        } else {
          dniNum = parseInt(dniNum, 10);
          if (isNaN(dniNum)) {
            return enviarRespuesta(res, { status: 400, mensaje: 'DNI inválido' });
          }
          data.identificacion.dni = dniNum;
          data.identificacion.extranjero = dniNum > 90000000;
        }
      }

      // NORMALIZAR DOMICILIO CON COMUNA (si viene en el payload)
      if (data.domicilio) {
        // Merge con lo anterior para no pisar campos no enviados
        const domAnterior = (anterior?.domicilio && typeof anterior.domicilio?.toObject === 'function')
                              ? anterior.domicilio.toObject()
                              : (anterior?.domicilio || {});
        data.domicilio = { ...domAnterior, ...data.domicilio };

        // Normaliza (capitaliza, mapea barrio->"Comuna N" en ciudad, etc.)
        const wrapper = { domicilio: { ...data.domicilio } };
        const { error: errNorm } = normalizarCamposIngreso(wrapper /* , false */);
        if (errNorm) {
          return enviarRespuesta(res, { status: 400, mensaje: 'Datos inválidos', error: errNorm });
        }
        data.domicilio = wrapper.domicilio;
      }

      // ── Duplicados (si se envían), excluyendo el propio registro ──
      if (data.datosContacto && 'email' in data.datosContacto && data.datosContacto.email !== null &&
          data.datosContacto.email.trim() !== '') {
        const existeEmail = await Miembro.findOne({
          'datosContacto.email': data.datosContacto.email,
          _id: { $ne: id }
        });
        if (existeEmail) {
          return enviarRespuesta(res, { status: 409, mensaje: 'Email duplicado' });
        }
      }

      if (data.datosContacto && 'telefono_movil' in data.datosContacto && data.datosContacto.telefono_movil !== null) {
        const existeTel = await Miembro.findOne({
          'datosContacto.telefono_movil': data.datosContacto.telefono_movil,
          _id: { $ne: id }
        });
        if (existeTel) {
          return enviarRespuesta(res, { status: 409, mensaje: 'Teléfono duplicado' });
        }
      }
      // ── CONSTRUIR $set POR PATHS (ACA ESTABA EL ERROR: update no definido) ──
      const update = {};
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && !Array.isArray(v) &&
            ['domicilio', 'datosContacto', 'identificacion', 'datosPersonales', 'estado'].includes(k)) {
          for (const [sk, sv] of Object.entries(v)) {
            update[`${k}.${sk}`] = sv;   // p.ej. domicilio.barrio, domicilio.ciudad, etc.
          }
        } else {
          update[k] = v;
        }
      }

      const miembroActualizado = await Miembro.findByIdAndUpdate(
          id,
          { $set: update },
          { new: true, runValidators: true }
        );

      const cambios = compararCampos(anterior.toObject(), miembroActualizado.toObject());

      if (cambios.length > 0) {
        await HistorialMiembro.create({
          miembroId: miembroActualizado._id,
          modificadoPor: usuario,
          accion: 'Modificado',
          detalle: cambios
        });
      }

      return res.status(200).send({
        mensaje: 'Miembro actualizado',
        data: miembroActualizado
      });

    } catch (err) {
      if (err?.name === 'ValidationError') {
        const errores = Object.values(err.errors || {}).map(e => e.message).join(', ');
        return enviarRespuesta(res, { status: 400, mensaje: 'Error de validación', error: errores });
      }
        if (err?.code === 11000) {
          return enviarRespuesta(res, { status: 409, mensaje: 'Registro duplicado', error: err.message });
        }
          return enviarRespuesta(res, { status: 500, mensaje: 'Error al actualizar miembro', error: err?.message || 'Error inesperado' });
      }
  },

 

 async exportarMiembrosExcel(req, res) {
    try {
      const miembros = await Miembro.find().lean();
      const usuario = req.user?.usuario || 'Sistema';

      if (miembros.length === 0) {
        return res.status(404).json({ mensaje: 'No hay miembros para exportar' });
      }

      const datos = miembros.map(p => ({
        nombres: p.nombres,
        apellidos: p.apellidos,
        email: p.datosContacto?.email || '',
        telefono_movil: p.datosContacto?.telefono_movil || '',
        telefono_fijo: p.datosContacto?.telefono_fijo || '',
        pais: p.datosContacto?.pais || '',
        dni: p.identificacion?.dni || '',
        extranjero: p.identificacion?.extranjero ? 'si' : 'no',
        genero: p.datosPersonales?.genero || '',
        f_nacimiento: p.datosPersonales?.f_nacimiento
          ? new Date(p.datosPersonales.f_nacimiento).toISOString().split('T')[0]
          : '',
        profesion: p.datosPersonales?.profesion || '',
        baja: p.estado?.baja ? 'sí' : 'no',
        motivo_baja: p.motivo_baja || '',
        domicilio_calle: p.domicilio?.calle || '',
        domicilio_numero: p.domicilio?.numero ?? '',
        domicilio_piso: p.domicilio?.piso ?? '',
        domicilio_departamento: p.domicilio?.departamento || '',
        domicilio_ciudad: p.domicilio?.ciudad || '',
        domicilio_provincia: p.domicilio?.provincia || '',
        domicilio_codigoPostal: p.domicilio?.codigoPostal || '',
        redesSociales: p.redesSociales?.map(r => `${r.nombre}: ${r.url}`).join(' | ') || '',
        rol: p.rol || '',
        observaciones: p.observaciones || '',
        foto_perfil: p.foto_perfil || '',
        usuario_alta: p.usuario_alta || '',
        usuario_baja: p.usuario_baja || '',
        creado: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
        actualizado: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : ''
      }));

      // Registrar exportación en historial
    await HistorialMiembro.create({
      miembroId: null,  
      modificadoPor: usuario,
      accion: 'Exportado',
      detalle: [
        {
          campo: 'cantidad_exportada',
          valorNuevo: miembros.length
        }
      ]
    });

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(datos);
      xlsx.utils.book_append_sheet(wb, ws, 'Miembros');

      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=miembros.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.status(200).send(buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ mensaje: 'Error al exportar miembros', error: err.message });
    }
  },

  async importarMiembros (req, res) {
     try {

    if (!req.file) {
      return res.status(400).json({ mensaje: 'Archivo no proporcionado o formato incorrecto (solo .xlsx)' });
    }
    const usuario = req.user?.usuario || 'Sistema';
    const nombreArchivo = req.file.originalname.toLowerCase();

    if (!nombreArchivo.endsWith('.xlsx')) {
      return res.status(400).json({ mensaje: 'Formato inválido: solo se acepta archivo .xlsx' });
    }


    const buffer = req.file.buffer;
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const datos = xlsx.utils.sheet_to_json(hoja);


    if (!datos.length) {
      return res.status(400).json({ mensaje: 'El archivo está vacío o mal formado' });
    }

    const exitosos = [];
    const errores = [];

    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i];

      // Armar objeto Miembro compatible con el modelo
      const miembro = {
        nombres: limpiarCampoTexto(fila.nombres),
        apellidos: limpiarCampoTexto(fila.apellidos),
        datosContacto: {
          email: limpiarCampoTexto(fila.email, null),
          telefono_movil: limpiarCampoTexto(fila.telefono_movil, null),
          telefono_fijo: limpiarCampoTexto(fila.telefono_fijo, null),
          pais: limpiarCampoTexto(fila.pais, 'argentina')
        },
        identificacion: {
          dni: limpiarCampoTexto(fila.dni),
          extranjero: (fila.extranjero === 'sí' || fila.extranjero === true)
        },
        datosPersonales: {
          genero: limpiarCampoTexto(fila.genero, 'otro'),
          f_nacimiento: fila.f_nacimiento ? new Date(fila.f_nacimiento) : null,
          profesion: limpiarCampoTexto(fila.profesion)
        },
        estado: {
          baja: fila.baja === 'sí' || fila.baja === true
        },
        domicilio: {
          calle: limpiarCampoTexto(fila.domicilio_calle),
          numero: fila.domicilio_numero || null,
          piso: fila.domicilio_piso || null,
          departamento: limpiarCampoTexto(fila.domicilio_departamento),
          barrio: limpiarCampoTexto(fila.domicilio_barrio),
          ciudad: limpiarCampoTexto(fila.domicilio_ciudad),
          provincia: limpiarCampoTexto(fila.domicilio_provincia),
          codigoPostal: limpiarCampoTexto(fila.domicilio_codigoPostal)
        },
        redesSociales: fila.redesSociales
          ? fila.redesSociales.split('|').map(entry => {
              const [nombre, url] = entry.split(':').map(x => x.trim());
              return {  nombre: capitalizarTexto(nombre), url };
            })
          : [],
        rol: limpiarCampoTexto(fila.rol, 'usuario'),
        observaciones: limpiarCampoTexto(fila.observaciones),
        foto_perfil: limpiarCampoTexto(fila.foto_perfil),
        usuario_alta: req.user?.usuario || 'importador_excel',
        usuario_baja: limpiarCampoTexto(fila.usuario_baja),
        motivo_baja: limpiarCampoTexto(fila.motivo_baja)
      };

      // normalizar domicilio y completar comuna si es CABA
      // (si querés modo estricto para rechazar barrios no reconocidos, pasá true)
      const { error: errNorm } = normalizarCamposIngreso(miembro /*, false */);
      if (errNorm) {
        errores.push({
          fila: i + 2,
          datos: fila,
          motivo: errNorm
        });
        continue; // salteo esta fila si la normalización falló en modo estricto
      }

      const { success, data: creada, error } = await crearMiembro(miembro);
       let motivoExtendido = error;

          if (error?.toLowerCase().includes('email') && fila.email) {
            motivoExtendido = `Email duplicado: ${fila.email}`;
          } else if (error?.toLowerCase().includes('telefono_movil') && fila.telefono_movil) {
            motivoExtendido = `Teléfono móvil duplicado: ${fila.telefono_movil}`;
          } else if (error?.toLowerCase().includes('dni') && fila.dni) {
            motivoExtendido = `DNI duplicado: ${fila.dni}`;
          }

        
      if (success) {
        exitosos.push(creada);
      } else {
        errores.push({
          fila: i + 2,
          datos: fila,
          motivo: motivoExtendido
        });
      }
    }
    if (exitosos.length > 0 || errores.length > 0) {
      await HistorialMiembro.create({
        modificadoPor: usuario,
        accion: 'Importado',
        detalle: [
          { campo: 'miembros_importados', valorNuevo: exitosos.length },
          { campo: 'errores_importacion', valorNuevo: errores.length },
          ...(exitosos.length > 0
            ? [{ campo: 'nombres_importados', valorNuevo: exitosos.slice(0, 10).map(p => `${p.nombres} ${p.apellidos}`) }]
            : []),
          ...(errores.length > 0
            ? [{
                campo: 'errores_detalle',
                valorNuevo: errores.slice(0, 5).map(e => ({
                  fila: e.fila,
                  motivo: e.motivo
                }))
              }]
            : [])
        ]
      });
    }
    res.status(200).json({
      mensaje: 'Importación finalizada',
      importados: exitosos.length,
      errores: errores.length,
      miembrosImportados: exitosos,
      erroresImportacion: errores
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al procesar el archivo', error: err.message });
  }
  },

  
  async marcarComoBaja (req, res) {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuario = req.user?.usuario || 'Sistema';
  

    if (!esObjectIdValido(id)) {
      return enviarRespuesta(res, {
        status: 400,
        mensaje: 'ID inválido',
        error: 'El formato del ObjectId no es válido'
      });
    }

    try {
      const miembro = await Miembro.findById(id); 
      if (!miembro) {
        return enviarRespuesta(res, {
          status: 404,
          mensaje: 'Miembro no encontrado'
        });
      }

      if (miembro.estado?.baja === true) {
        return enviarRespuesta(res, {
          status: 400,
          mensaje: 'El miembro ya está dado de baja'
        });
      }
      // (opcional) motivo requerido
      if (!motivo?.trim()) {
        return enviarRespuesta(res, { status: 400, mensaje: 'Debe indicar el motivo de la baja' });
      }

       const antesBaja   = miembro.estado.baja ?? false;
      const antesUsuario= miembro.usuario_baja ?? '';
      const antesMotivo = miembro.motivo_baja ?? '';

      miembro.estado.baja = true;
      miembro.usuario_baja = usuario;
      miembro.motivo_baja = motivo;
      miembro.modificadoPor = usuario;
      await miembro.save();

      await HistorialMiembro.create({
        miembroId: miembro._id,
        modificadoPor: usuario,
        accion: 'Baja',
        detalle: [
          { campo: 'estado.baja',  valorAnterior: antesBaja,    valorNuevo: true },
        { campo: 'usuario_baja', valorAnterior: antesUsuario, valorNuevo: usuario },
        { campo: 'motivo_baja',  valorAnterior: antesMotivo,  valorNuevo: motivo },
        { campo: 'nombre_completo', valorNuevo: `${miembro.nombres} ${miembro.apellidos}` }
        ]
      });

      return enviarRespuesta(res, {
        status: 200,
        mensaje: 'Miembro marcado como baja',
        data: miembro.toObject()
      });
    } catch (err) {
      return enviarRespuesta(res, {
        status: 500,
        mensaje: 'Error al marcar como baja',
        error: err.message
      });
    }
  },
  async marcarComoAlta (req, res) {
    const { id } = req.params;
    const usuario = req.user?.usuario || 'Sistema';

    if (!esObjectIdValido(id)) {
      return enviarRespuesta(res, {
        status: 400,
        mensaje: 'ID inválido',
        error: 'El formato del ObjectId no es válido'
      });
    }

    try {
      const miembro = await Miembro.findById(id); 
      if (!miembro) {
        return enviarRespuesta(res, {
          status: 404,
          mensaje: 'Miembro no encontrado'
        });
      }

      if (miembro.estado?.baja === false) {
        return enviarRespuesta(res, {
          status: 400,
          mensaje: 'El miembro ya está dado de alta'
        });
      }
       // guardar valores anteriores para historial
    const antesUsuarioBaja = miembro.usuario_baja ?? '';
    const antesMotivoBaja  = miembro.motivo_baja ?? '';

      miembro.estado.baja = false;
      miembro.usuario_baja = "";
      miembro.motivo_baja = "";
      miembro.modificadoPor = usuario;
      await miembro.save();

      await HistorialMiembro.create({
        miembroId: miembro._id,
        modificadoPor: usuario,
        accion: 'Alta',
        detalle: [
          { campo: 'estado.baja', valorAnterior: true, valorNuevo: false },
          { campo: 'usuario_baja', valorNuevo: usuario,   valorNuevo: '' },
          { campo: 'motivo_baja', valorAnterior: antesMotivoBaja,    valorNuevo: ''  },
          { campo: 'nombre_completo', valorNuevo: `${miembro.nombres} ${miembro.apellidos}` }
        ]
      });

      return enviarRespuesta(res, {
        status: 200,
        mensaje: 'Miembro marcado como alta',
        data: miembro.toObject()
      });
    } catch (err) {
      return enviarRespuesta(res, {
        status: 500,
        mensaje: 'Error al marcar como alta',
        error: err.message
      });
    }
  },

  async eliminarMiembro(req, res) {
    const { id } = req.params;
    const usuario = req.user?.usuario || 'Sistema';

    if (!esObjectIdValido(id)) {
      return enviarRespuesta(res, {
        status: 400,
        mensaje: 'ID inválido',
        error: 'El formato del ObjectId no es válido'
      });
    }

    try {
      // 1) Buscar snapshot plano (NO documento) para historial/respuesta
      const miembroPlano = await Miembro.findById(id).lean();
      if (!miembroPlano) {
        return enviarRespuesta(res, { status: 404, mensaje: 'Miembro no encontrado' });
      }

      // 2) Borrar logins asociados (si hubiera varios, borrá todos)
      await LoginUsuario.deleteMany({ miembro: id });

      // 3) Registrar historial ANTES de borrar
      await HistorialMiembro.create({
        miembroId: miembroPlano._id,
        modificadoPor: usuario,
        accion: 'Eliminado',
        detalle: [{
          campo: 'miembro_completo',
          valorAnterior: miembroPlano,
          valorNuevo: 'Registro eliminado'
        }]
      });

      // 4) Eliminar desde el MODELO (evita problemas con .lean() y métodos de documento)
      await Miembro.deleteOne({ _id: id });

      return enviarRespuesta(res, {
        status: 200,
        mensaje: 'Miembro eliminado',
        data: miembroPlano
      });
    } catch (err) {
      return enviarRespuesta(res, {
        status: 500,
        mensaje: 'Error al eliminar miembro',
        error: err.message
      });
    }
  },
}

function  generarFiltroFecha(base, condicion) {
 base.setHours(0, 0, 0, 0);

 switch (condicion) {
   case '<':
     return { $gt: base };
   case '>':
     return { $lt: base };
   case '=':
   default:
     const fin = new Date(base);
     fin.setFullYear(fin.getFullYear() + 1);
     fin.setDate(fin.getDate() - 1);
     fin.setHours(0, 0, 0, 0);
     return { $gte: base, $lte: fin };
 }
}

/** Capitaliza un conjunto de claves string de un objeto
 *  @param {object | null | undefined} obj
 *  @param {string[]} claves
 */
function capitalizarCampos(obj, claves) {
  if (!obj || typeof obj !== 'object') return;
  for (const k of claves) {
    if (typeof obj[k] === 'string') {
      obj[k] = capitalizarTexto(obj[k]);
    }
  }
}

export async function crearMiembro(data) {
  try {
    if (data.nombres) {
      data.nombres = capitalizarTexto(data.nombres);
    }
    if (data.apellidos) {
      data.apellidos = capitalizarTexto(data.apellidos);
    }

     // Capitalizar domicilio
    capitalizarCampos(data.domicilio, ['calle', 'barrio', 'ciudad', 'provincia']);
    // Capitalizar país si existe
    if (data.datosContacto?.pais) {
      data.datosContacto.pais = capitalizarTexto(data.datosContacto.pais);
    }
    // Capitalizar género si existe
    if (data.datosPersonales?.genero) {
      data.datosPersonales.genero = capitalizarTexto(data.datosPersonales.genero);
    }
    // Capitalizar género si existe
    if (data.datosPersonales?.profesion) {
      data.datosPersonales.profesion = capitalizarTexto(data.datosPersonales.profesion);
    }

    // Normalizar teléfono móvil
    if (data.datosContacto?.telefono_movil) {
      const telResult = normalizarTelefono(data.datosContacto.telefono_movil);
      if (!telResult.success) {
        return { success: false, error: telResult.error };
      }
      data.datosContacto.telefono_movil = telResult.telefono;
    }
     /* ──────────────── 1. Normalizar DNI ──────────────── */
    let dniNum = data?.identificacion?.dni

    if (!dniNum && dniNum !== 0) {
      // Si no vino DNI: registrar vacío
      data.identificacion = {
        ...data.identificacion,
        dni: '',
        extranjero: null
      }
    } else {
      dniNum = parseInt(dniNum, 10)
      if (isNaN(dniNum)) throw new Error('DNI inválido')
      data.identificacion.dni = dniNum
      data.identificacion.extranjero = dniNum > 90000000
    }    

    /* ──────────────── 2. Normalizar datosContacto ──────────────── */
    if (!data.datosContacto) data.datosContacto = {}
    if (!('email' in data.datosContacto)) data.datosContacto.email = null
    if (!('telefono_movil' in data.datosContacto)) data.datosContacto.telefono_movil = null
    if (!('telefono_fijo' in data.datosContacto)) data.datosContacto.telefono_fijo = null

    const { email, telefono_movil: tel } = data.datosContacto

    /* ──────────────── 3. Validación manual de duplicados ──────────────── */
    // 3a. Email (solo si viene un valor)
    if (email !== null) {
      const existeEmail = await Miembro.findOne({ 'datosContacto.email': email })
      if (existeEmail) {
        return { success: false, error: 'Email duplicado' }
      }
    }

    // 3b. Teléfono móvil (opcional: quítalo si mantienes el índice unique)
    if (tel !== null) {
      const existeTel = await Miembro.findOne({ 'datosContacto.telefono_movil': tel })
      if (existeTel) {
        return { success: false, error: 'Teléfono duplicado' }
      }
    }

    // 3c. DNI - sigue protegido por el índice unique + sparse → catch lo maneja
    //     (si prefieres quitárselo al índice, añade aquí una búsqueda similar)

    /* ──────────────── 4. Crear miembro ──────────────── */
    const nuevo = await Miembro.create(data)
    return { success: true, data: nuevo }

  } catch (err) {
    /* ──────────────── 5. Manejo de errores ──────────────── */
    let motivo = 'Error inesperado'

    // Solo esperamos duplicados por el índice de DNI
    if (err.code === 11000) {
      motivo = 'DNI duplicado'
    } else if (err.name === 'ValidationError') {
      motivo = Object.values(err.errors).map(e => e.message).join(', ')
    } else {
      motivo = err.message
    }
    return { success: false, error: motivo };
  }
}

/**
 * Compara recursivamente campos de objetos, incluyendo subdocumentos y arrays.
 */
function compararCampos(previo, nuevo, prefix = '') {
  const cambios = [];

  const claves = new Set([
    ...Object.keys(previo || {}),
    ...Object.keys(nuevo || {})
  ]);

  for (const clave of claves) {
    const key = prefix ? `${prefix}.${clave}` : clave;
    const valorAnterior = previo?.[clave];
    const valorNuevo = nuevo?.[clave];

    if (
      typeof valorNuevo === 'object' &&
      valorNuevo !== null &&
      !Array.isArray(valorNuevo)
    ) {
      cambios.push(...compararCampos(valorAnterior || {}, valorNuevo, key));
    } else if (Array.isArray(valorNuevo)) {
      if (JSON.stringify(valorAnterior || []) !== JSON.stringify(valorNuevo || [])) {
        cambios.push({ campo: key, valorAnterior, valorNuevo });
      }
    } else {
      const v1 = valorAnterior ?? null;
      const v2 = valorNuevo ?? null;

      if (JSON.stringify(v1) !== JSON.stringify(v2)) {
        cambios.push({ campo: key, valorAnterior: v1, valorNuevo: v2 });
      }
    }
  }

  return cambios;
}

