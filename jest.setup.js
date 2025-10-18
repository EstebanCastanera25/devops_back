// jest.setup.js
// Configurar variables de entorno para testing
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devops_test';
process.env.NODE_ENV = 'test';

// Aumentar el timeout global si es necesario
jest.setTimeout(30000);