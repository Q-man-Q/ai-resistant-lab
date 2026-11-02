// Сервис авторизации учителя (защита журнала от учащихся)
// Хранит PIN-код в localStorage и статус активной сессии учителя в sessionStorage

const PIN_STORAGE_KEY = 'ai_resistant_teacher_pin';
const AUTH_SESSION_KEY = 'ai_resistant_teacher_auth';
const DEFAULT_PIN = '2026';

export class TeacherAuthService {
  constructor() {
    this.listeners = [];
  }

  // Проверка: находится ли текущая вкладка в режиме учителя
  isTeacher() {
    try {
      return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  // Получить установленный PIN-код (по умолчанию 2026)
  getStoredPin() {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
    } catch (e) {
      return DEFAULT_PIN;
    }
  }

  // Проверить корректность PIN-кода
  verifyPin(inputPin) {
    if (!inputPin) return false;
    return String(inputPin).trim() === this.getStoredPin();
  }

  // Вход по PIN-коду
  loginWithPin(pin) {
    if (this.verifyPin(pin)) {
      try {
        sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      } catch (e) {
        console.error('Failed to set session auth:', e);
      }
      this.notifyListeners(true);
      return { success: true };
    }
    return { success: false, error: 'Неверный PIN-код учителя' };
  }

  // Вход через внешнюю авторизацию (например Google Auth)
  loginExternal(user) {
    if (user) {
      try {
        sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      } catch (e) {}
      this.notifyListeners(true);
      return true;
    }
    return false;
  }

  // Выход из режима учителя (блокировка кабинета)
  logout() {
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {}
    this.notifyListeners(false);
  }

  // Смена PIN-кода учителем
  changePin(currentPin, newPin, confirmPin) {
    if (!this.verifyPin(currentPin)) {
      return { success: false, error: 'Текущий PIN-код введен неверно' };
    }
    const cleanNew = String(newPin || '').trim();
    if (cleanNew.length < 4) {
      return { success: false, error: 'Новый PIN-код должен содержать минимум 4 символа' };
    }
    if (cleanNew !== String(confirmPin || '').trim()) {
      return { success: false, error: 'Новый PIN-код и его подтверждение не совпадают' };
    }

    try {
      localStorage.setItem(PIN_STORAGE_KEY, cleanNew);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Не удалось сохранить новый PIN в браузере' };
    }
  }

  // Подписка на изменение статуса авторизации
  onChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(isAuth) {
    this.listeners.forEach(cb => {
      try { cb(isAuth); } catch (e) { console.error(e); }
    });
  }
}
