// =========================
// CD (Cumulative Delta) - накопительная дельта
// Источник: old_app_not_write/math-model.js (строки 79-108)
// =========================
// CD (Cumulative Delta) - накопительная дельта, интегральная сила нарастающим суммированием PV.
// Физический смысл: интегральная сила нарастающим суммированием PV.
// Взаимосвязь: CD = сумма всех предыдущих PV, показывает накопленный импульс.
// В контексте ТА: положительная CD = накопленный бычий импульс, отрицательная = медвежий.

// Изолируем область видимости через IIFE для предотвращения конфликтов имен
(function() {
  'use strict';
  
  // Импорт утилит (должны быть загружены до этого файла)
  const clampFn = window.mmMedianHelpers?.clamp || ((x, min, max) => Math.max(min, Math.min(max, x)));
  const safeNumberFn = window.mmMedianHelpers?.safeNumber || ((x, def = 0) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : def;
  });
  
  // Импорт временных узлов (должен быть загружен до этого файла)
  // Используем timeFramesDays из window.timeFramesDays (экспортируется из prc-weights.js)
  const timeFramesDays = window.timeFramesDays || [1/24, 1, 7, 14, 30, 200];

/**
 * calculateCDsWeighted(pvs, prcWeights)
 * Расчет накопительной дельты (CD) - сырых и взвешенных значений
 * Источник: old_app_not_write/math-model.js, строки 85-97
 * 
 * Физический смысл: интегральная сила нарастающим суммированием PV.
 * Взаимосвязь: CD = сумма всех предыдущих PV, показывает накопленный импульс.
 * В контексте ТА: положительная CD = накопленный бычий импульс, отрицательная = медвежий.
 * 
 * Алгоритм:
 * 1. Для каждого временного узла (i = 0..5) вычисляется накопительная сумма:
 *    - cdRaw[i] = сумма всех PV от 0 до i (сырая накопительная дельта)
 *    - cdW[i] = сумма всех PV * prcWeights от 0 до i (взвешенная накопительная дельта)
 * 2. Возвращается объект с двумя массивами: {cdRaw: [...], cdW: [...]}
 * 
 * ВАЖНО: CD для новых интервалов (14d, 200d) вычисляются из реальных PV, без эмуляции старых интервалов.
 * - CD14 (индекс 3) вычисляется из реального PV14
 * - CD200 (индекс 5) вычисляется из реального PV200
 * - Веса для новых интервалов будут подобраны позже в формулах (CGR, AGR и т.д.)
 * 
 * @param {Array<number>} pvs - Массив из 6 значений PV (Price Variations) для временных узлов [1h, 24h, 7d, 14d, 30d, 200d]
 * @param {Array<number>} prcWeights - Массив из 6 PRC-весов (Proximity Relevance Coefficients) для временных узлов
 * @returns {Object} Объект с двумя массивами: {cdRaw: Array<number>, cdW: Array<number>}
 *   - cdRaw: массив из 6 сырых CD значений (накопительная сумма PV)
 *   - cdW: массив из 6 взвешенных CD значений (накопительная сумма PV * prcWeights)
 * 
 * Примеры:
 * calculateCDsWeighted([1, 2, 3, 4, 5, 6], [0.1, 0.2, 0.3, 0.2, 0.15, 0.05])
 * → {cdRaw: [1, 3, 6, 10, 15, 21], cdW: [0.1, 0.5, 1.4, 2.2, 2.95, 3.25]}
 */
function calculateCDsWeighted(pvs, prcWeights) {
  const cdRaw = [];
  const cdW = [];
  let sumRaw = 0, sumW = 0;
  
  for (let i = 0; i < 6; i++) {
    const pv = safeNumberFn(pvs[i], 0);
    sumRaw += pv;
    sumW += pv * (safeNumberFn(prcWeights[i], 0));
    cdRaw.push(sumRaw);
    cdW.push(sumW);
  }
  
  return { cdRaw, cdW };
}

/**
 * approximateCDHFromSeries(series, hDays)
 * Аппроксимация CDH (CD на горизонте) из серии CD значений
 * Источник: old_app_not_write/math-model.js, строки 99-108
 * 
 * Физический смысл: интерполяция между ближайшими временными узлами.
 * Взаимосвязь: использует линейную интерполяцию между двумя соседними CD значениями.
 * В контексте ТА: дает оценку накопительной дельты на произвольном горизонте.
 * 
 * Алгоритм:
 * 1. Находит два соседних временных узла из timeFramesDays, между которыми находится hDays
 * 2. Выполняет линейную интерполяцию между соответствующими CD значениями
 * 3. Если hDays выходит за пределы диапазона - использует ближайшее значение
 * 
 * ВАЖНО: Адаптирована под новые временные узлы [1/24, 1, 7, 14, 30, 200]
 * - Старое приложение: интерполяция между CD7 (индекс 2) и CD30 (индекс 3)
 * - Новое приложение: интерполяция между соседними узлами в зависимости от hDays
 * 
 * Примеры интерполяции:
 * - hDays = 10 дней: интерполяция между CD7 (индекс 2) и CD14 (индекс 3)
 * - hDays = 20 дней: интерполяция между CD14 (индекс 3) и CD30 (индекс 4)
 * - hDays = 100 дней: интерполяция между CD30 (индекс 4) и CD200 (индекс 5)
 * 
 * @param {Array<number>} series - Массив из 6 CD значений (соответствует временным узлам [1h, 24h, 7d, 14d, 30d, 200d])
 * @param {number} hDays - Горизонт прогноза в днях (для определения интервала интерполяции)
 * @returns {number} Интерполированное значение CDH на горизонте hDays
 * 
 * Примеры:
 * approximateCDHFromSeries([1, 3, 6, 10, 15, 21], 10) → интерполированное значение между 6 и 10
 * approximateCDHFromSeries([1, 3, 6, 10, 15, 21], 20) → интерполированное значение между 10 и 15
 * approximateCDHFromSeries([1, 3, 6, 10, 15, 21], 100) → интерполированное значение между 15 и 21
 */
function approximateCDHFromSeries(series, hDays) {
  // Если hDays меньше минимального временного узла - используем первое значение
  if (hDays <= timeFramesDays[0]) {
    return safeNumberFn(series[0], 0);
  }
  
  // Если hDays больше максимального временного узла - используем последнее значение
  if (hDays >= timeFramesDays[timeFramesDays.length - 1]) {
    return safeNumberFn(series[series.length - 1], 0);
  }
  
  // Находим два соседних временных узла, между которыми находится hDays
  let lowerIndex = 0;
  let upperIndex = timeFramesDays.length - 1;
  
  for (let i = 0; i < timeFramesDays.length - 1; i++) {
    if (hDays >= timeFramesDays[i] && hDays <= timeFramesDays[i + 1]) {
      lowerIndex = i;
      upperIndex = i + 1;
      break;
    }
  }
  
  // Получаем значения временных узлов и соответствующие CD значения
  const lowerTime = timeFramesDays[lowerIndex];
  const upperTime = timeFramesDays[upperIndex];
  const lowerCD = safeNumberFn(series[lowerIndex], 0);
  const upperCD = safeNumberFn(series[upperIndex], 0);
  
  // Вычисляем коэффициент интерполяции (0..1)
  // ratio = 0, если hDays = lowerTime
  // ratio = 1, если hDays = upperTime
  const ratio = clampFn((hDays - lowerTime) / (upperTime - lowerTime), 0, 1);
  
  // Линейная интерполяция между двумя CD значениями
  return lowerCD + ratio * (upperCD - lowerCD);
}

  // Экспорт функций через window для использования в других модулях
  // Префикс mmMedian указывает на модель "median"
  try {
    window.mmMedianCD = {
      calculateCDsWeighted,
      approximateCDHFromSeries
    };
    console.log('✅ mmMedianCD module loaded successfully');
  } catch (error) {
    console.error('❌ mmMedianCD module failed to load:', error);
  }
})();

