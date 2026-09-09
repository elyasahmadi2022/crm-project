import "dotenv/config";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./utiles/error-handler.utiles.js";
import { prisma } from "./lib/primsa.js";
import express, {} from "express";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// -------------------------------------------------------
// Validate required env vars before anything else starts
// -------------------------------------------------------
const requiredEnvVars = ["PORT", "DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
for (const key of requiredEnvVars) {
    if (!process.env[key])
        throw new Error(`Missing required env var: ${key}`);
}
const port = process.env.PORT;
// -------------------------------------------------------
// CORS
// -------------------------------------------------------
const allowedOrigins = [
    "http://localhost:3000",
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGINS
]
    .flatMap((origin) => origin?.split(",") ?? [])
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
function isAllowedOrigin(origin) {
    return allowedOrigins.includes(origin.replace(/\/$/, ""));
}
function setCorsHeaders(req, res) {
    const origin = req.header("origin");
    if (origin && isAllowedOrigin(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Vary", "Origin");
    }
}
// -------------------------------------------------------
// App
// -------------------------------------------------------
const app = express();
app.use(morgan("dev"));
app.use(helmet());
// CORS middleware
app.use((req, res, next) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,POST,PATCH,DELETE,OPTIONS");
        res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers") ?? "Content-Type,Authorization");
        res.sendStatus(204);
        return;
    }
    next();
});
// Body parsers — increased limit for base64 images
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
// Serve uploaded files (avatars) as public static assets
// Override helmet's default CORP: same-origin so browsers on a different
// origin (e.g. localhost:3000) can load images served from localhost:4444.
const uploadDir = process.env.UPLOAD_DIR ?? "uploads/avatars";
app.use(`/${uploadDir}`, (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.resolve(__dirname, "..", uploadDir)));
// Serve attendance face images
app.use("/uploads/attendance", (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.resolve(__dirname, "..", "uploads/attendance")));
// -------------------------------------------------------
// Routes
// -------------------------------------------------------
app.use("/api/v1", apiRouter);
// Health check — verifies DB connectivity and returns service status
app.get("/health", async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
            database: "connected"
        });
    }
    catch {
        res.status(503).json({
            status: "error",
            timestamp: new Date().toISOString(),
            database: "unreachable"
        });
    }
});
// -------------------------------------------------------
// Global error handler — must come after all routes
// -------------------------------------------------------
app.use(errorHandler);
// -------------------------------------------------------
// Start
// -------------------------------------------------------
app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
//# sourceMappingURL=index.js.map