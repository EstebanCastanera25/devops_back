// datadog.js
const tracer = require('dd-trace').init({
  service: process.env.DD_SERVICE || 'devops-backend',
  env: process.env.DD_ENV || 'production',
  version: process.env.DD_VERSION || '1.0.0',
  logInjection: true,
  runtimeMetrics: true,
  profiling: true
});

module.exports = tracer;