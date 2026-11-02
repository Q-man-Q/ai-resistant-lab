import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorksheetParser } from '../src/data/worksheetParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('WorksheetParser: successfully parses valid template JSON', () => {
  const templatePath = path.resolve(__dirname, '../templates/worksheet_template.json');
  const content = fs.readFileSync(templatePath, 'utf8');

  const result = WorksheetParser.parseJSON(content);
  assert.equal(result.success, true, 'Parsing should succeed for valid template');
  assert.equal(result.worksheets.length, 1);

  const ws = result.worksheets[0];
  assert.equal(ws.grade, 8);
  assert.equal(ws.sheetNumber, 8);
  assert.equal(ws.tasks.length, 3);
  assert.equal(ws.rubric.length, 7);

  const totalPoints = ws.rubric.reduce((acc, r) => acc + r.points, 0);
  assert.equal(totalPoints, 10, 'Rubric must total exactly 10 points');
});

test('WorksheetParser: rejects malformed JSON', () => {
  const result = WorksheetParser.parseJSON('{ not valid json }');
  assert.equal(result.success, false);
  assert.match(result.errors[0], /Синтаксическая ошибка/);
});

test('WorksheetParser: rejects missing mandatory fields', () => {
  const invalid = JSON.stringify({
    title: 'No grade or tasks'
  });
  const result = WorksheetParser.parseJSON(invalid);
  assert.equal(result.success, false);
  assert.ok(result.errors.some(e => e.includes('id')));
  assert.ok(result.errors.some(e => e.includes('grade')));
  assert.ok(result.errors.some(e => e.includes('tasks')));
});

test('WorksheetParser: warns if rubric sum is not 10', () => {
  const custom = JSON.stringify({
    id: 99,
    grade: 7,
    sheetNumber: 99,
    title: 'Test',
    topic: 'Topic',
    tasks: [{ id: 't1', type: 'trace', title: 'Task 1' }],
    rubric: [{ criterion: 'C1', descriptor: 'D1', points: 3 }]
  });
  const result = WorksheetParser.parseJSON(custom);
  assert.equal(result.success, true);
  assert.ok(result.warnings.some(w => w.includes('10 баллов')));
});
