import test from 'node:test';
import assert from 'node:assert/strict';
import { TeacherAuthService } from '../src/services/teacherAuthService.js';

// Mock localStorage and sessionStorage for node
if (typeof global.localStorage === 'undefined') {
  let store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

if (typeof global.sessionStorage === 'undefined') {
  let sStore = {};
  global.sessionStorage = {
    getItem: (key) => sStore[key] || null,
    setItem: (key, val) => { sStore[key] = String(val); },
    removeItem: (key) => { delete sStore[key]; },
    clear: () => { sStore = {}; }
  };
}

test('TeacherAuthService: manages default pin, login, logout and pin changes', async () => {
  global.localStorage.clear();
  global.sessionStorage.clear();

  const auth = new TeacherAuthService();

  // Initially not teacher
  assert.equal(auth.isTeacher(), false);
  assert.equal(auth.getStoredPin(), '2026');

  // Failed login
  const failRes = await auth.loginWithPin('wrong-pin');
  assert.equal(failRes.success, false);
  assert.equal(auth.isTeacher(), false);

  // Successful login
  const successRes = await auth.loginWithPin('2026');
  assert.equal(successRes.success, true);
  assert.equal(auth.isTeacher(), true);

  // Change PIN with invalid current PIN
  const badChange = await auth.changePin('1111', '9999', '9999');
  assert.equal(badChange.success, false);

  // Change PIN with mismatch
  const mismatchChange = await auth.changePin('2026', '9999', '8888');
  assert.equal(mismatchChange.success, false);

  // Successful PIN change
  const okChange = await auth.changePin('2026', '4321', '4321');
  assert.equal(okChange.success, true);
  assert.equal(auth.getStoredPin(), '4321');

  // Old PIN fails now
  assert.equal(await auth.verifyPin('2026'), false);
  assert.equal(await auth.verifyPin('4321'), true);

  // Logout
  auth.logout();
  assert.equal(auth.isTeacher(), false);
});
