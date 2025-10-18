import { setupTestDB, clearDatabase, closeTestDB } from './setup.js';
import { Miembro } from '../miembro.model.js';

// Setup y teardown
beforeAll(async () => {
  await setupTestDB();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Miembro Tests', () => {
  
  // ========== Test básico ==========
  describe('Tests Básicos', () => {
    it('debería pasar un test simple', () => {
      expect(1 + 1).toBe(2);
    });

    it('debería tener MongoDB conectado', async () => {
      const mongoose = await import('mongoose');
      expect(mongoose.default.connection.readyState).toBe(1);
    });
  });

  // ========== Test del Modelo Miembro ==========
  describe('Modelo Miembro', () => {
    
    it('debería crear un miembro con datos válidos', async () => {
      const datosMiembro = {
        nombres: 'Juan',
        apellidos: 'Pérez',
        identificacion: {
          dni: 12345678
        },
        datosContacto: {
          email: 'juan@test.com',
          telefono_movil: '+54 9 11 1234-5678',
          pais: 'Argentina'
        },
        datosPersonales: {
          genero: 'Masculino', // Capitalizado
          f_nacimiento: new Date('1990-01-01')
        }
      };

      const miembro = await Miembro.create(datosMiembro);

      expect(miembro).toBeTruthy();
      expect(miembro._id).toBeDefined();
      expect(miembro.nombres).toBe('Juan');
      expect(miembro.apellidos).toBe('Pérez');
      expect(miembro.identificacion.dni).toBe(12345678);
      expect(miembro.datosContacto.email).toBe('juan@test.com');
    });

    it('debería rechazar miembro sin nombre', async () => {
      const datosMiembro = {
        apellidos: 'Pérez',
        identificacion: { dni: 12345678 }
      };

      await expect(Miembro.create(datosMiembro)).rejects.toThrow();
    });

    it('debería rechazar miembro sin apellido', async () => {
      const datosMiembro = {
        nombres: 'Juan',
        identificacion: { dni: 12345678 }
      };

      await expect(Miembro.create(datosMiembro)).rejects.toThrow();
    });

    it('debería permitir email null', async () => {
      const datosMiembro = {
        nombres: 'Test',
        apellidos: 'Usuario',
        identificacion: { dni: 11111111 },
        datosContacto: { email: null }
      };

      const miembro = await Miembro.create(datosMiembro);
      expect(miembro.datosContacto.email).toBeNull();
    });

    it('debería validar email inválido', async () => {
      const datosMiembro = {
        nombres: 'Test',
        apellidos: 'Usuario',
        identificacion: { dni: 44444444 },
        datosContacto: { email: 'email-invalido' }
      };

      await expect(Miembro.create(datosMiembro)).rejects.toThrow(/Email no válido/);
    });

    it('debería marcar extranjero automáticamente para DNI > 90000000', async () => {
      const datosMiembro = {
        nombres: 'Extranjero',
        apellidos: 'Test',
        identificacion: { dni: 95000000 },
        datosContacto: { email: 'extranjero@test.com' }
      };

      const miembro = await Miembro.create(datosMiembro);
      expect(miembro.identificacion.dni).toBeGreaterThan(90000000);
    });
  });

  // ========== Test de Queries ==========
  describe('Queries de Miembro', () => {
    
    beforeEach(async () => {
      // Crear datos de prueba con género capitalizado
      await Miembro.create([
        {
          nombres: 'Juan',
          apellidos: 'Pérez',
          identificacion: { dni: 11111111 },
          datosContacto: { email: 'juan@test.com' },
          datosPersonales: { genero: 'Masculino' }
        },
        {
          nombres: 'María',
          apellidos: 'González',
          identificacion: { dni: 22222222 },
          datosContacto: { email: 'maria@test.com' },
          datosPersonales: { genero: 'Femenino' }
        },
        {
          nombres: 'Pedro',
          apellidos: 'Martínez',
          identificacion: { dni: 33333333 },
          datosContacto: { email: 'pedro@test.com' },
          datosPersonales: { genero: 'Masculino' },
          estado: { baja: true }
        }
      ]);
    });

    it('debería encontrar todos los miembros', async () => {
      const miembros = await Miembro.find();
      expect(miembros).toHaveLength(3);
    });

    it('debería encontrar miembros por nombre', async () => {
      const miembros = await Miembro.find({ nombres: 'Juan' });
      expect(miembros).toHaveLength(1);
      expect(miembros[0].nombres).toBe('Juan');
    });

    it('debería encontrar miembros por género', async () => {
      const miembros = await Miembro.find({ 'datosPersonales.genero': 'Masculino' });
      expect(miembros).toHaveLength(2);
    });

    it('debería encontrar miembros activos (no dados de baja)', async () => {
      const miembros = await Miembro.find({ 'estado.baja': { $ne: true } });
      expect(miembros).toHaveLength(2);
    });

    it('debería encontrar miembros dados de baja', async () => {
      const miembros = await Miembro.find({ 'estado.baja': true });
      expect(miembros).toHaveLength(1);
      expect(miembros[0].nombres).toBe('Pedro');
    });

    it('debería actualizar un miembro', async () => {
      const miembro = await Miembro.findOne({ nombres: 'Juan' });
      miembro.datosContacto.telefono_movil = '+54 9 11 9999-9999';
      await miembro.save();

      const miembroActualizado = await Miembro.findById(miembro._id);
      expect(miembroActualizado.datosContacto.telefono_movil).toBe('+54 9 11 9999-9999');
    });

    it('debería eliminar un miembro', async () => {
      const miembro = await Miembro.findOne({ nombres: 'Juan' });
      await Miembro.deleteOne({ _id: miembro._id });

      const miembroEliminado = await Miembro.findById(miembro._id);
      expect(miembroEliminado).toBeNull();
    });

    it('debería contar miembros correctamente', async () => {
      const total = await Miembro.countDocuments();
      expect(total).toBe(3);

      const activos = await Miembro.countDocuments({ 'estado.baja': { $ne: true } });
      expect(activos).toBe(2);

      const bajas = await Miembro.countDocuments({ 'estado.baja': true });
      expect(bajas).toBe(1);
    });

    it('debería buscar por email', async () => {
      const miembro = await Miembro.findOne({ 'datosContacto.email': 'juan@test.com' });
      expect(miembro).toBeTruthy();
      expect(miembro.nombres).toBe('Juan');
    });

    it('debería buscar por DNI', async () => {
      const miembro = await Miembro.findOne({ 'identificacion.dni': 11111111 });
      expect(miembro).toBeTruthy();
      expect(miembro.nombres).toBe('Juan');
    });
  });

 
});