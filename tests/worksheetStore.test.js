import test from 'node:test';
import assert from 'node:assert/strict';
import { WorksheetStore } from '../src/data/worksheetStore.js';

// Polyfill minimal localStorage for testing in Node
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

test('WorksheetStore: initializes with 7 default worksheets', () => {
  globalThis.localStorage.clear();
  const store = new WorksheetStore();
  const all = store.getAll();
  assert.equal(all.length, 7, 'Should have 7 default worksheets');
  assert.equal(store.getById(1).title, 'Разветвляющиеся алгоритмы и типы данных на языке Python');
});

test('WorksheetStore: imports new custom worksheet and persists it', () => {
  globalThis.localStorage.clear();
  const store = new WorksheetStore();

  const customJson = JSON.stringify({
    id: 'grade8-sheet99',
    grade: 8,
    sheetNumber: 99,
    title: 'Пользовательский лист',
    topic: 'Тестирование импорта',
    tasks: [{ id: 't1', type: 'trace', title: 'Task 1', description: 'Desc' }],
    rubric: [{ criterion: 'C', descriptor: 'D', points: 10 }]
  });

  const res = store.importFromJSON(customJson);
  assert.equal(res.success, true);
  assert.equal(res.count, 1);

  const updatedAll = store.getAll();
  assert.equal(updatedAll.length, 8, 'Should now have 8 worksheets');
  assert.ok(store.getById('grade8-sheet99'));

  // Test reload from storage
  const newStoreInstance = new WorksheetStore();
  assert.equal(newStoreInstance.getAll().length, 8, 'Should reload 8 worksheets from storage');
});

test('WorksheetStore: exports JSON and resets to defaults', () => {
  globalThis.localStorage.clear();
  const store = new WorksheetStore();
  const exported = store.exportToJSON(1);
  assert.ok(exported.includes('Разветвляющиеся алгоритмы'));

  store.resetToDefaults();
  assert.equal(store.getAll().length, 7);
});
