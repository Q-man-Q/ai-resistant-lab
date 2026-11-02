import test from 'node:test';
import assert from 'node:assert/strict';
import { SubmissionService } from '../src/services/submissionService.js';

// Mock localStorage for node environment
if (typeof global.localStorage === 'undefined') {
  let store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

test('SubmissionService: saves submission locally and exports CSV', async () => {
  global.localStorage.clear();
  const service = new SubmissionService();

  const sub = {
    worksheetId: '1',
    worksheetTitle: 'Тестовый лист',
    studentName: 'Арман Сериков',
    studentClass: '7 А',
    score: 9,
    trafficLight: 'green',
    answers: { q1: 'текст ответа' }
  };

  const res = await service.submitWorksheet(sub);
  assert.equal(res.success, true);
  assert.ok(res.id);

  const list = await service.getAllSubmissions();
  assert.equal(list.length, 1);
  assert.equal(list[0].studentName, 'Арман Сериков');
  assert.equal(list[0].score, 9);

  const csv = service.exportToCSV(list);
  assert.ok(csv.includes('Арман Сериков'));
  assert.ok(csv.includes('7 А'));
});
