import { defineConfig } from "drizzle-kit";

// DATABASE_URL is loaded automatically by drizzle-kit from the nearest .env file.
// No manual dotenv setup needed.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Make sure .env exists in the project root.",
  );
}

export default defineConfig({
  // Use a relative path — drizzle-kit resolves it from this config file's
  // directory. Avoids Windows backslash issues that break glob matching.
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
