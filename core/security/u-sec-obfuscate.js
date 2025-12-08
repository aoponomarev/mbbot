// Утилита обфускации для чувствительных данных (security sector)
// Предоставляет методы для безопасного хранения PIN-кодов и API-ключей
window.securityObfuscate = {
  /**
   * Обфускация текста (простое кодирование Base64)
   * Не является криптостойкой защитой, но скрывает данные от простого просмотра
   * @param {string} plainText - Открытый текст для обфускации
   * @returns {string} Обфусцированная строка
   */
  obfuscate(plainText) {
    if (!plainText) return '';
    try {
      return btoa(encodeURIComponent(plainText));
    } catch (e) {
      console.error('Obfuscation failed:', e);
      return '';
    }
  },

  /**
   * Деобфускация текста
   * @param {string} obfuscatedText - Обфусцированная строка
   * @returns {string} Восстановленный открытый текст
   */
  deobfuscate(obfuscatedText) {
    if (!obfuscatedText) return '';
    try {
      return decodeURIComponent(atob(obfuscatedText));
    } catch (e) {
      console.error('Deobfuscation failed:', e);
      return '';
    }
  },

  /**
   * Сохранение значения в localStorage с обфускацией
   * @param {string} key - Ключ для хранения
   * @param {string} value - Значение для сохранения
   */
  saveSecure(key, value) {
    if (!key) {
      console.error('Storage key is required');
      return;
    }
    try {
      const obfuscated = this.obfuscate(value);
      localStorage.setItem(key, obfuscated);
    } catch (e) {
      console.error('Secure save failed:', e);
    }
  },

  /**
   * Чтение значения из localStorage с деобфускацией
   * @param {string} key - Ключ для чтения
   * @returns {string} Деобфусцированное значение или пустая строка
   */
  loadSecure(key) {
    if (!key) {
      console.error('Storage key is required');
      return '';
    }
    try {
      const stored = localStorage.getItem(key);
      return stored ? this.deobfuscate(stored) : '';
    } catch (e) {
      console.error('Secure load failed:', e);
      return '';
    }
  },

  /**
   * Удаление обфусцированного значения из localStorage
   * @param {string} key - Ключ для удаления
   */
  removeSecure(key) {
    if (!key) {
      console.error('Storage key is required');
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Secure remove failed:', e);
    }
  },

  /**
   * Проверка наличия ключа в localStorage
   * @param {string} key - Ключ для проверки
   * @returns {boolean} true, если ключ существует
   */
  hasSecure(key) {
    if (!key) return false;
    try {
      return localStorage.getItem(key) !== null;
    } catch (e) {
      console.error('Secure check failed:', e);
      return false;
    }
  }
};
