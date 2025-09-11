import multer from 'multer'
import path from 'node:path'

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.xlsx']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowedTypes.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Formato de archivo no soportado. Solo CSV o XLSX'), false)
  }
}

export function makeFileFilter (allowedExts = []) {
  const set = new Set(allowedExts.map(e => e.toLowerCase()))
  return function fileFilter (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    if (set.size && !set.has(ext)) return cb(new Error(`Extensión no permitida: ${ext}`))
    cb(null, true)
  }
}

const memoryStorage = multer.memoryStorage()

export const uploadExcelBuffer = multer({
  storage: memoryStorage,
  fileFilter: makeFileFilter(['.xlsx', '.xls']),
  limits: { fileSize: 10 * 1024 * 1024 }
})

const upload = multer({ storage, fileFilter })

export default upload
