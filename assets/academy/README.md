# Quest Isles

Original geometry authored for Academy. The editable source contains individual
named books, trees, presentation slides, game pieces, atom orbits and portal parts.
The public GLB batches those parts by station and material and preserves
`stationId` metadata for browser picking. All materials use portable Principled
BSDF colors; there are no external textures or licensed model dependencies.

Build with an installed Blender:

```powershell
$env:BLENDER_PATH = 'C:\path\to\blender.exe'
node scripts/blender/build.mjs
node scripts/blender/validate_world.mjs
```

An existing official `bpy` module also works. Set `BPY_PYTHON` to its compatible
Python executable and `PYTHONPATH` to the directory containing `bpy`. Add the
runtime's DLL directories to `PATH` when required. The builder must run in a fresh
headless process. It refuses an unrelated saved Blender scene.

This workstation's delivery used the existing official bpy 5.2.1 LTS runtime,
started as an isolated headless worker with the already configured Blender MCP
add-on. MCP inspected the empty scene, executed the builder, and returned the
export statistics. The worker does not open or replace an interactive Blender
scene. `scripts/blender/start_mcp.py` accepts `BLENDER_MCP_ADDON` and starts this
add-on's supported blocking background server on localhost.

The browser component renders on demand and provides all five station controls
when WebGL or model loading is unavailable. Drag to orbit; arrow keys rotate;
plus/minus zoom; Home or the reset button restores the starting view.

## Playable lesson workshops

`lesson-lab-kit.blend` is the editable source for six original tabletop studios:
prompt building, motion editing, code pipelines, research, interface design, and
creative composition. The browser loads the matching family from
`public/models/academy/lesson-lab-kit.glb`. Its named mesh prefixes are `Prompt_`,
`Video_`, `Code_`, `Research_`, `Design_`, and `Creative_`.

Rebuild in a fresh headless Blender process:

```powershell
& 'C:\path\to\blender.exe' --background --factory-startup --python scripts/blender/build_lesson_lab_kit.py
node scripts/check-visual-learning.cjs
```

The builder also runs directly under a compatible official `bpy` Python runtime.
This kit was created with that headless runtime. It exports the editable source,
browser model, and `lesson-lab-kit-preview.png`; it uses no external textures.
The validation checks all 84 published lesson films and workshop missions, model
families, finite geometry, and the 35,000-triangle / 2 MB browser budget.

Each workshop supports orbiting and picking in 3D, keyboard rotation, and the
matching buttons below the scene. A visual workbench keeps the same placements
and experiments available when WebGL is unavailable.
