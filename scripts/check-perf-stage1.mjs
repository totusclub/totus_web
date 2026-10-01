// Check: performance stage 1 (01.10.2026) — same UI and behaviour, less waiting and traffic.
//
// Run: node scripts/check-perf-stage1.mjs   (Node >= 22.18, no npm install)
//
// 1. useHotelRooms: when a poll already fetched /hotels-rooms with the search
//    complete, the "final refresh" reuses that result instead of sending an
//    identical second request. Stale-request handling stays the same.
// 2. Source guards for the rest of stage 1 (gallery not tied to the rooms search,
//    lazy images below the fold, main hotel photo first, no debug log on home).

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${e && e.message ? e.message : e}`);
  }
}

// ---------------------------------------------------------------- source guards
console.log('source');
await check('home: no console.log of homeData on every render', () => {
  assert.ok(!/console\.log\(\s*['"]homeData/.test(read('src/pages/index.tsx')));
});
await check('hotel page: gallery is not hidden while rooms are searched', () => {
  const s = read('src/components/hotelDetails/hotelDetailsInfo/index.tsx');
  assert.ok(!/<VerticalSlider\s+loading=\{panding\}/.test(s.split(') : (')[1] || ''), 'loading branch must not pass panding');
});
await check('hotel page: main photo is fetched with high priority', () => {
  assert.ok(/fetchPriority="high"/.test(read('src/components/UI/verticalSlide/index.tsx')));
});
await check('hotel page: thumbnails beyond the first 6 load lazily', () => {
  assert.ok(/loading=\{index < 6 \? 'eager' : 'lazy'\}/.test(read('src/components/UI/verticalSlide/index.tsx')));
});
await check('room galleries and home partners: lazy images', () => {
  for (const f of ['src/components/UI/smallSlide/index.tsx', 'src/components/UI/appImage/index.tsx', 'src/components/home/partner.tsx']) {
    assert.ok(/loading="lazy"/.test(read(f)), f);
  }
});

// ---------------------------------------------------------------- useHotelRooms
if (!process.features || !process.features.typescript || typeof module.registerHooks !== 'function') {
  console.log('SKIP useHotelRooms: need Node >= 22.18');
} else {
  console.log('useHotelRooms');
  const MOCKS = {
    react: `
      export function useState(v){ const s=[typeof v==='function'?v():v, ()=>{}]; return s; }
      export function useRef(v){ return { current: v }; }
      export function useEffect(fn){ globalThis.__effects.push(fn); }
      export default { useState, useRef, useEffect };`,
    '@/api/levelTravelApi': `
      export const getHotelRooms = (...a) => globalThis.__api.getHotelRooms(...a);
      export const checkSearchStatus = (...a) => globalThis.__api.checkSearchStatus(...a);`,
    '@/utils/roomFilters': `export const cloneRoomFilters = (f) => f;`,
    '@/utils/hotelSearchRefresh': `
      export function isStaleSearchRequestError(e){ const s=e?.response?.status; return [400,404,410,500,502,503].includes(s); }`,
  };
  module.registerHooks({
    resolve(spec, ctx, next) {
      if (MOCKS[spec]) return {url: 'mock:' + spec, shortCircuit: true};
      if (spec.startsWith('@/')) {
        return {url: pathToFileURL(path.join(root, 'src', spec.slice(2) + '.ts')).href, shortCircuit: true};
      }
      return next(spec, ctx);
    },
    load(url, ctx, next) {
      if (url.startsWith('mock:')) return {format: 'module', source: MOCKS[url.slice(5)], shortCircuit: true};
      return next(url, ctx);
    },
  });
  const realSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (fn, ms, ...a) => realSetTimeout(fn, 0, ...a); // no real 2 s waits
  console.error = () => {};
  const {useHotelRooms} = await import(pathToFileURL(path.join(root, 'src/hooks/useHotelRooms.ts')).href);

  async function run(statuses, roomsImpl) {
    globalThis.__effects = [];
    let poll = 0;
    const calls = {rooms: 0, status: 0, stale: 0};
    globalThis.__api = {
      checkSearchStatus: async () => { calls.status++; return statuses[Math.min(poll++, statuses.length - 1)]; },
      getHotelRooms: async () => { calls.rooms++; return roomsImpl(calls.rooms); },
    };
    useHotelRooms('rid-1', '9022465', true, 0, {onRequestIdStale: () => { calls.stale++; }});
    globalThis.__effects.forEach((fn) => fn());
    await new Promise((r) => realSetTimeout(r, 50));
    return calls;
  }
  const done = {status: {op1: 'completed', op2: 'no_results'}, completeness: 100};
  const pending = {status: {op1: 'completed', op2: 'pending'}, completeness: 50};
  const someRooms = () => ({result: [{id: 1}], filters: null});

  await check('search already complete on first poll -> one /hotels-rooms (was two)', async () => {
    const c = await run([done], someRooms);
    assert.equal(c.rooms, 1);
    assert.equal(c.stale, 0);
  });
  await check('progressive search: pending, then complete -> two /hotels-rooms (was three)', async () => {
    const c = await run([pending, done], someRooms);
    assert.equal(c.rooms, 2);
    assert.equal(c.status, 2);
  });
  await check('stale request_id on the complete poll -> stale callback once, no extra requests', async () => {
    const c = await run([done], () => { const e = new Error('gone'); e.response = {status: 404}; throw e; });
    assert.equal(c.stale, 1);
    assert.equal(c.rooms, 1);
  });
  await check('network error (not stale) on the complete poll -> final refresh still retries, as before', async () => {
    const c = await run([done], (n) => { if (n === 1) throw new Error('network'); return someRooms(); });
    assert.equal(c.stale, 0, 'non-stale error must not trigger the stale refresh');
    assert.equal(c.rooms, 2, 'the retry (final refresh) is kept');
  });
  await check('complete search with zero rooms -> final refresh still runs, as before', async () => {
    const c = await run([done], () => ({result: [], filters: null}));
    assert.equal(c.rooms, 2);
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
