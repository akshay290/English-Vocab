import { defineConfig } from "drizzle-kit";
import { configDotenv } from "dotenv";
import path from "path";

// Load .env from the project root (two levels up from lib/db)
// This makes `pnpm --filter @workspace/db run push` work without
// manually setting environment variables in the shell.
configDotenv({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Make sure .env exists in the project root.",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
