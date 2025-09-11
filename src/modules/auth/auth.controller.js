import { AuthService } from '../auth/services/auth.services.js'

export const authController = {
  async login (req, res) {
    try {
      const result = await AuthService.login(req.body)
      res.status(result.status).send(result)
    } catch (err) {
      res.status(500).send({ message: 'Error en login', error: err.message })
    }
  },

  async registrar(req, res) {
    try {
      console.log("endpoint registrar")
      const result = await AuthService.registrar(req.body);
      res.status(result.status).send(result)
    } catch (err) {
      res.status(500).send({ message: 'Error en registro', error: err.message });
    }
  }
}
