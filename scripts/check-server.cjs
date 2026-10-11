// Run against a production server: node scripts/check-server.cjs http://localhost:3107
const fs = require('node:fs');
const assert = require('node:assert/strict');

async function main() {
  const base = process.argv[2] || 'http://localhost:3107';
  const manifest = JSON.parse(fs.readFileSync('.next/server/app-paths-manifest.json', 'utf8'));
  const routes = Object.keys(manifest)
    .filter(route => route.endsWith('/page') && !route.includes('[') && !route.startsWith('/_'))
    .map(route => route.slice(0, -5).replace(/\/\([^/]+\)/g, '') || '/');
  routes.push('/courses/masters-codex', '/courses/masters-codex/1', '/courses/masters-codex/gamify');
  const failures = [];
  async function check(route, options, expected = 200) {
    try {
      const response = await fetch(new URL(route, base), { ...options, signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, expected, `${route}: expected ${expected}, received ${response.status}`);
      await response.arrayBuffer();
    } catch (error) { failures.push(error.message); }
  }
  for (let index = 0; index < routes.length; index += 4) {
    await Promise.all(routes.slice(index, index + 4).map(route => check(route)));
  }
  await check('/api/admin/bulk-mail', {}, 401);
  for (const route of ['/api/paypal/create-subscription', '/api/paypal/activate-subscription', '/api/paypal/cancel-subscription']) {
    await check(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }, 401);
  }
  for (const route of ['/api/ai/training-pack', '/api/ai/generate-learning-game']) {
    await check(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }, 400);
  }
  console.log(JSON.stringify({ pageChecks: routes.length, apiChecks: 6, failures }));
  if (failures.length) process.exitCode = 1;
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
