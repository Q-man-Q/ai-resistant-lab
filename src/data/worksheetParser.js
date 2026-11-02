// Валидатор и парсер структуры рабочих листов

export class WorksheetParser {
  // Разбор строки JSON (одиночный лист или массив листов)
  static parseJSON(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, errors: ['Пустая строка или некорректный формат данных.'] };
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      return {
        success: false,
        errors: [`Синтаксическая ошибка JSON: ${err.message}`]
      };
    }

    const items = Array.isArray(parsed) ? parsed : [parsed];
    const validatedWorksheets = [];
    const allErrors = [];
    const allWarnings = [];

    items.forEach((item, index) => {
      const res = this.validateWorksheet(item, index + 1);
      if (res.valid) {
        validatedWorksheets.push(res.worksheet);
        if (res.warnings && res.warnings.length > 0) {
          allWarnings.push(...res.warnings);
        }
      } else {
        allErrors.push(...res.errors);
      }
    });

    if (allErrors.length > 0) {
      return { success: false, errors: allErrors, warnings: allWarnings };
    }

    return {
      success: true,
      worksheets: validatedWorksheets,
      warnings: allWarnings
    };
  }

  // Проверка полей и нормализация одного листа
  static validateWorksheet(raw, itemIndex = 1) {
    const errors = [];
    const warnings = [];
    const prefix = `Лист #${itemIndex}: `;

    if (!raw || typeof raw !== 'object') {
      return { valid: false, errors: [`${prefix}Элемент не является объектом.`] };
    }

    // Проверка обязательных полей
    if (raw.id === undefined || raw.id === null || String(raw.id).trim() === '') {
      errors.push(`${prefix}Отсутствует обязательное поле 'id'.`);
    }

    const grade = parseInt(raw.grade, 10);
    if (isNaN(grade) || grade < 1 || grade > 12) {
      errors.push(`${prefix}Поле 'grade' должно быть числом класса (от 1 до 12).`);
    }

    const sheetNumber = parseInt(raw.sheetNumber, 10);
    if (isNaN(sheetNumber) || sheetNumber < 1) {
      errors.push(`${prefix}Поле 'sheetNumber' должно быть положительным числом.`);
    }

    if (!raw.title || typeof raw.title !== 'string') {
      errors.push(`${prefix}Отсутствует обязательное текстовое поле 'title'.`);
    }

    if (!raw.topic || typeof raw.topic !== 'string') {
      errors.push(`${prefix}Отсутствует обязательное текстовое поле 'topic'.`);
    }

    // Проверка заданий
    if (!Array.isArray(raw.tasks) || raw.tasks.length === 0) {
      errors.push(`${prefix}Поле 'tasks' должно быть непустым массивом заданий.`);
    }

    const validatedTasks = [];
    if (Array.isArray(raw.tasks)) {
      raw.tasks.forEach((task, tIdx) => {
        const taskPrefix = `${prefix}Задание ${tIdx + 1}: `;
        if (!task || typeof task !== 'object') {
          errors.push(`${taskPrefix}Элемент задания не является объектом.`);
          return;
        }

        const validTypes = ['trace', 'debug', 'constraint', 'audit'];
        if (!validTypes.includes(task.type)) {
          errors.push(`${taskPrefix}Недопустимый тип задания '${task.type}'. Разрешены: ${validTypes.join(', ')}.`);
        }

        if (!task.title) {
          errors.push(`${taskPrefix}Отсутствует поле 'title'.`);
        }

        if (!task.description) {
          warnings.push(`${taskPrefix}Рекомендуется добавить описание условия в 'description'.`);
        }

        validatedTasks.push({
          id: task.id || `task-${itemIndex}-${tIdx + 1}`,
          taskNumber: task.taskNumber || (tIdx + 1),
          type: task.type,
          title: task.title || `Задание ${tIdx + 1}`,
          model: task.model || this.getDefaultModelName(task.type),
          description: task.description || '',
          code: task.code || '',
          buggyCode: task.buggyCode || '',
          fixedCodeTemplate: task.fixedCodeTemplate || '',
          aiPrompt: task.aiPrompt || '',
          aiOutputCode: task.aiOutputCode || '',
          aiDefects: Array.isArray(task.aiDefects) ? task.aiDefects : [],
          defaultInputs: Array.isArray(task.defaultInputs) ? task.defaultInputs : (Array.isArray(task.testInputs) ? task.testInputs : []),
          traceTests: Array.isArray(task.traceTests) ? task.traceTests : null,
          traceSteps: Array.isArray(task.traceSteps) ? task.traceSteps : null,
          bubbleSteps: Array.isArray(task.bubbleSteps) ? task.bubbleSteps : null,
          bannedKeywords: Array.isArray(task.bannedKeywords) ? task.bannedKeywords : [],
          questions: Array.isArray(task.questions) ? task.questions : [],
          conceptQuestion: task.conceptQuestion || null,
          starterCode: task.starterCode || '',
          points: typeof task.points === 'number' ? task.points : 0
        });
      });
    }

    // Проверка рубрики формативного оценивания
    const validatedRubric = [];
    if (!Array.isArray(raw.rubric) || raw.rubric.length === 0) {
      warnings.push(`${prefix}Отсутствует рубрика формативного оценивания 'rubric'. Будет создана базовая шкала.`);
      validatedRubric.push(
        { criterion: 'Выполнение заданий листа', descriptor: 'Верно выполняет практические задачи', points: 5 },
        { criterion: 'Алгоритмическая логика', descriptor: 'Демонстрирует понимание логики исполнения кода', points: 5 }
      );
    } else {
      let totalRubricPoints = 0;
      raw.rubric.forEach((r, rIdx) => {
        const pts = typeof r.points === 'number' ? r.points : 1;
        totalRubricPoints += pts;
        validatedRubric.push({
          criterion: r.criterion || 'Критерий ТУП',
          descriptor: r.descriptor || `Дескриптор действия ${rIdx + 1}`,
          points: pts
        });
      });

      if (totalRubricPoints !== 10) {
        warnings.push(`${prefix}Сумма баллов рубрики составляет ${totalRubricPoints} (рекомендуется ровно 10 баллов по стандарту ФО РК).`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    const normalizedWorksheet = {
      id: raw.id,
      grade,
      sheetNumber,
      title: raw.title.trim(),
      topic: raw.topic.trim(),
      learningObjectives: raw.learningObjectives ? String(raw.learningObjectives).trim() : '',
      tasks: validatedTasks,
      rubric: validatedRubric
    };

    return {
      valid: true,
      worksheet: normalizedWorksheet,
      warnings
    };
  }

  static getDefaultModelName(type) {
    switch (type) {
      case 'trace': return 'Ручная пошаговая трассировка';
      case 'debug': return 'Направленная отладка (дебаггинг)';
      case 'constraint': return 'Задачи с жесткими дидактическими ограничениями';
      case 'audit': return 'Критический аудит и верификация кода нейросети';
      default: return 'Алгоритмический практикум';
    }
  }
}
