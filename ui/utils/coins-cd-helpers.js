// =========================
// УТИЛИТЫ ДЛЯ РАБОТЫ С CD (Cumulative Delta)
// Независимый модуль (не Vue компонент), экспортирует функции через window
// =========================
// Этот модуль содержит чистые функции для работы с CD значениями монет:
// - Получение CDH (CD на горизонте) - взвешенных и сырых значений
// - Получение CD1-CD6 - взвешенных и сырых значений
// - Форматирование CD значений для отображения
// - Генерация tooltip с сырыми значениями
//
// ВАЖНО: Функции не зависят от Vue компонентов и могут использоваться
// в любом контексте. Они работают только с объектом монеты.

// =========================
// ПОЛУЧЕНИЕ CDH (CD на горизонте)
// =========================

/**
 * getCDH(coin)
 * Получить CDH (CD на горизонте) для монеты
 * 
 * @param {Object} coin - Объект монеты с полями cdh (сырое) и cdhw (взвешенное)
 * @returns {number} CDH значение (приоритет взвешенному, fallback на сырое, иначе 0)
 */
function getCDH(coin) {
  // Используем взвешенное CDH значение (cdhw), если доступно
  // Если нет - используем сырое CDH значение (cdh)
  // Если нет ни того, ни другого - возвращаем 0
  if (coin.cdhw !== undefined && coin.cdhw !== null) {
    return parseFloat(coin.cdhw) || 0;
  }
  if (coin.cdh !== undefined && coin.cdh !== null) {
    return parseFloat(coin.cdh) || 0;
  }
  return 0;
}

/**
 * getCDHRaw(coin)
 * Получить сырое CDH значение для tooltip
 * 
 * @param {Object} coin - Объект монеты с полем cdh (сырое CDH)
 * @returns {number} Сырое CDH значение
 */
function getCDHRaw(coin) {
  if (coin.cdh !== undefined && coin.cdh !== null) {
    return parseFloat(coin.cdh) || 0;
  }
  return 0;
}

// =========================
// ПОЛУЧЕНИЕ CD1-CD6
// =========================

/**
 * getCD(coin, index)
 * Получить CD значение по индексу (1-6)
 * 
 * @param {Object} coin - Объект монеты с полями cd1..cd6 (сырые) и cd1w..cd6w (взвешенные)
 * @param {number} index - Индекс CD (1-6)
 * @returns {number} CD значение (приоритет взвешенному, fallback на сырое, иначе 0)
 */
function getCD(coin, index) {
  // ВАЖНО: Возвращаем взвешенное CD значение (cdXw) для отображения в таблице
  // Сырые значения доступны через getCDRaw() для tooltip
  const cdWValue = coin[`cd${index}w`];
  
  if (cdWValue !== undefined && cdWValue !== null) {
    return parseFloat(cdWValue) || 0;
  }
  // Fallback на сырое значение, если взвешенное недоступно
  const cdRawValue = coin[`cd${index}`];
  if (cdRawValue !== undefined && cdRawValue !== null) {
    return parseFloat(cdRawValue) || 0;
  }
  return 0;
}

/**
 * getCDRaw(coin, index)
 * Получить сырое CD значение для tooltip
 * 
 * @param {Object} coin - Объект монеты с полями cd1..cd6 (сырые CD)
 * @param {number} index - Индекс CD (1-6)
 * @returns {number} Сырое CD значение
 */
function getCDRaw(coin, index) {
  const cdRawValue = coin[`cd${index}`];
  if (cdRawValue !== undefined && cdRawValue !== null) {
    return parseFloat(cdRawValue) || 0;
  }
  return 0;
}

// =========================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ПОЛЯМИ CD
// =========================

/**
 * getCDValue(coin, field)
 * Получить взвешенное значение CD для отображения в таблице по полю сортировки
 * 
 * @param {Object} coin - Объект монеты
 * @param {string} field - Поле сортировки ('cdh', 'cd1', 'cd2', 'cd3', 'cd4', 'cd5', 'cd6')
 * @returns {number} Взвешенное CD значение
 */
function getCDValue(coin, field) {
  if (field === 'cdh') {
    return getCDH(coin);
  }
  // Извлекаем индекс из поля (cd1 -> 1, cd2 -> 2, и т.д.)
  const index = parseInt(field.replace('cd', ''));
  if (index >= 1 && index <= 6) {
    return getCD(coin, index);
  }
  return 0;
}

/**
 * getCDTooltip(coin, field)
 * Получить строку с сырым значением CD для tooltip
 * 
 * @param {Object} coin - Объект монеты
 * @param {string} field - Поле сортировки ('cdh', 'cd1', 'cd2', 'cd3', 'cd4', 'cd5', 'cd6')
 * @returns {string|null} Строка с сырым значением для tooltip (например, "Сырое: -1.23") или null, если значения совпадают
 */
function getCDTooltip(coin, field) {
  if (field === 'cdh') {
    const rawValue = getCDHRaw(coin);
    const weightedValue = getCDH(coin);
    if (rawValue !== weightedValue) {
      return `Сырое: ${rawValue.toFixed(2)}`;
    }
    return null; // Если значения совпадают, tooltip не нужен
  }
  // Извлекаем индекс из поля (cd1 -> 1, cd2 -> 2, и т.д.)
  const index = parseInt(field.replace('cd', ''));
  if (index >= 1 && index <= 6) {
    const rawValue = getCDRaw(coin, index);
    const weightedValue = getCD(coin, index);
    if (rawValue !== weightedValue) {
      return `Сырое: ${rawValue.toFixed(2)}`;
    }
    return null; // Если значения совпадают, tooltip не нужен
  }
  return null;
}

// =========================
// ФОРМАТИРОВАНИЕ
// =========================

/**
 * formatCD(value)
 * Форматирование CD значения для отображения
 * 
 * @param {number} value - CD значение
 * @returns {string} Отформатированное значение (например, "-1.23" или "—" для null/undefined/0)
 */
function formatCD(value) {
  if (value === null || value === undefined || value === 0) return '—';
  const num = parseFloat(value);
  if (Number.isFinite(num)) {
    return num.toFixed(2);
  }
  return '—';
}

/**
 * getCDField(header, index)
 * Получить поле для сортировки по заголовку CD колонки
 * 
 * @param {string} header - Заголовок колонки ('CDH', 'CD1', 'CD2', и т.д.)
 * @param {number} index - Индекс колонки в массиве cdHeaders (не используется, оставлен для совместимости)
 * @returns {string} Поле для сортировки ('cdh', 'cd1', 'cd2', и т.д.)
 */
function getCDField(header, index) {
  return header.toLowerCase();
}

// Экспорт функций через window для использования в других модулях
try {
  window.coinsCDHelpers = {
    getCDH,
    getCDHRaw,
    getCD,
    getCDRaw,
    getCDValue,
    getCDTooltip,
    formatCD,
    getCDField
  };
} catch (error) {
  console.error('❌ coinsCDHelpers module failed to load:', error);
}

