"""Create six minimal, sculptural learning objects in a fresh Blender worker.

All geometry is original and texture-free. Every runtime object is named by its
learning family; the editable source preserves the individual parts. Run with
Blender --background --factory-startup --python, or the official bpy runtime.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public' / 'models' / 'academy'
SOURCE = ROOT / 'assets' / 'academy'
PUBLIC.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
existing_scene = bpy.context.scene
if not bpy.app.background and not existing_scene.get('academy_isolated_worker'):
    raise RuntimeError('Run in a fresh headless worker; interactive scenes are protected')
if bpy.data.filepath and not existing_scene.get('academy_isolated_worker'):
    raise RuntimeError('An existing Blender file is open; use factory startup')
bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True)
scene = bpy.context.scene
scene.name = 'Academy - Minimal Play Objects'
scene['academy_isolated_worker'] = True
bpy.context.preferences.filepaths.save_version = 0

def srgb_channel(v):
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4

def hex_color(value):
    return tuple(srgb_channel(int(value[i:i+2], 16) / 255) for i in (0, 2, 4))

MATERIALS = {}
for name, color, roughness, metallic in [
    ('Porcelain', 'f2f3f5', .53, .0),
    ('Graphite', '272d3b', .57, .12),
    ('Royal blue', '335cff', .46, .05),
    ('Warm orange', 'f39b68', .50, .0),
    ('Soft silver', 'a3a9b5', .52, .24),
]:
    mat = bpy.data.materials.new('Minimal ' + name)
    color = hex_color(color)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    MATERIALS[name] = mat

FAMILIES = ['Prompt', 'Video', 'Code', 'Research', 'Design', 'Creative']
GROUPS = {}
for i, family in enumerate(FAMILIES):
    group = bpy.data.objects.new(family + '_Play', None)
    scene.collection.objects.link(group)
    group.location = ((i % 3 - 1) * 4.7, (i // 3) * 4.2, 0)
    group['family'] = family.lower()
    group['front'] = 'GLB positive Z'
    GROUPS[family] = group

def finish(obj, family, name, material, smooth=False):
    obj.name = family + '_' + name
    obj.parent = GROUPS[family]
    obj.data.materials.append(MATERIALS[material])
    obj['family'] = family.lower()
    if smooth:
        for face in obj.data.polygons:
            face.use_smooth = True
    return obj

def box(family, name, at, size, material, bevel=.04, rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new('Precision soft edge', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    if rotation:
        obj.rotation_euler = rotation
    return finish(obj, family, name, material)

def cylinder(family, name, at, radius, depth, material, rotation=None, vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=at)
    obj = finish(bpy.context.object, family, name, material, True)
    if rotation:
        obj.rotation_euler = rotation
    return obj

def link(family, name, a, b, radius, material):
    a, b = Vector(a), Vector(b)
    obj = cylinder(family, name, (a+b)/2, radius, (b-a).length, material, vertices=12)
    obj.rotation_euler = (b-a).to_track_quat('Z','Y').to_euler()
    return obj

def sphere(family, name, at, radius, material, scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=radius, location=at)
    obj = finish(bpy.context.object, family, name, material, True)
    if scale:
        obj.scale = scale
    return obj

def ring(family, name, at, radius, thickness, material, rotation=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=32, minor_segments=6, major_radius=radius,
        minor_radius=thickness, location=at)
    obj = finish(bpy.context.object, family, name, material, True)
    if rotation:
        obj.rotation_euler = rotation
    return obj

# Prompt: three substantial, staggered context planes with precise blue insets.
f = 'Prompt'
for index, at, turn, material in [
    (1, (-.18, .08, .23), -.13, 'Graphite'),
    (2, (.07, .02, .78), .10, 'Porcelain'),
    (3, (.26, -.04, 1.33), -.06, 'Porcelain'),
]:
    box(f, 'Context_tile_' + str(index), at, (1.83, 1.15, .21), material, .085,
        rotation=(0,0,turn))
    box(f, 'Context_signal_' + str(index), (at[0], at[1]-.587, at[2]),
        (1.1,.025,.047), 'Royal blue', .012, rotation=(0,0,turn))
box(f,'Focus_marker',(.98,-.21,1.47),(.13,.16,.07),'Warm orange',.025)

# Code: a freestanding rectangular circuit loop with a suspended logic hub.
f = 'Code'
for name, at, size in [
    ('Trace_top',(0,0,1.93),(2.27,.12,.14)),
    ('Trace_bottom',(0,0,.21),(2.27,.12,.14)),
    ('Trace_left',(-1.07,0,1.07),(.14,.12,1.74)),
    ('Trace_right',(1.07,0,1.07),(.14,.12,1.74)),
]:
    box(f,name,at,size,'Graphite',.045)
box(f,'Active_trace',(-.44,-.012,1.935),(1.13,.145,.06),'Royal blue',.022)
box(f,'Logic_hub',(0,0,1.08),(.73,.31,.73),'Royal blue',.10,rotation=(0,math.pi/4,0))
for i, point in enumerate([(-1.07,0,1.07),(1.07,0,1.07),(0,0,1.93),(0,0,.21)]):
    link(f,'Hub_connector_'+str(i),point,(0,0,1.08),.025,'Soft silver')
for i, (x,z,mat) in enumerate([(-1.07,1.93,'Porcelain'),(1.07,1.93,'Porcelain'),
                            (1.07,.21,'Warm orange'),(-1.07,.21,'Porcelain')]):
    box(f,'Circuit_node_'+str(i),(x,0,z),(.24,.23,.24),mat,.052)
cylinder(f,'Logic_core',(0,-.214,1.08),.12,.045,'Porcelain',(math.pi/2,0,0),16)

# Video: a thin radial reel and an offset orange editing playhead.
f = 'Video'
ring(f,'Reel_outer',(0,0,1.12),.94,.095,'Graphite',(math.pi/2,0,0))
ring(f,'Reel_inner',(0,-.01,1.12),.74,.036,'Royal blue',(math.pi/2,0,0))
cylinder(f,'Reel_hub',(0,0,1.12),.22,.18,'Porcelain',(math.pi/2,0,0),32)
for i in range(3):
    angle = i*math.tau/3 + .33
    link(f,'Reel_spoke_'+str(i),(math.cos(angle)*.20,0,1.12+math.sin(angle)*.20),
        (math.cos(angle)*.91,0,1.12+math.sin(angle)*.91),.042,'Porcelain')
box(f,'Timeline',(0,-.07,.045),(2.52,.15,.11),'Soft silver',.035)
box(f,'Cut_playhead',(.69,-.095,.32),(.075,.20,.68),'Royal blue',.026)
box(f,'Cut_marker',(.69,-.095,.69),(.17,.21,.08),'Warm orange',.025)

# Research: a clean magnifier paired with three connected evidence nodes.
f = 'Research'
ring(f,'Evidence_lens',(-.27,-.10,1.39),.64,.065,'Graphite',(math.pi/2,0,0))
ring(f,'Evidence_inset',(-.27,-.105,1.39),.54,.018,'Royal blue',(math.pi/2,0,0))
link(f,'Lens_handle',(.16,-.10,.93),(.67,-.10,.35),.077,'Graphite')
link(f,'Handle_blue_tip',(.60,-.10,.43),(.78,-.10,.23),.080,'Royal blue')
points = [(-1.17,.23,.47),(-.20,.30,.65),(1.10,.22,1.58)]
for i, point in enumerate(points):
    sphere(f,'Evidence_node_'+str(i),point,.15,'Warm orange' if i==2 else 'Porcelain')
    if i:
        link(f,'Evidence_link_'+str(i),points[i-1],point,.026,'Royal blue')
link(f,'Evidence_link_0',points[0],points[2],.016,'Soft silver')

# Design: an open graphite frame and three thin offset grid planes.
f = 'Design'
for name, at, size in [
    ('Frame_top',(0,.10,1.96),(2.40,.11,.095)),
    ('Frame_bottom',(0,.10,.20),(2.40,.11,.095)),
    ('Frame_left',(-1.16,.10,1.08),(.095,.11,1.78)),
    ('Frame_right',(1.16,.10,1.08),(.095,.11,1.78)),
]:
    box(f,name,at,size,'Graphite',.026)
box(f,'Hero_plane',(0,-.07,1.54),(1.75,.065,.37),'Porcelain',.035)
box(f,'Grid_plane_1',(-.45,-.21,.80),(.73,.065,.66),'Royal blue',.045)
box(f,'Grid_plane_2',(.45,-.07,.80),(.73,.065,.66),'Porcelain',.045)
box(f,'Grid_signal',(.47,-.108,.76),(.39,.02,.042),'Soft silver',.01)
box(f,'Resize_marker',(1.16,-.04,.20),(.16,.16,.16),'Warm orange',.029)

# Creative: an architectural aperture framing a quiet suspended blue sphere.
f = 'Creative'
for name, at, size, mat in [
    ('Aperture_top',(0,.15,2.11),(2.03,.24,.15),'Graphite'),
    ('Aperture_left',(-.94,.15,1.15),(.15,.24,1.94),'Graphite'),
    ('Aperture_right',(.94,.15,1.15),(.15,.24,1.94),'Porcelain'),
    ('Aperture_bottom',(0,.15,.19),(2.03,.24,.15),'Graphite'),
]:
    box(f,name,at,size,mat,.055)
sphere(f,'Idea_orb',(.09,-.07,1.20),.46,'Royal blue')
ring(f,'Idea_orbit',(.09,-.07,1.20),.67,.018,'Soft silver',(.34,.46,.2))
sphere(f,'Orbit_focus',(.61,-.44,1.24),.088,'Warm orange')

bpy.context.view_layer.update()
scene.world = bpy.data.worlds.new('Minimal neutral studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.75,.78,.84,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .24
for name, at, energy, size in [('Key softbox',(-6,-8,12),1800,8),('Fill softbox',(9,3,9),1250,7)]:
    bpy.ops.object.light_add(type='AREA',location=at)
    lamp=bpy.context.object
    lamp.name=name
    lamp.data.energy=energy
    lamp.data.size=size
    lamp.rotation_euler=(Vector((0,2,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(9,-16,10))
camera=bpy.context.object
camera.name='Minimal objects editorial camera'
camera.data.type='ORTHO'
camera.data.ortho_scale=16.5
camera.rotation_euler=(Vector((0,2,1))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera=camera
scene.render.resolution_x=1440
scene.render.resolution_y=900
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=True
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.cycles.device='CPU'
scene.view_settings.view_transform='Standard'
scene.view_settings.exposure=-.15
scene.render.filepath=str(PUBLIC/'minimal-play-kit-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'minimal-play-kit.blend'))
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in {'MESH','EMPTY'}:
        obj.select_set(True)
glb=PUBLIC/'minimal-play-kit.glb'
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,
    export_animations=False,export_extras=True,export_yup=True,export_materials='EXPORT')
triangles=sum(len(poly.vertices)-2 for obj in scene.objects if obj.type=='MESH' for poly in obj.data.polygons)
result={'name':'Minimal Play Objects','blender':bpy.app.version_string,
    'model':'/models/academy/minimal-play-kit.glb','source':'assets/academy/minimal-play-kit.blend',
    'bytes':glb.stat().st_size,'triangles':triangles,
    'families':{f:{'root':GROUPS[f].name,'meshes':[obj.name for obj in scene.objects if obj.type=='MESH' and obj.parent==GROUPS[f]]} for f in FAMILIES}}
if result['bytes']>1_000_000 or triangles>16_000:
    raise RuntimeError('Minimal kit exceeds its delivery budget: '+json.dumps(result))
bpy.ops.render.render(write_still=True)
print(json.dumps(result))
