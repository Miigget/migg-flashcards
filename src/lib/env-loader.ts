import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Loads .env.production file in AWS Lambda runtime
 * This is needed because Node.js doesn't automatically load .env.production
 */
function loadProductionEnv() {
  // Skip if not in production, if we're in build-time, or if we're not in a Node.js environment
  if (
    import.meta.env?.DEV ||
    typeof process === "undefined" ||
    typeof window !== "undefined" || // Skip in browser environment
    (process.env.NODE_ENV && process.env.NODE_ENV !== "production") // Check if defined and not production
  ) {
    return;
  }

  try {
    // In AWS Lambda, the .env.production file is in the root directory
    const envPath = join(process.cwd(), ".env.production");

    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, "utf8");

      // Simple .env parser that handles KEY=VALUE lines
      envContent.split("\n").forEach((line: string) => {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith("#")) {
          return;
        }

        // Parse KEY=VALUE format
        const equalsIndex = trimmedLine.indexOf("=");
        if (equalsIndex > 0) {
          const key = trimmedLine.substring(0, equalsIndex).trim();
          const value = trimmedLine.substring(equalsIndex + 1).trim();

          // Only set if not already in process.env (environment takes precedence)
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });

      // eslint-disable-next-line no-console
      console.log("[env-loader] Successfully loaded .env.production");
    } else {
      // eslint-disable-next-line no-console
      console.log("[env-loader] No .env.production file found at:", envPath);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[env-loader] Failed to load .env.production:", error);
  }
}

// Load environment variables immediately when this module is imported
loadProductionEnv();

export { loadProductionEnv };
