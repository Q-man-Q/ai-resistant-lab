// Компонент «Журнал учителя» (Панель проверки работ и ведомости оценивания)

export class TeacherDashboardView {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.submissionService = options.submissionService;
    this.submissions = [];
    this.currentFilterClass = 'all';
    this.currentFilterSheet = 'all';

    this.render();
    this.initEventListeners();
    this.refresh();
  }

  render() {
    this.container.innerHTML = `
      <div class="teacher-dashboard">
        <div class="dashboard-header">
          <div>
            <h2 class="dashboard-title">Журнал сдачи работ (Кабинет учителя)</h2>
            <p class="dashboard-subtitle">Централизованный сбор и проверка письменных ответов, исправленного кода и баллов учащихся.</p>
          </div>
          <div class="dashboard-actions">
            <button class="btn btn-secondary" id="btnFirebaseConfig" title="Подключить или настроить Google Firebase Firestore">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.47 1.318a1 1 0 0 0-.94 0l-6 3.2A1 1 0 0 0 1 5.4v5.2a1 1 0 0 0 .53.882l6 3.2a1 1 0 0 0 .94 0l6-3.2A1 1 0 0 0 15 10.6V5.4a1 1 0 0 0-.53-.882l-6-3.2zM2 5.672 7.5 8.6v5.428L2 11.096V5.672zm7 8.356V8.6l5.5-2.928v5.424L9 14.028zM8 7.644 2.536 4.73 8 1.815l5.464 2.916L8 7.644z"/>
              </svg>
              <span id="firebaseStatusText">Облако Firebase</span>
            </button>
            <button class="btn btn-secondary" id="btnExportCSV" title="Скачать ведомость в формате CSV для импорта в электронный журнал">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              <span>Экспорт ведомости (CSV)</span>
            </button>
            <button class="btn btn-ghost" id="btnClearSubmissions" title="Очистить локальный журнал сданных работ">
              <span>Очистить журнал</span>
            </button>
          </div>
        </div>

        <!-- Карточки статистики -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-label">Сдано работ</span>
            <span class="stat-value" id="statTotalSubmissions">0</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Средний балл (из 10)</span>
            <span class="stat-value" id="statAvgScore">0.0</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Самооценка (Светофор)</span>
            <div class="traffic-summary">
              <span class="traffic-tag green" id="statGreenCount">🟢 0</span>
              <span class="traffic-tag yellow" id="statYellowCount">🟡 0</span>
              <span class="traffic-tag red" id="statRedCount">🔴 0</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-label">Режим синхронизации</span>
            <span class="stat-sync" id="statSyncMode">Локальный (Браузер)</span>
          </div>
        </div>

        <!-- Фильтры -->
        <div class="dashboard-filters">
          <div class="filter-group">
            <label for="filterClass">Фильтр по классу:</label>
            <select id="filterClass" class="app-select">
              <option value="all">Все классы</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="filterSheet">Фильтр по листу:</label>
            <select id="filterSheet" class="app-select">
              <option value="all">Все рабочие листы</option>
            </select>
          </div>
        </div>

        <!-- Таблица сданных работ -->
        <div class="submissions-table-wrapper">
          <table class="submissions-table">
            <thead>
              <tr>
                <th>Время сдачи</th>
                <th>Класс</th>
                <th>ФИО учащегося</th>
                <th>Рабочий лист</th>
                <th style="text-align: center;">Балл</th>
                <th style="text-align: center;">Светофор</th>
                <th style="text-align: right;">Действия</th>
              </tr>
            </thead>
            <tbody id="submissionsTableBody">
              <tr>
                <td colspan="7" class="empty-table-msg">Работ пока не сдано. Когда ученики нажмут кнопку «Сдать работу учителю», они сразу появятся здесь.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Модальное окно просмотра работы ученика -->
      <div class="modal-backdrop" id="reviewModal" style="display: none;">
        <div class="modal-dialog modal-dialog-lg">
          <div class="modal-header">
            <h3 class="modal-title" id="reviewModalTitle">Проверка работы учащегося</h3>
            <button class="btn btn-ghost" id="btnCloseReviewModal">✕</button>
          </div>
          <div class="modal-body" id="reviewModalBody"></div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnPrintReviewWork">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
              </svg>
              <span>Распечатать бланк</span>
            </button>
            <button class="btn btn-primary" id="btnCloseReviewBtn">Закрыть</button>
          </div>
        </div>
      </div>

      <!-- Модальное окно настройки Firebase -->
      <div class="modal-backdrop" id="firebaseModal" style="display: none;">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Настройка облачной базы Google Firebase</h3>
            <button class="btn btn-ghost" id="btnCloseFirebaseModal">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 12px; font-size: 13px; color: #475569;">
              Для синхронизации работ со всех компьютеров класса в реальном времени подключите бесплатную базу Firebase Firestore. Вставьте конфигурационный объект проекта (JSON):
            </p>
            <textarea id="firebaseConfigTextarea" class="app-textarea" rows="8" placeholder='{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-lab.firebaseapp.com",\n  "projectId": "my-lab",\n  "storageBucket": "my-lab.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}'></textarea>
            <p style="margin-top: 10px; font-size: 12px; color: #64748b;">
              💡 Без Firebase система работает полностью автономно: все сданные работы сохраняются в браузере и доступны для экспорта в CSV или печати.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="btnResetFirebaseConfig">Сбросить (Локальный режим)</button>
            <button class="btn btn-primary" id="btnSaveFirebaseConfig">Сохранить конфигурацию</button>
          </div>
        </div>
      </div>
    `;
  }

  initEventListeners() {
    // Кнопка экспорта в CSV
    this.container.querySelector('#btnExportCSV').addEventListener('click', () => {
      const csv = this.submissionService.exportToCSV(this.getFilteredSubmissions());
      if (!csv) {
        alert('Журнал пуст. Сначала сдайте хотя бы одну работу.');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ведомость_оценок_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Очистить журнал
    this.container.querySelector('#btnClearSubmissions').addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите очистить журнал сданных работ?')) {
        this.submissionService.clearLocal();
        this.refresh();
      }
    });

    // Фильтры
    this.container.querySelector('#filterClass').addEventListener('change', (e) => {
      this.currentFilterClass = e.target.value;
      this.renderTable();
    });

    this.container.querySelector('#filterSheet').addEventListener('change', (e) => {
      this.currentFilterSheet = e.target.value;
      this.renderTable();
    });

    // Модалка Firebase
    const fbModal = this.container.querySelector('#firebaseModal');
    this.container.querySelector('#btnFirebaseConfig').addEventListener('click', () => {
      const curConfig = this.submissionService.firebaseConfig;
      this.container.querySelector('#firebaseConfigTextarea').value = curConfig ? JSON.stringify(curConfig, null, 2) : '';
      fbModal.style.display = 'flex';
    });

    this.container.querySelector('#btnCloseFirebaseModal').addEventListener('click', () => {
      fbModal.style.display = 'none';
    });

    this.container.querySelector('#btnSaveFirebaseConfig').addEventListener('click', () => {
      const val = this.container.querySelector('#firebaseConfigTextarea').value.trim();
      if (!val) {
        this.submissionService.saveFirebaseConfig(null);
        alert('Конфигурация сброшена. Включен локальный режим.');
      } else {
        try {
          const parsed = JSON.parse(val);
          this.submissionService.saveFirebaseConfig(parsed);
          alert('Конфигурация Firebase успешно сохранена!');
        } catch (e) {
          alert('Ошибка парсинга JSON: ' + e.message);
          return;
        }
      }
      fbModal.style.display = 'none';
      this.refresh();
    });

    this.container.querySelector('#btnResetFirebaseConfig').addEventListener('click', () => {
      this.submissionService.saveFirebaseConfig(null);
      this.container.querySelector('#firebaseConfigTextarea').value = '';
      alert('Включен локальный режим.');
      fbModal.style.display = 'none';
      this.refresh();
    });

    // Модалка просмотра работы
    const revModal = this.container.querySelector('#reviewModal');
    this.container.querySelector('#btnCloseReviewModal').addEventListener('click', () => {
      revModal.style.display = 'none';
    });
    this.container.querySelector('#btnCloseReviewBtn').addEventListener('click', () => {
      revModal.style.display = 'none';
    });
    this.container.querySelector('#btnPrintReviewWork').addEventListener('click', () => {
      window.print();
    });

    // Подписка на новые сдачи
    this.submissionService.onNewSubmission(() => {
      this.refresh();
    });
  }

  async refresh() {
    this.submissions = await this.submissionService.getAllSubmissions();
    this.updateStats();
    this.updateFilters();
    this.renderTable();
  }

  updateStats() {
    const total = this.submissions.length;
    this.container.querySelector('#statTotalSubmissions').textContent = total;

    if (total === 0) {
      this.container.querySelector('#statAvgScore').textContent = '0.0';
      this.container.querySelector('#statGreenCount').textContent = '🟢 0';
      this.container.querySelector('#statYellowCount').textContent = '🟡 0';
      this.container.querySelector('#statRedCount').textContent = '🔴 0';
    } else {
      const sum = this.submissions.reduce((acc, s) => acc + (Number(s.score) || 0), 0);
      this.container.querySelector('#statAvgScore').textContent = (sum / total).toFixed(1);

      const greens = this.submissions.filter(s => s.trafficLight === 'green').length;
      const yellows = this.submissions.filter(s => s.trafficLight === 'yellow').length;
      const reds = this.submissions.filter(s => s.trafficLight === 'red').length;

      this.container.querySelector('#statGreenCount').textContent = `🟢 ${greens}`;
      this.container.querySelector('#statYellowCount').textContent = `🟡 ${yellows}`;
      this.container.querySelector('#statRedCount').textContent = `🔴 ${reds}`;
    }

    const isCloud = !!this.submissionService.firebaseConfig;
    const syncEl = this.container.querySelector('#statSyncMode');
    const fbText = this.container.querySelector('#firebaseStatusText');
    if (isCloud) {
      syncEl.textContent = 'Облако (Firebase)';
      syncEl.style.color = '#10b981';
      fbText.textContent = 'Firebase: Подключен';
    } else {
      syncEl.textContent = 'Локальный (Браузер)';
      syncEl.style.color = '#64748b';
      fbText.textContent = 'Облако Firebase';
    }
  }

  updateFilters() {
    const classSet = new Set();
    const sheetSet = new Set();

    this.submissions.forEach(s => {
      if (s.studentClass) classSet.add(s.studentClass);
      if (s.worksheetId) sheetSet.add(s.worksheetId);
    });

    const classSelect = this.container.querySelector('#filterClass');
    const curClass = this.currentFilterClass;
    classSelect.innerHTML = '<option value="all">Все классы</option>';
    Array.from(classSet).sort().forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = `Класс: ${c}`;
      if (c === curClass) opt.selected = true;
      classSelect.appendChild(opt);
    });

    const sheetSelect = this.container.querySelector('#filterSheet');
    const curSheet = this.currentFilterSheet;
    sheetSelect.innerHTML = '<option value="all">Все рабочие листы</option>';
    Array.from(sheetSet).sort((a,b) => Number(a)-Number(b)).forEach(sid => {
      const opt = document.createElement('option');
      opt.value = sid;
      opt.textContent = `Лист №${sid}`;
      if (String(sid) === String(curSheet)) opt.selected = true;
      sheetSelect.appendChild(opt);
    });
  }

  getFilteredSubmissions() {
    return this.submissions.filter(s => {
      if (this.currentFilterClass !== 'all' && s.studentClass !== this.currentFilterClass) {
        return false;
      }
      if (this.currentFilterSheet !== 'all' && String(s.worksheetId) !== String(this.currentFilterSheet)) {
        return false;
      }
      return true;
    });
  }

  renderTable() {
    const tbody = this.container.querySelector('#submissionsTableBody');
    const list = this.getFilteredSubmissions();

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-msg">
            ${this.submissions.length === 0 ? 'Работ пока не сдано. Когда ученики нажмут кнопку «Сдать работу учителю», они появятся здесь.' : 'Нет работ, удовлетворяющих выбранным фильтрам.'}
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((s, idx) => {
      const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-';
      const trafficBadge = s.trafficLight === 'green' ? '<span class="traffic-tag green">🟢 Уверенно</span>' :
                           s.trafficLight === 'yellow' ? '<span class="traffic-tag yellow">🟡 Сомнения</span>' :
                           s.trafficLight === 'red' ? '<span class="traffic-tag red">🔴 Нужна помощь</span>' : '-';
      
      return `
        <tr>
          <td style="font-size: 13px; color: #64748b;">${dateStr}</td>
          <td><span class="badge-class">${escapeHtml(s.studentClass || '-')}</span></td>
          <td style="font-weight: 600; color: #1e293b;">${escapeHtml(s.studentName || 'Без имени')}</td>
          <td style="font-size: 13px;">№${s.worksheetId} ${escapeHtml(s.worksheetTitle || '')}</td>
          <td style="text-align: center;"><strong style="font-size: 15px; color: #0284c7;">${s.score || 0}</strong> / 10</td>
          <td style="text-align: center;">${trafficBadge}</td>
          <td style="text-align: right;">
            <button class="btn btn-sm btn-outline btn-view-submission" data-sub-idx="${idx}">
              Проверить работу
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-view-submission').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.subIdx);
        this.openReviewModal(list[idx]);
      });
    });
  }

  openReviewModal(sub) {
    if (!sub) return;

    this.container.querySelector('#reviewModalTitle').textContent = `Работа: ${sub.studentName} (${sub.studentClass || 'Класс не указан'})`;
    const body = this.container.querySelector('#reviewModalBody');

    const answers = sub.answers || {};
    let answersHtml = '';

    // Формируем список ответов
    const answerKeys = Object.keys(answers);
    if (answerKeys.length === 0) {
      answersHtml = '<p style="color: #64748b;">Учащийся не заполнил текстовые поля перед отправкой.</p>';
    } else {
      answersHtml = answerKeys.map(k => {
        const val = answers[k];
        let label = k;
        if (k.includes('concept')) label = 'Вопрос на понимание алгоритма';
        else if (k.includes('q1')) label = 'Ответ на вопрос №1';
        else if (k.includes('q2')) label = 'Ответ на вопрос №2';
        else if (k.includes('code')) label = 'Исправленный / написанный код программы';
        else if (k.includes('ai_')) label = 'Аудит ответа нейросети';

        const isCode = typeof val === 'string' && (val.includes('\n') || val.includes('=') || val.includes('print'));

        return `
          <div class="review-answer-card">
            <div class="review-answer-label">${escapeHtml(label)}</div>
            ${isCode ? `<pre class="review-code-block"><code>${escapeHtml(val)}</code></pre>` : `<div class="review-answer-text">${escapeHtml(val)}</div>`}
          </div>
        `;
      }).join('');
    }

    body.innerHTML = `
      <div class="review-meta-bar">
        <div><strong>Лист:</strong> №${sub.worksheetId} ${escapeHtml(sub.worksheetTitle || '')}</div>
        <div><strong>Время сдачи:</strong> ${new Date(sub.createdAt).toLocaleString('ru-RU')}</div>
        <div><strong>Итоговый балл:</strong> <span style="font-size: 16px; font-weight: 700; color: #0284c7;">${sub.score || 0} из 10</span></div>
        <div><strong>Самооценка (Светофор):</strong> ${sub.trafficLight === 'green' ? '🟢 Уверенно' : sub.trafficLight === 'yellow' ? '🟡 Были сомнения' : '🔴 Требуется помощь'}</div>
      </div>

      <h4 style="font-size: 14px; font-weight: 600; margin: 16px 0 8px; color: #334155;">Письменные ответы и программный код учащегося:</h4>
      <div class="review-answers-container">
        ${answersHtml}
      </div>
    `;

    this.container.querySelector('#reviewModal').style.display = 'flex';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
