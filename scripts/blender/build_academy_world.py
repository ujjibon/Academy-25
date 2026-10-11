"""Create the original, editable Quest Isles learning world and portable GLB.

Run in a new headless Blender process using build.mjs. Through Blender MCP,
run only after inspecting the isolated worker created by start_mcp.py.
No external images, fonts, or procedural materials are required at runtime.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets" / "academy"
PUBLIC = ROOT / "public" / "models" / "academy"
SOURCE.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)

# Refuse to replace an unrelated scene when called through an existing session.
scene = bpy.context.scene
if not bpy.app.background and not scene.get("academy_isolated_worker"):
    raise RuntimeError("Run this builder in a new headless process; interactive scenes are protected")
if bpy.data.filepath and not scene.get("academy_isolated_worker"):
    raise RuntimeError("Run this builder in a fresh headless process; an existing Blender file is open")
if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene.name = "Academy - Quest Isles"
scene["academy_isolated_worker"] = True
bpy.context.preferences.filepaths.save_version = 0

COLORS = {
    "Cream sandstone": (0.95, 0.87, 0.72),
    "Coral clay": (0.96, 0.38, 0.30),
    "Teal lagoon": (0.12, 0.64, 0.58),
    "Lavender crystal": (0.63, 0.51, 0.92),
    "Indigo ink": (0.12, 0.15, 0.29),
    "Golden sparks": (1.0, 0.72, 0.25),
    "Mint canopy": (0.50, 0.79, 0.65),
    "Chalk white": (0.99, 0.97, 0.92),
    "Rose quartz": (0.95, 0.65, 0.68),
}
MATS = {}
for name, color in COLORS.items():
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = 0.72
    MATS[name] = mat

groups = {}
for station in ['learn', 'play', 'build', 'recall', 'boss', 'landscape']:
    group = bpy.data.objects.new("station_" + station, None)
    scene.collection.objects.link(group)
    if station != 'landscape':
        group['stationId'] = station
    groups[station] = group

def finish(obj, name, mat, station='landscape'):
    obj.name = name
    obj.data.materials.append(MATS[mat])
    obj.parent = groups[station]
    if station != 'landscape':
        obj['stationId'] = station
    return obj

def cube(name, at, size, mat, station='landscape', bevel=0.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new("Soft crafted edges", 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(obj, name, mat, station)

def cylinder(name, at, radius, depth, mat, station='landscape', vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=at)
    return finish(bpy.context.object, name, mat, station)

def cone(name, at, radius1, radius2, depth, mat, station='landscape', vertices=12):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth, location=at)
    return finish(bpy.context.object, name, mat, station)

def sphere(name, at, scale, mat, station='landscape', subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=at)
    obj = bpy.context.object
    obj.scale = scale
    return finish(obj, name, mat, station)

def bar(name, start, end, radius, mat, station='landscape'):
    a, b = Vector(start), Vector(end)
    obj = cylinder(name, (a+b)/2, radius, (b-a).length, mat, station, 10)
    obj.rotation_euler = (b-a).to_track_quat('Z', 'Y').to_euler()
    return obj

def ring(name, at, radius, thickness, mat, station='landscape', rotation=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=40, minor_segments=6, major_radius=radius, minor_radius=thickness, location=at)
    obj = finish(bpy.context.object, name, mat, station)
    if rotation:
        obj.rotation_euler = rotation
    return obj

def crystal(name, at, size, mat, station='landscape'):
    x, y, z = at
    cone(name + " lower", (x, y, z + size*0.25), size*0.23, size*0.30, size*0.50, mat, station, 5)
    cone(name + " tip", (x, y, z + size*0.75), size*0.30, 0, size*0.50, mat, station, 5)

def platform(station, x, y, mat):
    cylinder(station + " station plinth", (x, y, .42), 1.42, .22, mat, station, 40)
    cylinder(station + " stone inset", (x, y, .56), 1.24, .10, 'Chalk white', station, 40)
    ring(station + " rim", (x, y, .64), 1.18, .035, mat, station)

# Asymmetric stacked low-poly rock makes a clear floating-island silhouette.
cone("Floating island taper", (0, 0, -2.65), .80, 5.90, 4.60, 'Coral clay', vertices=13)
cone("Island rock upper shelf", (0, 0, -.40), 5.90, 6.35, .90, 'Cream sandstone', vertices=48)
cylinder("Mint meadow terrace", (0, 0, .11), 6.15, .20, 'Mint canopy', vertices=64)
ring("Terrace cream boundary", (0, 0, .25), 5.98, .075, 'Cream sandstone')
for angle, size in [(0.4, .6), (2.3, .8), (3.8, .55), (5.2, .6)]:
    x, y = math.cos(angle)*4.4, math.sin(angle)*4.4
    sphere("Embedded island rock", (x, y, -1.3), (size, size, size), 'Lavender crystal')

# Stepping stones connect every station to a central fountain of ideas.
STATIONS = {
    'learn': {'name':'Slide sanctuary', 'position':[-3.1, -2.5], 'color':'Coral clay'},
    'play': {'name':'Puzzle arena', 'position':[3.1, -2.5], 'color':'Golden sparks'},
    'build': {'name':'Maker observatory', 'position':[3.3, 1.8], 'color':'Teal lagoon'},
    'recall': {'name':'Memory grove', 'position':[-3.3, 1.8], 'color':'Lavender crystal'},
    'boss': {'name':'Mastery gateway', 'position':[0, 4.3], 'color':'Indigo ink'},
}
for station, config in STATIONS.items():
    x, y = config['position']
    platform(station, x, y, config['color'])
    for i in range(1, 5):
        t = i/6
        cylinder("Path " + station + " " + str(i), (x*t, y*t, .26), .23, .07, 'Cream sandstone', vertices=10)
    config['anchor'] = [x, 2.30, -y]

cylinder("Fountain of ideas stone", (0, 0, .38), .90, .26, 'Cream sandstone')
cylinder("Fountain teal pool", (0, 0, .54), .74, .09, 'Teal lagoon')
crystal("Central idea crystal", (0, 0, .57), 1.40, 'Golden sparks')
ring("Floating idea orbit", (0, 0, 1.40), .70, .045, 'Chalk white', rotation=(.3, .3, 0))

# Learn: an open book pavilion and tangible presentation slides.
x, y = STATIONS['learn']['position']
for dx in [-.70, .70]:
    bar("Presentation frame", (x+dx, y+.3, .7), (x+dx, y+.3, 2.4), .08, 'Coral clay', 'learn')
cube("Presentation chalk screen", (x, y+.32, 1.75), (1.60, .12, 1.22), 'Chalk white', 'learn')
cube("Presentation headline", (x-.10, y+.24, 2.09), (1.08, .035, .11), 'Coral clay', 'learn', .025)
for z, width in [(1.85, 1.05), (1.65, .88), (1.45, .72)]:
    cube("Slide learning line", (x-.14, y+.24, z), (width, .035, .065), 'Indigo ink', 'learn', .012)
for dx, angle in [(-.35, -.20), (.35, .20)]:
    obj = cube("Open book pages", (x+dx, y-.42, .86), (.70, .60, .12), 'Cream sandstone', 'learn', .03)
    obj.rotation_euler.y = angle
cube("Book spine", (x, y-.42, .81), (.08, .64, .12), 'Coral clay', 'learn', .025)
sphere("Study spark", (x+1.0, y-.35, 1.30), (.15,.15,.15), 'Golden sparks', 'learn')

# Play: a four-square game board, colorful pawns, goal arch and trophy.
x, y = STATIONS['play']['position']
for ix in range(3):
    for iy in range(3):
        cube("Arena puzzle tile", (x+(ix-1)*.49, y+(iy-1)*.49, .72), (.45,.45,.10), 'Golden sparks' if (ix+iy)%2 else 'Cream sandstone', 'play', .035)
for dx, dy, mat in [(-.48,-.48,'Coral clay'),(.48,.48,'Teal lagoon'),(0,-.48,'Lavender crystal')]:
    cylinder("Game pawn base", (x+dx,y+dy,.87), .12,.20,mat,'play',12)
    sphere("Game pawn head", (x+dx,y+dy,1.04), (.14,.14,.14),mat,'play',2)
for dx in [-.72,.72]:
    bar("Arena goal post", (x+dx,y+.72,.70),(x+dx,y+.72,1.65),.075,'Coral clay','play')
bar("Arena goal beam", (x-.72,y+.72,1.65),(x+.72,y+.72,1.65),.075,'Coral clay','play')
crystal("Victory trophy", (x+.94,y-.12,.7),.68,'Golden sparks','play')

# Build: a modeled atom sculpture over a maker bench, with movable blocks.
x, y = STATIONS['build']['position']
cylinder("Observatory pedestal",(x,y,1.01),.39,.80,'Teal lagoon','build',16)
sphere("Observatory nucleus",(x,y,1.84),(.30,.30,.30),'Golden sparks','build',2)
for angle, mat in [(0,'Coral clay'),(math.pi/3,'Lavender crystal'),(2*math.pi/3,'Teal lagoon')]:
    ring("Atom orbit",(x,y,1.84),.81,.045,mat,'build',(math.pi/2,angle,.2))
    sphere("Orbiting electron",(x+math.cos(angle)*.76,y+math.sin(angle)*.36,2.12),(.12,.12,.12),mat,'build',2)
cube("Maker block coral",(x-.86,y-.30,.86),(.38,.38,.40),'Coral clay','build')
cube("Maker block lavender",(x+.79,y-.42,.91),(.42,.42,.48),'Lavender crystal','build')
cone("Maker pyramid",(x+.79,y-.42,1.33),.29,0,.37,'Golden sparks','build',4)

# Recall: three book-like towers and a memory tree with separate branches.
x, y = STATIONS['recall']['position']
for dx, height, mat in [(-.66,.90,'Coral clay'),(-.12,1.22,'Teal lagoon'),(.46,1.00,'Lavender crystal')]:
    cube("Memory archive book",(x+dx,y-.22,.65+height/2),(.38,.63,height),mat,'recall',.06)
    for z in [.82,1.01]:
        cube("Book spine gold band",(x+dx,y-.55,z),(.35,.025,.04),'Golden sparks','recall',.01)
bar("Memory tree trunk",(x,y+.53,.7),(x,y+.53,1.6),.105,'Cream sandstone','recall')
for dx, dy, dz in [(-.44,.02,1.83),(.40,.04,1.94),(0,.04,2.19)]:
    bar("Memory tree branch",(x,y+.53,1.4),(x+dx,y+.53+dy,dz),.06,'Cream sandstone','recall')
    sphere("Memory tree canopy",(x+dx,y+.53+dy,dz),(.42,.35,.39),'Lavender crystal','recall',2)

# Boss: a chunky portal, stairs and floating mastery crest.
x, y = STATIONS['boss']['position']
for dx in [-.86,.86]:
    cube("Mastery gate pillar",(x+dx,y,1.51),(.32,.40,1.72),'Indigo ink','boss',.09)
    cube("Mastery gate capital",(x+dx,y,2.42),(.46,.53,.19),'Golden sparks','boss',.05)
cube("Mastery arch beam",(x,y,2.53),(2.02,.42,.25),'Indigo ink','boss',.10)
for i in range(3):
    cube("Gateway stair",(x,y-.72+i*.18,.63+i*.085),(1.50-i*.13,.32,.15),'Cream sandstone','boss',.03)
ring("Gateway portal inner ring",(x,y+.03,1.64),.60,.07,'Lavender crystal','boss',(math.pi/2,0,0))
crystal("Mastery crest",(x,y,2.79),.66,'Golden sparks','boss')

# Framing details: hand-made trees, crystals, and floating satellite stones.
for x,y,size in [(-5.0,-.1,.8),(5.0,.0,.8),(-1.8,4.8,.62),(1.7,4.8,.63),(-1.8,-4.8,.65),(1.8,-4.8,.65)]:
    bar("Grove tree trunk",(x,y,.25),(x,y,1.10*size),.10,'Cream sandstone')
    for dx,dy,dz in [(0,0,1.5),(-.25,.05,1.25),(.22,-.02,1.24)]:
        sphere("Faceted grove foliage",(x+dx*size,y+dy*size,dz*size),(.43*size,.42*size,.52*size),'Teal lagoon',subdivisions=2)
for x,y,size in [(-4.6,-3.8,.63),(4.6,-3.8,.65),(-4.5,3.5,.72),(4.5,3.5,.66)]:
    crystal("Meadow crystal",(x,y,.25),size,'Lavender crystal')
for x,y,z,size in [(-7,1,-1.3,.65),(6.8,-2,-.4,.48),(-2,-7,-1.7,.45)]:
    cone("Satellite floating stone",(x,y,z),.13,size,size*1.4,'Lavender crystal',vertices=7)
    cylinder("Satellite meadow cap",(x,y,z+size*.7),size,.08,'Mint canopy',vertices=7)

scene.world = bpy.data.worlds.new("Warm pastel daylight")
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.77,.87,.92,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .6
for name, at, energy, size in [("Soft morning key",(-8,-10,15),1700,8),("Lavender fill",(8,4,10),1000,7)]:
    bpy.ops.object.light_add(type='AREA',location=at)
    light=bpy.context.object
    light.name=name
    light.data.energy=energy
    light.data.shape='DISK'
    light.data.size=size
    light.rotation_euler=(Vector((0,0,0))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(12,-16,12))
camera=bpy.context.object
camera.name="Delivery isometric camera"
camera.data.type='ORTHO'
camera.data.ortho_scale=19.0
camera.rotation_euler=(Vector((0,0,.1))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera=camera
scene.render.resolution_x=1000
scene.render.resolution_y=700
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=True
scene.render.engine='CYCLES'
scene.cycles.samples=16
scene.cycles.use_denoising=True
scene.cycles.device='CPU'
scene.view_settings.view_transform='Standard'
scene.render.filepath=str(PUBLIC / 'quest-isles-preview.png')
source_path=SOURCE / 'quest-isles.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(source_path))

# Preserve individual editable parts in the .blend, then batch runtime meshes by
# station and material so the browser pays fewer draw calls.
for station in groups:
    for mat in MATS.values():
        objects=[obj for obj in scene.objects if obj.type=='MESH' and obj.parent==groups[station] and len(obj.data.materials)==1 and obj.data.materials[0]==mat]
        if not objects:
            continue
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:
            bpy.ops.object.join()
        merged=bpy.context.object
        merged.name='academy_'+station+'_'+mat.name.lower().replace(' ','_')
        if station!='landscape':
            merged['stationId']=station

bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type=='MESH' or obj.type=='EMPTY':
        obj.select_set(True)
glb_path=PUBLIC / 'quest-isles.glb'
bpy.ops.export_scene.gltf(filepath=str(glb_path),export_format='GLB',use_selection=True,export_animations=False,export_extras=True,export_yup=True,export_materials='EXPORT')
triangles=sum(len(p.vertices)-2 for obj in scene.objects if obj.type=='MESH' for p in obj.data.polygons)
report={
    'name':'Quest Isles', 'generator':'scripts/blender/build_academy_world.py',
    'blender':bpy.app.version_string, 'source':'assets/academy/quest-isles.blend',
    'model':'/models/academy/quest-isles.glb', 'preview':'/models/academy/quest-isles-preview.png',
    'triangles':triangles, 'meshObjects':sum(obj.type=='MESH' for obj in scene.objects),
    'materials':len({mat.name for obj in scene.objects if obj.type=='MESH' for mat in obj.data.materials}),
    'bytes':glb_path.stat().st_size, 'stations':STATIONS,
}
(PUBLIC / 'manifest.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.ops.render.render(write_still=True)
result=report
print(json.dumps(report))
