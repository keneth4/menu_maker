import { execFileSync } from "node:child_process";
import path from "node:path";

const cleanupScriptPath = path.resolve(
  process.cwd(),
  "scripts",
  "cleanup-test-generated-projects.mjs"
);

export default async () => {
  try {
    execFileSync(process.execPath, [cleanupScriptPath], { stdio: "ignore" });
  } catch {
    // Cleanup is best-effort and should not block test teardown.
  }
};
