const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const client = require("prom-client");

const app = express();

const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || "TaskFlow API";
const NODE_ENV = process.env.NODE_ENV || "development";
const API_TOKEN = process.env.API_TOKEN || "";
const POD_NAME = process.env.POD_NAME || "unknown-pod";
const APP_VERSION = process.env.APP_VERSION || "v1";

client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "taskflow_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "taskflow_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "taskflow",
  user: process.env.DB_USER || "taskflow_user",
  password: process.env.DB_PASSWORD || "taskflow_password",
});

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;

    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
});

const checkDbConnection = async () => {
  await pool.query("SELECT 1");
};

const checkApiToken = (req, res, next) => {
  const token = req.headers["x-api-token"];

  if (!API_TOKEN) {
    return res.status(500).json({
      message: "API_TOKEN is not configured",
    });
  }

  if (token !== API_TOKEN) {
    return res.status(401).json({
      message: "Invalid API token",
    });
  }

  next();
};

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      app: APP_NAME,
      env: NODE_ENV,
      version: APP_VERSION,
      pod: POD_NAME,
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      app: APP_NAME,
      env: NODE_ENV,
      version: APP_VERSION,
      pod: POD_NAME,
      database: "disconnected",
      message: error.message,
    });
  }
});

app.get("/api/tasks", async (req, res) => {
  const result = await pool.query(`
    SELECT id, title, done, created_at
    FROM tasks
    ORDER BY id ASC
  `);

  res.json(result.rows);
});

app.post("/api/tasks", async (req, res) => {
  const title = req.body.title;

  if (!title || typeof title !== "string") {
    return res.status(400).json({
      message: "Title is required",
    });
  }

  const result = await pool.query(
    `
      INSERT INTO tasks (title, done)
      VALUES ($1, false)
      RETURNING id, title, done, created_at
    `,
    [title]
  );

  res.status(201).json(result.rows[0]);
});

app.get("/api/private", checkApiToken, (req, res) => {
  res.json({
    message: "You have access to private API data",
    env: NODE_ENV,
    pod: POD_NAME,
  });
});

app.get("/api/cpu", (req, res) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 80) {
    Math.sqrt(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  res.json({
    status: "ok",
    message: "CPU work completed",
    pod: POD_NAME,
  });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.get("/api/error", (req, res) => {
  res.status(500).json({
    message: "Synthetic error for alert testing",
    pod: POD_NAME,
  });
});

app.get("/api/crash", (req, res) => {
  res.json({
    message: "Crashing API process",
    pod: POD_NAME,
  });

  setTimeout(() => {
    process.exit(1);
  }, 100);
});

checkDbConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`${APP_NAME} running on port ${PORT} in ${NODE_ENV} mode`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
