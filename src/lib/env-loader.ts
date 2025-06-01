import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Loads .env.production file in AWS Lambda runtime
 * This is needed because Node.js doesn't automatically load .env.production
 */
function loadProductionEnv() {
  // Skip if in browser environment or dev mode
  if (
    typeof window !== "undefined" || // Skip in browser environment
    import.meta.env?.DEV // Skip in dev mode
  ) {
    return;
  }

  // Possible locations for .env.production in AWS Lambda
  const possiblePaths = [
    join(process.cwd(), ".env.production"), // Current working directory
    "/var/task/.env.production", // AWS Lambda task directory
    join(process.cwd(), ".amplify-hosting/compute/default/.env.production"), // Build location
    "./.env.production", // Relative to current directory
    ".env.production", // Direct file name
    "/opt/.env.production", // Alternative AWS Lambda location
  ];

  // Add __dirname based path if available
  if (typeof __dirname !== "undefined") {
    possiblePaths.push(join(__dirname, ".env.production"));
  }

  for (const envPath of possiblePaths) {
    try {
      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, "utf8");
        let loadedCount = 0;

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
              loadedCount++;
            }
          }
        });

        // eslint-disable-next-line no-console
        console.log(`[env-loader] Successfully loaded ${loadedCount} environment variables from .env.production`);
        return; // Exit after finding and loading the first valid file
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[env-loader] Failed to load from ${envPath}:`, error);
    }
  }

  // eslint-disable-next-line no-console
  console.log("[env-loader] No .env.production file found");
}

// Load environment variables immediately when this module is imported
loadProductionEnv();

export { loadProductionEnv };
