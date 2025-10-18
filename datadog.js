import tracer from 'dd-trace';

tracer.init({
  logInjection: true,
  url: 'https://trace.agent.datadoghq.com', // agentless
  // opcionales:
  runtimeMetrics: true,
  profiling: true,
});

export default tracer;