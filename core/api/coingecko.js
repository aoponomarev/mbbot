// =========================
// УТИЛИТЫ ДЛЯ РАБОТЫ С COINGECKO API
// Независимый модуль (не Vue компонент), экспортирует функции через window
// =========================
// Этот модуль содержит чистые функции для работы с CoinGecko API:
// - Трансформация данных CoinGecko в формат приложения
// - Запросы к CoinGecko API (markets, search, top coins)
// - Обработка rate limiting через адаптивный таймаут
//
// ВАЖНО: Функции не зависят от Vue компонентов и могут использоваться
// в любом контексте. Адаптивный таймаут передается как параметр.

// =========================
// УТИЛИТА: Трансформация данных CoinGecko в формат со старыми переменными
// Источник: old_app_not_write/parsing.js (строки 62-70)
// =========================
// Преобразует данные CoinGecko API в формат, совместимый со старым приложением:
// - Создает массив pvs (Price Variations) из 6 интервалов времени
// - Сохраняет структуру данных для совместимости с математической моделью
// 
// Маппинг интервалов CoinGecko → Старые переменные:
// - price_change_percentage_1h_in_currency → PV1h (pvs[0])
// - price_change_percentage_24h_in_currency → PV24h (pvs[1])
// - price_change_percentage_7d_in_currency → PV7d (pvs[2])
// - price_change_percentage_14d_in_currency → PV14d (pvs[3]) - НОВЫЙ интервал (заменяет 30d в старом индексе)
// - price_change_percentage_30d_in_currency → PV30d (pvs[4]) - НОВЫЙ индекс (был pvs[3] в старом)
// - price_change_percentage_200d_in_currency → PV200d (pvs[5]) - НОВЫЙ интервал (заменяет 60d и 90d)
// 
// ВАЖНО: Замененные интервалы (14d вместо 30d в индексе 3, 200d вместо 60d/90d в индексе 5)
// потребуют анализа и пересмотра весов и коэффициентов в математической модели.
// 
// @param {Object} coinGeckoCoin - Объект монеты из CoinGecko API
// @returns {Object} Объект монеты с добавленными полями pvs и отдельными переменными PV
function transformCoinGeckoToPV(coinGeckoCoin) {
  // Безопасное извлечение значений с fallback на 0
  const safeValue = (value) => {
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : 0;
  };
  
  // Создаем массив pvs (Price Variations) - совместимый со старым форматом
  // Источник: old_app_not_write/parsing.js, строка 70: pvs: values
  const pvs = [
    safeValue(coinGeckoCoin.price_change_percentage_1h_in_currency),   // pvs[0] - PV1h (1 час)
    safeValue(coinGeckoCoin.price_change_percentage_24h_in_currency), // pvs[1] - PV24h (24 часа)
    safeValue(coinGeckoCoin.price_change_percentage_7d_in_currency),  // pvs[2] - PV7d (7 дней)
    safeValue(coinGeckoCoin.price_change_percentage_14d_in_currency), // pvs[3] - PV14d (14 дней) - НОВЫЙ интервал
    safeValue(coinGeckoCoin.price_change_percentage_30d_in_currency), // pvs[4] - PV30d (30 дней) - сдвинут с индекса 3
    safeValue(coinGeckoCoin.price_change_percentage_200d_in_currency)  // pvs[5] - PV200d (200 дней) - НОВЫЙ интервал (заменяет 60d и 90d)
  ];
  
  // Добавляем pvs к объекту монеты для совместимости со старым форматом
  // Также добавляем отдельные переменные для удобства (опционально, для совместимости)
  return {
    ...coinGeckoCoin,
    pvs, // Массив дельт изменения цены (совместим со старым форматом)
    // Отдельные переменные для удобства (совместимость со старым кодом)
    PV1h: pvs[0],
    PV24h: pvs[1],
    PV7d: pvs[2],
    PV14d: pvs[3],
    PV30d: pvs[4],
    PV200d: pvs[5]
  };
}

// =========================
// API ФУНКЦИИ
// =========================

/**
 * fetchCoinsMarkets(coinIds, timeoutManager)
 * Получение данных монет по их ID из CoinGecko API
 * 
 * @param {Array<string>} coinIds - Массив ID монет (например: ['bitcoin', 'ethereum'])
 * @param {Object} timeoutManager - Объект для управления адаптивным таймаутом
 *   - increaseAdaptiveTimeout() - увеличить таймаут при rate limiting
 *   - decreaseAdaptiveTimeout() - уменьшить таймаут при успешном запросе
 * @returns {Promise<Array>} Массив объектов монет с трансформированными данными (pvs, PV1h и т.д.)
 * @throws {Error} При ошибке HTTP запроса
 */
async function fetchCoinsMarkets(coinIds, timeoutManager) {
  if (!coinIds || coinIds.length === 0) {
    return [];
  }
  
  const priceChangeParams = '1h,24h,7d,14d,30d,200d';
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&price_change_percentage=${priceChangeParams}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    // Обработка rate limiting (429)
    if (res.status === 429 && timeoutManager) {
      timeoutManager.increaseAdaptiveTimeout();
    }
    throw new Error(`HTTP ${res.status}`);
  }
  
  // Успешный запрос - уменьшаем таймаут
  if (timeoutManager) {
    timeoutManager.decreaseAdaptiveTimeout();
  }
  
  const data = await res.json();
  // Трансформируем данные CoinGecko в формат со старыми переменными (pvs, PV1h и т.д.)
  // Источник трансформации: old_app_not_write/parsing.js
  return Array.isArray(data) ? data.map(coin => transformCoinGeckoToPV(coin)) : [];
}

/**
 * getCoinIdBySymbol(symbol, timeoutManager)
 * Получение CoinGecko ID монеты по её тикеру (symbol)
 * 
 * @param {string} symbol - Тикер монеты (например: 'BTC', 'ETH')
 * @param {Object} timeoutManager - Объект для управления адаптивным таймаутом
 *   - increaseAdaptiveTimeout() - увеличить таймаут при rate limiting
 *   - decreaseAdaptiveTimeout() - уменьшить таймаут при успешном запросе
 * @returns {Promise<string|null>} CoinGecko ID монеты или null, если не найдена
 */
async function getCoinIdBySymbol(symbol, timeoutManager) {
  if (!symbol) return null;
  
  try {
    // Используем поиск CoinGecko для получения ID монеты по тикеру
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      // Обработка rate limiting (429)
      if (res.status === 429 && timeoutManager) {
        timeoutManager.increaseAdaptiveTimeout();
      }
      return null;
    }
    
    // Успешный запрос - уменьшаем таймаут
    if (timeoutManager) {
      timeoutManager.decreaseAdaptiveTimeout();
    }
    
    const data = await res.json();
    const coins = data.coins || [];
    
    // Ищем точное совпадение по тикеру (case-insensitive)
    const symbolUpper = symbol.toUpperCase();
    const exactMatch = coins.find(coin => coin.symbol && coin.symbol.toUpperCase() === symbolUpper);
    
    if (exactMatch) {
      return exactMatch.id;
    }
    
    // Если точного совпадения нет, возвращаем первый результат (самый популярный)
    return coins.length > 0 ? coins[0].id : null;
  } catch (error) {
    console.error(`Error getting coin ID for symbol ${symbol}:`, error);
    return null;
  }
}

/**
 * searchCoins(query, timeoutManager)
 * Поиск монет в CoinGecko API по запросу
 * 
 * @param {string} query - Поисковый запрос (тикер, название или часть названия)
 * @param {Object} timeoutManager - Объект для управления адаптивным таймаутом
 *   - increaseAdaptiveTimeout() - увеличить таймаут при rate limiting
 *   - decreaseAdaptiveTimeout() - уменьшить таймаут при успешном запросе
 *   - adaptiveTimeout - текущее значение таймаута в миллисекундах
 * @returns {Promise<Array>} Массив объектов монет из результатов поиска (максимум 10)
 */
async function searchCoins(query, timeoutManager) {
  if (!query || query.length < 2) {
    return [];
  }
  
  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      // Обработка rate limiting (429)
      if (res.status === 429 && timeoutManager) {
        timeoutManager.increaseAdaptiveTimeout();
        // Добавляем задержку перед следующей попыткой
        if (timeoutManager.adaptiveTimeout) {
          await new Promise(resolve => setTimeout(resolve, timeoutManager.adaptiveTimeout));
        }
      }
      return [];
    }
    
    // Успешный запрос - уменьшаем таймаут
    if (timeoutManager) {
      timeoutManager.decreaseAdaptiveTimeout();
    }
    
    const data = await res.json();
    let coins = data.coins || [];
    
    // Сортируем результаты: полные совпадения с тикером вверху
    const queryLower = query.toLowerCase();
    coins.sort((a, b) => {
      const aSymbol = a.symbol ? a.symbol.toLowerCase() : '';
      const bSymbol = b.symbol ? b.symbol.toLowerCase() : '';
      
      // Полное совпадение тикера - в начало
      const aExactMatch = aSymbol === queryLower ? 1 : 0;
      const bExactMatch = bSymbol === queryLower ? 1 : 0;
      if (aExactMatch !== bExactMatch) {
        return bExactMatch - aExactMatch;
      }
      
      // Тикер начинается с запроса - выше
      const aStartsWith = aSymbol.startsWith(queryLower) ? 1 : 0;
      const bStartsWith = bSymbol.startsWith(queryLower) ? 1 : 0;
      if (aStartsWith !== bStartsWith) {
        return bStartsWith - aStartsWith;
      }
      
      // Остальные по market_cap_rank (популярности)
      return (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999);
    });
    
    return coins.slice(0, 10);
  } catch (error) {
    console.error('CoinGecko search error', error);
    return [];
  }
}

/**
 * getTopCoinsByMarketCap(count, timeoutManager)
 * Получение топ N монет по капитализации из CoinGecko API
 * 
 * @param {number} count - Количество монет (1-250)
 * @param {Object} timeoutManager - Объект для управления адаптивным таймаутом
 *   - increaseAdaptiveTimeout() - увеличить таймаут при rate limiting
 *   - decreaseAdaptiveTimeout() - уменьшить таймаут при успешном запросе
 * @returns {Promise<Array>} Массив объектов монет с трансформированными данными (pvs, PV1h и т.д.)
 * @throws {Error} При ошибке HTTP запроса или невалидном count
 */
async function getTopCoinsByMarketCap(count, timeoutManager) {
  if (!count || count <= 0 || count > 250) {
    throw new Error('Count must be between 1 and 250');
  }
  
  const priceChangeParams = '1h,24h,7d,14d,30d,200d';
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${count}&page=1&price_change_percentage=${priceChangeParams}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    if (res.status === 429 && timeoutManager) {
      timeoutManager.increaseAdaptiveTimeout();
    }
    throw new Error(`HTTP ${res.status}`);
  }
  
  if (timeoutManager) {
    timeoutManager.decreaseAdaptiveTimeout();
  }
  
  const data = await res.json();
  // Трансформируем данные CoinGecko в формат со старыми переменными (pvs, PV1h и т.д.)
  // Источник трансформации: old_app_not_write/parsing.js
  return Array.isArray(data) ? data.map(coin => transformCoinGeckoToPV(coin)) : [];
}

/**
 * getTopCoinsByVolume(count, timeoutManager)
 * Получение топ N монет по дневному объему из CoinGecko API
 * 
 * @param {number} count - Количество монет (1-250)
 * @param {Object} timeoutManager - Объект для управления адаптивным таймаутом
 *   - increaseAdaptiveTimeout() - увеличить таймаут при rate limiting
 *   - decreaseAdaptiveTimeout() - уменьшить таймаут при успешном запросе
 * @returns {Promise<Array>} Массив объектов монет с трансформированными данными (pvs, PV1h и т.д.)
 * @throws {Error} При ошибке HTTP запроса или невалидном count
 */
async function getTopCoinsByVolume(count, timeoutManager) {
  if (!count || count <= 0 || count > 250) {
    throw new Error('Count must be between 1 and 250');
  }
  
  const priceChangeParams = '1h,24h,7d,14d,30d,200d';
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=${count}&page=1&price_change_percentage=${priceChangeParams}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    if (res.status === 429 && timeoutManager) {
      timeoutManager.increaseAdaptiveTimeout();
    }
    throw new Error(`HTTP ${res.status}`);
  }
  
  if (timeoutManager) {
    timeoutManager.decreaseAdaptiveTimeout();
  }
  
  const data = await res.json();
  // Трансформируем данные CoinGecko в формат со старыми переменными (pvs, PV1h и т.д.)
  // Источник трансформации: old_app_not_write/parsing.js
  return Array.isArray(data) ? data.map(coin => transformCoinGeckoToPV(coin)) : [];
}

// Экспорт функций через window для использования в других модулях
try {
  window.coinGeckoAPI = {
    transformCoinGeckoToPV,
    fetchCoinsMarkets,
    getCoinIdBySymbol,
    searchCoins,
    getTopCoinsByMarketCap,
    getTopCoinsByVolume
  };
} catch (error) {
  console.error('❌ coinGeckoAPI module failed to load:', error);
}

