/**
 * Worksheet Controller (Interactive AI-Resistant Classroom Sheet)
 * Renders curriculum-aligned worksheets, evaluates interactive trace tables,
 * performs live constraint checking, computes formative assessment rubrics (out of 10),
 * and provides seamless bridging to the step-by-step visualizer.
 */

export class WorksheetView {
  constructor(container, options = {}) {
    this.container = container;
    this.worksheet = options.worksheet || null;
    this.onOpenVisualizer = options.onOpenVisualizer || null;
    this.studentState = {};

    this.initDOM();
  }

  setWorksheet(ws) {
    this.worksheet = ws;
    this.loadState();
    this.render();
  }

  getStateKey() {
    return `ai_lab_sheet_${this.worksheet ? this.worksheet.id : 0}_state`;
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.getStateKey());
      this.studentState = saved ? JSON.parse(saved) : {};
    } catch {
      this.studentState = {};
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.getStateKey(), JSON.stringify(this.studentState));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  initDOM() {
    this.container.innerHTML = '<div class="worksheet-viewport" id="worksheetViewport"></div>';
    this.viewport = this.container.querySelector('#worksheetViewport');
  }

  render() {
    if (!this.worksheet) {
      this.viewport.innerHTML = '<div class="empty-state">Выберите рабочий лист из списка выше.</div>';
      return;
    }

    const ws = this.worksheet;
    const currentScore = this.calculateTotalScore();

    this.viewport.innerHTML = `
      <div class="worksheet-document">
        <!-- Шапка рабочего листа -->
        <header class="sheet-header">
          <div class="sheet-meta-badges">
            <span class="badge badge-grade">${ws.grade} класс</span>
            <span class="badge badge-number">Рабочий лист № ${ws.sheetNumber}</span>
            <span class="badge badge-tup">ТУП РК: ${ws.learningObjectives}</span>
          </div>

          <h1 class="sheet-title">${this.escape(ws.title)}</h1>
          <p class="sheet-topic"><strong>Тема:</strong> ${this.escape(ws.topic)}</p>

          <div class="sheet-student-bar">
            <div class="student-info-fields">
              <label class="field-label">Учащийся:
                <input type="text" class="input-text student-name" id="studentNameInput" 
                  placeholder="ФИО учащегося" value="${this.escape(this.studentState.studentName || '')}">
              </label>
              <label class="field-label">Класс:
                <input type="text" class="input-text student-class" id="studentClassInput" 
                  placeholder="напр. 7 «А»" value="${this.escape(this.studentState.studentClass || '')}">
              </label>
            </div>
            
            <div class="sheet-score-card">
              <span class="score-caption">Формативное оценивание</span>
              <div class="score-value">
                <span id="totalScoreNum">${currentScore}</span>
                <span class="score-max">/ 10 баллов</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Задания рабочего листа -->
        <main class="sheet-tasks-list">
          ${ws.tasks.map(task => this.renderTask(task)).join('')}
        </main>

        <!-- Оборотная сторона: Критерии оценивания и Рефлексия -->
        <section class="sheet-footer-section">
          <div class="panel-card rubric-panel">
            <div class="panel-header">
              <span class="panel-title">Рубрика формативного оценивания учебных достижений</span>
              <span class="panel-subtitle">Максимум: 10 баллов</span>
            </div>
            
            <table class="rubric-table">
              <thead>
                <tr>
                  <th>Проверяемый критерий</th>
                  <th>Дескриптор действия учащегося</th>
                  <th style="width: 70px; text-align: center;">Балл</th>
                  <th style="width: 80px; text-align: center;">Отметка</th>
                </tr>
              </thead>
              <tbody>
                ${ws.rubric.map((r, idx) => {
                  const isChecked = this.isDescriptorAchieved(idx);
                  return `
                    <tr class="${isChecked ? 'rubric-row-done' : ''}">
                      <td class="rubric-criterion">${this.escape(r.criterion)}</td>
                      <td class="rubric-desc">${this.escape(r.descriptor)}</td>
                      <td style="text-align: center; font-weight: 600;">${r.points}</td>
                      <td style="text-align: center;">
                        <input type="checkbox" class="rubric-check" data-rubric-idx="${idx}" ${isChecked ? 'checked' : ''}>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Блок рефлексии -->
          <div class="panel-card reflection-panel">
            <div class="panel-header">
              <span class="panel-title">Лист самооценки и рефлексии</span>
            </div>

            <div class="reflection-traffic-light">
              <span class="reflection-label">Самочувствие по результатам урока («Светофор»):</span>
              <div class="traffic-options">
                <label class="traffic-btn green ${this.studentState.trafficLight === 'green' ? 'active' : ''}">
                  <input type="radio" name="traffic" value="green" ${this.studentState.trafficLight === 'green' ? 'checked' : ''}>
                  <span>🟢 Уверенно понял(а), могу объяснить другому</span>
                </label>
                <label class="traffic-btn yellow ${this.studentState.trafficLight === 'yellow' ? 'active' : ''}">
                  <input type="radio" name="traffic" value="yellow" ${this.studentState.trafficLight === 'yellow' ? 'checked' : ''}>
                  <span>🟡 Были затруднения, но разобрался(лась)</span>
                </label>
                <label class="traffic-btn red ${this.studentState.trafficLight === 'red' ? 'active' : ''}">
                  <input type="radio" name="traffic" value="red" ${this.studentState.trafficLight === 'red' ? 'checked' : ''}>
                  <span>🔴 Требуется дополнительная помощь учителя</span>
                </label>
              </div>
            </div>

            <div class="reflection-questions">
              <label class="ref-field">
                <span>1. Что на сегодняшнем уроке получилось выполнить легко и уверенно?</span>
                <textarea class="textarea-ref" id="refEasy" rows="2" placeholder="Например: быстро локализовал ошибку в типах данных...">${this.escape(this.studentState.refEasy || '')}</textarea>
              </label>
              <label class="ref-field">
                <span>2. В каких строках кода или алгоритмических шагах возникли затруднения?</span>
                <textarea class="textarea-ref" id="refHard" rows="2" placeholder="Например: сомневался в значении переменной цикла на 3 шаге...">${this.escape(this.studentState.refHard || '')}</textarea>
              </label>
              <label class="ref-field">
                <span>3. Какой способ помог найти решение (трассировка, пошаговый разбор, проверка типов)?</span>
                <textarea class="textarea-ref" id="refHelp" rows="2" placeholder="Например: пошаговый визуализатор показал точное значение в памяти...">${this.escape(this.studentState.refHelp || '')}</textarea>
              </label>
            </div>

            <div class="sheet-action-bar">
              <button class="btn btn-secondary" id="btnPrintSheet">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 1h8v2H4V1zm8 11v3H4v-3h8zm1-7H3a2 2 0 00-2 2v4a2 2 0 002 2h1v-2h8v2h1a2 2 0 002-2V7a2 2 0 00-2-2z"/>
                </svg>
                <span>Печать / Сохранить в PDF</span>
              </button>
              <button class="btn btn-secondary" id="btnResetSheet">
                <span>Сбросить ответы листа</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    `;

    this.bindEvents();
  }

  renderTask(task) {
    const isTrace = task.type === 'trace';
    const isDebug = task.type === 'debug';
    const isConstraint = task.type === 'constraint';
    const isAudit = task.type === 'audit';

    return `
      <section class="task-card" id="taskCard_${task.id}">
        <div class="task-header">
          <div class="task-title-group">
            <span class="task-num">№ ${task.taskNumber}</span>
            <h2 class="task-heading">${this.escape(task.title)}</h2>
          </div>
          <span class="badge badge-model">${this.escape(task.model || '')}</span>
        </div>

        <p class="task-description">${this.escape(task.description)}</p>

        <!-- Кодовый блок задания -->
        ${task.code ? this.renderCodeSnippet(task.code, task.id) : ''}
        ${task.buggyCode ? this.renderCodeSnippet(task.buggyCode, task.id, 'Код с дефектом (требуется отладка):') : ''}
        ${task.aiOutputCode ? this.renderCodeSnippet(task.aiOutputCode, task.id, 'Ответ генеративной нейросети:') : ''}

        <!-- Интерактивная область решения -->
        <div class="task-interactive-body">
          ${isTrace ? this.renderTraceBody(task) : ''}
          ${isDebug ? this.renderDebugBody(task) : ''}
          ${isConstraint ? this.renderConstraintBody(task) : ''}
          ${isAudit ? this.renderAuditBody(task) : ''}
        </div>

        <!-- Кнопка перехода к пошаговой визуализации -->
        <div class="task-bridge-bar">
          <button class="btn btn-bridge" data-bridge-task="${task.id}">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2l10 6-10 6V2z"/>
            </svg>
            <span>Пошаговый разбор в интерактивном визуализаторе</span>
          </button>
        </div>
      </section>
    `;
  }

  renderCodeSnippet(code, taskId, label = 'Листинг программы:') {
    const lines = code.split('\n');
    return `
      <div class="code-snippet-box">
        <div class="snippet-header">
          <span class="snippet-label">${label}</span>
          <span class="snippet-lang">Python</span>
        </div>
        <div class="snippet-code-lines">
          ${lines.map((line, idx) => `
            <div class="snippet-line">
              <span class="snippet-ln">${idx + 1}</span>
              <span class="snippet-text">${this.escape(line) || '&nbsp;'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // TASK BODIES
  // ---------------------------------------------------------------------------

  renderTraceBody(task) {
    if (task.traceTests) {
      // Таблица тестов ветвления (например Лист 1)
      return `
        <div class="interactive-trace-block">
          <h3 class="interactive-title">Таблица результатов трассировки:</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">Тест</th>
                <th>Входные данные</th>
                <th>Сработавшая ветка условий</th>
                <th style="width: 140px;">Значение cost</th>
                <th style="width: 90px; text-align: center;">Статус</th>
              </tr>
            </thead>
            <tbody>
              ${task.traceTests.map(t => {
                const ansBranch = this.studentState[`trace_${task.id}_${t.testNum}_branch`] || '';
                const ansCost = this.studentState[`trace_${task.id}_${t.testNum}_cost`] || '';
                const status = this.studentState[`trace_${task.id}_${t.testNum}_status`] || '';
                return `
                  <tr>
                    <td style="text-align: center; font-weight: 600;">${t.testNum}</td>
                    <td><code>${this.escape(t.inputs)}</code></td>
                    <td>
                      <input type="text" class="input-cell trace-branch-input" 
                        data-task="${task.id}" data-test="${t.testNum}" 
                        placeholder="${this.escape(t.branchHint)}" value="${this.escape(ansBranch)}">
                    </td>
                    <td>
                      <input type="number" class="input-cell trace-cost-input" 
                        data-task="${task.id}" data-test="${t.testNum}" 
                        placeholder="cost = ?" value="${this.escape(ansCost)}">
                    </td>
                    <td style="text-align: center;">
                      ${status === 'correct' ? '<span class="status-tag status-ok">Верно</span>' : 
                        status === 'wrong' ? '<span class="status-tag status-err">Ошибка</span>' : 
                        '<span class="status-tag status-empty">-</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          ${task.conceptQuestion ? `
            <div class="concept-question-box">
              <label class="concept-label">
                <strong>Вопрос на понимание алгоритма:</strong> ${this.escape(task.conceptQuestion.text)}
                <textarea class="concept-textarea" data-task="${task.id}" rows="2" 
                  placeholder="Запишите свой развернутый ответ...">${this.escape(this.studentState[`concept_${task.id}`] || '')}</textarea>
              </label>
              <div class="concept-feedback" id="conceptFeedback_${task.id}"></div>
            </div>
          ` : ''}

          <div class="task-action-row">
            <button class="btn btn-primary" data-check-trace="${task.id}">
              <span>Проверить трассировку</span>
            </button>
          </div>
        </div>
      `;
    }

    if (task.traceSteps) {
      // Таблица пошаговых итераций цикла (например Лист 3, Лист 5)
      return `
        <div class="interactive-trace-block">
          <h3 class="interactive-title">Пошаговая таблица состояний памяти:</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 60px;">Шаг</th>
                <th>Переменная i</th>
                <th>Выражение / Условие</th>
                <th>Значение накопителя</th>
                <th style="width: 90px; text-align: center;">Статус</th>
              </tr>
            </thead>
            <tbody>
              ${task.traceSteps.map(step => {
                const ansS = this.studentState[`step_${task.id}_${step.step}_s`] || '';
                const status = this.studentState[`step_${task.id}_${step.step}_status`] || '';
                return `
                  <tr>
                    <td style="text-align: center; font-weight: 600;">${step.step}</td>
                    <td><code>i = ${step.i}</code></td>
                    <td><code>${this.escape(step.cond || step.elem || '')}</code></td>
                    <td>
                      <input type="number" class="input-cell step-val-input" 
                        data-task="${task.id}" data-step="${step.step}" 
                        placeholder="значение" value="${this.escape(ansS)}">
                    </td>
                    <td style="text-align: center;">
                      ${status === 'correct' ? '<span class="status-tag status-ok">Верно</span>' : 
                        status === 'wrong' ? '<span class="status-tag status-err">Ошибка</span>' : 
                        '<span class="status-tag status-empty">-</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="task-action-row">
            <button class="btn btn-primary" data-check-steps="${task.id}">
              <span>Проверить таблицу</span>
            </button>
          </div>
        </div>
      `;
    }

    if (task.bubbleSteps) {
      // Таблица пузырьковой сортировки (Лист 6)
      return `
        <div class="interactive-trace-block">
          <h3 class="interactive-title">Один проход пузырьковой сортировки:</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 70px;">Шаг j</th>
                <th>Сравниваемая пара</th>
                <th>Условие a[j] > a[j+1]</th>
                <th>Обмен?</th>
                <th>Список a после шага</th>
              </tr>
            </thead>
            <tbody>
              ${task.bubbleSteps.map(step => {
                const ansSwap = this.studentState[`bubble_${task.id}_${step.j}_swap`] || '';
                const ansList = this.studentState[`bubble_${task.id}_${step.j}_list`] || '';
                return `
                  <tr>
                    <td style="text-align: center; font-weight: 600;">j = ${step.j}</td>
                    <td><code>${this.escape(step.pair)}</code></td>
                    <td><code>${this.escape(step.cmp)}</code></td>
                    <td>
                      <input type="text" class="input-cell" data-task="${task.id}" data-bj="${step.j}" data-bfield="swap"
                        placeholder="Да / Нет" value="${this.escape(ansSwap)}">
                    </td>
                    <td>
                      <input type="text" class="input-cell" data-task="${task.id}" data-bj="${step.j}" data-bfield="list"
                        placeholder="[...]" value="${this.escape(ansList)}">
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          ${task.conceptQuestion ? `
            <div class="concept-question-box">
              <label class="concept-label">
                <strong>Вопрос:</strong> ${this.escape(task.conceptQuestion.text)}
                <textarea class="concept-textarea" data-task="${task.id}" rows="2" 
                  placeholder="Запишите свой развернутый ответ...">${this.escape(this.studentState[`concept_${task.id}`] || '')}</textarea>
              </label>
            </div>
          ` : ''}

          <div class="task-action-row">
            <button class="btn btn-primary" data-check-bubble="${task.id}">
              <span>Проверить шаг сортировки</span>
            </button>
          </div>
        </div>
      `;
    }

    return '';
  }

  renderDebugBody(task) {
    return `
      <div class="interactive-debug-block">
        <h3 class="interactive-title">Анализ и локализация ошибки:</h3>
        
        <div class="debug-questions-list">
          ${(task.questions || []).map(q => `
            <div class="debug-question-item">
              <label class="debug-label">
                <span class="debug-q-text">${this.escape(q.text)}</span>
                <input type="text" class="input-text debug-answer-input" 
                  data-task="${task.id}" data-qid="${q.id}" 
                  placeholder="Ваш ответ..." value="${this.escape(this.studentState[`debug_${task.id}_${q.id}`] || '')}">
              </label>
            </div>
          `).join('')}
        </div>

        <div class="debug-code-edit-area">
          <label class="debug-label">
            <span class="debug-q-text">Запишите исправленный вариант программы:</span>
            <textarea class="code-editor-box debug-code-editor" data-task="${task.id}" rows="7" 
              spellcheck="false">${this.escape(this.studentState[`debug_${task.id}_code`] || task.fixedCodeTemplate || task.buggyCode)}</textarea>
          </label>
        </div>

        <div class="task-action-row">
          <button class="btn btn-primary" data-check-debug="${task.id}">
            <span>Проверить отладку</span>
          </button>
          <div class="task-feedback" id="debugFeedback_${task.id}"></div>
        </div>
      </div>
    `;
  }

  renderConstraintBody(task) {
    const banned = task.bannedKeywords || [];
    const savedCode = this.studentState[`code_${task.id}`] || task.starterCode || '';

    return `
      <div class="interactive-constraint-block">
        <div class="constraint-warning-banner">
          <span class="constraint-title">Дидактические ограничения синтаксиса:</span>
          <div class="banned-tags-list">
            ${banned.map(word => `<span class="banned-tag">ЗАПРЕЩЕНО: <code>${this.escape(word)}</code></span>`).join('')}
          </div>
        </div>

        <div class="code-editor-wrapper">
          <label class="editor-header">
            <span>Редактор кода решения:</span>
            <span class="constraint-live-indicator" id="constraintLive_${task.id}">Ограничения соблюдены</span>
          </label>
          <textarea class="code-editor-box constraint-code-editor" data-task="${task.id}" rows="9" 
            spellcheck="false" placeholder="Напишите программу на Python...">${this.escape(savedCode)}</textarea>
        </div>

        ${task.conceptQuestion ? `
          <div class="concept-question-box" style="margin-top: 12px;">
            <label class="concept-label">
              <strong>Теоретический вопрос:</strong> ${this.escape(task.conceptQuestion.text)}
              <textarea class="concept-textarea" data-task="${task.id}" rows="2" 
                placeholder="Запишите свой развернутый ответ...">${this.escape(this.studentState[`concept_${task.id}`] || '')}</textarea>
            </label>
          </div>
        ` : ''}

        <div class="task-action-row">
          <button class="btn btn-primary" data-check-constraint="${task.id}">
            <span>Проверить решение на ограничения и тесты</span>
          </button>
          <div class="task-feedback" id="constraintFeedback_${task.id}"></div>
        </div>
      </div>
    `;
  }

  renderAuditBody(task) {
    return `
      <div class="interactive-audit-block">
        <div class="audit-prompt-box">
          <span class="audit-label">Запрос (промпт) ученика к нейросети:</span>
          <p class="audit-prompt-text">«${this.escape(task.aiPrompt || '')}»</p>
        </div>

        <h3 class="interactive-title">Экспертиза кода нейросети на соответствие программе 9 класса:</h3>
        <p class="audit-subtext">Отметьте дефекты и несоответствия, допущенные генеративной моделью:</p>

        <div class="audit-defects-checklist">
          ${(task.aiDefects || []).map((defect, idx) => {
            const isChecked = this.studentState[`audit_${task.id}_${idx}`] === true;
            return `
              <label class="defect-checkbox-row">
                <input type="checkbox" class="audit-check" data-task="${task.id}" data-didx="${idx}" ${isChecked ? 'checked' : ''}>
                <span>${this.escape(defect)}</span>
              </label>
            `;
          }).join('')}
        </div>

        <div class="audit-rewrite-area">
          <label class="debug-label">
            <span class="debug-q-text">Каноническое школьное решение (Задание 2):</span>
            <p class="audit-subtext">Перепишите код нейросети без использования sum(), lambda и list comprehension:</p>
            <textarea class="code-editor-box audit-code-editor" data-task="${task.id}" rows="8" 
              spellcheck="false">${this.escape(this.studentState[`audit_${task.id}_code`] || '')}</textarea>
          </label>
        </div>

        <div class="task-action-row">
          <button class="btn btn-primary" data-check-audit="${task.id}">
            <span>Подтвердить аудит</span>
          </button>
          <div class="task-feedback" id="auditFeedback_${task.id}"></div>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // INTERACTION & EVALUATION
  // ---------------------------------------------------------------------------

  bindEvents() {
    // Student personal info
    const nameInput = this.viewport.querySelector('#studentNameInput');
    const classInput = this.viewport.querySelector('#studentClassInput');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.studentState.studentName = e.target.value;
        this.saveState();
      });
    }
    if (classInput) {
      classInput.addEventListener('input', (e) => {
        this.studentState.studentClass = e.target.value;
        this.saveState();
      });
    }

    // Trace inputs
    this.viewport.querySelectorAll('.trace-branch-input, .trace-cost-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const taskId = e.target.dataset.task;
        const testNum = e.target.dataset.test;
        const type = e.target.classList.contains('trace-branch-input') ? 'branch' : 'cost';
        this.studentState[`trace_${taskId}_${testNum}_${type}`] = e.target.value;
        this.saveState();
      });
    });

    // Step inputs
    this.viewport.querySelectorAll('.step-val-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const taskId = e.target.dataset.task;
        const stepNum = e.target.dataset.step;
        this.studentState[`step_${taskId}_${stepNum}_s`] = e.target.value;
        this.saveState();
      });
    });

    // Concept questions textareas
    this.viewport.querySelectorAll('.concept-textarea').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const taskId = e.target.dataset.task;
        this.studentState[`concept_${taskId}`] = e.target.value;
        this.saveState();
      });
    });

    // Debug inputs
    this.viewport.querySelectorAll('.debug-answer-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const taskId = e.target.dataset.task;
        const qid = e.target.dataset.qid;
        this.studentState[`debug_${taskId}_${qid}`] = e.target.value;
        this.saveState();
      });
    });

    // Debug code editor
    this.viewport.querySelectorAll('.debug-code-editor').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const taskId = e.target.dataset.task;
        this.studentState[`debug_${taskId}_code`] = e.target.value;
        this.saveState();
      });
    });

    // Constraint live validator
    this.viewport.querySelectorAll('.constraint-code-editor').forEach(editor => {
      const taskId = editor.dataset.task;
      const task = this.worksheet.tasks.find(t => t.id === taskId);
      const indicator = this.viewport.querySelector(`#constraintLive_${taskId}`);

      const validateBanned = () => {
        const code = editor.value;
        this.studentState[`code_${taskId}`] = code;
        this.saveState();

        if (!task || !task.bannedKeywords || !indicator) return;
        const found = task.bannedKeywords.filter(w => code.includes(w));
        if (found.length > 0) {
          indicator.className = 'constraint-live-indicator violated';
          indicator.textContent = `Обнаружен запрет: ${found.join(', ')}`;
        } else {
          indicator.className = 'constraint-live-indicator ok';
          indicator.textContent = 'Ограничения соблюдены';
        }
      };

      editor.addEventListener('input', validateBanned);
      validateBanned();
    });

    // Check trace button
    this.viewport.querySelectorAll('[data-check-trace]').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.checkTrace;
        this.evaluateTraceTask(taskId);
      });
    });

    // Check steps button
    this.viewport.querySelectorAll('[data-check-steps]').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.checkSteps;
        this.evaluateStepsTask(taskId);
      });
    });

    // Check debug button
    this.viewport.querySelectorAll('[data-check-debug]').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.checkDebug;
        this.evaluateDebugTask(taskId);
      });
    });

    // Check constraint button
    this.viewport.querySelectorAll('[data-check-constraint]').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.checkConstraint;
        this.evaluateConstraintTask(taskId);
      });
    });

    // Audit checkboxes & button
    this.viewport.querySelectorAll('.audit-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const taskId = e.target.dataset.task;
        const didx = e.target.dataset.didx;
        this.studentState[`audit_${taskId}_${didx}`] = e.target.checked;
        this.saveState();
      });
    });

    this.viewport.querySelectorAll('.audit-code-editor').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const taskId = e.target.dataset.task;
        this.studentState[`audit_${taskId}_code`] = e.target.value;
        this.saveState();
      });
    });

    this.viewport.querySelectorAll('[data-check-audit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.checkAudit;
        this.evaluateAuditTask(taskId);
      });
    });

    // Bridge button to visualizer
    this.viewport.querySelectorAll('[data-bridge-task]').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.bridgeTask;
        const task = this.worksheet.tasks.find(t => t.id === taskId);
        if (!task) return;

        let codeToVisualize = task.code || task.starterCode || task.buggyCode || '';
        let inputs = task.defaultInputs || [];

        // If it's a debug task and student wrote code, use student code
        if (task.type === 'debug' && this.studentState[`debug_${taskId}_code`]) {
          codeToVisualize = this.studentState[`debug_${taskId}_code`];
        } else if (task.type === 'constraint' && this.studentState[`code_${taskId}`]) {
          codeToVisualize = this.studentState[`code_${taskId}`];
        }

        if (this.onOpenVisualizer) {
          this.onOpenVisualizer(codeToVisualize, inputs, task);
        }
      });
    });

    // Rubric manual checkboxes
    this.viewport.querySelectorAll('.rubric-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = e.target.dataset.rubricIdx;
        this.studentState[`rubric_${idx}`] = e.target.checked;
        this.saveState();
        this.updateTotalScoreDisplay();
      });
    });

    // Reflection traffic light
    this.viewport.querySelectorAll('input[name="traffic"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.studentState.trafficLight = e.target.value;
        this.saveState();
        this.viewport.querySelectorAll('.traffic-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('.traffic-btn').classList.add('active');
      });
    });

    // Reflection textareas
    ['refEasy', 'refHard', 'refHelp'].forEach(id => {
      const el = this.viewport.querySelector(`#${id}`);
      if (el) {
        el.addEventListener('input', (e) => {
          this.studentState[id] = e.target.value;
          this.saveState();
        });
      }
    });

    // Print button
    const printBtn = this.viewport.querySelector('#btnPrintSheet');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Reset button
    const resetBtn = this.viewport.querySelector('#btnResetSheet');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Очистить все введенные ответы текущего листа?')) {
          this.studentState = {};
          this.saveState();
          this.render();
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // EVALUATION ENGINES
  // ---------------------------------------------------------------------------

  evaluateTraceTask(taskId) {
    const task = this.worksheet.tasks.find(t => t.id === taskId);
    if (!task || !task.traceTests) return;

    let correctCount = 0;
    task.traceTests.forEach(t => {
      const ansCost = parseInt(this.studentState[`trace_${taskId}_${t.testNum}_cost`], 10);
      const isOk = (ansCost === t.expectedCost);
      this.studentState[`trace_${taskId}_${t.testNum}_status`] = isOk ? 'correct' : 'wrong';
      if (isOk) correctCount++;
    });

    // Auto-update rubric descriptors
    if (this.worksheet.id === 1) {
      // descriptors 0 and 1
      const test1Ok = this.studentState[`trace_${taskId}_1_status`] === 'correct';
      const test2Ok = this.studentState[`trace_${taskId}_2_status`] === 'correct';
      const test3Ok = this.studentState[`trace_${taskId}_3_status`] === 'correct';
      const test4Ok = this.studentState[`trace_${taskId}_4_status`] === 'correct';

      this.studentState['rubric_0'] = (test1Ok && test2Ok);
      this.studentState['rubric_1'] = (test3Ok && test4Ok);

      // Check concept question
      const conceptAns = (this.studentState[`concept_${taskId}`] || '').toLowerCase();
      if (task.conceptQuestion && task.conceptQuestion.keywords) {
        const matches = task.conceptQuestion.keywords.some(k => conceptAns.includes(k));
        this.studentState['rubric_2'] = matches;
        this.studentState['rubric_3'] = (test2Ok && test3Ok);
      }
    }

    this.saveState();
    this.render();
  }

  evaluateStepsTask(taskId) {
    const task = this.worksheet.tasks.find(t => t.id === taskId);
    if (!task || !task.traceSteps) return;

    let allOk = true;
    task.traceSteps.forEach(step => {
      const entered = parseInt(this.studentState[`step_${taskId}_${step.step}_s`], 10);
      const isOk = (entered === step.s);
      this.studentState[`step_${taskId}_${step.step}_status`] = isOk ? 'correct' : 'wrong';
      if (!isOk) allOk = false;
    });

    if (this.worksheet.id === 3) {
      this.studentState['rubric_0'] = true;
      this.studentState['rubric_1'] = true;
      this.studentState['rubric_2'] = allOk;
    } else if (this.worksheet.id === 5) {
      this.studentState['rubric_0'] = true;
      this.studentState['rubric_1'] = allOk;
    }

    this.saveState();
    this.render();
  }

  evaluateDebugTask(taskId) {
    const task = this.worksheet.tasks.find(t => t.id === taskId);
    if (!task) return;

    const feedback = this.viewport.querySelector(`#debugFeedback_${taskId}`);
    const code = this.studentState[`debug_${taskId}_code`] || '';

    // Verify answers to questions
    if (this.worksheet.id === 1) {
      const q1 = (this.studentState[`debug_${taskId}_q1`] || '').trim();
      const q2 = (this.studentState[`debug_${taskId}_q2`] || '').toLowerCase();

      const q1Ok = q1.includes('1') && q1.includes('2');
      const q2Ok = q2.includes('str') || q2.includes('строк') || q2.includes('тип') || q2.includes('typeerror');
      const codeOk = code.includes('int(input())');

      this.studentState['rubric_4'] = q1Ok;
      this.studentState['rubric_5'] = q2Ok;
      this.studentState['rubric_6'] = codeOk;

      if (feedback) {
        feedback.innerHTML = codeOk ? 
          '<span class="feedback-msg ok">Код успешно преобразован с помощью int(). Ошибка типов устранена!</span>' :
          '<span class="feedback-msg err">Обратите внимание на вызов int(input()).</span>';
      }
    } else if (this.worksheet.id === 4) {
      const q1 = (this.studentState[`debug_${taskId}_q1`] || '').trim();
      const q1Ok = q1.includes('2');
      const codeOk = code.includes('i = i + 1') && code.indexOf('i = i + 1') < code.indexOf('continue');

      this.studentState['rubric_0'] = q1Ok;
      this.studentState['rubric_1'] = true;
      this.studentState['rubric_2'] = codeOk;

      if (feedback) {
        feedback.innerHTML = codeOk ?
          '<span class="feedback-msg ok">Инкремент шага вынесен до continue. Зацикливание устранено!</span>' :
          '<span class="feedback-msg err">Убедитесь, что переменная i увеличивается до срабатывания continue.</span>';
      }
    } else if (this.worksheet.id === 5) {
      this.studentState['rubric_2'] = true;
      this.studentState['rubric_3'] = true;
      this.studentState['rubric_4'] = true;
    }

    this.saveState();
    this.updateTotalScoreDisplay();
  }

  evaluateConstraintTask(taskId) {
    const task = this.worksheet.tasks.find(t => t.id === taskId);
    if (!task) return;

    const feedback = this.viewport.querySelector(`#constraintFeedback_${taskId}`);
    const code = this.studentState[`code_${taskId}`] || '';
    const banned = task.bannedKeywords || [];

    const foundBanned = banned.filter(w => code.includes(w));
    if (foundBanned.length > 0) {
      if (feedback) {
        feedback.innerHTML = `<span class="feedback-msg err">Решение отклонено! Обнаружены запрещенные конструкции: <strong>${foundBanned.join(', ')}</strong></span>`;
      }
      return;
    }

    if (code.trim().length < 15) {
      if (feedback) {
        feedback.innerHTML = '<span class="feedback-msg err">Напишите программный код решения.</span>';
      }
      return;
    }

    // Award rubric points for constraint satisfaction
    if (this.worksheet.id === 2) {
      this.studentState['rubric_0'] = true;
      this.studentState['rubric_1'] = true;
      this.studentState['rubric_2'] = true;
    } else if (this.worksheet.id === 3) {
      this.studentState['rubric_6'] = true;
    } else if (this.worksheet.id === 4) {
      this.studentState['rubric_3'] = true;
      this.studentState['rubric_4'] = true;
    } else if (this.worksheet.id === 5) {
      this.studentState['rubric_5'] = true;
      this.studentState['rubric_6'] = true;
    } else if (this.worksheet.id === 6) {
      this.studentState['rubric_0'] = true;
      this.studentState['rubric_1'] = true;
      this.studentState['rubric_2'] = true;
      this.studentState['rubric_3'] = true;
    } else if (this.worksheet.id === 7) {
      this.studentState['rubric_3'] = true;
      this.studentState['rubric_4'] = true;
    }

    if (feedback) {
      feedback.innerHTML = '<span class="feedback-msg ok">Синтаксические ограничения полностью соблюдены! Алгоритмическая структура верна.</span>';
    }

    this.saveState();
    this.updateTotalScoreDisplay();
  }

  evaluateAuditTask(taskId) {
    const feedback = this.viewport.querySelector(`#auditFeedback_${taskId}`);
    const check0 = this.studentState[`audit_${taskId}_0`] === true;
    const check1 = this.studentState[`audit_${taskId}_1`] === true;
    const check2 = this.studentState[`audit_${taskId}_2`] === true;

    if (this.worksheet.id === 7) {
      this.studentState['rubric_0'] = true;
      this.studentState['rubric_1'] = (check0 || check1);
      this.studentState['rubric_2'] = check0;
      this.studentState['rubric_5'] = true;
    }

    if (feedback) {
      feedback.innerHTML = '<span class="feedback-msg ok">Аудит зафиксирован! Все дефекты кода нейросети выявлены.</span>';
    }

    this.saveState();
    this.updateTotalScoreDisplay();
  }

  isDescriptorAchieved(idx) {
    return this.studentState[`rubric_${idx}`] === true;
  }

  calculateTotalScore() {
    if (!this.worksheet || !this.worksheet.rubric) return 0;
    let total = 0;
    this.worksheet.rubric.forEach((r, idx) => {
      if (this.isDescriptorAchieved(idx)) {
        total += r.points;
      }
    });
    return total;
  }

  updateTotalScoreDisplay() {
    const numEl = this.viewport.querySelector('#totalScoreNum');
    if (numEl) {
      numEl.textContent = this.calculateTotalScore();
    }
  }

  escape(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
