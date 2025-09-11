import moment from 'moment'
import { decodeToken } from '../helpers/jwt.js'

const auth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header) {
    return res.status(401).json({ message: 'Token no proporcionado' })
  }

  const token = header.replace(/['"]+/g, '')

  try {
    const payload = decodeToken(token)

    if (payload.exp <= moment().unix()) {
      return res.status(401).json({ message: 'Token expirado' })
    }
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' })
  }
}

export default auth
