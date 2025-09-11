import { Router } from 'express'
import { miembroController } from '../miembro/miembro.controller.js'
import auth from '../../middlewares/authenticate.js'
import authorizeRoles from '../../middlewares/authorizeRoles.js'
import uploadFile from '../../middlewares/uploadFile.js'

const router = Router()

// Rutas protegidas
router.get('/exportar', auth,authorizeRoles('admin'), miembroController.exportarMiembrosExcel)
router.post('/listar', auth,authorizeRoles('admin'), miembroController.listarMiembros)

router.post('/agregar', auth, authorizeRoles('admin'), miembroController.agregarMiembro)

router.get('/obtener/:id', auth,authorizeRoles('admin'), miembroController.obtenerMiembro)

router.put('/actualizar/:id', auth,authorizeRoles('admin'), miembroController.actualizarMiembro)


router.post('/importar', auth, authorizeRoles('admin'), uploadFile.single('archivo'), miembroController.importarMiembros)
router.put('/marcar-baja/:id', auth, authorizeRoles('admin'), miembroController.marcarComoBaja);
router.put('/marcar-alta/:id', auth, authorizeRoles('admin'), miembroController.marcarComoAlta);
router.delete('/eliminar/:id', auth, authorizeRoles('admin'), miembroController.eliminarMiembro);


export default router