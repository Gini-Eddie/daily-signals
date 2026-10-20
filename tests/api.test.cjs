const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { scryptSync, timingSafeEqual } = require('node:crypto');

test('owner provisioning preserves personal data and refuses replacement', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'daily-signals-owner-test-'));
  try {
    const store = '{"user_profile":{"name":"Original Owner"},"entries":[{"actual_value":42}]}';
    fs.writeFileSync(path.join(dir, 'store.json'), store);
    const env = { ...process.env, DATA_DIR: dir };
    execFileSync(process.execPath, ['scripts/provision-owner.cjs', 'owner@example.com'], { env, stdio: 'pipe' });
    assert.equal(fs.readFileSync(path.join(dir, 'store.json'), 'utf8'), store);
    const owner = JSON.parse(fs.readFileSync(path.join(dir, 'account.json')));
    const credentials = fs.readFileSync(path.join(dir, 'owner-access.txt'), 'utf8');
    const password = credentials.match(/^Initial password: (.+)$/m)[1];
    const [salt, hash] = owner.password.split(':');
    assert.ok(timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex')));
    assert.equal(owner.must_change_password, true);
    assert.equal(owner.role, 'owner');
    assert.throws(() => execFileSync(process.execPath, ['scripts/provision-owner.cjs', 'another@example.com'], { env, stdio: 'pipe' }));
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'account.json'))).email, 'owner@example.com');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('personal account, targets, backfill, persistence and recovery', { timeout: 60000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'daily-signals-test-'));
  const server = spawn(process.execPath, ['dist/server.cjs'], { env: { ...process.env, NODE_ENV: 'production', PORT: '3199', DATA_DIR: dir, ACCOUNT_SETUP_KEY: 'test-only-setup-key' }, stdio: 'pipe' });
  let output = '';
  server.stderr.on('data', chunk => output += chunk);
  const call = async (route, body, token, method) => {
    const res = await fetch('http://127.0.0.1:3199/api/' + route, { signal: AbortSignal.timeout(5000), method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, body: res.status === 204 ? null : await res.json() };
  };
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) { try { await call('auth/status'); ready = true; break; } catch { await new Promise(r => setTimeout(r, 100)); } }
    assert.ok(ready, output);
    assert.equal((await call('habits')).status, 401);
    const credentials = { email: 'owner@example.com', password: 'a-long-test-password' };
    assert.equal((await call('auth/register', credentials)).status, 403);
    const registered = await call('auth/register', { ...credentials, setup_key: 'test-only-setup-key' });
    assert.equal(registered.status, 200);
    const token = registered.body.token;
    const goal = await call('weekly-goals', { week_start: '2026-10-19', title: 'Work out four times', target: 4, unit: 'workouts' }, token);
    assert.equal(goal.status, 201);
    assert.equal((await call('weekly-goals/' + goal.body.id, { progress: 3 }, token, 'PUT')).body.progress, 3);
    assert.equal((await call('weekly-goals?week_start=2026-10-19', null, token)).body.length, 1);
    assert.equal((await call('weekly-goals?week_start=2026-10-12', null, token)).body.length, 0);
    assert.equal((await call('weekly-goals/' + goal.body.id, { target: 0 }, token, 'PUT')).status, 400);
    assert.equal((await call('weekly-goals', { week_start: '2026-10-20', title: 'Invalid week', target: 1 }, token)).status, 400);
    assert.equal((await call('weekly-goals/' + goal.body.id, { progress: 4 }, token, 'PUT')).body.progress, 4);
    assert.equal((await call('weekly-goals/' + goal.body.id, null, token, 'DELETE')).status, 204);
    assert.ok(registered.body.recovery_code);
    assert.equal((await call('auth/register', { ...credentials })).status, 409);
    const habits = (await call('habits', null, token)).body;
    const habit = habits.find(h => h.tracking_type !== 'BINARY');
    const updated = await call('habits/' + habit.id, { target_value: 80, minimum_value: 20 }, token, 'PUT');
    assert.equal(updated.body.target_value, 80);
    assert.equal((await call('habits/' + habit.id, { target_value: -2 }, token, 'PUT')).status, 400);
    assert.equal((await call('habit-entries', { habit_id: habit.id, entry_date: '2026-10-19', actual_value: -1 }, token)).status, 400);
    assert.equal((await call('habit-entries', { habit_id: habit.id, entry_date: '2026-10-19', actual_value: 42 }, token)).status, 200);
    await call('habit-entries', { habit_id: habit.id, entry_date: '2026-10-19', notes: 'Backfilled yesterday' }, token);
    const history = (await call('history/2026-10-19', null, token)).body;
    const entry = history.habits.find(h => h.habit.id === habit.id).entry;
    assert.equal(entry.actual_value, 42); assert.equal(entry.notes, 'Backfilled yesterday');
    await call('habits/' + habit.id, { is_active: false }, token, 'PUT');
    assert.equal((await call('history/2026-10-19', null, token)).body.habits.find(h => h.habit.id === habit.id).actual_value, 42);
    await call('habits/' + habit.id, { is_active: true }, token, 'PUT');
    assert.equal((await call('history/2026-10-18', null, token)).body.habits.find(h => h.habit.id === habit.id).actual_value, 0);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'store.json'))).entries.find(e => e.habit_id === habit.id).actual_value, 42);
    assert.equal((await call('auth/recover', { ...credentials, recovery_code: 'bad-code' })).status, 400);
    const recovered = await call('auth/recover', { ...credentials, password: 'a-new-long-password', recovery_code: registered.body.recovery_code });
    assert.equal(recovered.status, 200); assert.notEqual(recovered.body.recovery_code, registered.body.recovery_code);
    assert.equal((await call('habits', null, token)).status, 401);
    assert.equal((await call('auth/login', credentials)).status, 400);
    const login = await call('auth/login', { ...credentials, password: 'a-new-long-password' });
    assert.equal(login.status, 200);
    const changed = await call('auth/change-password', { current_password: 'a-new-long-password', password: 'another-long-private-password' }, login.body.token);
    assert.equal(changed.status, 200);
    assert.equal((await call('habits', null, login.body.token)).status, 401);
    assert.equal((await call('auth/login', { ...credentials, password: 'another-long-private-password' })).status, 200);
    await call('auth/logout', {}, login.body.token);
    assert.equal((await call('habits', null, login.body.token)).status, 401);
    const account = fs.readFileSync(path.join(dir, 'account.json'), 'utf8');
    assert.ok(!account.includes('a-new-long-password')); assert.ok(!account.includes(recovered.body.recovery_code));
  } finally {
    if (server.exitCode === null && server.signalCode === null) await new Promise(resolve => { server.once('close', resolve); server.kill(); });
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
