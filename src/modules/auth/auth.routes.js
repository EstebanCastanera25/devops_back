import { Router } from 'express'
import { authController } from '../auth/auth.controller.js'

const router = Router()

// Rutas públicas
router.post('/login', authController.login)
router.post('/registrar', authController.registrar)

export default router
