"""Build six original, tactile course workshops in a fresh headless Blender.

Use Blender --background --factory-startup --python this_file, or BPY_PYTHON.
The editable source and browser GLB are generated without external textures.
Every exported mesh is prefixed by its workshop family for selective loading.
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
scene = bpy.context.scene
if not bpy.app.background and not scene.get('academy_isolated_worker'):
    raise RuntimeError('Use a fresh headless Blender worker; interactive scenes are protected')
if bpy.data.filepath and not scene.get('academy_isolated_worker'):
    raise RuntimeError('Use factory startup; an existing Blender file is open')
bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True)
scene = bpy.context.scene
scene.name = 'Academy - Six Learning Workshops'
scene['academy_isolated_worker'] = True
bpy.context.preferences.filepaths.save_version = 0

COLORS = {
    'Porcelain': (0.97, 0.94, 0.87), 'Ink': (0.065, 0.10, 0.17),
    'Warm clay': (0.94, 0.34, 0.20), 'Peach': (1.0, 0.67, 0.43),
    'Marigold': (1.0, 0.70, 0.12), 'Butter': (1.0, 0.87, 0.46),
    'Lagoon': (0.035, 0.59, 0.55), 'Mint': (0.46, 0.83, 0.69),
    'Blueberry': (0.35, 0.34, 0.80), 'Lilac': (0.70, 0.62, 0.95),
    'Berry': (0.80, 0.22, 0.43), 'Blush': (1.0, 0.67, 0.73),
    'Sky': (0.31, 0.64, 0.88), 'Cloud': (0.75, 0.87, 0.94),
    'Wood': (0.72, 0.43, 0.22), 'Paper': (1.0, 0.99, 0.96),
}
MATS = {}
for name, color in COLORS.items():
    mat = bpy.data.materials.new('Lab ' + name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = 0.58
    MATS[name] = mat

FAMILIES = ['Prompt', 'Video', 'Code', 'Research', 'Design', 'Creative']
GROUPS = {}
for i, family in enumerate(FAMILIES):
    root = bpy.data.objects.new(family + '_Lab', None)
    scene.collection.objects.link(root)
    root.location = ((i % 3 - 1) * 6, (i // 3) * 5.0, 0)
    root['family'] = family.lower()
    root['purpose'] = 'Original learning workshop props'
    GROUPS[family] = root

def finish(obj, name, mat, family, smooth=False):
    obj.name = family + '_' + name
    obj.data.materials.append(MATS[mat])
    obj.parent = GROUPS[family]
    obj['family'] = family.lower()
    if smooth:
        for face in obj.data.polygons:
            face.use_smooth = True
    return obj

def cube(f, name, at, size, mat, bevel=0.06, rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Tactile rounded edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if rotation:
        obj.rotation_euler = rotation
    return finish(obj, name, mat, f)

def cylinder(f, name, at, radius, depth, mat, rotation=None, vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=at)
    obj = finish(bpy.context.object, name, mat, f, True)
    if rotation:
        obj.rotation_euler = rotation
    return obj

def sphere(f, name, at, size, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1, location=at)
    obj = bpy.context.object
    obj.scale = size
    return finish(obj, name, mat, f, True)

def bar(f, name, a, b, radius, mat, vertices=12):
    a, b = Vector(a), Vector(b)
    obj = cylinder(f, name, (a + b) / 2, radius, (b-a).length, mat, vertices=vertices)
    obj.rotation_euler = (b-a).to_track_quat('Z', 'Y').to_euler()
    return obj

def ring(f, name, at, radius, width, mat, rotation=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=24, minor_segments=6, major_radius=radius, minor_radius=width, location=at)
    obj = finish(bpy.context.object, name, mat, f, True)
    if rotation:
        obj.rotation_euler = rotation
    return obj

def triangle(f, name, at, scale, mat, rotate=0):
    # A raised triangular icon facing the camera, not a texture.
    mesh = bpy.data.meshes.new(name)
    pts = [(-0.45, -0.035, -0.45), (-0.45, -0.035, 0.45), (0.45, -0.035, 0),
           (-0.45, 0.035, -0.45), (-0.45, 0.035, 0.45), (0.45, 0.035, 0)]
    faces = [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]
    mesh.from_pydata(pts, [], faces)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.location = at
    obj.scale = (scale, scale, scale)
    obj.rotation_euler.z = rotate
    return finish(obj, name, mat, f)

def table(f, accent, pale):
    cube(f, 'Workshop_base', (0, 0, 0.16), (4.7, 3.35, 0.28), accent, .14)
    cube(f, 'Porcelain_work_surface', (0, 0, .33), (4.49, 3.13, .11), 'Porcelain', .12)
    cube(f, 'Back_inset', (0, .78, .405), (4.08, 1.18, .04), pale, .14)
    for x in [-1.98, 1.98]:
        for y in [-1.29, 1.29]:
            cylinder(f, 'Corner_rivet', (x, y, .406), .052, .018, accent, vertices=12)
    # A quiet front work area leaves room for game pieces and connecting paths.
    for x in [-.94, 0, .94]:
        ring(f, 'Piece_socket', (x, -.99, .408), .19, .016, pale)

for f, accent, pale in [('Prompt','Warm clay','Peach'),('Video','Blueberry','Lilac'),
                        ('Code','Lagoon','Mint'),('Research','Sky','Cloud'),
                        ('Design','Berry','Blush'),('Creative','Marigold','Butter')]:
    table(f, accent, pale)

# Prompt workshop: a friendly socket robot and context blocks.
f = 'Prompt'
cube(f, 'Robot_body', (.85, .50, .91), (.75, .62, .84), 'Warm clay', .14)
cube(f, 'Robot_head', (.85, .49, 1.62), (1.12, .70, .72), 'Peach', .18)
cube(f, 'Robot_face', (.85, .105, 1.62), (.86, .035, .46), 'Ink', .12)
for x in [.62, 1.08]:
    cylinder(f, 'Robot_eye', (x, .073, 1.69), .075, .03, 'Mint', (math.pi/2,0,0), 16)
cube(f, 'Robot_smile', (.85,.069,1.47), (.29,.024,.045), 'Porcelain', .02)
bar(f, 'Antenna', (.85,.49,1.99), (.85,.49,2.27), .025, 'Ink')
sphere(f,'Antenna_light',(.85,.49,2.29),(.095,.095,.095),'Mint')
for x in [.63,1.08]:
    cube(f,'Robot_foot',(x,.18,.50),(.30,.47,.20),'Ink',.07)
for x, side in [(.29,-1),(1.41,1)]:
    bar(f,'Robot_arm',(x,.48,1.25),(x+side*.18,.04,1.10),.065,'Peach')
    sphere(f,'Robot_hand',(x+side*.18,.04,1.10),(.11,.11,.11),'Warm clay')
for i, (mat, width) in enumerate([('Porcelain',.95),('Mint',.81),('Marigold',.68)]):
    cube(f,'Context_block',(-.95,.48,.56+i*.24),(width,.77,.19),mat,.05)
    cube(f,'Context_detail',(-.99,.077,.56+i*.24),(width*.58,.022,.046),'Ink',.012)
ring(f,'Input_socket',(.85,.164,.96),.16,.03,'Porcelain',(math.pi/2,0,0))
cube(f,'Signal_card',(-.92,-.20,.50),(1.17,.48,.12),'Peach',.05)
for x in [-1.26,-.98,-.70]:
    sphere(f,'Signal_dot',(x,-.20,.574),(.035,.035,.025),'Warm clay')

# Video workshop: chunky film camera, physical reel, and cut timeline.
f = 'Video'
cube(f,'Camera_body',(-.79,.59,1.17),(1.30,.76,.94),'Blueberry',.14)
cube(f,'Camera_highlight',(-.79,.188,1.23),(.92,.045,.58),'Lilac',.07)
cylinder(f,'Camera_lens',(-.79,.04,1.19),.29,.37,'Ink',(math.pi/2,0,0))
cylinder(f,'Camera_glass',(-.79,-.164,1.19),.22,.033,'Sky',(math.pi/2,0,0))
ring(f,'Lens_rim',(-.79,-.19,1.19),.248,.029,'Porcelain',(math.pi/2,0,0))
for x in [-1.13,-.43]:
    cylinder(f,'Film_reel',(x,.55,1.92),.34,.12,'Porcelain',(math.pi/2,0,0))
    for a in range(5):
        ang = a*math.tau/5
        cylinder(f,'Reel_hole',(x+math.cos(ang)*.19,.475,1.92+math.sin(ang)*.19),.065,.022,'Ink',(math.pi/2,0,0),12)
bar(f,'Camera_stand',(-.79,.59,.47),(-.79,.59,.73),.065,'Ink')
cube(f,'Camera_stand_foot',(-.79,.59,.46),(.9,.62,.1),'Ink',.06)
cube(f,'Clapper_board',(1.02,.65,.99),(1.0,.16,.88),'Ink',.06)
cube(f,'Clapper_arm',(1.00,.65,1.58),(1.06,.19,.17),'Porcelain',.025,rotation=(0,.15,0))
for x in [.65,.91,1.17,1.43]:
    cube(f,'Clapper_stripe',(x,.544,1.58),(.12,.025,.15),'Blueberry',.015,rotation=(0,.33,0))
triangle(f,'Clapper_play',(1.02,.549,1.07),.36,'Lilac')
cube(f,'Timeline_track',(0,-.35,.46),(3.35,.40,.09),'Ink',.03)
for x, mat, size in [(-1.07,'Lilac',.72),(-.18,'Peach',.85),(.90,'Mint',1.07)]:
    cube(f,'Timeline_clip',(x,-.35,.528),(size,.29,.055),mat,.018)
cube(f,'Cut_playhead',(.23,-.35,.62),(.042,.53,.12),'Marigold',.01)

# Code workshop: a circuit board and expressive terminal blocks.
f = 'Code'
cube(f,'Terminal_frame',(-.51,.93,1.17),(1.87,.19,1.35),'Ink',.12)
cube(f,'Terminal_screen',(-.51,.818,1.17),(1.63,.035,1.10),'Lagoon',.06)
for i, width in enumerate([.67,.91,.42,.78]):
    cube(f,'Terminal_line',(-.68,.79,1.51-i*.22),(width,.025,.065),'Mint' if i%2==0 else 'Porcelain',.015)
cube(f,'Terminal_cursor',(.02,.785,.85),(.07,.027,.11),'Marigold',.01)
cube(f,'Terminal_foot',(-.51,.93,.48),(1.20,.51,.17),'Ink',.06)
cube(f,'Circuit_board',(1.04,.42,.59),(1.17,1.05,.20),'Lagoon',.07)
cube(f,'Processor',(1.04,.42,.74),(.48,.45,.14),'Ink',.04)
for x in [.82,1.01,1.21]:
    for y in [.035,.79]:
        cube(f,'Chip_pin',(x,y,.67),(.06,.26,.06),'Marigold',.01)
for x in [.56,1.52]:
    bar(f,'Circuit_trace',(x,-.06,.72),(x,.82,.72),.018,'Mint')
    for y in [-.06,.82]:
        cylinder(f,'Trace_node',(x,y,.727),.046,.025,'Marigold',vertices=12)
for i,mat in enumerate(['Marigold','Mint','Porcelain']):
    cube(f,'Function_block',(-1.22+i*.68,-.23,.57),(.55,.48,.29),mat,.07)
    cylinder(f,'Function_socket',(-1.22+i*.68,-.23,.74),.09,.04,'Lagoon',vertices=12)

# Research workshop: books, tangible evidence sheets, and a magnifier.
f = 'Research'
for i, (w,mat) in enumerate([(1.35,'Sky'),(1.14,'Marigold'),(1.21,'Blueberry')]):
    cube(f,'Archive_book',(-.92,.78,.51+i*.20),(w,.88,.16),mat,.055)
    cube(f,'Book_page_edge',(-.92,.295,.51+i*.20),(w*.87,.025,.089),'Paper',.012)
    cube(f,'Book_spine_band',(-1.34,.285,.51+i*.20),(.065,.038,.13),'Porcelain',.012)
cube(f,'Evidence_clipboard',(.72,.73,.48),(1.22,1.38,.09),'Wood',.06)
cube(f,'Evidence_paper',(.72,.70,.548),(1.05,1.15,.025),'Paper',.02)
cube(f,'Clipboard_clip',(.72,1.34,.581),(.38,.15,.065),'Sky',.025)
for y,width in [(1.07,.68),(.91,.80),(.75,.58)]:
    cube(f,'Evidence_ink',(.67,y,.566),(width,.043,.017),'Ink',.01)
for x in [.37,.65,.93]:
    cylinder(f,'Evidence_point',(x,.42,.573),.06,.02,'Sky',vertices=12)
ring(f,'Magnifier_frame',(.81,-.21,.87),.35,.058,'Ink',(math.pi/2,.13,.15))
cylinder(f,'Magnifier_glass',(.81,-.21,.87),.30,.038,'Cloud',(math.pi/2,.13,.15))
bar(f,'Magnifier_handle',(1.05,-.24,.58),(1.39,-.27,.44),.07,'Sky')
cube(f,'Index_card',(-.97,-.24,.48),(1.06,.46,.12),'Cloud',.04)
for x in [-1.28,-1.02,-.76]:
    cube(f,'Card_reference',(x,-.24,.553),(.15,.17,.025),'Sky',.015)

# Design workshop: an articulated UI window with tactile layout cards.
f = 'Design'
cube(f,'Window_frame',(.02,.95,1.24),(2.82,.21,1.63),'Berry',.14)
cube(f,'Window_canvas',(.02,.822,1.16),(2.56,.035,1.19),'Paper',.07)
for x,mat in [(-1.03,'Peach'),(-.84,'Marigold'),(-.65,'Mint')]:
    cylinder(f,'Window_control',(x,.811,1.91),.042,.027,mat,(math.pi/2,0,0),12)
cube(f,'Layout_sidebar',(-.97,.788,1.17),(.35,.026,.94),'Blush',.03)
cube(f,'Layout_hero',(.25,.78,1.45),(1.56,.04,.34),'Lilac',.04)
for x in [-.30,.29,.88]:
    cube(f,'Layout_tile',(x,.778,1.00),(.47,.045,.37),'Peach' if x<0 else 'Mint' if x<.5 else 'Cloud',.04)
cube(f,'Window_stand',(.02,.97,.45),(1.30,.66,.10),'Berry',.04)
for x,y,a,mat in [(-1.28,-.13,.13,'Blush'),(-.53,-.22,-.07,'Lilac'),(.22,-.16,.07,'Mint')]:
    cube(f,'Loose_design_card',(x,y,.51),(.60,.57,.13),mat,.04,rotation=(0,0,a))
    cube(f,'Card_image',(x,y+.04,.59),(.39,.22,.017),'Paper',.015,rotation=(0,0,a))
bar(f,'Stylus',(1.15,-.15,.45),(1.77,.12,.45),.039,'Berry')
sphere(f,'Stylus_tip',(1.80,.13,.45),(.063,.04,.04),'Ink')

# Creative workshop: easel, layered abstract artwork, and a paint palette.
f = 'Creative'
for x in [-.91,.34]:
    bar(f,'Easel_leg',(x,.47,.42),(x+.15,.91,2.27),.046,'Wood')
bar(f,'Easel_rear_leg',(-.14,1.25,.42),(-.21,.98,2.22),.046,'Wood')
cube(f,'Easel_ledge',(-.17,.48,.83),(1.73,.32,.12),'Wood',.035)
cube(f,'Canvas_frame',(-.17,.71,1.57),(1.57,.17,1.43),'Marigold',.065)
cube(f,'Canvas_paper',(-.17,.61,1.57),(1.42,.027,1.28),'Paper',.035)
cylinder(f,'Artwork_sun',(.21,.577,1.95),.22,.035,'Peach',(math.pi/2,0,0))
triangle(f,'Artwork_mountain',(-.27,.572,1.45),.75,'Lagoon')
triangle(f,'Artwork_layer',(.09,.546,1.31),.65,'Blueberry')
cube(f,'Artwork_brushstroke',(-.25,.537,1.02),(1.14,.04,.14),'Blush',.06)
for x,z in [(-.58,1.89),(-.48,1.70),(.36,1.57)]:
    cylinder(f,'Artwork_dot',(x,.531,z),.052,.037,'Marigold',(math.pi/2,0,0),12)
sphere(f,'Palette',(.93,-.08,.52),(.59,.49,.083),'Wood')
for x,y,mat in [(.62,-.04,'Berry'),(.89,.18,'Blueberry'),(1.16,.15,'Sky'),(1.31,-.09,'Lagoon'),(1.06,-.32,'Marigold')]:
    sphere(f,'Paint_dab',(x,y,.595),(.093,.081,.025),mat)
bar(f,'Paintbrush',(1.51,.42,.51),(1.88,.93,.51),.022,'Ink')
bar(f,'Brush_ferrule',(1.85,.89,.51),(1.93,1.01,.51),.028,'Marigold')
sphere(f,'Brush_tip',(1.98,1.06,.51),(.064,.12,.027),'Berry')
for i,mat in enumerate(['Lilac','Blush','Mint']):
    cube(f,'Art_layer_sheet',(-1.47+i*.08,-.22+i*.09,.48+i*.055),(.66,.61,.036),mat,.018,rotation=(0,0,.15))

# Studio illumination is saved in the editable file, excluded from the GLB.
scene.world = bpy.data.worlds.new('Workshop studio daylight')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.70,.78,.88,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .5
for name, at, energy, size in [('Large softbox',(-6,-10,16),2300,10),('Cool fill',(10,5,10),1600,9)]:
    bpy.ops.object.light_add(type='AREA', location=at)
    lamp = bpy.context.object
    lamp.name = name
    lamp.data.energy = energy
    lamp.data.size = size
    lamp.rotation_euler = (Vector((0,2,0))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(12,-18,19))
camera = bpy.context.object
camera.name = 'Workshop kit camera'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 21.8
camera.rotation_euler = (Vector((0,2.2,.5))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera = camera
scene.render.resolution_x = 1500
scene.render.resolution_y = 950
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = True
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.cycles.device = 'CPU'
scene.view_settings.view_transform = 'Standard'
scene.render.filepath = str(PUBLIC / 'lesson-lab-kit-preview.png')
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / 'lesson-lab-kit.blend'))

# Batch each family's static materials to keep browser draw calls economical.
for f in FAMILIES:
    for mat_name, mat in MATS.items():
        objects = [o for o in scene.objects if o.type=='MESH' and o.parent==GROUPS[f] and o.data.materials[0]==mat]
        if not objects:
            continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects)>1:
            bpy.ops.object.join()
        merged = bpy.context.object
        merged.name = f + '_' + mat_name.replace(' ','_')
        merged['family'] = f.lower()

bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in {'MESH','EMPTY'}:
        obj.select_set(True)
glb = PUBLIC / 'lesson-lab-kit.glb'
bpy.ops.export_scene.gltf(filepath=str(glb), export_format='GLB', use_selection=True,
    export_animations=False, export_extras=True, export_yup=True, export_materials='EXPORT')
triangles = sum(len(p.vertices)-2 for obj in scene.objects if obj.type=='MESH' for p in obj.data.polygons)
result = {'name':'Six Learning Workshops','blender':bpy.app.version_string,
    'model':'/models/academy/lesson-lab-kit.glb','source':'assets/academy/lesson-lab-kit.blend',
    'triangles':triangles,'bytes':glb.stat().st_size,
    'families': {f:{'root':GROUPS[f].name,'meshPrefix':f+'_','front':'positive Z in GLB'} for f in FAMILIES},
    'meshObjects':sum(o.type=='MESH' for o in scene.objects)}
if result['bytes'] > 2_000_000 or triangles > 35_000:
    raise RuntimeError('Kit exceeds the intended browser asset budget: '+json.dumps(result))
bpy.ops.render.render(write_still=True)
print(json.dumps(result))
