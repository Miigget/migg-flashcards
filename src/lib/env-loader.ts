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
    // eslint-disable-next-line no-console
    console.log("[env-loader] Skipping env loading - browser/dev environment");
    return;
  }

  // eslint-disable-next-line no-console
  console.log("[env-loader] Starting env loading process...");
  // eslint-disable-next-line no-console
  console.log("[env-loader] Current working directory:", process.cwd());
  // eslint-disable-next-line no-console
  console.log("[env-loader] __dirname:", typeof __dirname !== "undefined" ? __dirname : "undefined");

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

  // eslint-disable-next-line no-console
  console.log("[env-loader] Searching in paths:", possiblePaths);

  for (const envPath of possiblePaths) {
    try {
      // eslint-disable-next-line no-console
      console.log(`[env-loader] Checking path: ${envPath}`);

      if (existsSync(envPath)) {
        // eslint-disable-next-line no-console
        console.log(`[env-loader] Found file at: ${envPath}`);

        const envContent = readFileSync(envPath, "utf8");
        // eslint-disable-next-line no-console
        console.log(`[env-loader] File content length: ${envContent.length}`);

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
              // eslint-disable-next-line no-console
              console.log(`[env-loader] Set ${key}=${value.substring(0, 20)}...`);
            } else {
              // eslint-disable-next-line no-console
              console.log(`[env-loader] Variable ${key} already exists in process.env`);
            }
          }
        });

        // eslint-disable-next-line no-console
        console.log(`[env-loader] Successfully loaded .env.production from: ${envPath}`);
        return; // Exit after finding and loading the first valid file
      } else {
        // eslint-disable-next-line no-console
        console.log(`[env-loader] File not found at: ${envPath}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[env-loader] Failed to load from ${envPath}:`, error);
    }
  }

  // eslint-disable-next-line no-console
  console.log("[env-loader] No .env.production file found in any of the expected locations");
  // eslint-disable-next-line no-console
  console.log(
    "[env-loader] Current process.env keys:",
    Object.keys(process.env).filter((key) => key.includes("SUPABASE"))
  );
}

// Load environment variables immediately when this module is imported
loadProductionEnv();

export { loadProductionEnv };
