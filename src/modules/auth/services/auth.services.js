import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import { Miembro } from '../../miembro/miembro.model.js'
import { createToken } from '../../../helpers/jwt.js'
import { LoginUsuario } from '../../auth/loginUsuario.model.js'; 

export const AuthService = {
  async login({ usuario, password }) {
    if (!usuario || !password) {
      return { status: 400, message: 'Usuario y contraseña son obligatorios' }
    }

    const loginData = await LoginUsuario.findOne({ usuario }).populate('miembro')

    if (!loginData) {
      return { status: 404, message: 'Usuario no encontrado' }
    }

    if (!loginData.activo) {
      return { status: 403, message: 'Usuario bloqueado o inactivo' }
    }

    // Asegurar valor numérico
    loginData.intentosFallidos = Number(loginData.intentosFallidos || 0)

    const match = await bcrypt.compare(password, loginData.password || '')
    if (!match) {
      loginData.intentosFallidos += 1

      // Bloquear si supera el límite (5 intentos)
      if (loginData.intentosFallidos >= 5) {
        loginData.activo = false
        // opcional: guardar fecha de bloqueo: loginData.fechaBloqueo = new Date()
      }

      await loginData.save()

      return {
        status: 401,
        message: loginData.activo
          ? 'Contraseña incorrecta'
          : 'Usuario bloqueado por múltiples intentos fallidos'
      }
    }

    // Contraseña correcta -> resetear intentos y actualizar ultimoLogin
    loginData.ultimoLogin = new Date()
    loginData.intentosFallidos = 0
    await loginData.save()

    const miembro = loginData.miembro

    const token = createToken({
      sub: miembro._id,
      rol: miembro.rol,
      nombres: miembro.nombres,
      apellidos: miembro.apellidos,
      email: miembro.datosContacto?.email || '',
      usuario: loginData.usuario
    })

    return {
      status: 200,
      message: 'Login exitoso',
      data: {
        _id: miembro._id,
        nombres: miembro.nombres,
        apellidos: miembro.apellidos,
        rol: miembro.rol,
        email: miembro.datosContacto?.email,
        usuario: loginData.usuario,
        token // lo devuelvo también dentro de data para conveniencia del frontend
      }
    }
  },

  async registrar(body) {
      try {
    const {
      nombres,
      apellidos,
      login,
      datosContacto = {},
      identificacion = {},
      domicilio,
      datosPersonales,
      estado,
      redesSociales,
      observaciones,
      usuario_alta,
      usuario_baja,
      rol
    } = body;

    const rolFinal = rol || 'usuario';
    const email = datosContacto?.email;
    const password = login?.password;

    if (!nombres || !apellidos || !email) {
      return {
        status: 400,
        message: 'Nombre, apellido y email son obligatorios'
      };
    }

    // Preparar miembro sin login
    const miembroNuevo = {
      nombres,
      apellidos,
      rol: rolFinal,
      datosContacto: { ...datosContacto, email },
      identificacion,
      domicilio,
      datosPersonales,
      estado: estado ?? {},
      redesSociales,
      observaciones,
      usuario_alta,
      usuario_baja
    };

    // Crear miembro
    const nueva = await Miembro.create(miembroNuevo);
    console.log("nueva",nueva)
    // Si necesita login, lo creamos aparte en otra colección
    let usuarioFinal = null;

    if (['admin', 'colaborador', 'fiscal'].includes(rolFinal)) {
      if (!password) {
        return {
          status: 400,
          message: 'Contraseña obligatoria para roles con acceso (admin o colaborador)'
        };
      }

      const baseUsuario = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      usuarioFinal = baseUsuario;
      let i = 1;
      while (await LoginUsuario.findOne({ usuario: usuarioFinal })) {
        usuarioFinal = `${baseUsuario}${i}`;
        i++;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await LoginUsuario.create({
        miembro: nueva._id,
        usuario: usuarioFinal,
        password: passwordHash,
        rol: rolFinal,
        activo: true
      });
    }

    return {
      status: 201,
      message: 'Registro exitoso',
      data: {
        _id: nueva._id,
        usuario: usuarioFinal,
        nombres: nueva.nombres,
        apellidos: nueva.apellidos,
        email: nueva.datosContacto.email,
        rol: nueva.rol
      }
    };

  } catch (err) {
    console.log("err",err)
    if (err.code === 11000) {
      const campo = Object.keys(err.keyPattern)[0];
      return {
        status: 409,
        message: `El campo duplicado es: ${campo}`
      };
    }

    return {
      status: 500,
      message: 'Error inesperado',
      error: err.message
    };
  }
  }
}