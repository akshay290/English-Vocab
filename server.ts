import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Serve static assets from /data (idiom crops and json)
  const dataDir = path.resolve(__dirname, "public/data");
  const fallbackDataDir = path.resolve(__dirname, "artifacts/ssc-vocab/public/data");
  if (fs.existsSync(dataDir)) {
    app.use("/data", express.static(dataDir));
  } else if (fs.existsSync(fallbackDataDir)) {
    app.use("/data", express.static(fallbackDataDir));
  }

  // Mount API routes
  app.use("/api", apiRouter);

  if (!isProd) {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist/
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SSC Vocabulary Master running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
