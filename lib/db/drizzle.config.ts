import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";

// drizzle-kit runs from lib/db/, so we go up two levels to reach the project root.
// process.cwd() is lib/db/ when invoked via pnpm --filter @workspace/db run push.
config({ path: resolve(process.cwd(), "../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    [
      "DATABASE_URL is not set.",
      "Make sure a .env file exists in the project root (English-Vocab/.env).",
      "Current working directory: " + process.cwd(),
    ].join("\n"),
  );
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
