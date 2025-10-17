import jwt from 'jwt-simple'
import moment from 'moment'

const secret = 'devops12'

const createToken = (user) => {
  const payload = {
    sub: user._id,
    nombres: user.nombres,
    apellidos: user.apellidos,
    email: user.email,
    rol: user.rol,
    usuario: user.usuario,
    iat: moment().unix(),
    exp: moment().add(1, 'days').unix()
  }
  return jwt.encode(payload, secret)
}

const decodeToken = (token) => {
  return jwt.decode(token, secret)
}

export { createToken, decodeToken }
