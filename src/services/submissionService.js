// Сервис хранения и отправки сданных работ учащихся
// Поддерживает локальное хранилище и синхронизацию с Google Firebase Firestore

const LOCAL_STORAGE_KEY = 'ai_resistant_submissions';
const FIREBASE_CONFIG_KEY = 'ai_resistant_firebase_config';

export class SubmissionService {
  constructor() {
    this.firebaseApp = null;
    this.firestore = null;
    this.firebaseConfig = this.loadFirebaseConfig();
    this.listeners = [];
  }

  loadFirebaseConfig() {
    try {
      const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  saveFirebaseConfig(config) {
    if (!config) {
      localStorage.removeItem(FIREBASE_CONFIG_KEY);
      this.firebaseConfig = null;
      this.firebaseApp = null;
      this.firestore = null;
      return;
    }
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    this.firebaseConfig = config;
    this.initFirebase();
  }

  async initFirebase() {
    if (!this.firebaseConfig || !this.firebaseConfig.apiKey) {
      return false;
    }

    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

      this.firebaseApp = initializeApp(this.firebaseConfig, 'ai-resistant-lab');
      this.firestore = getFirestore(this.firebaseApp);
      return true;
    } catch (err) {
      console.warn('Firebase init failed, fallback to local storage:', err.message);
      return false;
    }
  }

  // Сохранить сданную работу
  async submitWorksheet(submissionData) {
    const enrichedData = {
      ...submissionData,
      id: submissionData.id || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    // 1. Всегда сохраняем в локальное хранилище
    this.saveToLocal(enrichedData);

    // 2. Если подключен Firebase, отправляем в облако
    let cloudSynced = false;
    if (this.firebaseConfig) {
      try {
        if (!this.firestore) {
          await this.initFirebase();
        }
        if (this.firestore) {
          const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
          await addDoc(collection(this.firestore, 'submissions'), enrichedData);
          cloudSynced = true;
        }
      } catch (err) {
        console.warn('Could not sync to Firebase:', err.message);
      }
    }

    this.notifyListeners(enrichedData);
    return { success: true, id: enrichedData.id, cloudSynced };
  }

  saveToLocal(sub) {
    const list = this.getAllLocal();
    list.unshift(sub);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  getAllLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  async getAllSubmissions() {
    // Если подключен Firebase, пробуем загрузить из облака
    if (this.firebaseConfig) {
      try {
        if (!this.firestore) {
          await this.initFirebase();
        }
        if (this.firestore) {
          const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
          const q = query(collection(this.firestore, 'submissions'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          const cloudList = [];
          snapshot.forEach(doc => {
            cloudList.push({ ...doc.data(), cloudId: doc.id });
          });
          if (cloudList.length > 0) {
            return cloudList;
          }
        }
      } catch (e) {
        console.warn('Firebase fetch failed, fallback to local:', e.message);
      }
    }

    // Фоллбэк на локальное хранилище
    return this.getAllLocal();
  }

  clearLocal() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  exportToCSV(submissions) {
    if (!submissions || submissions.length === 0) return '';

    const headers = ['ID', 'Дата и время', 'Класс', 'ФИО учащегося', 'Номер листа', 'Тема', 'Балл (из 10)', 'Светофор'];
    const rows = submissions.map(s => [
      `"${s.id || ''}"`,
      `"${s.createdAt ? new Date(s.createdAt).toLocaleString('ru-RU') : ''}"`,
      `"${s.studentClass || ''}"`,
      `"${s.studentName || ''}"`,
      `"${s.worksheetId || ''}"`,
      `"${(s.worksheetTitle || '').replace(/"/g, '""')}"`,
      `"${s.score || 0}"`,
      `"${s.trafficLight || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    return csvContent;
  }

  onNewSubmission(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(sub) {
    this.listeners.forEach(cb => {
      try { cb(sub); } catch (e) { console.error(e); }
    });
  }
}
