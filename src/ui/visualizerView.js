// Интерактивный пошаговый визуализатор исполнения кода

import { generateTrace } from '../engine/tracer.js';
import { MemoryView } from './memoryView.js';

export class VisualizerView {
  constructor(container, options = {}) {
    this.container = container;
    this.code = options.code || '';
    this.inputs = options.inputs || [];
    this.onStepChange = options.onStepChange || null;

    this.traceResult = null;
    this.currentStepIdx = 0;
    this.isPlaying = false;
    this.playbackTimer = null;
    this.speed = 1.0;

    this.initDOM();
    this.memoryView = new MemoryView(this.dom.memoryEl, this.dom.stackEl, this.dom.consoleEl);
    this.bindEvents();

    if (this.code) {
      this.loadCode(this.code, this.inputs);
    }
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="visualizer-workbench">
        <!-- Верхняя панель управления плеером -->
        <div class="player-toolbar">
          <div class="player-controls">
            <button class="btn-tool" id="btnStepBack" title="Шаг назад (стрелка влево)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12 2L4 8l8 6V2z"/>
              </svg>
              <span>Назад</span>
            </button>
            
            <button class="btn-tool btn-primary-tool" id="btnPlayPause" title="Автовоспроизведение / Пауза (Пробел)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" id="playIcon">
                <path d="M4 2l10 6-10 6V2z"/>
              </svg>
              <span id="playLabel">Старт</span>
            </button>

            <button class="btn-tool" id="btnStepForward" title="Шаг вперед (стрелка вправо)">
              <span>Вперед</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2l8 6-8 6V2z"/>
              </svg>
            </button>

            <button class="btn-tool btn-ghost" id="btnReset" title="Сбросить на начало">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 104.546 2.914.5.5 0 01.908-.417A6 6 0 118 2v1z"/>
                <path d="M8 .5v3l2.5-1.5L8 .5z"/>
              </svg>
              <span>Сброс</span>
            </button>
          </div>

          <div class="player-slider-block">
            <input type="range" class="timeline-range" id="timelineSlider" min="0" max="0" value="0">
            <span class="step-indicator" id="stepCounter">Шаг 0 / 0</span>
          </div>

          <div class="player-speed-block">
            <label for="speedSelect" class="speed-label">Скорость:</label>
            <select id="speedSelect" class="speed-select">
              <option value="0.5">0.5x</option>
              <option value="1.0" selected>1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
            </select>
          </div>
        </div>

        <!-- Центральная часть: Код и Память -->
        <div class="visualizer-panels">
          <!-- Левая колонка: Просмотрщик кода с подсветкой -->
          <div class="panel-card code-panel">
            <div class="panel-header">
              <span class="panel-title">Текст программы</span>
              <span class="panel-subtitle" id="codeLanguageTag">Python 3</span>
            </div>
            <!-- Панель входных данных -->
            <div class="visualizer-inputs-bar">
              <span class="inputs-bar-label">Входные данные (input):</span>
              <input type="text" class="inputs-bar-field" id="visualizerInputsField" placeholder="напр. 2026, 2008">
              <button class="btn btn-sm btn-secondary" id="btnApplyInputs">Применить</button>
            </div>
            <div class="code-viewer-wrapper">
              <div class="code-lines-container" id="codeViewer"></div>
            </div>
            <!-- Пояснение к текущему шагу -->
            <div class="step-explanation-box" id="explanationBox">
              <span class="explanation-tag">Действие алгоритма:</span>
              <p class="explanation-text" id="explanationText">Нажмите «Вперед» или «Старт» для пошаговой трассировки.</p>
            </div>
          </div>

          <!-- Правая колонка: Память и Консоль -->
          <div class="panel-card state-panel">
            <div class="panel-header">
              <span class="panel-title">Состояние оперативной памяти (RAM)</span>
              <span class="panel-badge">Переменные</span>
            </div>
            <div class="memory-shelves-container" id="memoryShelves"></div>

            <div class="panel-divider"></div>

            <div class="panel-header console-header">
              <span class="panel-title">Консоль вывода (print)</span>
            </div>
            <div class="console-box" id="consoleBox"></div>
            
            <div id="callStackBox" style="display: none;"></div>
          </div>
        </div>
      </div>
    `;

    this.dom = {
      btnStepBack: this.container.querySelector('#btnStepBack'),
      btnStepForward: this.container.querySelector('#btnStepForward'),
      btnPlayPause: this.container.querySelector('#btnPlayPause'),
      playIcon: this.container.querySelector('#playIcon'),
      playLabel: this.container.querySelector('#playLabel'),
      btnReset: this.container.querySelector('#btnReset'),
      timelineSlider: this.container.querySelector('#timelineSlider'),
      stepCounter: this.container.querySelector('#stepCounter'),
      speedSelect: this.container.querySelector('#speedSelect'),
      codeViewer: this.container.querySelector('#codeViewer'),
      explanationText: this.container.querySelector('#explanationText'),
      memoryEl: this.container.querySelector('#memoryShelves'),
      consoleEl: this.container.querySelector('#consoleBox'),
      stackEl: this.container.querySelector('#callStackBox'),
      inputsField: this.container.querySelector('#visualizerInputsField'),
      btnApplyInputs: this.container.querySelector('#btnApplyInputs')
    };
  }

  bindEvents() {
    this.dom.btnStepForward.addEventListener('click', () => {
      this.pause();
      this.stepForward();
    });

    this.dom.btnStepBack.addEventListener('click', () => {
      this.pause();
      this.stepBack();
    });

    this.dom.btnPlayPause.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    });

    this.dom.btnReset.addEventListener('click', () => {
      this.pause();
      this.goToStep(0);
    });

    this.dom.timelineSlider.addEventListener('input', (e) => {
      this.pause();
      this.goToStep(parseInt(e.target.value, 10));
    });

    if (this.dom.btnApplyInputs) {
      this.dom.btnApplyInputs.addEventListener('click', () => {
        const raw = this.dom.inputsField ? this.dom.inputsField.value : '';
        const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
        this.loadCode(this.code, parsed);
        this.goToStep(0);
      });
    }

    this.dom.speedSelect.addEventListener('change', (e) => {
      this.speed = parseFloat(e.target.value);
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    });

    // Управление с клавиатуры (стрелки, пробел)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'ArrowRight') {
        this.pause();
        this.stepForward();
      } else if (e.code === 'ArrowLeft') {
        this.pause();
        this.stepBack();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (this.isPlaying) this.pause();
        else this.play();
      }
    });
  }

  loadCode(code, inputs = []) {
    this.pause();
    this.code = code;
    this.inputs = inputs;

    if (this.dom && this.dom.inputsField) {
      this.dom.inputsField.value = Array.isArray(inputs) ? inputs.join(', ') : '';
    }

    try {
      this.traceResult = generateTrace(code, { inputs });
      this.renderCodeLines();
      this.dom.timelineSlider.max = Math.max(0, this.traceResult.steps.length - 1);
      this.goToStep(0);
    } catch (err) {
      console.error('Trace compilation error:', err);
      this.dom.explanationText.textContent = `Ошибка синтаксиса: ${err.message}`;
    }
  }

  renderCodeLines() {
    const lines = this.code.split('\n');
    let html = '';
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const text = lines[i];
      html += `
        <div class="code-line" id="codeLine-${lineNum}" data-line="${lineNum}">
          <span class="line-number">${lineNum}</span>
          <span class="line-content">${this.escapeHtml(text) || '&nbsp;'}</span>
        </div>
      `;
    }
    this.dom.codeViewer.innerHTML = html;
  }

  goToStep(idx) {
    if (!this.traceResult || !this.traceResult.steps.length) return;

    this.currentStepIdx = Math.max(0, Math.min(idx, this.traceResult.steps.length - 1));
    const step = this.traceResult.steps[this.currentStepIdx];
    const total = this.traceResult.steps.length;

    this.dom.timelineSlider.value = this.currentStepIdx;
    this.dom.stepCounter.textContent = `Шаг ${this.currentStepIdx + 1} / ${total}`;

    // Подсветка активной строки
    this.container.querySelectorAll('.code-line').forEach(el => el.classList.remove('active-line'));
    if (step.line) {
      const activeEl = this.container.querySelector(`#codeLine-${step.line}`);
      if (activeEl) {
        activeEl.classList.add('active-line');
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    this.memoryView.render({
      memory: step.memory || {},
      callStack: step.callStack || [],
      changedVar: step.changedVar || null,
      readVar: step.readVar || null,
      stdout: step.stdout || ''
    });

    this.dom.explanationText.textContent = this.generateExplanation(step);

    if (this.onStepChange) {
      this.onStepChange(this.currentStepIdx, step);
    }
  }

  stepForward() {
    if (!this.traceResult) return;
    if (this.currentStepIdx < this.traceResult.steps.length - 1) {
      this.goToStep(this.currentStepIdx + 1);
    } else {
      this.pause();
    }
  }

  stepBack() {
    if (!this.traceResult) return;
    if (this.currentStepIdx > 0) {
      this.goToStep(this.currentStepIdx - 1);
    }
  }

  play() {
    if (!this.traceResult) return;
    if (this.currentStepIdx >= this.traceResult.steps.length - 1) {
      this.goToStep(0);
    }
    this.isPlaying = true;
    this.dom.playLabel.textContent = 'Пауза';
    this.dom.playIcon.innerHTML = '<path d="M3 2h3v12H3zm7 0h3v12h-3z"/>';

    const interval = Math.max(200, 1000 / this.speed);
    this.playbackTimer = setInterval(() => {
      if (this.currentStepIdx < this.traceResult.steps.length - 1) {
        this.stepForward();
      } else {
        this.pause();
      }
    }, interval);
  }

  pause() {
    this.isPlaying = false;
    clearInterval(this.playbackTimer);
    this.playbackTimer = null;
    this.dom.playLabel.textContent = 'Старт';
    this.dom.playIcon.innerHTML = '<path d="M4 2l10 6-10 6V2z"/>';
  }

  generateExplanation(step) {
    if (!step) return '';
    const line = step.line ? `Строка ${step.line}: ` : '';

    if (step.type === 'START') {
      return 'Начало выполнения программы. Оперативная память готова к записи переменных.';
    }
    if (step.type === 'ASSIGN') {
      return `${line}Переменной "${step.changedVar}" присвоено значение ${step.value}.`;
    }
    if (step.type === 'INPUT') {
      return `${line}Ввод данных пользователя: получено значение ${step.value} для переменной "${step.changedVar}".`;
    }
    if (step.type === 'IF_TRUE') {
      return `${line}Условие оказалось ИСТИННЫМ (True). Программа переходит к выполнению внутреннего блока ветвления.`;
    }
    if (step.type === 'IF_FALSE') {
      return `${line}Условие оказалось ЛОЖНЫМ (False). Программа переходит к следующей ветке elif или else.`;
    }
    if (step.type === 'FOR_START' || step.type === 'FOR_STEP') {
      return `${line}Итерация цикла for. Переменная-счетчик получила значение ${step.value}.`;
    }
    if (step.type === 'WHILE_CHECK') {
      return `${line}Проверка условия продолжения цикла while.`;
    }
    if (step.type === 'PRINT') {
      return `${line}Команда print вывела в терминал результат: ${step.printed || ''}.`;
    }
    if (step.type === 'END') {
      return 'Алгоритм успешно завершил работу. Итоговое состояние памяти зафиксировано.';
    }
    return step.description || `${line}Выполнение инструкции.`;
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
