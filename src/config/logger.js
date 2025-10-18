import winston from 'winston';
import tracer from 'dd-trace';

const ddCorrelate = winston.format((info) => {
  try {
    const ids = tracer.traceIdentifiers(); // { trace_id, span_id }
    if (ids?.trace_id) {
      info.dd = {
        trace_id: String(ids.trace_id),
        span_id: String(ids.span_id),
        service: process.env.DD_SERVICE,
        env: process.env.DD_ENV,
        version: process.env.DD_VERSION
      };
    }
  } catch {}
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: process.env.DD_SERVICE || 'llac-backend' },
  format: winston.format.combine(
    ddCorrelate(),                 // ← opcional si ya usás DD_LOGS_INJECTION=true
    winston.format.timestamp(),
    winston.format.json()          // ← importante: JSON para Datadog
  ),
  transports: [ new winston.transports.Console() ]
});

export default logger;