/** Run the Academy builder with an installed Blender or an official bpy module. */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "build_academy_world.py");
const executable = process.env.BPY_PYTHON || process.env.BLENDER_PATH || "blender";
const args = process.env.BPY_PYTHON
  ? [script]
  : ["--background", "--factory-startup", "--python", script];
const result = spawnSync(executable, args, { stdio: "inherit", windowsHide: true });
if (result.error) console.error(result.error.message);
process.exit(result.error ? 1 : (result.status ?? 1));
