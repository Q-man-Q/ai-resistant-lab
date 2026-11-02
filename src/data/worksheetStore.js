// Хранилище рабочих листов (базовые + пользовательские из localStorage)

import { WORKSHEETS as DEFAULT_WORKSHEETS } from './worksheets.js';
import { WorksheetParser } from './worksheetParser.js';

const STORAGE_CUSTOM_KEY = 'ai_lab_custom_worksheets_v1';
const STORAGE_DELETED_KEY = 'ai_lab_deleted_sheets_v1';

export class WorksheetStore {
  constructor() {
    this.customWorksheets = [];
    this.deletedIds = new Set();
    this.listeners = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.customWorksheets = parsed;
        }
      }

      const deleted = localStorage.getItem(STORAGE_DELETED_KEY);
      if (deleted) {
        const parsed = JSON.parse(deleted);
        if (Array.isArray(parsed)) {
          this.deletedIds = new Set(parsed);
        }
      }
    } catch (e) {
      this.customWorksheets = [];
      this.deletedIds = new Set();
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(this.customWorksheets));
      localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify([...this.deletedIds]));
    } catch (e) {
      console.warn('Ошибка сохранения в localStorage:', e);
    }
  }

  getAll() {
    const all = [...DEFAULT_WORKSHEETS];

    this.customWorksheets.forEach(custom => {
      const existingIdx = all.findIndex(w => String(w.id) === String(custom.id));
      if (existingIdx !== -1) {
        all[existingIdx] = custom;
      } else {
        all.push(custom);
      }
    });

    return all.filter(w => !this.deletedIds.has(String(w.id)));
  }

  getById(id) {
    return this.getAll().find(w => String(w.id) === String(id)) || null;
  }

  importFromJSON(jsonString) {
    const parseResult = WorksheetParser.parseJSON(jsonString);
    if (!parseResult.success) {
      return parseResult;
    }

    let addedCount = 0;
    parseResult.worksheets.forEach(ws => {
      this.deletedIds.delete(String(ws.id));

      const existingIdx = this.customWorksheets.findIndex(c => String(c.id) === String(ws.id));
      if (existingIdx !== -1) {
        this.customWorksheets[existingIdx] = ws;
      } else {
        this.customWorksheets.push(ws);
      }
      addedCount++;
    });

    this.saveToStorage();
    this.notifyChange();

    return {
      success: true,
      count: addedCount,
      warnings: parseResult.warnings
    };
  }

  exportToJSON(sheetId = null) {
    if (sheetId !== null) {
      const ws = this.getById(sheetId);
      return ws ? JSON.stringify(ws, null, 2) : null;
    }
    return JSON.stringify(this.getAll(), null, 2);
  }

  deleteSheet(id) {
    const strId = String(id);
    this.deletedIds.add(strId);
    this.customWorksheets = this.customWorksheets.filter(w => String(w.id) !== strId);
    this.saveToStorage();
    this.notifyChange();
  }

  resetToDefaults() {
    this.customWorksheets = [];
    this.deletedIds.clear();
    this.saveToStorage();
    this.notifyChange();
  }

  onChange(cb) {
    this.listeners.push(cb);
  }

  notifyChange() {
    this.listeners.forEach(cb => {
      try {
        cb(this.getAll());
      } catch (e) {
        console.error('Ошибка в слушателе WorksheetStore:', e);
      }
    });
  }
}
