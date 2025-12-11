// =========================
// БАЗОВЫЕ МАТЕМАТИЧЕСКИЕ УТИЛИТЫ
// Источник: old_app_not_write/math-model.js (строки 12-14, 451-457)
// =========================
// Этот файл содержит базовые математические утилиты, используемые во всех расчетах математической модели.
// Все функции сохраняют названия и логику из старого приложения для преемственности.

/**
 * clamp(x, min, max)
 * Ограничение значения в заданном диапазоне
 * Источник: old_app_not_write/math-model.js, строка 12
 * 
 * @param {number} x - Значение для ограничения
 * @param {number} min - Минимальное значение
 * @param {number} max - Максимальное значение
 * @returns {number} Значение, ограниченное диапазоном [min, max]
 * 
 * Примеры:
 * clamp(5, 0, 10) → 5
 * clamp(-5, 0, 10) → 0
 * clamp(15, 0, 10) → 10
 */
function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

/**
 * safeNumber(x, def)
 * Безопасное преобразование значения в число с fallback на значение по умолчанию
 * Источник: old_app_not_write/math-model.js, строка 13
 * 
 * @param {*} x - Значение для преобразования (может быть строкой, числом, null, undefined)
 * @param {number} def - Значение по умолчанию (по умолчанию 0)
 * @returns {number} Число или значение по умолчанию, если преобразование невозможно
 * 
 * Примеры:
 * safeNumber('5.5') → 5.5
 * safeNumber('abc') → 0
 * safeNumber(null) → 0
 * safeNumber(undefined, 10) → 10
 * safeNumber(NaN) → 0
 */
function safeNumber(x, def = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

/**
 * tanh(x)
 * Гиперболический тангенс
 * Источник: old_app_not_write/math-model.js, строка 14
 * 
 * @param {number} x - Аргумент функции
 * @returns {number} Значение гиперболического тангенса
 * 
 * Формула: tanh(x) = (e^x - e^(-x)) / (e^x + e^(-x))
 * Диапазон значений: [-1, 1]
 * 
 * Используется для нормализации значений в диапазоне [-1, 1] в различных расчетах модели.
 * 
 * Примеры:
 * tanh(0) → 0
 * tanh(1) → ~0.76
 * tanh(-1) → ~-0.76
 * tanh(10) → ~1 (асимптотически приближается к 1)
 */
function tanh(x) {
  const e1 = Math.exp(x);
  const e2 = Math.exp(-x);
  return (e1 - e2) / (e1 + e2);
}

/**
 * median(arr)
 * Вычисление медианы массива
 * Источник: old_app_not_write/math-model.js, строки 451-457
 * 
 * @param {Array<number>} arr - Массив чисел для вычисления медианы
 * @returns {number} Медиана массива (среднее значение для четного количества элементов)
 * 
 * Медиана - это значение, которое делит упорядоченный массив пополам.
 * Для нечетного количества элементов - средний элемент.
 * Для четного количества элементов - среднее арифметическое двух средних элементов.
 * 
 * Используется для расчета медианных значений метрик по всей выборке монет.
 * 
 * Примеры:
 * median([1, 2, 3]) → 2
 * median([1, 2, 3, 4]) → 2.5
 * median([5, 1, 3, 2, 4]) → 3
 */
function median(arr) {
  if (!arr || arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

// Экспорт функций через window для использования в других модулях
// Префикс mmMedian указывает на модель "median"
try {
  window.mmMedianHelpers = {
    clamp,
    safeNumber,
    tanh,
    median
  };
  console.log('✅ mmMedianHelpers module loaded successfully');
} catch (error) {
  console.error('❌ mmMedianHelpers module failed to load:', error);
}

