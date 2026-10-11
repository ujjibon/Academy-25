"""Start the existing Blender MCP add-on in an isolated headless bpy process.

Use BPY_PYTHON / PYTHONPATH for the official bpy runtime, and point
BLENDER_MCP_ADDON to the directory containing blender_mcp_addon. This worker
starts an empty scene; it never opens or modifies an interactive Blender file.
"""
import os
import sys

import bpy

addon = os.environ.get("BLENDER_MCP_ADDON")
if not addon or not os.path.isdir(addon):
    raise RuntimeError("Set BLENDER_MCP_ADDON to the installed Blender MCP addon directory")
sys.path.insert(0, addon)
bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True)
bpy.context.scene["academy_isolated_worker"] = True
from blender_mcp_addon.cli import cli_execute

cli_execute(["--host", "127.0.0.1", "--port", os.environ.get("BLENDER_MCP_PORT", "9876")])
