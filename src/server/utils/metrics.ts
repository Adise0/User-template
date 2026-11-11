import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";

// Everything GET /metrics exposes, in Prometheus format. A registry of our own (instead of the
// library's global one) so nothing else in the process can add to it by accident.
export const metricsRegistry = new Registry();

// Process stats: CPU, memory, event loop lag, garbage collection, open handles...
collectDefaultMetrics({ register: metricsRegistry });

// Request rate, error rate and latency per route. The route is the pattern (eg.
// /admin/users/:userId), never the real URL, so ids and tokens don't turn into labels.
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

// Emails are sent after the response for most endpoints, so their failures never show up as a
// status code. This is the only place they're counted.
export const emailsSent = new Counter({
  name: "emails_sent_total",
  help: "Emails handed to the SMTP server, by result",
  labelNames: ["result"] as const,
  registers: [metricsRegistry],
});
