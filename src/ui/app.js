// Главный координатор интерфейса (переключение листов, вкладок и импорт)

import { WorksheetStore } from '../data/worksheetStore.js';
import { WorksheetParser } from '../data/worksheetParser.js';
import { WorksheetView } from './worksheetView.js';
import { VisualizerView } from './visualizerView.js';
import { SubmissionService } from '../services/submissionService.js';
import { TeacherDashboardView } from './teacherDashboardView.js';
import { TeacherAuthService } from '../services/teacherAuthService.js';

export class App {
  constructor() {
    this.store = new WorksheetStore();
    this.submissionService = new SubmissionService();
    this.teacherAuthService = new TeacherAuthService();
    this.currentSheetId = 1;
    this.currentTab = 'worksheet'; // 'worksheet' | 'visualizer' | 'sandbox' | 'teacher'
    this.customSandboxCode = `numbers = [3, 8, 1, 6, 2]
max_val = numbers[0]
for x in numbers:
    if x > max_val:
        max_val = x
print("Максимум:", max_val)`;

    this.dom = {
      sheetSelect: document.querySelector('#sheetSelect'),
      tabWorksheet: document.querySelector('#tabWorksheet'),
      tabVisualizer: document.querySelector('#tabVisualizer'),
      tabSandbox: document.querySelector('#tabSandbox'),
      tabTeacher: document.querySelector('#tabTeacher'),
      worksheetContainer: document.querySelector('#worksheetContainer'),
      visualizerContainer: document.querySelector('#visualizerContainer'),
      sandboxContainer: document.querySelector('#sandboxContainer'),
      teacherContainer: document.querySelector('#teacherContainer'),
      
      // Модальное окно импорта
      btnOpenImport: document.querySelector('#btnOpenImport'),
      importModal: document.querySelector('#importModal'),
      btnCloseImportModal: document.querySelector('#btnCloseImportModal'),
      dropzone: document.querySelector('#dropzone'),
      fileInput: document.querySelector('#fileInput'),
      importRawJson: document.querySelector('#importRawJson'),
      importStatus: document.querySelector('#importStatus'),
      btnSubmitImport: document.querySelector('#btnSubmitImport'),
      btnDownloadTemplate: document.querySelector('#btnDownloadTemplate'),
      
      btnExportSheet: document.querySelector('#btnExportSheet'),
      btnResetAll: document.querySelector('#btnResetAll'),

      // Справка
      btnAbout: document.querySelector('#btnAbout'),
      aboutModal: document.querySelector('#aboutModal'),
      btnCloseModal: document.querySelector('#btnCloseModal'),
      btnCloseAboutBtn: document.querySelector('#btnCloseAboutBtn'),

      // Авторизация учителя
      btnTeacherAuth: document.querySelector('#btnTeacherAuth'),
      teacherAuthBtnText: document.querySelector('#teacherAuthBtnText'),
      teacherAuthIcon: document.querySelector('#teacherAuthIcon'),
      teacherAuthModal: document.querySelector('#teacherAuthModal'),
      btnCloseTeacherAuthModal: document.querySelector('#btnCloseTeacherAuthModal'),
      btnCancelTeacherAuth: document.querySelector('#btnCancelTeacherAuth'),
      btnSubmitTeacherAuth: document.querySelector('#btnSubmitTeacherAuth'),
      teacherPinInput: document.querySelector('#teacherPinInput'),
      teacherAuthError: document.querySelector('#teacherAuthError')
    };

    this.initViews();
    this.populateSheetSelect();
    this.updateTeacherAuthUI();
    this.bindEvents();

    this.store.onChange(() => {
      this.populateSheetSelect();
    });

    const all = this.store.getAll();
    if (all.length > 0) {
      this.selectSheet(all[0].id);
    }
  }

  initViews() {
    this.worksheetView = new WorksheetView(this.dom.worksheetContainer, {
      onOpenVisualizer: (code, inputs, task) => {
        this.openInVisualizer(code, inputs, task);
      },
      onSubmitWorksheet: async (subData) => {
        return await this.submissionService.submitWorksheet(subData);
      }
    });

    this.visualizerView = new VisualizerView(this.dom.visualizerContainer);

    this.teacherView = new TeacherDashboardView(this.dom.teacherContainer, {
      submissionService: this.submissionService,
      teacherAuthService: this.teacherAuthService,
      onLogout: () => {
        this.updateTeacherAuthUI();
        this.switchTab('worksheet');
      }
    });
  }

  populateSheetSelect() {
    const all = this.store.getAll();
    const groups = {};

    all.forEach(ws => {
      const g = ws.grade || 0;
      if (!groups[g]) groups[g] = [];
      groups[g].push(ws);
    });

    let html = '';
    const sortedGrades = Object.keys(groups).map(Number).sort((a, b) => a - b);

    sortedGrades.forEach(grade => {
      const label = grade > 0 ? `${grade} класс` : 'Пользовательские материалы';
      html += `<optgroup label="${label}">`;
      groups[grade].forEach(ws => {
        html += `<option value="${ws.id}">Лист № ${ws.sheetNumber}: ${ws.title}</option>`;
      });
      html += '</optgroup>';
    });

    this.dom.sheetSelect.innerHTML = html;
    if (this.currentSheetId) {
      this.dom.sheetSelect.value = this.currentSheetId;
    }
  }

  bindEvents() {
    this.dom.sheetSelect.addEventListener('change', (e) => {
      this.selectSheet(e.target.value);
    });

    this.dom.tabWorksheet.addEventListener('click', () => this.switchTab('worksheet'));
    this.dom.tabVisualizer.addEventListener('click', () => this.switchTab('visualizer'));
    this.dom.tabSandbox.addEventListener('click', () => this.switchTab('sandbox'));
    if (this.dom.tabTeacher) {
      this.dom.tabTeacher.addEventListener('click', () => this.switchTab('teacher'));
    }

    // Вход / выход учителя
    if (this.dom.btnTeacherAuth) {
      this.dom.btnTeacherAuth.addEventListener('click', () => {
        if (this.teacherAuthService.isTeacher()) {
          if (confirm('Выйти из режима учителя и заблокировать журнал?')) {
            this.teacherAuthService.logout();
            this.updateTeacherAuthUI();
            this.switchTab('worksheet');
          }
        } else {
          this.openTeacherAuthModal();
        }
      });
    }

    if (this.dom.btnCloseTeacherAuthModal) {
      this.dom.btnCloseTeacherAuthModal.addEventListener('click', () => this.closeTeacherAuthModal());
    }
    if (this.dom.btnCancelTeacherAuth) {
      this.dom.btnCancelTeacherAuth.addEventListener('click', () => this.closeTeacherAuthModal());
    }
    if (this.dom.teacherAuthModal) {
      this.dom.teacherAuthModal.addEventListener('click', (e) => {
        if (e.target === this.dom.teacherAuthModal) this.closeTeacherAuthModal();
      });
    }

    if (this.dom.btnSubmitTeacherAuth) {
      this.dom.btnSubmitTeacherAuth.addEventListener('click', () => this.submitTeacherAuth());
    }
    if (this.dom.teacherPinInput) {
      this.dom.teacherPinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitTeacherAuth();
        }
      });
    }

    const openAbout = () => this.dom.aboutModal.classList.add('open');
    const closeAbout = () => this.dom.aboutModal.classList.remove('open');
    if (this.dom.btnAbout) this.dom.btnAbout.addEventListener('click', openAbout);
    if (this.dom.btnCloseModal) this.dom.btnCloseModal.addEventListener('click', closeAbout);
    if (this.dom.btnCloseAboutBtn) this.dom.btnCloseAboutBtn.addEventListener('click', closeAbout);
    if (this.dom.aboutModal) {
      this.dom.aboutModal.addEventListener('click', (e) => {
        if (e.target === this.dom.aboutModal) closeAbout();
      });
    }

    if (this.dom.btnOpenImport) {
      this.dom.btnOpenImport.addEventListener('click', () => {
        this.dom.importRawJson.value = '';
        this.dom.importStatus.style.display = 'none';
        this.dom.importModal.classList.add('open');
      });
    }
    if (this.dom.btnCloseImportModal) {
      this.dom.btnCloseImportModal.addEventListener('click', () => {
        this.dom.importModal.classList.remove('open');
      });
    }
    if (this.dom.importModal) {
      this.dom.importModal.addEventListener('click', (e) => {
        if (e.target === this.dom.importModal) {
          this.dom.importModal.classList.remove('open');
        }
      });
    }

    if (this.dom.dropzone && this.dom.fileInput) {
      this.dom.dropzone.addEventListener('click', () => this.dom.fileInput.click());
      this.dom.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dom.dropzone.classList.add('dragover');
      });
      this.dom.dropzone.addEventListener('dragleave', () => {
        this.dom.dropzone.classList.remove('dragover');
      });
      this.dom.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dom.dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.readFileIntoImport(e.dataTransfer.files[0]);
        }
      });
      this.dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.readFileIntoImport(e.target.files[0]);
        }
      });
    }

    if (this.dom.btnSubmitImport) {
      this.dom.btnSubmitImport.addEventListener('click', () => {
        this.handleImportSubmit();
      });
    }

    if (this.dom.btnDownloadTemplate) {
      this.dom.btnDownloadTemplate.addEventListener('click', () => {
        this.downloadTemplateFile();
      });
    }

    if (this.dom.btnExportSheet) {
      this.dom.btnExportSheet.addEventListener('click', () => {
        this.exportCurrentSheet();
      });
    }

    if (this.dom.btnResetAll) {
      this.dom.btnResetAll.addEventListener('click', () => {
        if (confirm('Сбросить все импортированные листы и вернуться к стандартному банку из 7 листов?')) {
          this.store.resetToDefaults();
          const first = this.store.getAll()[0];
          if (first) this.selectSheet(first.id);
        }
      });
    }

    const btnRunSandbox = document.querySelector('#btnRunSandbox');
    const sandboxEditor = document.querySelector('#sandboxEditor');
    if (btnRunSandbox && sandboxEditor) {
      sandboxEditor.value = this.customSandboxCode;
      btnRunSandbox.addEventListener('click', () => {
        const code = sandboxEditor.value;
        this.visualizerView.loadCode(code, []);
        this.switchTab('visualizer');
      });
    }
  }

  readFileIntoImport(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.dom.importRawJson.value = e.target.result;
      this.showImportStatus('Файл успешно загружен. Нажмите «Импортировать в лабораторию».', 'success');
    };
    reader.onerror = () => {
      this.showImportStatus('Не удалось прочитать файл.', 'error');
    };
    reader.readAsText(file, 'utf-8');
  }

  handleImportSubmit() {
    const text = this.dom.importRawJson.value.trim();
    if (!text) {
      this.showImportStatus('Вставьте JSON или выберите файл.', 'error');
      return;
    }

    const res = this.store.importFromJSON(text);
    if (!res.success) {
      const errList = (res.errors || []).map(e => `<li>${e}</li>`).join('');
      this.showImportStatus(`<strong>Ошибки валидации:</strong><ul>${errList}</ul>`, 'error');
      return;
    }

    let msg = `Успешно импортировано рабочих листов: ${res.count}.`;
    if (res.warnings && res.warnings.length > 0) {
      msg += ` Предупреждения: ${res.warnings.join('; ')}`;
    }

    this.showImportStatus(msg, res.warnings && res.warnings.length > 0 ? 'warning' : 'success');

    setTimeout(() => {
      this.dom.importModal.classList.remove('open');
      const all = this.store.getAll();
      const last = all[all.length - 1];
      if (last) {
        this.selectSheet(last.id);
      }
    }, 1200);
  }

  showImportStatus(html, type) {
    this.dom.importStatus.className = `import-status-box ${type}`;
    this.dom.importStatus.innerHTML = html;
    this.dom.importStatus.style.display = 'block';
  }

  downloadTemplateFile() {
    fetch('templates/worksheet_template.json')
      .then(res => res.text())
      .then(content => {
        this.triggerFileDownload('worksheet_template.json', content);
      })
      .catch(err => {
        console.error('Failed to fetch template, generating inline:', err);
        const inlineTemplate = JSON.stringify({
          id: "custom-template",
          grade: 8,
          sheetNumber: 8,
          title: "Шаблон рабочего листа",
          topic: "Тема по ТУП",
          learningObjectives: "8.3.3.1",
          tasks: [
            { id: "t1", taskNumber: 1, type: "trace", title: "Задание 1", description: "Условие..." }
          ],
          rubric: [
            { criterion: "Критерий 1", descriptor: "Дескриптор", points: 10 }
          ]
        }, null, 2);
        this.triggerFileDownload('worksheet_template.json', inlineTemplate);
      });
  }

  exportCurrentSheet() {
    const ws = this.store.getById(this.currentSheetId);
    if (!ws) return;

    const json = JSON.stringify(ws, null, 2);
    const filename = `worksheet_${ws.grade}_cl_${ws.sheetNumber}.json`;
    this.triggerFileDownload(filename, json);
  }

  triggerFileDownload(filename, content) {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  selectSheet(id) {
    const ws = this.store.getById(id);
    if (!ws) return;

    this.currentSheetId = ws.id;
    this.dom.sheetSelect.value = ws.id;
    this.worksheetView.setWorksheet(ws);

    // Preload first task code into visualizer
    const firstTask = ws.tasks[0];
    if (firstTask) {
      const code = firstTask.code || firstTask.starterCode || firstTask.buggyCode || '';
      const inputs = firstTask.defaultInputs || firstTask.testInputs || [];
      this.visualizerView.loadCode(code, inputs);
    }
  }

  switchTab(tabName) {
    if (tabName === 'teacher' && !this.teacherAuthService.isTeacher()) {
      this.openTeacherAuthModal();
      return;
    }

    this.currentTab = tabName;

    this.dom.tabWorksheet.classList.toggle('active', tabName === 'worksheet');
    this.dom.tabVisualizer.classList.toggle('active', tabName === 'visualizer');
    this.dom.tabSandbox.classList.toggle('active', tabName === 'sandbox');
    if (this.dom.tabTeacher) {
      this.dom.tabTeacher.classList.toggle('active', tabName === 'teacher');
    }

    this.dom.worksheetContainer.style.display = (tabName === 'worksheet') ? 'block' : 'none';
    this.dom.visualizerContainer.style.display = (tabName === 'visualizer') ? 'block' : 'none';
    if (this.dom.sandboxContainer) {
      this.dom.sandboxContainer.style.display = (tabName === 'sandbox') ? 'block' : 'none';
    }
    if (this.dom.teacherContainer) {
      this.dom.teacherContainer.style.display = (tabName === 'teacher') ? 'block' : 'none';
    }

    if (tabName === 'visualizer') {
      this.visualizerView.goToStep(this.visualizerView.currentStepIdx || 0);
    } else if (tabName === 'teacher' && this.teacherView) {
      this.teacherView.refresh();
    }
  }

  openTeacherAuthModal() {
    if (!this.dom.teacherAuthModal) return;
    if (this.dom.teacherPinInput) this.dom.teacherPinInput.value = '';
    if (this.dom.teacherAuthError) this.dom.teacherAuthError.style.display = 'none';
    this.dom.teacherAuthModal.style.display = 'flex';
    setTimeout(() => {
      if (this.dom.teacherPinInput) this.dom.teacherPinInput.focus();
    }, 50);
  }

  closeTeacherAuthModal() {
    if (this.dom.teacherAuthModal) {
      this.dom.teacherAuthModal.style.display = 'none';
    }
  }

  submitTeacherAuth() {
    const pin = (this.dom.teacherPinInput.value || '').trim();
    const res = this.teacherAuthService.loginWithPin(pin);
    if (!res.success) {
      if (this.dom.teacherAuthError) {
        this.dom.teacherAuthError.style.display = 'block';
        this.dom.teacherAuthError.textContent = res.error || 'Неверный PIN-код учителя';
      }
      if (this.dom.teacherPinInput) this.dom.teacherPinInput.focus();
      return;
    }
    this.closeTeacherAuthModal();
    this.updateTeacherAuthUI();
    this.switchTab('teacher');
  }

  updateTeacherAuthUI() {
    const isTeacher = this.teacherAuthService.isTeacher();
    if (this.dom.tabTeacher) {
      this.dom.tabTeacher.style.display = isTeacher ? 'inline-flex' : 'none';
    }
    if (this.dom.teacherAuthBtnText) {
      this.dom.teacherAuthBtnText.textContent = isTeacher ? 'Выйти из кабинета' : 'Вход для учителя';
    }
    if (this.dom.btnTeacherAuth) {
      if (isTeacher) {
        this.dom.btnTeacherAuth.style.color = '#dc2626';
        this.dom.btnTeacherAuth.title = 'Кабинет учителя активен. Нажмите, чтобы выйти и заблокировать журнал.';
      } else {
        this.dom.btnTeacherAuth.style.color = '';
        this.dom.btnTeacherAuth.title = 'Вход в кабинет учителя (защищен PIN-кодом)';
      }
    }
  }

  openInVisualizer(code, inputs = [], task = null) {
    this.visualizerView.loadCode(code, inputs);
    this.switchTab('visualizer');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
