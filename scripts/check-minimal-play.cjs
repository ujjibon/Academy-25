// Exercise real game actions, authored course coverage, independent output cases,
// rejected edits, and the actual runtime vertices in the minimal Blender GLB.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
require.extensions['.ts'] = function (module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};
const { buildLearningPlayGame, createPlayRoundState, applyPlayAction, evaluatePlayRound, tracePlayCircuit } = require('../src/lib/learning-play-games.ts');
const clean = value => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const frozen = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(frozen);
  }
  return value;
};
let actionChecks = 0, rejectionChecks = 0, solvedRounds = 0;
function act(state, action) {
  const previous = JSON.stringify(state);
  const next = applyPlayAction(frozen(state), frozen(action));
  assert.equal(JSON.stringify(state), previous, 'A player action must preserve its previous state');
  assert.notEqual(next, state, 'A supported action returns a new state');
  actionChecks++;
  return next;
}
function result(round, state) {
  const before = JSON.stringify({ round, state });
  const evaluated = evaluatePlayRound(frozen(round), frozen(state));
  assert.equal(JSON.stringify({ round, state }), before, 'Evaluation is read-only');
  assert(Number.isFinite(evaluated.progress) && evaluated.progress >= 0 && evaluated.progress <= 1);
  assert(evaluated.feedback.trim().length > 12, 'Every experiment returns useful feedback');
  return evaluated;
}
function rejects(round, state, why) {
  assert.equal(result(round, state).passed, false, why);
  rejectionChecks++;
}

// Derive a route from grid vectors and physically rotate the pieces. This does
// not call the engine's reference solution or its internal port helper.
function routeWithActions(round, initial) {
  let state = initial;
  const coordinate = cell => ({ x: cell % 4, y: Math.floor(cell / 4) });
  const delta = (from, to) => ({ x: to.x - from.x, y: to.y - from.y });
  const same = (a, b) => a.x === b.x && a.y === b.y;
  round.circuit.path.forEach((cell, index, cells) => {
    const here = coordinate(cell);
    const incoming = index ? delta(here, coordinate(cells[index - 1])) : { x: -1, y: 0 };
    const outgoing = index < cells.length - 1 ? delta(here, coordinate(cells[index + 1])) : { x: 1, y: 0 };
    assert.equal(Math.abs(incoming.x) + Math.abs(incoming.y), 1, 'Input cells are adjacent');
    assert.equal(Math.abs(outgoing.x) + Math.abs(outgoing.y), 1, 'Output cells are adjacent');
    const edges = round.circuit.tiles[cell].shape === 'straight' ? [{ x: -1, y: 0 }, { x: 1, y: 0 }] : [{ x: 0, y: -1 }, { x: 1, y: 0 }];
    let rotation;
    for (let turns = 0; turns < 4; turns++) {
      const turned = edges.map(edge => {
        let point = { ...edge };
        for (let q = 0; q < turns; q++) point = { x: -point.y, y: point.x };
        return point;
      });
      if (turned.some(edge => same(edge, incoming)) && turned.some(edge => same(edge, outgoing))) { rotation = turns; break; }
    }
    assert.notEqual(rotation, undefined, 'The physical tile can connect this route');
    for (let turns = 0; state.rotations[cell] !== rotation && turns < 4; turns++) state = act(state, { type: 'rotate', index: cell });
    assert.equal(state.rotations[cell], rotation);
  });
  return state;
}
function playToCompletion(round) {
  let state = createPlayRoundState(round);
  if (round.family === 'code') return routeWithActions(round, state);
  if (round.family === 'prompt' || round.family === 'video') {
    round.expected.forEach((id, index) => { state = act(state, { type: 'place', id, index }); });
    if (round.family === 'video' && !round.id.endsWith('-0')) {
      round.expected.forEach(id => { state = act(state, { type: 'cut', id, delta: 2 - state.durations[id] }); });
    }
    if (round.requireSafeArea) state = act(state, { type: 'captions' });
  } else if (round.family === 'research') {
    Object.entries(round.evidenceLinks).forEach(([claim, source]) => { state = act(state, { type: 'connect', source, claim }); });
  } else if (round.family === 'design') {
    Object.entries(round.targets).forEach(([id, point]) => { state = act(state, { type: 'move', id, point }); });
  } else {
    state = act(state, { type: 'move', id: 'subject', point: round.focalTarget });
    state = act(state, { type: 'resize', delta: round.focalSize - state.size });
    if (round.requireSafeArea) state = act(state, { type: 'safe-area' });
  }
  return state;
}

const courses = fs.readdirSync(path.join(root, 'src/data/courses')).filter(name => name.endsWith('.json'))
  .map(name => JSON.parse(fs.readFileSync(path.join(root, 'src/data/courses', name), 'utf8')))
  .filter(course => Array.isArray(course.lessons));
const plans = new Set(), roundIds = new Set(), families = new Map();
let lessons = 0;
for (const course of courses) for (const lesson of course.lessons) {
  lessons++;
  const plan = buildLearningPlayGame(course, lesson);
  assert(!plans.has(plan.id), 'Every lesson has a unique playable plan'); plans.add(plan.id);
  families.set(plan.family, (families.get(plan.family) || 0) + 1);
  assert.equal(plan.lessonTitle, lesson.title);
  assert.equal(plan.projectTitle, clean(lesson.project.title));
  assert.equal(plan.teaching, clean(lesson.keyTakeaways?.[0] || lesson.objectives?.[0] || lesson.introduction.text));
  assert.equal(plan.rounds.length, 3, 'Every authored lesson has three rounds');
  assert.equal(new Set(plan.rounds.map(round => round.goal)).size, 3, 'Rounds teach different goals');
  assert.equal(new Set(plan.rounds.map(round => round.title)).size, 3, 'Round titles communicate the progression');
  const completedStates = [];
  for (const round of plan.rounds) {
    assert(!roundIds.has(round.id), 'Round identity is unique'); roundIds.add(round.id);
    assert.equal(round.family, plan.family);
    assert(round.hint.includes(plan.teaching), 'The teaching cue uses the authored takeaway');
    assert(round.hint.includes(plan.projectTitle), 'The task names the authored project');
    assert(round.hint.includes(clean(lesson.project.description).slice(0, 70)), 'The project requirements ground every round');
    const untouched = createPlayRoundState(round);
    rejects(round, untouched, `${round.id}: an untouched round cannot be completed`);
    const solved = playToCompletion(round);
    const evaluated = result(round, solved);
    assert(evaluated.passed && evaluated.progress === 1, `${round.id}: player actions can solve the task`);
    completedStates.push(JSON.stringify(solved)); solvedRounds++;

    if (round.family === 'code') {
      const blocked = act(solved, { type: 'rotate', index: 4 });
      rejects(round, blocked, 'Closing the input port breaks the route');
      let expected = [...round.circuit.samples];
      if (round.circuit.tiles.some(tile => tile.node === 'guard')) {
        const numeric = round.circuit.operation === 'double' || round.circuit.operation === 'sort';
        expected = expected.filter(value => numeric ? typeof value === 'number' && Number.isFinite(value) && value >= 0 : typeof value === 'string' && value.trim().length > 0);
      }
      expected = round.circuit.operation === 'sort' ? expected.sort((a, b) => Number(a) - Number(b)) : round.circuit.operation === 'uppercase' ? expected.map(value => String(value).toUpperCase()) : round.circuit.operation === 'render' ? expected.map(value => `Card(${value})`) : expected.map(value => Number(value) * 2);
      assert.deepEqual(evaluated.values, expected, 'The delivered values match the independently calculated operation');
      assert.deepEqual(evaluated.trace, round.circuit.path, 'The packet actually visits the required grid cells');
    } else if (round.family === 'prompt' || round.family === 'video') {
      rejects(round, act(solved, { type: 'place', id: round.expected[0], index: round.expected.length - 1 }), 'Wrong reading order changes the outcome');
      rejects(round, act(solved, { type: 'remove', id: round.expected[0] }), 'A missing required part cannot pass');
      const noise = round.cards.find(item => item.valid === false);
      rejects(round, act(solved, { type: 'place', id: noise.id, index: 0 }), 'A conflicting or unrelated item cannot pass');
      if (round.family === 'video' && !round.id.endsWith('-0')) {
        rejects(round, act(solved, { type: 'cut', id: 'demo', delta: 1 }), 'A three-second demo violates the timed teaching cut');
        if (round.requireSafeArea) rejects(round, act(solved, { type: 'captions' }), 'Final delivery needs captions');
      }
    } else if (round.family === 'research') {
      const firstClaim = Object.keys(round.evidenceLinks)[0];
      rejects(round, act(solved, { type: 'connect', source: 'rumor', claim: firstClaim }), 'An unsourced replacement cannot support a claim');
      rejects(round, act(solved, { type: 'connect', source: round.evidenceLinks[firstClaim], claim: firstClaim }), 'Disconnecting a required link removes its evidence');
      rejects(round, act(solved, { type: 'connect', source: 'source-project', claim: 'claim-rumor' }), 'An unsupported extra claim blocks delivery');
    } else if (round.family === 'design') {
      const target = round.targets.heading;
      rejects(round, act(solved, { type: 'move', id: 'heading', point: { x: target.x + 8, y: target.y } }), 'A visible eight-point placement error does not snap to the grid');
      const swapped = act(act(solved, { type: 'move', id: 'heading', point: round.targets.action }), { type: 'move', id: 'action', point: target });
      rejects(round, swapped, 'Inverting heading and action breaks the hierarchy');
    } else {
      rejects(round, act(solved, { type: 'move', id: 'subject', point: { x: round.focalTarget.x - 9, y: round.focalTarget.y } }), 'The focal object must occupy its composition guide');
      rejects(round, act(solved, { type: 'resize', delta: 4 }), 'A visibly oversized subject cannot pass the crop');
      if (round.requireSafeArea) rejects(round, act(solved, { type: 'safe-area' }), 'Delivery requires an inspected safe area');
    }
  }
  assert.equal(new Set(completedStates).size, 3, 'Progressive rounds require different completed states');
}
assert.equal(lessons, 84, 'All 84 authored lessons are covered');
assert.equal(solvedRounds, 252);
assert.deepEqual([...families.keys()].sort(), ['code','creative','design','prompt','research','video']);

// Hand-built circuit cases assert known results independently of the authored
// plan generator and of solvePlayRound. Straight rotation zero is horizontal.
function circuitFixture({ path: route = [4,5,6,7], samples = [3], operation = 'double', nodes = {5:'work'}, shapes = {} } = {}) {
  return { id:'fixture-0',family:'code',title:'Known circuit',goal:'Known output',hint:'Inspect actual values',action:'Run',cards:[],expected:[],
    circuit:{path:route,samples,operation,tiles:Array.from({length:12},(_,index)=>({shape:shapes[index]||'straight',rotation:0,node:nodes[index]}))} };
}
const simple = circuitFixture();
let simpleState = createPlayRoundState(simple);
assert.deepEqual(tracePlayCircuit(simple, simpleState).values, [6], '[3] must become [6], not a label or canned preview');
assert.equal(tracePlayCircuit(simple, simpleState).passed, true);
const closed = act(simpleState, {type:'rotate',index:4});
assert.equal(tracePlayCircuit(simple, closed).blockedAt, 4);
assert.deepEqual(tracePlayCircuit(simple, closed).values, [3], 'An unconnected packet is never transformed');
rejects(simple, closed, 'The input side is closed');
const checked = circuitFixture({path:[4,5,9,10,6,7],samples:[2,-1,4],nodes:{5:'guard',9:'work',10:'test'},shapes:{5:'corner',9:'corner',10:'corner',6:'corner'}});
const checkedState = routeWithActions(checked, createPlayRoundState(checked));
assert.deepEqual(tracePlayCircuit(checked, checkedState).values, [4,8], 'GUARD rejects -1 before WORK doubles the valid batch');
assert.equal(tracePlayCircuit(checked, checkedState).passed, true);
for (const [node, nodes, route] of [
  ['guard',{0:'guard',5:'work',6:'test'},[4,0,1,5,6,7]],
  ['work',{4:'guard',0:'work',6:'test'},[4,0,1,2,6,7]],
  ['test',{4:'guard',5:'work',1:'test'},[4,5,1,2,6,7]],
]) {
  const bypass = circuitFixture({path:route,nodes,samples:[2,-1,4]});
  const shortcut = createPlayRoundState(bypass);
  assert.deepEqual(tracePlayCircuit(bypass, shortcut).trace, [4,5,6,7], 'The bypass physically reaches delivery');
  assert.equal(tracePlayCircuit(bypass, shortcut).blockedAt, undefined, 'The rejection checks a missing operation, not a closed port');
  rejects(bypass, shortcut, `A direct shortcut that bypasses ${node.toUpperCase()} cannot deliver`);
}
const wrongOrder = circuitFixture({path:[4,8,9,10,6,5,1,2,3,7],samples:[2,-1,4],nodes:{5:'work',6:'guard',7:'test'}});
wrongOrder.circuit.tiles.forEach(tile => { tile.rotation = 1; });
const physicalDirectRoute = {...wrongOrder,circuit:{...wrongOrder.circuit,path:[4,5,6,7]}};
const reordered = routeWithActions(physicalDirectRoute, createPlayRoundState(wrongOrder));
assert.deepEqual(tracePlayCircuit(wrongOrder, reordered).trace, [4,5,6,7], 'Real rotations create a valid route with WORK before GUARD');
assert.equal(tracePlayCircuit(wrongOrder, reordered).blockedAt, undefined);
assert.deepEqual(tracePlayCircuit(wrongOrder, reordered).values, [4,8], 'Even correct eventual values cannot replace the guard-first operation order');
rejects(wrongOrder, reordered, 'WORK before GUARD cannot satisfy the required guard-first route');
for (const samples of [['not a number',-1,3], [Infinity,3]]) {
  const guarded = {...checked,circuit:{...checked.circuit,samples}};
  const delivered = tracePlayCircuit(guarded, checkedState);
  assert.equal(delivered.passed, true, 'A typed guard removes invalid inputs while keeping the valid batch');
  assert.deepEqual(delivered.values, [6], 'Only the valid input reaches WORK and TEST');
}
const zero = {...checked,circuit:{...checked.circuit,samples:[0,-1,3]}};
assert.deepEqual(tracePlayCircuit(zero, checkedState).values, [0,6], 'Zero is valid numeric data; the negative item is rejected');
const overflow = {...checked,circuit:{...checked.circuit,samples:[Number.MAX_VALUE,3]}};
assert.equal(tracePlayCircuit(overflow, checkedState).blockedAt, undefined, 'Overflow is checked after a physically connected processing route');
rejects(overflow, checkedState, 'A finite input that overflows during WORK must fail TEST and delivery');
for (const samples of [[Infinity],['not a number']]) {
  const unguarded = circuitFixture({samples});
  rejects(unguarded, createPlayRoundState(unguarded), 'Unguarded nonfinite or invalid numeric output cannot be delivered');
}
const stringGuard = {...checked,circuit:{...checked.circuit,operation:'uppercase',samples:['  ',3,'hello']}};
assert.deepEqual(tracePlayCircuit(stringGuard, checkedState).values, ['HELLO'], 'A string guard rejects whitespace and numeric input before uppercase work');
assert.equal(tracePlayCircuit(stringGuard, checkedState).passed, true);
const prematureTest = circuitFixture({nodes:{5:'test',6:'work'}});
rejects(prematureTest, createPlayRoundState(prematureTest), 'TEST examines the values at its own step; a later transformation cannot conceal an early failed check');
const duplicateWork = circuitFixture({nodes:{5:'work',6:'work'}});
assert.deepEqual(tracePlayCircuit(duplicateWork, createPlayRoundState(duplicateWork)).values, [12]);
rejects(duplicateWork, createPlayRoundState(duplicateWork), 'Repeated WORK cannot pass by merely visiting the named operations');
for (const [operation,samples,expected] of [['sort',[3,1,2],[1,2,3]],['uppercase',['hello'],['HELLO']],['render',['Tile'],['Card(Tile)']]]) {
  const fixture=circuitFixture({operation,samples});
  assert.deepEqual(tracePlayCircuit(fixture,createPlayRoundState(fixture)).values,expected);
}
const original=createPlayRoundState(simple);
const clipped=act(original,{type:'cut',id:'demo',delta:100}); assert.equal(clipped.durations.demo,6);
const moved=act(original,{type:'move',id:'subject',point:{x:-100,y:200}});assert.deepEqual(moved.positions.subject,{x:8,y:88});
const resized=act(original,{type:'resize',delta:-100});assert.equal(resized.size,14);
assert.deepEqual(original,createPlayRoundState(simple),'Action branches do not leak their changes into another attempt');

// Inspect the GLB binary geometry, not only the advertised JSON bounding boxes.
const bytes=fs.readFileSync(path.join(root,'public/models/academy/minimal-play-kit.glb'));
assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
const jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
assert.equal(gltf.asset.version,'2.0');
const binaryHeader=20+jsonLength;assert.equal(bytes.readUInt32LE(binaryHeader+4),0x004e4942);
const binary=bytes.subarray(binaryHeader+8,binaryHeader+8+bytes.readUInt32LE(binaryHeader));
let blenderTriangles=0,blenderVertices=0;
for(const family of ['Prompt','Code','Video','Research','Design','Creative']) {
  const roots=gltf.nodes.filter(node=>node.name===family+'_Play');assert.equal(roots.length,1,`${family} has one selectable sculpture root`);
  assert(roots[0].children.length>=3,`${family} preserves independently animatable geometry`);
  for(const index of roots[0].children)assert(gltf.nodes[index].name.startsWith(family+'_'));
}
for(const node of gltf.nodes)for(const key of ['translation','rotation','scale'])if(node[key])assert(node[key].every(Number.isFinite));
for(const mesh of gltf.meshes)for(const primitive of mesh.primitives) {
  assert.equal(primitive.mode??4,4);const positions=gltf.accessors[primitive.attributes.POSITION];
  assert.equal(positions.type,'VEC3');assert.equal(positions.componentType,5126);assert(positions.count>0);
  assert(positions.min.every(Number.isFinite)&&positions.max.every(Number.isFinite));
  const view=gltf.bufferViews[positions.bufferView],base=(view.byteOffset||0)+(positions.byteOffset||0),stride=view.byteStride||12;
  for(let vertex=0;vertex<positions.count;vertex++)for(let component=0;component<3;component++) {
    const value=binary.readFloatLE(base+vertex*stride+component*4);
    assert(Number.isFinite(value),'Actual Blender vertex coordinates are finite');
    assert(value>=positions.min[component]-.00002&&value<=positions.max[component]+.00002,'Accessor bounds contain the delivered vertices');
  }
  blenderVertices+=positions.count;
  if(primitive.indices!==undefined) {
    const accessor=gltf.accessors[primitive.indices],indexView=gltf.bufferViews[accessor.bufferView],indexBase=(indexView.byteOffset||0)+(accessor.byteOffset||0);
    const sizes={5121:1,5123:2,5125:4};assert(sizes[accessor.componentType]);assert.equal(accessor.count%3,0);
    for(let index=0;index<accessor.count;index++) {
      const offset=indexBase+index*sizes[accessor.componentType];const value=accessor.componentType===5121?binary.readUInt8(offset):accessor.componentType===5123?binary.readUInt16LE(offset):binary.readUInt32LE(offset);
      assert(value<positions.count,'Every triangle index points to an existing vertex');
    }
    blenderTriangles+=accessor.count/3;
  } else { assert.equal(positions.count%3,0);blenderTriangles+=positions.count/3; }
}
assert(blenderTriangles>1000&&blenderTriangles<16000,'The kit is real 3D geometry within the intended runtime budget');
assert(bytes.length<1000000,'The minimal kit is less than one megabyte');
assert(fs.statSync(path.join(root,'assets/academy/minimal-play-kit.blend')).size>10000,'Editable original Blender source is present');
const png=fs.readFileSync(path.join(root,'public/models/academy/minimal-play-kit-preview.png'));
assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert(png.readUInt32BE(16)>=1000&&png.readUInt32BE(20)>=600,'A rendered preview is delivered');
console.log(JSON.stringify({courses:courses.length,lessons,rounds:solvedRounds,families:Object.fromEntries(families),actionChecks,rejectionChecks,blenderTriangles,blenderVertices,blenderBytes:bytes.length}));
