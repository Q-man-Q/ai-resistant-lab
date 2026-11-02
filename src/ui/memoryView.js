// Визуализация переменных в оперативной памяти и вывода консоли

export class MemoryView {
  constructor(memoryEl, stackEl, consoleEl) {
    this.memoryEl = memoryEl;
    this.stackEl = stackEl;
    this.consoleEl = consoleEl;
  }

  render({ memory = {}, callStack = [], changedVar = null, readVar = null, stdout = '' }) {
    this.renderVariables(memory, changedVar, readVar);
    this.renderStack(callStack);
    this.renderConsole(stdout);
  }

  renderVariables(memory, changedVar, readVar) {
    if (!this.memoryEl) return;

    const varNames = Object.keys(memory);
    if (varNames.length === 0) {
      this.memoryEl.innerHTML = `
        <div class="empty-memory-state">
          <p class="empty-title">Память программы пуста</p>
          <p class="empty-desc">Переменные появятся здесь при первом присваивании значений в ходе выполнения алгоритма.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="variables-grid">';
    for (const name of varNames) {
      const varInfo = memory[name];
      const isChanged = name === changedVar;
      const isRead = name === readVar;

      let cardClasses = 'variable-box';
      if (isChanged) cardClasses += ' is-changed';
      if (isRead) cardClasses += ' is-read';

      const typeBadgeClass = `badge-${varInfo.type}`;

      html += `
        <div class="${cardClasses}" data-var="${name}">
          <div class="var-header">
            <span class="var-name">${this.escapeHtml(name)}</span>
            <span class="var-type ${typeBadgeClass}">${this.escapeHtml(varInfo.type)}</span>
          </div>
          <div class="var-content">
            ${this.renderValueFormatted(varInfo)}
          </div>
          ${isChanged ? '<span class="status-indicator update">Обновлено</span>' : ''}
          ${isRead ? '<span class="status-indicator read">Чтение</span>' : ''}
        </div>
      `;
    }
    html += '</div>';

    this.memoryEl.innerHTML = html;
  }

  renderValueFormatted(varInfo) {
    if (varInfo.type === 'list' && Array.isArray(varInfo.rawValue)) {
      if (varInfo.rawValue.length === 0) {
        return '<div class="list-empty">[ ] пустой список</div>';
      }
      return `
        <div class="list-container">
          ${varInfo.rawValue.map((item, idx) => `
            <div class="list-item">
              <span class="item-index">${idx}</span>
              <span class="item-value">${this.escapeHtml(this.formatSimple(item))}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `<div class="var-value type-${varInfo.type}">${this.escapeHtml(varInfo.value)}</div>`;
  }

  formatSimple(val) {
    if (typeof val === 'string') return `"${val}"`;
    if (val === null) return 'None';
    if (val === true) return 'True';
    if (val === false) return 'False';
    return String(val);
  }

  renderStack(callStack) {
    if (!this.stackEl) return;

    if (!callStack || callStack.length === 0) {
      this.stackEl.innerHTML = `
        <div class="stack-frame">
          <span class="frame-scope">Глобальная область</span>
          <span class="frame-title">&lt;module&gt; Основная программа</span>
        </div>
      `;
      return;
    }

    let html = '';
    for (let i = callStack.length - 1; i >= 0; i--) {
      const frame = callStack[i];
      html += `
        <div class="stack-frame active">
          <span class="frame-scope">Функция</span>
          <span class="frame-title">${this.escapeHtml(frame.name)}()</span>
        </div>
      `;
    }
    html += `
      <div class="stack-frame">
        <span class="frame-scope">Глобальная область</span>
        <span class="frame-title">&lt;module&gt; Основная программа</span>
      </div>
    `;

    this.stackEl.innerHTML = html;
  }

  renderConsole(stdout) {
    if (!this.consoleEl) return;
    if (!stdout) {
      this.consoleEl.innerHTML = '<span class="console-empty">Вывод консоли пуст</span>';
    } else {
      this.consoleEl.textContent = stdout;
      this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
    }
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
