// Сервис авторизации учителя (защита журнала от учащихся)
// Хранит PIN-код в localStorage и синхронизирует его с Google Firebase Firestore (settings/access)

const PIN_STORAGE_KEY = 'ai_resistant_teacher_pin';
const AUTH_SESSION_KEY = 'ai_resistant_teacher_auth';
const DEFAULT_PIN = '2026';

export class TeacherAuthService {
  constructor(options = {}) {
    this.submissionService = options.submissionService || null;
    this.listeners = [];
    this.cachedCloudPin = null;

    if (this.submissionService && typeof window !== 'undefined') {
      this.fetchCloudPin();
    }
  }

  // Проверка: находится ли текущая вкладка в режиме учителя
  isTeacher() {
    try {
      return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  // Получить установленный локальный PIN-код (по умолчанию 2026)
  getStoredPin() {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
    } catch (e) {
      return DEFAULT_PIN;
    }
  }

  // Запросить актуальный PIN-код из Firebase Firestore
  async fetchCloudPin() {
    if (!this.submissionService) return null;
    try {
      if (!this.submissionService.firestore) {
        await this.submissionService.initFirebase();
      }
      if (this.submissionService.firestore) {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const snap = await getDoc(doc(this.submissionService.firestore, 'settings', 'access'));
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.teacherPin) {
            this.cachedCloudPin = String(data.teacherPin).trim();
            return this.cachedCloudPin;
          }
        }
      }
    } catch (e) {
      // Игнорируем сетевые ошибки, используем локальный PIN
    }
    return null;
  }

  // Проверить корректность PIN-кода (локально или через облако)
  async verifyPin(inputPin) {
    if (!inputPin) return false;
    const clean = String(inputPin).trim();

    // 1. Проверяем локальный PIN
    if (clean === this.getStoredPin()) return true;

    // 2. Проверяем кешированный облачный PIN
    if (this.cachedCloudPin && clean === this.cachedCloudPin) return true;

    // 3. Проверяем напрямую из Firebase
    const cloudPin = await this.fetchCloudPin();
    if (cloudPin && clean === cloudPin) {
      return true;
    }

    return false;
  }

  // Вход по PIN-коду
  async loginWithPin(pin) {
    const isOk = await this.verifyPin(pin);
    if (isOk) {
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

  // Смена PIN-кода учителем (сохраняет локально и в облако Firebase)
  async changePin(currentPin, newPin, confirmPin) {
    const isOldValid = await this.verifyPin(currentPin);
    if (!isOldValid) {
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
      this.cachedCloudPin = cleanNew;

      // Синхронизируем с Firebase Firestore (коллекция settings, документ access)
      if (this.submissionService) {
        try {
          if (!this.submissionService.firestore) {
            await this.submissionService.initFirebase();
          }
          if (this.submissionService.firestore) {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
            await setDoc(doc(this.submissionService.firestore, 'settings', 'access'), {
              teacherPin: cleanNew,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (fbErr) {
          console.warn('Could not sync new PIN to Firebase:', fbErr.message);
        }
      }

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
