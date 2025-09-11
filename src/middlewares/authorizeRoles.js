const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return res.status(403).json({ 
        message: 'Acceso restringido',
        rol: req.user?.rol ?? 'desconocido',
        permitidos: roles
      })
    }
    next()
  }
}

export default authorizeRoles
